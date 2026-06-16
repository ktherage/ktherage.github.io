---
title: "Le cache qui ne fonctionnait pas : une histoire de sérialisation chez Symfony"
description: "Comment une Closure dans getInfo(), une exception silencieuse, et une valeur de retour non vérifiée ont créé un faux succès parfait."
cover:
  image: "img/pexels-black-hole-23522813.jpeg"
  alt: "Vue en noir et blanc d'un trou noir entouré d'étoiles tourbillonnantes dans une galaxie spirale"
  caption: "Photo par <a href=\"https://www.pexels.com/@icebergsano-427049742/\">Iceberg San</a> sur <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Symfony, PHP, Debug, Cache, Sérialisation]
excerpt: >-
  Les logs disaient que le cache fonctionnait. Le filesystem pouvait en témoigner. Voici comment une Closure cachée dans getInfo(), une gestion d'exception silencieuse, et une valeur de retour ignorée ont créé un parfait cauchemar silencieux.
---

J'ai eu un bug où la mise en cache des réponses HTTP semblait fonctionner d'après les logs, pourtant aucun fichier n'apparaissait dans `var/http_cache/`. Pas de fichiers. Pas d'erreurs. Juste du silence.

## Le Contexte

Je construis un serveur MCP pour exposer un RAG et éviter les appels API redondants pendant le développement. Le cache filesystem se place entre l'application et l'API externe que j'utilise pour construire mon RAG.

La chaîne de clients HTTP suit un pattern decorator classique (du plus haut au plus bas dans la chaine de décoration):

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A[Symfony\Component\HttpClient\HttpClient\ScopingHttpClient] --> B
    B["CachedHttpClient (stratégie de cache perso)"] --> C
    C["LoggedHttpClient (stratégie de logging perso)"] --> D
    D["Symfony\Component\HttpClient\HttpClient::create()"]
</pre>

`CachedHttpClient` combine `ScopingHttpClient` de Symfony (pour le scoping et l'authentification auprès de l'API) avec un `FilesystemAdapter` pour persister les réponses HTTP dans `var/http_cache/`. Une classe `CachedResponse` implémente `ResponseInterface` pour que les réponses mises en cache ressemblent aux réponses fraîches.

## Le Symptôme

```
app.DEBUG: Storing Response to cache with key c3f36f73afae200bb284436334b6647f.
app.DEBUG: Response stored to cache with key c3f36f73afae200bb284436334b6647f.
```

Les logs debug confirmaient les tentatives de mise en cache. Réalité : `var/http_cache/` restait vide.

<div class="d-flex flex-column m-2 justify-content-center align-items-center">
    <iframe src="https://giphy.com/embed/NTur7XlVDUdqM" width="480" height="274" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
    <p><a href="https://giphy.com/gifs/trump-consequences-NTur7XlVDUdqM">via GIPHY</a>
</div>

## L'analyse

### 1. Le `FilesystemAdapter` la fausse piste qui m'a aidé a comprendre

Donc la question qui ce posait à ce moment était, Pourquoi ? Pourquoi ça ne sauvegarde pas mes reponses en cache ?

### 1.1. Y-a-t-il un problème avec le système de fichiers ?

J'ai d'abord pensé que ça venait de `Symfony\Component\Cache\Adapter\FilesystemAdapter` et en fouillant dans les fichiers du dossier `vendor` j'ai pu constater ce qui suit :

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A["Symfony\Component\Cache\Adapter\FilesystemAdapter::save()"] --> B
    B["Symfony\Component\Cache\Traits\AbstractAdapterTrait::save()"] --> C
    C["Symfony\Component\Cache\Adapter\AbstractAdapter::commit()"] --> D
    D["Symfony\Component\Cache\Traits\FilesystemTrait::doSave()"] --> E
    E["Symfony\Component\Cache\Marshaller\DefaultMarshaller::marshall()"] --> F{"calls serialize()"}
    F["Symfony\Component\Cache\Traits\FilesystemCommonTrait::write()"]
</pre>

`Symfony\Component\Cache\Traits\FilesystemTrait::doSave()` appelait `Symfony\Component\Cache\Marshaller\DefaultMarshaller::marshall()` qui lui utilisait `serialize()` de PHP avant d'en fournir le retour à `Symfony\Component\Cache\Traits\FilesystemCommonTrait::write()`.

En ouvrant la fonction, j'ai constaté que `FilesystemCommonTrait::write()` executais la fonction `mkdir()` de PHP préfixée d'un `@` qui supprimais les erreurs lié a la création du répertoire. Donc s'il y avait un problème avec mon repertoire de cache, il serait tû tout simplement. J'ai donc essayé de lancer un `chmod -R 777 var/http_cache/` mais en vain.

### 1.2. Y-a-t-il un problème avec la serialisation ?

Il ne me restais plus qu'à voir si le problème pouvait venir de la serialisation. J'ai donc créé un script de reproduction minimaliste pour comprendre :

```bash
docker compose exec cli sh -c "php -r '
require \"/srv/vendor/autoload.php\";

use App\HTTP\CachedResponse;
use Symfony\Component\HttpClient\HttpClient;

\$client = HttpClient::create();
\$response = \$client->request(\"GET\", \"https://some.api.com/foo\", [
    \"headers\" => [
        \"User-Agent\" => \"Test\",
    ],
]);

\$cached = new CachedResponse(\$response);
try {
    \$serialized = serialize(\$cached);
    echo \"Serialization OK\\n\";
} catch (\Exception \$e) {
    echo \"Serialization FAILED: \" . \$e->getMessage() . \"\\n\";
}
' 2>&1
# Sortie :
# Serialization FAILED: Serialization of 'Closure' is not allowed
```

L'échec se produit pendant `serialize()` — bien avant les opérations de fichier. L'objet `CachedResponse` contenait des données non sérialisables, dans mon cas une `Closure`.

### 2. Localiser l'élément non sérialisable

La nouvelle question maintenant, où est-ce que je peut avoir une `Closure` dans ma `CachedResponse`.

### 2.1. CachedResponse

Cette classe est plutôt simple et est construite à partir d'une instance de `Symfony\Contracts\HttpClient\ResponseInterface`.

```php
<?php

declare(strict_types=1);

namespace App\HTTP;

use Symfony\Contracts\HttpClient\ResponseInterface;

final class CachedResponse implements ResponseInterface
{
    private int $statusCode;
    private array $headers;
    private string $content;
    private array $toArray;
    private array $info;

    public function __construct(ResponseInterface $response)
    {
        $this->statusCode = $response->getStatusCode();
        $this->headers = $response->getHeaders();
        $this->content = $response->getContent();
        $this->toArray = $response->toArray();
        $this->info = $response->getInfo();
    }
    
    // ...
}
```

### 2.2. Procédons par élimination

En procédant par élimination, il ne nous reste que `getInfo()` qui peut avoir ce genre de choses à l'interieur puisque :
- `statusCode`: retourne un `int` qui corresponds au code de statut HTTP qui est aussi un entier.
- `headers`: retourne les entêtes HTTP qui ne sont basiquement que des tableaux d'`int` ou `string`.
- `content`: retourne le corps de la réponse qui n'est qu'une `string` donc aucune `Closure` là-dedans.
- `toArray`: aurait renvoyé une exception si le `content` n'avait pas été encodé en JSON.

Donc il doit y avoir quelque chose d'étrange que je n'avais pas anticipé dans `getInfo()` et inspecter `getInfo()` a révélé le coupable ce que j'ai fais via ce script :
```bash
docker compose exec cli php -r '
require "/srv/vendor/autoload.php";
use Symfony\Component\HttpClient\HttpClient;
\$client = HttpClient::create();
\$response = \$client->request("GET", "https://api.github.com/repos/symfony/symfony/pulls/64552", [
    "headers" => ["Accept" => "application/vnd.github+json", "User-Agent" => "Test"],
]);
foreach (\$response->getInfo() as \$k => \$v) {
    if (\$v instanceof \\Closure) echo "\$k => Closure\\n";
}
'
# Sortie :
pause_handler => Closure
```

Le client HTTP de Symfony inclut une clé `pause_handler` dans `getInfo()` contenant une `Closure` utilisée en interne pour la logique de retry (gestion des `429 Too Many Requests` avec `Retry-After`) or PHP ne peut pas sérialiser les `Closure`.

### 3. Pourquoi l'échec était silencieux

Trois couches ont occulté la rééle cause :

**Couche 1 — Valeur de retour ignorée / Mon erreure**

Mon erreure a été de ne pas vérifier le retour de la fonction `save()` qui, je ne l'avais pas noté à ce moment là, retourne un booléen indiquant si l'enregistrement a bien été effectué.

Je suis donc passé de :
```php
$this->cache->save($cacheItem); // returns false, ignored
$this->logger->debug("Response stored to cache with key {$key}.");
```

à:
```php
$saved = $this->cache->save($cacheItem);
$this->logger->debug("Cache save: {result}", ['result' => $saved ? 'success' : 'FAILED']);
```

Ce qui m'a permis d'avoir des logs plus pertinent avec un message `Cache save: FAILED` qui était affiché à chaque tentatives.
La méthodes `save()` ne fonctionnait pas et donc mon cache n'avais jamais fonctionné.

**Couche 2 — Gestion d'exception silencieuse dans le marshallage**

`serialize()` plantais silencieusement parce que dans `Symfony\Component\Cache\Marshaller\DefaultMarshaller::marshall()` en interne et par défaut Symfony attrape les exceptions de sérialisation et peuple un tableau d'id avec les serialisations échouées.

Voici une version simplifiée de la fonction :

```php
public function marshall(array $values, ?array &$failed): array
{
    $serialized = $failed = [];

    foreach ($values as $id => $value) {
        try {
            $serialized[$id] = serialize($value);
        } catch (\Exception $e) {
            if ($this->throwOnSerializationFailure) {
                throw new \ValueError($e->getMessage(), 0, $e);
            }
            $failed[] = $id;
        }
    }

    return $serialized;
}
```

Avec `throwOnSerializationFailure` par défaut à `false`, les exceptions sont avalées. La clé de cache échouée va dans `$failed`, mais aucun avertissement n'est émis.

**Couche 3 — Sérialisation complète d'un tableau de donneés mixte**

Stocker complètement un tableau de données mixte dans le cache a été une autre de mes erreurs, _quoique à moitié la mienne je n'avais pas anticipé la `Closure` dans `getInfo()`_, avec le recule tout n'est pas peut-être pas bon a conserver.

## La Correction

**Valider les résultats de l'opération de cache:**

```php
if (!\$this->cache->save(\$cacheItem)) {
    \$this->logger->warning('Failed to save response to cache', ['key' => \$key]);
    return;
}
\$this->logger->debug("Response stored to cache with key {\$key}.");
```

**Filtrer les `\Closure` de `getInfo()`:**

```php
\$this->info = array_filter(
    \$response->getInfo(),
    static fn (\$v) => !\$v instanceof \Closure
);
```

## Prévention

Ce bug n'était pas un problème avec le cache de Symfony — il fonctionnait comme conçu. L'échec venait de trois négligences alignées :

1. **Oublier de vérifier les valeurs de retour**  
   Les méthodes retournent des valeurs pour une raison. Traite les méthodes avec `bool` comme `save()` comme des contrats.

2. **Négliger la gestion d'exception silencieuse**  
   Les frameworks priorisent parfois le silence sur la visibilité. Saisis où basculer la verbosité (`throwOnSerializationFailure: true` en dev).

3. **Supposer que `getInfo()` ne contient que des données scalaires**  
   Des internals comme `pause_handler` peuvent fuir dans les métadonnées. Valide toujours ce que tu caches.

