---
alias: /blog/symfony-session-vs-http-cache/
title: "Symfony Silently Kills Your HTTP Cache When a Session Starts"
date: 2026-09-02
description: "You set Cache-Control: public, s-maxage=86400. Symfony replies private, max-age=0, must-revalidate, s-maxage=86400. Here is AbstractSessionListener at -1000 and the official escape hatch NO_AUTO_CACHE_CONTROL_HEADER (PR #53057)."
cover:
  image: "img/pexels-emergency-exit-10547549.jpg"
  alt: "Bright green emergency exit sign illuminated in darkness — the official escape hatch"
  caption: "Photo by <a href=\"https://www.pexels.com/@esjaimes-2097293/\">Esdras Jaimes</a> on <a href=\"https://www.pexels.com/photo/close-up-of-an-exit-sign-10547549/\">Pexels</a>"
published: true
tags: [Symfony, PHP, HTTP Cache, API Platform, Security]
excerpt: >-
  Your API Platform cacheHeaders say public, Symfony replies private, max-age=0. Blame AbstractSessionListener at priority -1000 — and its documented escape hatch Symfony-Session-NoAutoCacheControl.
---

I learned the hard way that Symfony has a security listener that silently overwrites your `Cache-Control` with `private, max-age=0, must-revalidate` the moment a PHP session is started during the request.

More importantly, there is an official escape hatch when you know the response is safe to cache anyway.

If you have ever fought this header:

```http
Cache-Control: max-age=0, must-revalidate, private, s-maxage=86400
```

while your code clearly asked for a public response, this one is for you.

## The symptom

With API Platform 3.4 and this configuration, you define cache headers for a resource:

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

You expect something like:

```http
Cache-Control: max-age=86400, public, s-maxage=86400
ETag: "abc123"
```

But in some situations, you get:

```http
Cache-Control: max-age=0, must-revalidate, private, s-maxage=86400
```

Even though `s-maxage` is present in the header, it becomes useless for a shared cache: the response is now `private` and the shared cache will skip it entirely, ignoring the `s-maxage` duration you set.

No error, no log: your API Platform configuration was correct — it was simply modified later in the HTTP cycle.

## How I found it: Behat tests on the cache

I didn't find this by reading source code out of curiosity on a Sunday afternoon. I found it while writing Behat tests for the HTTP cache on our API.

I was writing scenarios to cover cache behavior on our API endpoints, something like:

```gherkin
Scenario: Published articles are publicly cached
  Given I am authenticated as a user
  When I send a "GET" request to "/api/articles"
  Then the response status code should be 200
  And the response header "cache-control" should contain "public"
  And the response header "cache-control" should contain "max-age=86400"
  And the response header "cache-control" should contain "s-maxage=86400"
```

At execution, the test failed. No `public` in the header — just a `max-age=0, must-revalidate, private, s-maxage=86400` instead.

That's when I started looking at what could modify the response after API Platform had correctly set its headers.

## The culprit: `AbstractSessionListener` at `-1000`

The responsible party is `Symfony\Component\HttpKernel\EventListener\AbstractSessionListener`. Its job goes beyond saving the session: when a session is started during a request, Symfony transforms the response into a private, uncacheable one by default — a security measure to avoid accidentally caching and redistributing user-specific private data across a shared cache misconfiguration.

Two details explain why this catches everyone off guard.

**It runs very late.** In Symfony 6.4+, the listener subscribes to `kernel.response` at priority `-1000`, explicitly to execute among the very last response listeners — after API Platform, after your own subscribers *that rarely have such a low priority set, I'd presume*.

**It checks whether the session was actually used**, not just whether it exists. It's not `$request->hasSession()`. The real code:

```php
if ($autoCacheControl) { // this condition will be useful later (`true` by default)

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

Before it ever reaches `if ($autoCacheControl)`, `AbstractSessionListener::onKernelResponse()` runs through several guard clauses — each can `return` early without touching `Cache-Control`:

1. **Main request only** — `if (!$event->isMainRequest() || (!$container->has('initialized_session') && !$request->hasSession())) return;` : sub-requests are ignored.
2. **Internal header popped early** — `$autoCacheControl = !$response->headers->has(self::NO_AUTO_CACHE_CONTROL_HEADER)` then unconditional `remove()`, even if the method returns right after.
3. **Session attached?** — `if (!$request->hasSession(true)) return;` (`true` also checks request attributes).
4. **If `isStarted()` → `save()` + cookie handling** — early save (locks, `fastcgi_finish_request`, ID regeneration) and `Set-Cookie` management: `clearCookie` if session empty but cookie present, `setCookie` if new ID and session not empty.
5. **Actually used?** — `if ($session instanceof Session ? 0 === $session->getUsageIndex() : !$session->isStarted()) return;` : a session that exists but was never read/written does not force `private`.

Only after these early exits does the block run — `maxAge` is `0` if the response was `public` else `getMaxAge()`, then `setExpires()`, `setPrivate()`, `setMaxAge($maxAge)` and `must-revalidate`.

File: `src/Symfony/Component/HttpKernel/EventListener/AbstractSessionListener.php` — [6.4 on GitHub](https://github.com/symfony/symfony/blob/6.4/src/Symfony/Component/HttpKernel/EventListener/AbstractSessionListener.php).

## Why Symfony does this

A session generally means **user-specific data is involved**. If a `GET /api/me` response for user A became publicly cacheable, user B could receive A's data from the shared cache (Varnish, for example).

Symfony defaults to a conservative behavior: session used → private response.

**Having an `Authorization: Bearer ...` header does not mean Symfony started a session.** The actual trigger for `AbstractSessionListener` is effective session usage somewhere in the request — not the presence of an auth token.

So even if your firewall is configured with `stateless: true`, your code — at some point — might still use the session for entirely legitimate reasons, triggering the listener.

The real question to ask yourself is: **is a session actually being used during this request** — via your code, a bundle, a listener, a controller?

To find out, look for the accesses that actually start the session:

```php
$request->getSession()->start()
$request->getSession()->set(...)
$request->getSession()->get(...)
$request->getSession()->getFlashBag()
```

## The `if ($autoCacheControl)` escape hatch

Remember `if ($autoCacheControl) {`? That's our escape route.

Because Symfony planned an escape hatch to bypass this behavior when you explicitly want to tell the framework:

> OK, I know you want to protect me, but I know what I'm doing — so can you ignore this for a minute?

It goes through checking for the presence of the `NO_AUTO_CACHE_CONTROL_HEADER` constant in the response headers:

```php
$autoCacheControl = !$response->headers->has(
    self::NO_AUTO_CACHE_CONTROL_HEADER
);
```

The constant resolves to `'Symfony-Session-NoAutoCacheControl'`.

If your `Response` carries this header, the listener skips the forced `private`, then removes the header itself before sending the response to the client:

```php
$response->headers->remove(self::NO_AUTO_CACHE_CONTROL_HEADER);
```

This is an internal server signal, never a header destined for the client.

### Is it a hack? No — it is documented

Until Symfony 7.0, the entire `AbstractSessionListener` class was `@internal`, so PHPStan/Psalm complained when you referenced `AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER`.

PR [#53057](https://github.com/symfony/symfony/pull/53057) — *[HttpKernel] Move @internal from AbstractSessionListener class to its methods and properties* — removed `@internal` from the class (kept on methods/props), backported to 6.4, making this constant officially usable. Symfony 7.1 docs now show it explicitly:

```php
use Symfony\Component\HttpKernel\EventListener\AbstractSessionListener;

$response->headers->set(AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER, 'true');
```

Source: [symfony.com/doc/current/http_cache.html#http-caching-and-user-sessions](https://symfony.com/doc/current/http_cache.html#http-caching-and-user-sessions)

### How to use it

If you control the `Response`:

```php
use Symfony\Component\HttpKernel\EventListener\AbstractSessionListener;

$response->headers->set(
    AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
    'true'
);
```

In an API Platform application, a `kernel.response` subscriber scopes the behavior properly:

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
        // AbstractSessionListener = -1000, we need to run before it
        return [
            KernelEvents::RESPONSE => ['onKernelResponse', -100],
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        // Scope it by path — never globally
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

`-100` is nothing magical: it simply has higher priority than `-1000`, so this subscriber runs before `AbstractSessionListener`.

### The pitfall to absolutely avoid

Do not set this header globally on every safe `GET` response:

```php
// Do not do this without thinking about the response content
if ($request->isMethodSafe()) {
    $response->headers->set(
        AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
        'true'
    );
}
```

`GET /api/me`, `GET /api/cart`, or `GET /api/orders` must not become publicly cacheable simply because they use `GET`.

The right question: **is this response identical for multiple users?**

In my case, it was. But if it isn't, do not bypass this Symfony safety mechanism.

Also, prefer whitelisting specific paths that are allowed to bypass this protection, rather than applying it broadly.

## TL;DR

```text
#[ApiResource(cacheHeaders: [...])]
        → API Platform generates a cacheable response
        → kernel.response
        → AbstractSessionListener (-1000)
        → session used? yes
        → Cache-Control becomes private
```

Symfony does this intentionally to prevent a session-bound response from accidentally ending up in a shared cache.

If you know with certainty the response can be cached despite session usage:

```php
$response->headers->set(
    AbstractSessionListener::NO_AUTO_CACHE_CONTROL_HEADER,
    'true'
);
```

set on the `Response`, never the `Request`, then automatically removed by the listener before sending.

And if one lesson is to remember beyond the header itself: **test your cache headers like any other observable behavior of your API.**
