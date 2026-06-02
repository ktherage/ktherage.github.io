---
title: "Symfony & Doctrine Migrations : Validation en CI"
description: "Comment détecter qu'un changement d'entité Doctrine est livré sans migration générée : un check CI simple qui échoue vite sur une incohérence schéma/mapping."
cover:
  image: "img/birds-migration.jpg"
  alt: "Vol d'oiseaux formant un V en plein vol"
  caption: "Photo par <a href=\"https://www.pexels.com/@kai-filmer/\">Kai Filmer</a> sur <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Symfony, Doctrine, Migrations, CI, DevOps]
excerpt: >-
  J'ai eu l'opportunité de travailler sur un projet avec une équipe relativement novice en matière de migrations Doctrine. Pour les aider à s'y habituer et écarter la possibilité d'avoir des pull (ou merge) requests avec des modifications d'entités Doctrine sans migration générée.

  Voici comment j'ai procédé. J'espère que cela vous plaira !
---

J'ai eu l'opportunité de travailler sur un projet avec une équipe relativement novice en matière de migrations Doctrine. Pour les aider à s'y habituer et écarter la possibilité d'avoir des pull (ou merge) requests avec des modifications d'entités Doctrine sans migration générée.

Voici comment j'ai procédé. J'espère que cela vous plaira !

## Avertissement

Nous sommes le 10 juillet 2025 et cet article est obsolète en raison du merge de la Pull Request https://github.com/doctrine/migrations/issues/1406 ; désormais, l'exécution de `bin/console doctrine:migrations:up-to-date` prend en compte la configuration `schema_filter`.

## Comment fonctionnent les migrations Doctrine

Lors de la génération de la migration, Doctrine calcule un delta entre son mapping et le schéma actuel de la base de données. Avec ce delta en mémoire, il génère un **fichier de migration** avec deux méthodes principales :
* `up` applique les commandes SQL pour combler l'écart entre le schéma actuel de la base de données et son mapping. Utilisé pour déployer les modifications du schéma de votre base de données.
* `down` permet d'annuler la migration avec les commandes SQL nécessaires pour « annuler » les modifications effectuées dans la méthode up. Utilisé pour revenir en arrière sur les modifications du schéma de votre base de données.

## L'astuce magique

Il n'existe actuellement aucun moyen simple de vérifier si une migration n'a pas été générée. Si ce code était fusionné, le schéma de la base de données pourrait ne plus être synchronisé avec le mapping des entités, entraînant ainsi une erreur serveur.

Les mots-clés dans la description ci-dessus sont **fichiers de migration**. J'utilise le fait que l'exécution de la commande `bin/console doctrine:migration:diff` génère un nouveau fichier et échoue s'il n'y a aucun changement à appliquer.

Connaître la liste des fichiers existants avant l'exécution de cette commande, puis l'exécuter, permet de détecter qu'il y a des modifications qui n'ont pas été commitées dans un **fichier de migration** dans cette pull (ou merge) request.

## Étapes à suivre

1. Créez votre base de données
2. Exécutez vos migrations existantes
3. Puis exécutez l'étape de vérification des modifications manquantes (voir ci-dessous)

## Avantages

1. Tester que vos migrations ne échouent pas
2. Assurer la cohérence du schéma de base de données avec le mapping de Doctrine

## Vous voulez l'extrait de code, n'est-ce pas ?

Voici le code bash :

```bash
#!/bin/bash

set -e
set -o pipefail

# run doctrine migration diff to check if there is a new migration file generated and check last exit code
if [[ -z $(bin/console doctrine:migrations:diff -n --quiet) ]]; then
    echo "Error ! bin/console doctrine:migration:diff found a new migration which must not be the case.";
    # cat last file (should be the newly generated one)
    cat $(ls -Art migrations/*.php | tail -n 1);
    # remove that file (just in case to comply with my paranoïac side)
    rm -f $(ls -Art migrations/*.php | tail -n 1);
    exit 1;
else
    exit 0;
fi

```

Et voilà ! Vous pouvez désormais vous assurer que chaque pull (ou merge) request contient des migrations fonctionnelles, sans modification en attente laissée de côté !

## Ok, mais pourquoi ne pas utiliser `bin/console doctrine:schema:validate` ?

La raison est que le projet sur lequel nous travaillions utilisait la configuration `schema_filter` de Doctrine pour filtrer certaines tables dont nous ne voulions pas nous occuper (contrainte liée au projet).

Le problème avec `bin/console doctrine:schema:validate` est qu'il ne prenait pas en compte cette configuration, et signalait donc des modifications (tentant de supprimer toutes les tables normalement filtrées) sans rapport avec ce que nous voulions.

Un collègue m'a dit qu'il s'agit d'un problème connu qui pourrait être corrigé prochainement (https://github.com/doctrine/migrations/issues/1406).

Merci d'avoir lu cet article et n'hésitez pas à laisser vos commentaires si vous avez des questions !
