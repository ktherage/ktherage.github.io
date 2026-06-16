---
title: "The Cache That Didn't Cache: A Symfony Serialization Story"
description: "How a Closure inside getInfo(), a silent exception, and an unchecked return value created a perfect false success."
cover:
  image: "img/pexels-black-hole-23522813.jpeg"
  alt: "Black and white view of a black hole surrounded by swirling stars in a spiral galaxy"
  caption: "Photo by <a href=\"https://www.pexels.com/@icebergsano-427049742/\">Iceberg San</a> on <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Symfony, PHP, Debug, Cache, Serialization]
excerpt: >-
  The logs said the cache was working. The filesystem could testify to it. Here is how a hidden Closure in getInfo(), silent exception handling, and an ignored return value created a perfect, silent nightmare.
---

I hit a bug where caching HTTP responses seemed to work perfectly according to the logs, yet no files ever appeared in `var/http_cache/`. No files. No errors. Just pure silence.

## The Context

I am building an MCP server to expose a RAG and avoid redundant API calls during development. The filesystem cache sits between the application and the external API I use to construct my RAG.

The HTTP client chain follows a classic decorator pattern (from top to bottom in the decoration chain):

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A[Symfony\Component\HttpClient\HttpClient\ScopingHttpClient] --> B
    B["CachedHttpClient (stratégie de cache perso)"] --> C
    C["LoggedHttpClient (stratégie de logging perso)"] --> D
    D["Symfony\Component\HttpClient\HttpClient::create()"]
</pre>

`CachedHttpClient` combines Symfony's `ScopingHttpClient` (for scoping and authenticating with the API) with a `FilesystemAdapter` to persist HTTP responses in `var/http_cache/`. A `CachedResponse` class implements `ResponseInterface` so that cached responses look identical to fresh ones.

## The Symptom

```
app.DEBUG: Storing Response to cache with key c3f36f73afae200bb284436334b6647f.
app.DEBUG: Response stored to cache with key c3f36f73afae200bb284436334b6647f.
```

The debug logs confirmed the caching attempts. The reality: `var/http_cache/` remained completely empty.

<div class="d-flex flex-column m-2 justify-content-center align-items-center">
    <iframe src="https://giphy.com/embed/NTur7XlVDUdqM" width="480" height="274" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
    <p><a href="https://giphy.com/gifs/trump-consequences-NTur7XlVDUdqM">via GIPHY</a>
</div>

## The Analysis

### 1. The `FilesystemAdapter` — The Red Herring That Helped Me Understand

So the question at that point was: Why? Why isn't it saving my responses to the cache?

### 1.1. Is there an issue with the filesystem?

I initially thought it was coming from `Symfony\Component\Cache\Adapter\FilesystemAdapter`, and digging into the `vendor` files revealed the following path:

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A["Symfony\Component\Cache\Adapter\FilesystemAdapter::save()"] --> B
    B["Symfony\Component\Cache\Traits\AbstractAdapterTrait::save()"] --> C
    C["Symfony\Component\Cache\Adapter\AbstractAdapter::commit()"] --> D
    D["Symfony\Component\Cache\Traits\FilesystemTrait::doSave()"] --> E
    E["Symfony\Component\Cache\Marshaller\DefaultMarshaller::marshall()"] --> F{"calls serialize()"}
    F["Symfony\Component\Cache\Traits\FilesystemCommonTrait::write()"]
</pre>

`Symfony\Component\Cache\Traits\FilesystemTrait::doSave()` called `Symfony\Component\Cache\Marshaller\DefaultMarshaller::marshall()`, which used PHP's native `serialize()` before handing the return value over to `Symfony\Component\Cache\Traits\FilesystemCommonTrait::write()`.

Looking closely at the code, I noticed that `FilesystemCommonTrait::write()` runs PHP's `mkdir()` prefixed with an `@` operator, silencing any directory creation errors. Meaning, if there was an issue with my cache directory, it would be suppressed entirely. I tried running `chmod -R 777 var/http_cache/`, but to no avail.

### 1.2. Is there an issue with serialization?

The only thing left to check was whether the issue came from serialization itself. I wrote a minimal reproduction script to figure it out:

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
# Output:
# Serialization FAILED: Serialization of 'Closure' is not allowed
```

The failure happens during `serialize()` — long before any file operations occur. The `CachedResponse` object contained non-serializable data, which in my case turned out to be a `Closure`.

### 2. Locating the Unserializable Element

The new question now was: Where on earth could a `Closure` be lurking inside my `CachedResponse`?

### 2.1. CachedResponse

This class is quite straightforward and is built from an instance of `Symfony\Contracts\HttpClient\ResponseInterface`.

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

### 2.2. Process of Elimination

By a process of elimination, only `getInfo()` could contain this kind of data, because:
- `statusCode`: returns an `int` corresponding to the HTTP status code.
- `headers`: returns HTTP headers, which are fundamentally arrays of `int` or `string`.
- `content`: returns the response body, which is just a `string`, so no `Closure` there.
- `toArray`: would have thrown an exception already if the `content` wasn't valid JSON.

So, there had to be something unexpected inside `getInfo()`. Inspecting `getInfo()` revealed the culprit via this script:

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
# Output:
pause_handler => Closure
```

Symfony’s HTTP client includes a `pause_handler` key inside `getInfo()`, which contains a `Closure` used internally for retry logic (handling `429 Too Many Requests` with `Retry-After`). PHP, however, cannot serialize a `Closure`.

### 3. Why the Failure Was Silent

Three layers of code completely masked the root cause:

**Layer 1 — Ignored Return Value / My Mistake**

My mistake was failing to check the return value of the `save()` function. I hadn't realized at the time that it returns a boolean indicating whether the item was successfully stored.

So I went from:
```php
$this->cache->save($cacheItem); // returns false, ignored
$this->logger->debug("Response stored to cache with key {$key}.");
```

To:
```php
$saved = $this->cache->save($cacheItem);
$this->logger->debug("Cache save: {result}", ['result' => $saved ? 'success' : 'FAILED']);
```

This gave me more relevant logs, showing a `Cache save: FAILED` message on every single attempt. The `save()` method was failing, meaning my cache had never actually worked.

**Layer 2 — Silent Exception Handling in the Marshaller**

`serialize()` was failing silently because, inside `Symfony\Component\Cache\Marshaller\DefaultMarshaller::marshall()`, Symfony catches serialization exceptions by default and populates an array with the IDs of failed serializations.

Here is a simplified version of that function:

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

With `throwOnSerializationFailure` defaulting to `false`, exceptions are swallowed. The failed cache key goes into `$failed`, but no warning is ever logged.

**Layer 3 — Serializing a Mixed Data Array Fully**

Storing a mixed data array completely in the cache was another mistake of mine — _though only half mine, as I didn't anticipate the `Closure` inside `getInfo()`_. In hindsight, not everything is worth keeping.

## The Fix

**Validate cache operation results:**

```php
if (!\$this->cache->save(\$cacheItem)) {
    \$this->logger->warning('Failed to save response to cache', ['key' => \$key]);
    return;
}
\$this->logger->debug("Response stored to cache with key {\$key}.");
```

**Filter out `\Closure` instances from `getInfo()`:**

```php
\$this->info = array_filter(
    \$response->getInfo(),
    static fn (\$v) => !\$v instanceof \Closure
);
```

## Prevention

This bug wasn't an issue with Symfony's cache system — it was working exactly as designed. The failure came from three aligned oversights:

1. **Forgetting to check return values**  
   Methods return values for a reason. Treat methods returning a `bool` like `save()` as contracts.

2. **Neglecting silent exception handling**  
   Frameworks sometimes prioritize silence over visibility. Know where to flip the switch for verbosity (`throwOnSerializationFailure: true` in dev environments).

3. **Assuming `getInfo()` only contains scalar data**  
   Internal mechanics like `pause_handler` can leak into metadata. Always validate what you cache.