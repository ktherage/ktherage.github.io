---
alias: /blog/symfony-session-vs-http-cache/
title: "Symfony tue silencieusement votre cache HTTP dès qu'une session démarre"
date: 2026-09-02
description: "Vous envoyez Cache-Control: public, s-maxage=86400. Symfony répond private, max-age=0, must-revalidate, s-maxage=86400. Voici l'AbstractSessionListener à -1000 et son échappatoire officielle NO_AUTO_CACHE_CONTROL_HEADER (PR #53057)."
cover:
  image: "img/pexels-emergency-exit-10547549.jpg"
  alt: "Panneau vert lumineux de sortie de secours illuminé dans l'obscurité — l'échappatoire officielle"
  caption: "Photo par <a href=\"https://www.pexels.com/@esjaimes-2097293/\">Esdras Jaimes</a> sur <a href=\"https://www.pexels.com/photo/close-up-of-an-exit-sign-10547549/\">Pexels</a>"
published: true
tags: [Symfony, PHP, HTTP Cache, API Platform, Security]
excerpt: >-
  Vos cacheHeaders API Platform disent public, Symfony répond private, max-age=0. Coupable : l'AbstractSessionListener en priorité -1000 et son échappatoire documentée NO_AUTO_CACHE_CONTROL_HEADER.
---

J'ai découvert à mes dépens que Symfony possède un listener de sécurité qui écrase votre directive `Cache-Control` avec `private, max-age=0, must-revalidate` dès qu'une session PHP est démarrée pendant la requête.

Plus important, il existe une échappatoire officielle lorsqu'on sait que la réponse peut malgré tout être mise en cache.

Si vous vous êtes déjà battu avec ce header :

```http
Cache-Control: max-age=0, must-revalidate, private, s-maxage=86400
```

alors que votre code demande clairement une réponse publique, cet article est pour vous.

## Le symptôme

Avec API Platform 3.4 et cette configuration, on définit les headers de cache d'une ressource :

```php
#[ApiResource(
    cacheHeaders: [
        'etag' => true,
        'max_age' => 86400,
        'shared_max_age' => 86400,
        'vary' => ['Accept'],
    ]
)]
class Article
{
}
```

On s'attend à quelque chose comme :

```http
Cache-Control: max-age=86400, public, s-maxage=86400
ETag: "abc123"
```

Mais dans certaines situations, on observe :

```http
Cache-Control: max-age=0, must-revalidate, private, s-maxage=86400
```

Dans cette situation, même si le `s-maxage` est présent dans le header, il devient inutile pour un cache partagé : la réponse est passée en `private` et le cache partagé passera à côté de la réponse sans tenir compte de la durée définie dans `s-maxage`.

Pas d'erreur, pas de log : votre configuration API Platform était correcte, elle a simplement été modifiée plus tard dans le cycle HTTP.

## Comment je suis tombé là-dessus : des tests Behat sur le cache

Je ne suis pas tombé là-dessus en lisant le code source par curiosité un dimanche après-midi. Je suis tombé là-dessus en écrivant des tests Behat sur le cache HTTP de l'API.

J'écrivais donc des scénarios Behat pour couvrir le comportement de cache de nos endpoints API, dans le genre :

```gherkin
Scenario: Les articles publiés sont mis en cache publiquement
  Given je suis authentifié en tant qu'utilisateur
  When j'envoie une requête "GET" vers "/api/articles"
  Then la réponse a le statut 200
  And le header de réponse "cache-control" contient "public"
  And le header de réponse "cache-control" contient "max-age=86400"
  And le header de réponse "cache-control" contient "s-maxage=86400"
```

À l'exécution du test, il a échoué. Pas de `public` dans le header, mais un `max-age=0, must-revalidate, private, s-maxage=86400` à la place.

C'est là que j'ai commencé à regarder ce qui pouvait modifier la réponse après qu'API Platform ait correctement configuré ses headers.

## Le coupable : `AbstractSessionListener` avec une priorité à `-1000`

Le responsable est le listener `Symfony\Component\HttpKernel\EventListener\AbstractSessionListener`. Son rôle ne se limite pas à sauvegarder la session : quand une session est démarrée pendant une requête, Symfony transforme par défaut la réponse en réponse privée non cachable, une mesure de sécurité appréciable pour éviter de mettre en cache et de redistribuer par erreur des données privées propres à un utilisateur à travers une erreur de configuration du cache HTTP.

Deux détails expliquent pourquoi ça surprend autant.

**Il passe très tard.** Dans Symfony 6.4+, le listener s'abonne à `kernel.response` avec une priorité de `-1000`, explicitement pour s'exécuter parmi les derniers listeners de réponse après API Platform, après vos propres subscribers *qui n'ont que rarement une priorité aussi basse de paramétrée je présume 😅*.

**Il regarde si la session a été utilisée**, pas juste si elle existe. Ce n'est pas `$request->hasSession()`. Le code réel :

```php
if ($autoCacheControl) { // cette condition va nous être utile plus tard (`true` par défaut)

    $maxAge = $response->headers->hasCacheControlDirective('public')
        ? 0
        : (int) $response->getMaxAge();

    $response
        ->setExpires(new \DateTimeImmutable('+'.$maxAge.' seconds'))
        ->setPrivate()
        ->setMaxAge($maxAge)
        ->headers->addCacheControlDirective('must-revalidate');
}
```

Avant même d'atteindre `if ($autoCacheControl)`, `AbstractSessionListener::onKernelResponse()` enchaîne plusieurs garde-fous — chacun peut court-circuiter avec un `return` sans toucher au `Cache-Control` :

1. **Requête principale uniquement** — `if (!$event->isMainRequest() || (!$container->has('initialized_session') && !$request->hasSession())) return;` : les sous-requêtes sont ignorées.
2. **Header interne dépilé tôt** — `$autoCacheControl = !$response->headers->has(self::NO_AUTO_CACHE_CONTROL_HEADER)` puis `remove()` systématique, même si la suite sortira.
3. **Session attachée ?** — `if (!$request->hasSession(true)) return;` (le `true` cherche aussi dans les attributs, pas seulement la pile).
4. **Si `isStarted()` → `save()` + cookies** — sauvegarde anticipée (verrous, `fastcgi_finish_request`, régénération d'ID) et gestion du `Set-Cookie` : `clearCookie` si session vide et cookie présent, `setCookie` si nouvel ID et session non vide.
5. **Usage réel ?** — `if ($session instanceof Session ? 0 === $session->getUsageIndex() : !$session->isStarted()) return;` : une session qui existe mais n'a jamais été lue/écrite ne déclenche pas le passage en `private`.

Ce n'est qu'après ces sorties que le bloc s'exécute — `maxAge` vaut `0` si la réponse était `public` sinon `getMaxAge()`, puis `setExpires()`, `setPrivate()`, `setMaxAge($maxAge)` et `must-revalidate`.

Fichier : `src/Symfony/Component/HttpKernel/EventListener/AbstractSessionListener.php` — [6.4 sur GitHub](https://github.com/symfony/symfony/blob/6.4/src/Symfony/Component/HttpKernel/EventListener/AbstractSessionListener.php).

## Pourquoi Symfony fait ça ?

Une session est généralement synonyme **de données dépendantes de l'utilisateur présentement connecté**. Si une réponse `GET /api/me` pour l'utilisateur A devenait publiquement cachable, un utilisateur B pourrait recevoir les données de A depuis le cache partagé (comme Varnish par exemple).

Symfony adopte donc un comportement conservateur par défaut : session utilisée → réponse privée.

**Le simple fait d'avoir un header `Authorization: Bearer ...` ne signifie pas que Symfony a démarré une session.** Le déclencheur réel de `AbstractSessionListener`, c'est l'usage effectif de la session quelque part dans la requête, pas la présence d'un token d'authentification.

Donc même si votre pare-feu est configuré avec l'option `stateless: true`, il est possible que votre code, à un moment donné, utilise la session utilisateur pour des raisons tout à fait légitimes, ce qui déclenche le listener.

La vraie question à se poser est : **une session est-elle effectivement utilisée pendant cette requête** via votre code, un bundle, un listener, un contrôleur ?

Pour le savoir, cherchez les accès qui déclenchent effectivement la session :

```php
$request->getSession()->start()
$request->getSession()->set(...)
$request->getSession()->get(...)
$request->getSession()->getFlashBag()
```

## L'échappatoire : le header magique `Symfony-Session-NoAutoCacheControl`

Vous vous souvenez de `if ($autoCacheControl) {` ? C'est lui notre sauveur en la circonstance.

Parce qu'un échappatoire a été prévu pour contourner ce comportement dans le cas où l'on souhaite explicitement dire à Symfony :

> OK, je sais que tu veux me protéger mais je sais ce que je fais alors oublie ça 5 minutes tu veux ?

Et ça passe par la vérification de la présence de la constante `NO_AUTO_CACHE_CONTROL_HEADER` dans les headers de la réponse :

```php
$autoCacheControl = !$response->headers->has(
    self::NO_AUTO_CACHE_CONTROL_HEADER
);
```

La constante vaut `Symfony-Session-NoAutoCacheControl`.

Si votre `Response` porte ce header, le listener n'applique pas son `private` automatique, puis le supprime lui-même avant d'envoyer la réponse au client :

```php
$response->headers->remove(self::NO_AUTO_CACHE_CONTROL_HEADER);
```

C'est un signal interne au serveur, pas un header de `Response` destiné à être transmis côté client et ne doit jamais l'être.

### Un hack ? Non — c'est documenté

Jusqu'à Symfony 7.0, toute la classe `AbstractSessionListener` était `@internal`, donc PHPStan/Psalm hurlaient si vous utilisiez `AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER`.

La PR [#53057](https://github.com/symfony/symfony/pull/53057) — *[HttpKernel] Move @internal from AbstractSessionListener class to its methods and properties* — a retiré `@internal` de la classe (gardé sur méthodes/props), rétroportée en 6.4, pour rendre la constante officiellement utilisable. La doc Symfony 7.1 l'affiche désormais explicitement :

```php
use Symfony\Component\HttpKernel\EventListener\AbstractSessionListener;

$response->headers->set(AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER, 'true');
```

Source : [symfony.com/doc/current/http_cache.html#http-caching-and-user-sessions](https://symfony.com/doc/current/http_cache.html#http-caching-and-user-sessions)

### Comment l'utiliser

Si vous contrôlez la `Response` :

```php
use Symfony\Component\HttpKernel\EventListener\AbstractSessionListener;

$response->headers->set(
    AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
    'true'
);
```

Dans une application API Platform, un subscriber `kernel.response` scope proprement le comportement :

```php
<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\EventListener\AbstractSessionListener;
use Symfony\Component\HttpKernel\KernelEvents;

final class BypassSessionCacheSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            // AbstractSessionListener = -1000, on doit passer avant
            KernelEvents::RESPONSE => ['onKernelResponse', -100],
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        // Scoper par chemin — jamais globalement
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $event->getResponse()->headers->set(
            AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
            'true'
        );
    }
}
```

`-100` n'a rien de magique : il est simplement supérieur à `-1000`, donc ce subscriber s'exécute avant `AbstractSessionListener`.

### Le piège à éviter absolument

Ne posez pas ce header globalement sur toute réponse `GET` :

```php
// À ne pas faire sans réfléchir au contenu de la réponse
if ($request->isMethodSafe()) {
    $response->headers->set(
        AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
        'true'
    );
}
```

`GET /api/me`, `GET /api/cart` ou `GET /api/orders` ne doivent pas devenir publiquement cachables simplement parce qu'elles utilisent `GET`.

La bonne question : **cette réponse est-elle identique pour plusieurs utilisateurs ?**

Dans mon cas, ça l'était. Mais si ce n'est pas le cas, ne contournez pas cette sécurité de Symfony.

De plus, il est préférable de *whitelister* les chemins qui ont droit de contourner cette sécurité pour éviter tout problème de fuite de données lié au cache.

## TL;DR

```text
#[ApiResource(cacheHeaders: [...])]
        → API Platform génère une réponse cachable
        → kernel.response
        → AbstractSessionListener (-1000)
        → session utilisée ? oui
        → Cache-Control devient private
```

Symfony fait ça volontairement pour éviter qu'une réponse liée à une session finisse accidentellement dans un cache partagé.

Si vous savez avec certitude que la réponse peut être cachée malgré l'usage de la session :

```php
$response->headers->set(
    AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
    'true'
);
```

posé sur la `Response`, jamais sur la `Request`, puis supprimé automatiquement par le listener avant l'envoi.

Et si une leçon est à retenir en plus du header lui-même : **testez vos headers de cache comme n'importe quel autre comportement observable de votre API.**
