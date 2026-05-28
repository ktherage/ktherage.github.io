---
title: "Déboguer le .gitignore de Git : Pourquoi la liste blanche dans les sous-répertoires échoue"
description: "Une plongée dans les règles de traversée des répertoires du .gitignore et comment éviter les pièges courants lors de la mise en liste blanche de fichiers dans les sous-répertoires."
cover:
  image: "img/pexels-photo-577585.jpeg"
  alt: "Image de www.pexels.com - Crédits Kevin Ku"
  caption: "Image de <a href=\"https://www.pexels.com\">www.pexels.com</a> - Crédits <a href=\"https://www.pexels.com/@kevin-ku-92347/\">Kevin Ku</a>"
published: true
tags: [Git]
excerpt: >-
  En utilisant .gitignore pour garder votre projet propre, il est facile de cacher accidentellement des fichiers importants dans les sous-répertoires. Voici comment déboguer et résoudre ce problème courant.
---

## Introduction

Lorsque vous travaillez avec Git, il est courant d'utiliser `.gitignore` pour exclure des fichiers et des répertoires. Mais parfois, même des règles bien intentionnées peuvent conduire à un comportement inattendu — en particulier lorsqu'il s'agit de répertoires imbriqués. Dans cet article, je vais vous présenter un exemple concret d'une règle `.gitignore` destinée à garder un projet propre qui a fini par cacher des fichiers importants, et comment nous l'avons corrigée.

---

## La configuration

Je voulais garder le répertoire `.tools/` propre, en ne suivant que `composer.json`, `composer.lock` et le fichier `.gitignore` lui-même. Mon `.tools/.gitignore` initial ressemblait à ceci :

```gitignore
*
!.gitignore
!composer.json
!composer.lock
```

Objectif : Ne suivre que composer.json, composer.lock et .gitignore dans .tools/ et ses sous-répertoires, en ignorant tout le reste.

---

## Le problème

Après avoir poussé ce changement, un collègue a signalé que son fichier composer.lock dans `.tools/rector/` était ignoré. Nous avons utilisé la commande suivante pour déboguer :

```bash
$ git check-ignore -v .tools/rector/composer.lock
.tools/.gitignore:1:*     .tools/rector/composer.lock
```

---

## Cause racine

La règle de Git : *« Il n'est pas possible de ré-inclure un fichier si un répertoire parent de ce fichier est exclu. »*

Le motif `*` ignore à la fois les fichiers et les répertoires, ce qui signifie que Git ne regarde jamais à l'intérieur de `.tools/rector/` — donc les règles de liste blanche pour `composer.json` et `composer.lock` ne s'appliquent jamais.

---

## La solution

Après débogage, nous avons mis à jour le `.gitignore` pour permettre explicitement la traversée des répertoires et ré-inclure les fichiers nécessaires :

```gitignore
# Ignore all files and directories at this level
*

# But allow Git to inspect subdirectories
!*/

# Explicitly ignore vendor directories
vendor

# Whitelist composer.json in any subdirectory
!*/composer.json

# Whitelist composer.lock in any subdirectory
!*/composer.lock

# Always keep this .gitignore file
!.gitignore
```

---

## Points clés à retenir

| Répertoire/Fichier | Règle appliquée | Résultat |
|---------------------|-----------------|----------|
| .tools/ | `*` | Ignoré |
| .tools/rector/ | `!*/` | Inspecté |
| .tools/rector/vendor | `vendor` | Ignoré |
| .tools/rector/composer.json | `!*/composer.json` | Suivi |

- **La traversée des répertoires par Git :** Lorsque vous utilisez `*` pour tout ignorer, Git ne regardera pas à l'intérieur des répertoires sauf si vous l'autorisez explicitement avec `!*/`.
- **Tester vos règles :** Testez toujours votre `.gitignore` avec `git check-ignore -v <fichier>` et `git status` pour vous assurer que les fichiers attendus sont suivis.
- **L'ordre a son importance :** Placez les exclusions générales en premier, puis ré-incluez les fichiers ou répertoires spécifiques.
- **Pièges courants :** N'oubliez pas de ré-exclure les répertoires comme `vendor` après la mise en liste blanche, sinon ils seront inclus dans votre dépôt.

---

## Conclusion

Déboguer les problèmes de `.gitignore` peut être délicat, mais comprendre comment Git évalue la traversée des répertoires et la correspondance des motifs rend les choses beaucoup plus faciles. Testez toujours vos règles avec des répertoires imbriqués avant de commiter, et n'hésitez pas à utiliser `git check-ignore` pour vérifier votre configuration.
