---
title: "My EventSubscriber silenced errors, here's why"
description: "How my whitelist route EventSubscriber was hiding real errors and how I fixed it."
cover:
  image: "img/terminal-code.jpg"
  alt: "Computer program language text"
  caption: "Photo by <a href=\"https://www.pexels.com/@nathan-dumlao/\">Nathan Dumlao</a> on <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Symfony, PHP, Debug, EventSubscriber, Security]
excerpt: >-
  My whitelist route EventSubscriber was throwing AccessDenied errors in logs with no apparent reason. Here's how I discovered it was actually hiding the real error behind the scenes.
---

A Jira ticket came out with : *"There's a strange bug disallowing users to access a page at that time that day."*
Logs said multiple times : *"[that day T that time] request.ERROR: Uncaught PHP Exception Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException: "Access denied to that resource." at WhitelistSubscriber.php line 99"*

I had no idea at first... 😅 Here's how I figured it out.

---

## The Setup

I had an EventSubscriber checking page access based on a whitelist of routes. This was legacy code — refactoring it wasn't on the table at the time.

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

Goal: Block all routes except the whitelist. Simple, right?

---

## The Problem

Logs were showing `AccessDeniedHttpException` on routes I knew were whitelisted. Classic first move: throw a `dump()` inside the subscriber to see what was coming in.

```php
public function onKernelRequest(RequestEvent $event): void
{
    $request = $event->getRequest();
    $route = $request->attributes->get('_route');

    dump($route); // 🔍 Let's see what's happening
    // ...
}
```

First surprising finding: **the subscriber was being called twice** for a single request. The first call had the expected route, the second had `$route = null`.

Obvious question: *why is `_route` null?*

I dug further with `dump($request->getPathInfo())` to see what URL was being processed on the second call:

```
// 1st call
dump($request->getPathInfo()); // "/foo"

// 2nd call
dump($request->getPathInfo()); // "/foo" ← same. Wait, what?
```

Same URL, called twice. That made no sense — if it was the same request, why was `_route` null the second time? I was going in circles.

So I dumped the full `$event` object to get more context, and narrowed it down to `_controller` in the request attributes:

```php
dump($request->attributes->get('_controller'));
// "Symfony\Component\HttpKernel\Controller\ErrorController"
```

There it was. `_controller` wasn't pointing to my code at all. Symfony had forged a brand new request to its own `ErrorController`, reusing the original URL — which is why `getPathInfo()` was so misleading — but bypassing the router entirely. That's why `_route` was null.

---

## Root Cause

The actual flow was:

```
Request → /foo
  └── WhitelistSubscriber (1st call) → _route = 'app_foo' ✅ Access granted
      └── Controller → throws RealException 💥
          └── Symfony catches it
              └── Sub-request → ErrorController (bypasses router, no _route)
                  └── WhitelistSubscriber (2nd call) → _route = null ❌ AccessDenied thrown
                      └── RealException is now silenced 🔇
```

The trap: **the subscriber's `AccessDeniedHttpException` was completely masking the original exception** — the one that actually contained the useful debug information.

When an exception is thrown, Symfony's `HttpKernel` dispatches a `KernelEvents::EXCEPTION` event, then delegates the error rendering to `ErrorController` via an internal sub-request. That sub-request reuses the original URL — which is why `getPathInfo()` was misleading — but it completely bypasses the routing layer, leaving `_route` as `null`.

---

## The Solution

Check if the request is the main request (not a sub-request):

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

`isMainRequest()` returns `false` for any internal sub-request — error handling, ESI fragments, `hinclude` — so your logic only runs on real, router-dispatched requests.

> **Note:** `isMainRequest()` replaced the deprecated `isMasterRequest()` in Symfony 5.3. If you're on an older version, use `isMasterRequest()` instead.

---

## Takeaway

Anytime your subscriber does something destructive — throw, redirect, set a response — ask yourself: *what happens when Symfony calls this on a sub-request?*

Sub-requests are everywhere in Symfony: error handling, ESI, fragments. They don't carry the same context as a main request, and your subscriber doesn't know the difference unless you tell it to.

`isMainRequest()` is that check. Make it a reflex. 🎉

