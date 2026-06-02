---
title: "Dealing with Isolated PHPStan 1 and the PHPUnit 13 Blindspot"
description: "How isolating your QA tools can cause phantom 'unknown class TestCase' errors after upgrading to PHPUnit 13, and how upgrading to PHPStan 2.0 solves it."
cover:
  image: "img/pexels-puzzle-missing-piece.jpg"
  alt: "White jigsaw puzzle with one missing piece revealing a blue background"
  caption: "Photo by <a href=\"https://www.pexels.com/@karolina-grabowska/\">Karolina Grabowska</a> on <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [PHPStan, PHPUnit, QA Tools, Testing]
excerpt: >-
  Shoving PHPStan into a separate subdirectory is great for avoiding dependency hell—until you upgrade to PHPUnit 13 and your static analysis pipeline goes completely blind. Here is how to fix it.
---

We love isolated dev tools. Shoving PHPStan, Rector, or PHP CS Fixer into separate subdirectories like `.tools/phpstan/` with their own `composer.json` is a great way to avoid dependency hell in your root project.

Until it completely blinds your analysis pipeline.

If you recently jumped to **PHPUnit 13** and your static analysis suddenly went off the rails with phantom errors like `unknown class PHPUnit\Framework\TestCase`, you've hit a classic isolation wall. Let's look at why it breaks and how to fix it properly.

---

## The Symptom

Your test suite runs inside Docker. It passes flawlessly. Every assertion goes green.
Yet, the moment you run PHPStan, your terminal explodes:

```text
 ------ ---------------------------------------------------------------------------- 
  Line   tests/Client/FakeClientTest.php                                             
 ------ ---------------------------------------------------------------------------- 
  12     Class App\Tests\Client\FakeClientTest extends unknown class                 
         PHPUnit\Framework\TestCase.                                                 
         💡 Learn more at https://phpstan.org/user-guide/discovering-symbols         
  30     Call to an undefined static method                                          
         App\Tests\Client\FakeClientTest::assertInstanceOf().                        
 ------ ---------------------------------------------------------------------------- 

```

You look at your `phpstan.neon.dist`. You already bridged the gap by telling PHPStan where to find the project's autoloader:

```yaml
parameters:
    level: max
    paths:
        - src/
        - tests/
    bootstrapFiles:
        - vendor/autoload.php

```

You even double-check the autoloader manually via PHP:

```bash
php -r "require 'vendor/autoload.php'; echo class_exists('PHPUnit\Framework\TestCase') ? '🟢 OUI' : '🔴 NON';"
```

The console returns `🟢 OUI`. The class is right there. So why is PHPStan blind?

---

## Why Did This Work Fine on PHPUnit 9?

If you have this exact same layout running on an older project with PHPUnit 9.5, it works without a hitch. What changed?

### 1. The Architectural Shift in PHPUnit 10+

In PHPUnit 9, `TestCase` was a pretty monolithic class. PHPStan's static reflection engine (`BetterReflection`) had no trouble mapping it from an external directory.

With PHPUnit 10 (and up through v13), the framework was completely refactored. `TestCase` now relies on a deep web of internal interfaces and traits. When PHPStan tries to inspect it remotely across directory boundaries via a bootstrapped autoloader, the reflection engine gets lost in the inheritance tree and safely assumes the class doesn't exist.

### 2. The Legacy Extension Trap

If you look at your isolated `.tools/phpstan/composer.json`, you probably pulled a legacy constraint from an older project boilerplate:

```json
"require": {
    "phpstan/phpstan": "*",
    "phpstan/phpstan-phpunit": "^1.1"
}

```

That `^1.1` constraint locks the PHPUnit extension to its **1.x branch**, which was historically built for PHPUnit 9. Because the extension is locked to v1.x, Composer silently pins core `phpstan/phpstan` to a legacy version too (like `1.12.x`), completely ignoring your `*` wildcard. You are effectively analyzing a modern PHPUnit 13 codebase with an outdated engine.

---

## The Clean Fix: Drop the Legacy Constraints

Instead of fighting paths with `scanDirectories` or stuffing a dummy copy of PHPUnit into your tools directory, just upgrade your toolchain. **PHPStan 2.0** and its **phpstan-phpunit 2.0** extension handle the complex architecture of modern PHPUnit natively.

### 1. Bump to v2

Open `.tools/phpstan/composer.json` and force the upgrade:

```json
{
    "require": {
        "php": ">=8.4",
        "phpstan/phpstan": "^2.0",
        "phpstan/phpstan-phpunit": "^2.0"
    },
    "config": {
        "bin-dir": "./",
        "sort-packages": true
    }
}

```

### 2. Refresh the Environment

Run an update inside your tools directory to rebuild the lock file:

```bash
cd .tools/phpstan && composer update

```

### 3. Clear Cache & Analyze

Make sure your `phpstan.neon.dist` uses the absolute path variable to target your root vendor directory securely:

```yaml
parameters:
    level: max
    paths:
        - src/
        - tests/
    bootstrapFiles:
        - %currentWorkingDirectory%/vendor/autoload.php

includes:
    - .tools/phpstan/vendor/phpstan/phpstan-phpunit/extension.neon
    - .tools/phpstan/vendor/phpstan/phpstan-phpunit/rules.neon

```

Nuke the old analysis cache so you don't run into stale results:

```bash
.tools/phpstan/phpstan clear-result-cache

```

Run your analyzer again. The phantom errors will disappear, and you'll get your clean green light back without degrading your isolated architecture.
