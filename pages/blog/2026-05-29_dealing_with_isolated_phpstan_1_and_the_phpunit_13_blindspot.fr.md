---
title: "Gérer l'isolation de PHPStan 1 et l'angle mort de PHPUnit 13"
description: "Comment l'isolation de vos outils de QA peut causer des erreurs fantômes 'unknown class TestCase' après une mise à jour vers PHPUnit 13, et comment la version 2.0 de PHPStan résout le problème."
cover:
  image: "img/pexels-puzzle-missing-piece.jpg"
  alt: "Puzzle blanc avec une pièce manquante révélant un fond bleu"
  caption: "Photo par <a href=\"[https://www.pexels.com/@karolina-grabowska/](https://www.pexels.com/@karolina-grabowska/)\">Karolina Grabowska</a> sur <a href=\"[https://www.pexels.com](https://www.pexels.com)\">Pexels</a>"
published: true
tags: [PHP, PHPStan, PHPUnit, QA Tools, Clean Code, Testing]
excerpt: >-
  Isoler PHPStan dans un sous-dossier séparé est une excellente idée pour éviter l'enfer des dépendances—jusqu'à ce que vous passiez à PHPUnit 13 et que votre pipeline d'analyse statique devienne complètement aveugle. Voici comment y remédier.
---

Nous adorons les outils de développement isolés. Placer PHPStan, Rector ou PHP CS Fixer dans des sous-répertoires distincts comme `.tools/phpstan/` avec leur propre `composer.json` est un excellent moyen d'éviter l'enfer des dépendances dans votre projet racine.

Jusqu'à ce que cela rende votre pipeline d'analyse complètement aveugle.

Si vous êtes récemment passé à **PHPUnit 13** et que votre analyse statique a soudainement déraillé avec des erreurs fantômes du type `unknown class PHPUnit\Framework\TestCase`, vous vous êtes heurté à un mur d'isolation classique. Voyons pourquoi cela ne fonctionne plus et comment corriger le tir proprement.

---

## Le Symptôme

Votre suite de tests s'exécute dans Docker. Tout passe haut la main. Chaque assertion est au vert.
Pourtant, dès que vous lancez PHPStan, votre terminal explose :

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

Vous jetez un œil à votre fichier `phpstan.neon.dist`. Vous avez pourtant déjà fait le pont en indiquant à PHPStan où trouver l'autoloader du projet :

```yaml
parameters:
    level: max
    paths:
        - src/
        - tests/
    bootstrapFiles:
        - vendor/autoload.php
```

Vous double-vérifiez même l'autoloader manuellement via PHP :

```bash
php -r "require 'vendor/autoload.php'; echo class_exists('PHPUnit\Framework\TestCase') ? '🟢 OUI' : '🔴 NON';"
```

La console renvoie `🟢 OUI`. La classe est bien là. Alors, pourquoi PHPStan est-il aveugle ?

---

## Pourquoi cela fonctionnait-il très bien avec PHPUnit 9 ?

Si vous avez exactement cette même configuration sur un projet plus ancien tournant sous PHPUnit 9.5, tout fonctionne sans accroc. Qu'est-ce qui a changé ?

### 1. Le virage architectural de PHPUnit 10+

Dans PHPUnit 9, `TestCase` était une classe plutôt monolithique. Le moteur de réflexion statique de PHPStan (`BetterReflection`) n'avait aucun mal à la cartographier depuis un répertoire externe.

Avec PHPUnit 10 (et jusqu'à la v13), le framework a été entièrement refactorisé. `TestCase` s'appuie désormais sur un réseau complexe d'interfaces et de traits internes. Lorsque PHPStan tente de l'inspecter à distance au-delà des frontières du répertoire via un autoloader bootstrappé, le moteur de réflexion se perd dans l'arbre d'héritage et considère prudemment que la classe n'existe pas.

### 2. Le piège de l'extension obsolète

Si vous regardez le fichier `.tools/phpstan/composer.json` de votre outil isolé, vous y trouverez probablement une contrainte héritée d'un ancien boilerplate de projet :

```json
"require": {
    "phpstan/phpstan": "*",
    "phpstan/phpstan-phpunit": "^1.1"
}
```

Cette contrainte `^1.1` verrouille l'extension PHPUnit sur sa **branche 1.x**, historiquement conçue pour PHPUnit 9. L'extension étant bloquée en v1.x, Composer fige silencieusement le cœur de `phpstan/phpstan` dans une version obsolète elle aussi (comme la `1.12.x`), ignorant complètement votre wildcard `*`. Vous vous retrouvez concrètement à analyser du code moderne sous PHPUnit 13 avec un moteur daté.

---

## La solution propre : abandonner les contraintes obsolètes

Plutôt que de vous battre avec les chemins via `scanDirectories` ou d'installer une copie factice de PHPUnit dans le répertoire de vos outils, mettez simplement à jour votre chaîne d'outils. **PHPStan 2.0** et son extension **phpstan-phpunit 2.0** gèrent nativement l'architecture complexe du PHPUnit moderne.

### 1. Passer à la v2

Ouvrez `.tools/phpstan/composer.json` et forcez la mise à jour :

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

### 2. Rafraîchir l'environnement

Lancez une mise à jour dans le répertoire de votre outil pour reconstruire le fichier lock :

```bash
cd .tools/phpstan && composer update
```

### 3. Vider le cache et analyser

Assurez-vous que votre fichier `phpstan.neon.dist` utilise bien la variable de chemin absolu pour cibler le répertoire vendor racine de manière sécurisée :

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

Supprimez l'ancien cache d'analyse pour éviter les résultats obsolètes :

```bash
.tools/phpstan/phpstan clear-result-cache
```

Relancez votre analyseur. Les erreurs fantômes vont disparaître et vous retrouverez vos indicateurs au vert, sans pour autant dégrader l'architecture isolée de vos outils.