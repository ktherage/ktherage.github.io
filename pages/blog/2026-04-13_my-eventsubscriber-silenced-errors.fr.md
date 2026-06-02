---
title: "Mon EventSubscriber masquait les erreurs, voici pourquoi"
description: "Comment mon EventSubscriber de liste blanche de routes cachait de véritables erreurs et comment je l'ai corrigé."
cover:
  image: "img/terminal-code.jpg"
  alt: "Texte de langage de programmation informatique"
  caption: "Photo par <a href=\"https://www.pexels.com/@nathan-dumlao/\">Nathan Dumlao</a> sur <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Symfony, Debug, Security]
excerpt: >-
  Mon EventSubscriber de liste blanche de routes levait des exceptions AccessDenied dans les logs sans raison apparente. Voici comment j'ai découvert qu'il cachait en réalité la véritable erreur en coulisses.
---

Un ticket Jira est apparu : *« Il y a un bug étrange qui empêche les utilisateurs d'accéder à une page à ce moment-là de la journée. »*
Les logs indiquaient plusieurs fois : *« [ce jour T cette heure] request.ERROR: Uncaught PHP Exception Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException: "Access denied to that resource." at WhitelistSubscriber.php line 99 »*

Je n'avais aucune idée au début… 😅 Voici comment j'ai compris.

---

## La configuration

J'avais un EventSubscriber qui vérifiait l'accès aux pages basé sur une liste blanche de routes. C'était du code legacy — le refactoriser n'était pas à l'ordre du jour à ce moment-là.

```php
<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class WhitelistRouteSubscriber implements EventSubscriberInterface
{
    private const WHITELISTED_ROUTES = [
        'app_login',
        'app_homepage',
        'app_healthcheck',
    ];

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 0],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $route = $request->attributes->get('_route');

        // Allow whitelisted routes
        if (in_array($route, self::WHITELISTED_ROUTES, true)) {
            return;
        }

        // Deny access for non-whitelisted routes
        throw new AccessDeniedHttpException('Route not whitelisted');
    }
}
```

Objectif : Bloquer toutes les routes sauf la liste blanche. Simple, non ?

---

## Le problème

Les logs montraient des `AccessDeniedHttpException` sur des routes que je savais être dans la liste blanche. Premier geste classique : mettre un `dump()` dans le subscriber pour voir ce qui arrivait.

```php
public function onKernelRequest(RequestEvent $event): void
{
    $request = $event->getRequest();
    $route = $request->attributes->get('_route');

    dump($route); // 🔍 Voyons ce qui se passe
    // ...
}
```

Première découverte surprenante : **le subscriber était appelé deux fois** pour une seule requête. Le premier appel avait la route attendue, le second avait `$route = null`.

Question évidente : *pourquoi `_route` est-il null ?*

J'ai creusé plus loin avec `dump($request->getPathInfo())` pour voir quelle URL était traitée lors du second appel :

```
// 1er appel
dump($request->getPathInfo()); // "/foo"

// 2e appel
dump($request->getPathInfo()); // "/foo" ← identique. Attends, quoi ?
```

Même URL, appelée deux fois. Cela n'avait aucun sens — si c'était la même requête, pourquoi `_route` était-il null la deuxième fois ? Je tournais en rond.

J'ai donc dumpé l'objet `$event` complet pour avoir plus de contexte, et j'ai réduit le champ à `_controller` dans les attributs de la requête :

```php
dump($request->attributes->get('_controller'));
// "Symfony\Component\HttpKernel\Controller\ErrorController"
```

Voilà. `_controller` ne pointait pas vers mon code du tout. Symfony avait forgé une toute nouvelle requête vers son propre `ErrorController`, réutilisant l'URL d'origine — ce qui explique pourquoi `getPathInfo()` était si trompeur — mais en contournant complètement le routeur. C'est pourquoi `_route` était null.

---

## Cause racine

Le flux réel était :

```
Requête → /foo
  └── WhitelistSubscriber (1er appel) → _route = 'app_foo' ✅ Accès accordé
      └── Controller → lève RealException 💥
          └── Symfony l'attrape
              └── Sous-requête → ErrorController (contourne le routeur, pas de _route)
                  └── WhitelistSubscriber (2e appel) → _route = null ❌ AccessDenied levé
                      └── RealException est maintenant silencieuse 🔇
```

Le piège : **l'`AccessDeniedHttpException` du subscriber masquait complètement l'exception originale** — celle qui contenait réellement les informations de débogage utiles.

Lorsqu'une exception est levée, le `HttpKernel` de Symfony distribue un événement `KernelEvents::EXCEPTION`, puis délègue le rendu de l'erreur à `ErrorController` via une sous-requête interne. Cette sous-requête réutilise l'URL d'origine — ce qui explique pourquoi `getPathInfo()` était trompeur — mais elle contourne complètement la couche de routage, laissant `_route` à `null`.

---

## La solution

Vérifiez si la requête est la requête principale (pas une sous-requête) :

```php
<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class WhitelistRouteSubscriber implements EventSubscriberInterface
{
    private const WHITELISTED_ROUTES = [
        'app_login',
        'app_homepage',
        'app_healthcheck',
    ];

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 0],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        // Skip sub-requests (like error handling)
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $route = $request->attributes->get('_route');

        // Allow whitelisted routes
        if (in_array($route, self::WHITELISTED_ROUTES, true)) {
            return;
        }

        // Deny access for non-whitelisted routes
        throw new AccessDeniedHttpException('Route not whitelisted');
    }
}
```

`isMainRequest()` retourne `false` pour toute sous-requête interne — gestion d'erreurs, fragments ESI, `hinclude` — donc votre logique ne s'exécute que sur les vraies requêtes distribuées par le routeur.

> **Note :** `isMainRequest()` a remplacé l'ancien `isMasterRequest()` dans Symfony 5.3. Si vous êtes sur une version plus ancienne, utilisez `isMasterRequest()` à la place.

---

## Conclusion

Chaque fois que votre subscriber fait quelque chose de destructeur — lever une exception, rediriger, définir une réponse — demandez-vous : *que se passe-t-il quand Symfony appelle ceci sur une sous-requête ?*

Les sous-requêtes sont omniprésentes dans Symfony : gestion d'erreurs, ESI, fragments. Elles n'ont pas le même contexte qu'une requête principale, et votre subscriber ne connaît pas la différence à moins que vous ne lui disiez.

`isMainRequest()` est cette vérification. Faites-en un réflexe. 🎉
