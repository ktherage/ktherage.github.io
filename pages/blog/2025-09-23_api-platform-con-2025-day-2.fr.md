---
title: "API Platform con 2025 - JOUR 2"
date: 2025-09-23
description: "API Platform con 2025 - JOUR 2 - un aperçu des conférences auxquelles j'ai assisté à l'API Platform Conference en 2025."
cover:
  image: "img/54799605114_49f6d7d4e1_k.jpg"
  alt: "Image de l'API Platform con 2025 - Crédits Nicolas Detrez"
  caption: "Image de l'API Platform con 2025 - Crédits <a href=\"https://ncls.tv/\">Nicolas Detrez</a>"
published: true
tags:
  - Conference
  - API
  - Symfony
category: Conférences
excerpt: >-
  J'ai eu l'opportunité d'assister à l'API Platform Con 2025 grâce à SensioLabs et voici ce que j'ai appris lors des conférences auxquelles j'ai assisté.
---

J'ai eu l'opportunité d'assister à l'API Platform Con 2025 grâce à SensioLabs et voici ce que j'ai appris lors des conférences auxquelles j'ai assisté.

Table des matières :

[toc]

---

## Comment les LLM changent la façon de construire des API (Fabien Potencier)

**Les slides de cette conférence sont disponibles : [https://speakerdeck.com/fabpot/how-ai-agents-are-changing-the-way-we-should-build-apis](https://speakerdeck.com/fabpot/how-ai-agents-are-changing-the-way-we-should-build-apis)**

Fabien Potencier a partagé des informations sur la façon dont les grands modèles de langage sont en train de changer fondamentalement la façon dont nous devons concevoir les API. Comme il l'a mentionné, c'est un monde qui change si vite que certaines affirmations pourraient déjà être obsolètes.

### Les agents ?

Les LLM évoluent au-delà de la simple génération de texte pour devenir des agents autonomes. Selon la définition d'Anthropic, un agent est un LLM qui utilise des outils dans une boucle. Ces LLM sont auto-dirigés — ils peuvent raisonner sur les choses, ils peuvent planifier et ont une mémoire.

Un agent IA est en quelque sorte un mélange entre une machine et un humain, combinant la puissance de calcul des machines avec des capacités de raisonnement de type humain.

### Qui peut consommer votre application ?

À l'époque, les consommateurs étaient clairement définis :

**Site Web :**
- Utilisateurs humains uniquement

**Outils CLI :**
- Réservés aux développeurs

**API :**
- Uniquement pour les machines
- Semi-privée (pour découpler le frontend) ou publique

De nos jours, les API sont principalement utilisées pour exposer des données, mais les agents IA ont complètement changé la donne. Ils sont capables d'interagir avec les trois interfaces :

- **Les sites Web peuvent être scrappés par l'IA** - les agents peuvent naviguer et extraire des informations des interfaces web
- **Les outils CLI peuvent être utilisés via des serveurs MCP** - fournissant un accès structuré aux outils
- **Les API** - les LLM (par exemple dans les chatbots) sont souvent des wrappers autour d'API. De plus, les LLM peuvent aussi écrire des appels API directement.

Mais ces trois types ont des attentes différentes, ce qui crée de nouveaux défis.

### Le défi : API pour les humains vs. machines vs. agents IA

Les API sont optimisées pour les machines, mais quand quelque chose se casse, vous avez besoin d'un humain dans la boucle. Cependant, les agents IA sont autonomes mais, comme les humains, ils ont besoin d'aide et de conseils.

Prenons l'exemple des codes de statut HTTP. Ils fournissent des informations sur les problèmes, mais les agents IA ont besoin de plus de contexte.
Les réponses HTTP peuvent fournir un contexte sur les erreurs, mais les réponses fournies par les API peuvent ne pas être à jour ou précises, ce qui fait que les LLM restent bloqués.

Voici un schéma de workflow courant suivi par les LLM : Pensée → Action → Observation.
Sans conseils fournis via les prompts, ils peuvent boucler sur le même problème, rencontrant la même Observation après avoir effectué la même Action — potentiellement pour toujours.
Les LLM vont essayer de deviner et de s'auto-corriger, ce qui est probablement mauvais pour deux raisons :
- **Coûteux** - plus d'appels API et de traitement
- **Perte de temps** - résolution inefficace du problème
- **Gourmand en ressources** - le temps GPU et l'électricité sont consommés sans résoudre le problème

**Conseil :** Moins vous faites d'allers-retours avec un LLM, plus il devient « déterministe », même si les LLM ne sont pas intrinsèquement déterministes.

### Bonnes pratiques pour des API adaptées aux LLM

Tout ce qui est valable pour les LLM est également valable pour les humains.

#### Messages d'erreur
Soyez précis avec vos messages d'erreur : « Format de date incorrect. Utilisez 'YYYY-MM-DD'. »
Avantages :
- Moins de tokens consommés
- Utilisation réduite de la fenêtre de contexte
- Résolution plus rapide

#### Nommage cohérent
Utilisez le même modèle de nommage partout. Par exemple, utilisez `user_id` de manière cohérente sur tous les points de terminaison.
Avantages :
- Modèles prévisibles
- Les LLM aiment la cohérence
- Plus facile à comprendre et à utiliser

#### Documentation
- Corrigez les exemples et supprimez le contenu obsolète
- Moins de problèmes et d'hallucinations
- Envisagez d'utiliser des fichiers `llms.txt` - documentation spécifiquement formatée pour les LLM en Markdown

#### Considérations de performance
Les agents IA sont lents, donc réduire le nombre de requêtes offre un gain de performance significatif.

#### Conception d'API orientée intention
Concevez vos API pour capturer et préserver l'intention utilisateur plutôt que de simplement exposer des opérations CRUD.

### Défis des tests

Tester les agents IA est extrêmement difficile car :
- Les LLM ne sont pas déterministes
- Vous devez régler la température à 0 pour des résultats plus cohérents
- Utilisez des prompts concis
- En fin de compte, vous avez besoin d'un humain pour juger la qualité des actions effectuées par le LLM, ce qui rend les tests automatisés complexes

### Considérations techniques

#### Tokens vs. Texte

Comprendre la tokenisation est crucial. Des outils comme [tiktokenizer.vercel.app](https://tiktokenizer.vercel.app) aident à visualiser comment le texte est tokenisé :

- **La langue a son importance :** l'anglais coûte moins de tokens que le français ou le japonais par exemple
- **Les identifiants uniques sont problématiques :** les UUID sont mauvais pour les tokeniseurs, les ULID sont meilleurs
- **Plus court n'est pas toujours mieux** en termes d'efficacité des tokens
- **Les formats de date ont un impact** sur la consommation de tokens
- **JSON n'est pas le meilleur format** pour les LLM - Markdown est meilleur et utilise moins de tokens

Plus de tokens nécessitent plus d'argent et créent des fenêtres de contexte plus grandes, ce qui impacte négativement les temps de réponse et la pertinence des agents IA.

#### Sécurité et identifiants

Les agents IA sont mauvais pour gérer les identifiants. La solution est d'utiliser des serveurs MCP (Model Context Protocol) qui :
- Gèrent les identifiants de manière sécurisée
- Fournissent des outils aux agents IA
- Donnent des permissions à portée limitée aux actions MCP
- Agissent comme un intermédiaire sécurisé entre le LLM et vos API

### Tout journaliser

Compte tenu de la complexité et de l'imprévisibilité des interactions des agents IA, une journalisation complète devient essentielle pour le débogage et l'amélioration du système.

### La nouvelle expérience : AX (AI Experience)

Fabien a introduit le concept d'AX (AI Experience) aux côtés de l'UX (User Experience) et du DX (Developer Experience). Cela représente une nouvelle dimension de la conception d'API axée sur la façon dont votre API fonctionne avec les agents IA.

Les aspects clés d'une bonne AX incluent :
- Documentation et exemples à jour (éviter les exemples obsolètes qui pourraient induire le LLM en erreur)
- Utilisation de fichiers `llms.txt` avec toute la documentation utile pour le LLM au format Markdown
- Messages d'erreur clairs et cohérents
- Conception d'API préservant l'intention
- Utilisation efficace des tokens

L'aspect fascinant est que de nombreuses améliorations pour l'AX profitent également au DX traditionnel, rendant les API meilleures à la fois pour les développeurs humains et les agents IA.

---

## Construire une application découplée avec API Platform et Vue.js (Nathan de Pachtere)

Nathan de Pachtere a partagé son expérience de construction d'applications découplées en utilisant API Platform pour le backend et Vue.js pour le frontend. Ses réflexions ont couvert les différences entre les approches headless et découplées, les stratégies d'implémentation pratiques et les avantages de l'architecture monorepo.

### Headless

L'architecture headless consiste à créer une API orientée métier que tout le monde peut utiliser indépendamment. Pensez à l'API GitHub - elle est conçue comme un service autonome qui fournit toutes les fonctionnalités nécessaires pour interagir avec les fonctionnalités de GitHub, complètement indépendante de toute implémentation frontend spécifique.

L'objectif est de créer une logique métier et de fournir une API que chacun peut utiliser à ses propres fins.

### Découplé

L'architecture découplée est similaire mais plus ciblée. Vous fournissez un frontend qui repose spécifiquement sur votre API, créant ainsi ce qu'on appelle un modèle backend-for-frontend. L'API ne semble pas conçue pour une utilisation indépendante en dehors de l'application spécifique - elle est adaptée pour répondre exactement aux besoins du frontend.

### Pourquoi choisir cette approche ?

#### Avantages

- **Séparation des responsabilités** - Limites claires entre les préoccupations frontend et backend
- **Gestion d'équipe** - Permet aux équipes spécialisées de travailler indépendamment sur leurs domaines d'expertise
- **Capitalisation** - Composants et logique réutilisables entre différents projets
- **Pérennisation** - L'IA pourrait être l'interface utilisée à l'avenir, rendant une approche API-first précieuse

#### Inconvénients

- **Complexité** - Configuration plus complexe pour les projets existants qui doivent être refactorisés

### Implémentation Headless

#### avec API Platform

Le processus suit une approche orientée métier :

1. **Représenter l'API basée sur les besoins métier** - Concentrez-vous sur ce que l'entreprise fait réellement
2. **Traduire en entités et workflows** - Convertissez les processus métier en implémentations techniques
3. **Écrire uniquement le code nécessaire** - Restez simple initialement
4. **Puis optimiser et refactoriser** - Améliorez les performances et la qualité du code
5. **Itérer** - Améliorez continuellement en fonction des retours
6. **Aller au-delà du CRUD** - Implémentez des opérations métier significatives, pas seulement la manipulation de données de base

#### Fourniture de clés API

Pour l'authentification machine-à-machine :

- **Créez une interface simple** pour créer/supprimer des clés configurables avec des permissions spécifiques
- **Envisagez des fournisseurs d'identité externes** comme Keycloak ou Zitadel pour des cas d'utilisation plus avancés
- **Principe important :** Ne mélangez pas les utilisateurs humains avec les utilisateurs machines - ils ont des besoins et des exigences de sécurité différents

Nathan a souligné l'importance de rendre les tests simples et faciles à implémenter, en les intégrant naturellement dans le workflow de développement plutôt que de les traiter comme une réflexion après coup.

#### Stratégie de dépréciation

Lors de l'évolution de votre API :

- **Dépréciez les points de terminaison, ressources et propriétés** progressivement
- **Donnez aux consommateurs le temps de s'adapter** aux changements
- **Communiquez les changements clairement** avant de supprimer une fonctionnalité

Cette approche maintient la rétrocompatibilité tout en permettant à l'API d'évoluer.

### Implémentation Découplée

#### avec Vue.js

Nathan a choisi Vue.js pour plusieurs raisons :

- **Indépendant et piloté par la communauté** - Pas contrôlé par une seule entreprise
- **Composition API (Vue 3)** - Favorise la réutilisabilité du code et une meilleure organisation
- **Excellente expérience développeur** - Outillage et workflow de développement de qualité
- **Meilleures performances** - Rapide et efficace (jusqu'au prochain framework, comme il l'a plaisanté)

#### Connexion API

Pour connecter le frontend Vue.js au backend API Platform :

##### Génération de code

Utilisez **openapi-ts.dev** pour générer des types TypeScript et des composables à partir de votre spécification OpenAPI. Cela garantit la sécurité des types et réduit le travail manuel.

**Principe important :** N'utilisez pas directement les types générés comme objets de base dans votre frontend. Créez vos propres modèles pour maintenir un découplage approprié entre les représentations frontend et backend.

##### Client HTTP et gestion d'état

- **Tanstack Query** - Pour une récupération et un mise en cache efficaces des données
- **TypeScript partout** - Garantit la sécurité des types dans toute l'application
- **VS Code pour le développement Vue.js** - Meilleure intégration que les IDE JetBrains pour le travail Vue.js

##### SDK de haut niveau

Fournissez des SDK de haut niveau pour faciliter l'intégration API, rendant plus facile pour les développeurs de travailler avec votre API.

### Gestion des versions

#### Polyrepo vs Monorepo

**Monorepo ne signifie pas monolithe** - c'est une distinction cruciale :

- **Monorepo** = Plusieurs projets séparés dans un seul dépôt
- **Monolithe** = Application unique gérant tout

#### Avantages du Monorepo

L'objectif est de simplifier le workflow :

- **Façon unifiée de penser le code** - Modèles cohérents entre les projets
- **Cohérence** - Outillage et configurations partagés
- **Facilite le partage** - Réutilisation facile du code et des composants
- **Travail d'équipe plus efficace** - Collaboration et gestion des dépendances simplifiées

#### Outillage

Nathan a recommandé **moonrepo.dev** comme outil open source pour gérer les monorepos. Vous pouvez trouver plus d'informations sur **monorepo.tools**.

#### Exemple concret

Nathan a partagé leur expérience avec des avantages considérables :

- **Généralisation du code** - Modèles et composants réutilisables
- **Partage de fonctionnalités** - Bibliothèques communes entre les projets
- **Organisation par technologie** - Les projets utilisent des bibliothèques partagées organisées par stack technologique

Vous pouvez voir un exemple pratique de cette approche dans le projet [Lychen](https://github.com/alpsify/lychen) ([lychen.fr](https://lychen.fr/)), qui démontre un monorepo bien structuré avec une séparation claire entre le backend, le frontend et les outils partagés.

Le projet Lychen montre comment organiser un monorepo avec :

- **Backend** (API Platform/PHP)
- **Frontend** (Vue.js/TypeScript)
- **Outillage partagé** (Moonrepo, Docker, outils de test)
- **Limites technologiques claires** tout en maintenant un partage de code efficace

---

## Jean-Beru présente : Fun with flags (Hubert Lenoir)

**Les slides de cette conférence sont disponibles : [https://jean-beru.github.io/2025_09_apiplatformcon_fun_with_flags](https://jean-beru.github.io/2025_09_apiplatformcon_fun_with_flags)**

Jean-Beru (Hubert Lenoir) a présenté le monde fascinant des feature flags et leur implémentation pratique. Comme l'a dit Oncle Ben dans Spider-Man : « Un grand pouvoir implique de grandes responsabilités » - et les feature flags sont effectivement un outil puissant qui nécessite une réflexion approfondie.

### Que sont les Feature Flags ?

Les feature flags (également appelés feature flipping ou feature toggles) sont une technique de développement logiciel qui permet d'activer ou de désactiver des fonctionnalités sans déployer de nouveau code. Ils agissent comme des instructions conditionnelles dans votre code qui déterminent si une fonctionnalité particulière doit être activée ou désactivée pour des utilisateurs, environnements ou conditions spécifiques.

### Types de Feature Flags

#### Flags de Release

Principalement utilisés pour tester de nouvelles fonctionnalités en production en toute sécurité.

- **Développement continu** - Même si une fonctionnalité n'est pas prête, vous pouvez continuer à développer et déployer (non prêt = désactivé)
- **Déploiement sécurisé** - Déployez le code avec les fonctionnalités désactivées, puis activez-les quand elles sont prêtes
- **Déploiement progressif** - Activez les fonctionnalités pour de petits groupes avant le déploiement complet

#### Flags d'Expérimentation

Utilisés pour comparer différentes versions de votre application.

- **Tests A/B** - Comparez différentes implémentations ou expériences utilisateur
- **Doivent être accompagnés de métriques** - Suivez les performances et le comportement des utilisateurs
- **Activation partielle** - Activez pour des pourcentages spécifiques (par exemple, 20 % des utilisateurs)

Cette approche permet des décisions basées sur les données concernant les fonctionnalités ou implémentations qui fonctionnent le mieux pour vos utilisateurs.

#### Flags de Permission

Contrôlent l'accès aux fonctionnalités en fonction des permissions des utilisateurs ou des niveaux d'abonnement.

- **Blocage d'accès basé sur les permissions** - Par exemple, fonctionnalités payantes disponibles uniquement pour les abonnés premium
- **Accès aux fonctionnalités basé sur les rôles** - Différentes fonctionnalités pour différents types d'utilisateurs
- **Niveaux d'abonnement** - Activez des fonctionnalités avancées pour les clients de niveaux supérieurs

#### Flags Opérationnels

Ceinture de sécurité et fonction kill switch.

- **Permettent de désactiver les fonctionnalités lourdes** - Désactivez rapidement les fonctionnalités gourmandes en ressources en période de forte charge
- **Réponse d'urgence** - Désactivez les fonctionnalités problématiques sans déploiement
- **Gestion des performances** - Contrôlez la charge système en activant/désactivant les opérations coûteuses

Pour plus d'informations détaillées sur les modèles de feature flags, Martin Fowler a un excellent article sur [https://martinfowler.com/articles/feature-toggles.html](https://martinfowler.com/articles/feature-toggles.html).

### Implémentation

Il existe de nombreux fournisseurs de feature flags sur le marché, mais l'implémentation n'a pas nécessairement besoin d'utiliser le composant Security de Symfony.

#### Pourquoi pas le composant Security ?

- **Restreint au contexte utilisateur actuel** - Limitations lorsque les flags doivent fonctionner dans différents contextes utilisateur
- **Problèmes de timing d'authentification** - L'authentification a lieu après le routage, ce qui peut entraîner des codes d'erreur interdits indésirables
- **Besoins de flexibilité** - Les implémentations personnalisées peuvent mieux s'intégrer avec des fournisseurs existants comme Unleash

#### Exigences pour une bonne implémentation

Un système de feature flags solide devrait fournir :

- **Simplicité** - Facile à implémenter et à utiliser
- **Débogage intégré** - Visibilité claire sur les flags actifs
- **Sources multiples** - Capacité de basculer entre différents fournisseurs de flags
- **Support de divers fournisseurs** - Fonctionne avec différents services de feature flags
- **Cacheable** - Optimisation des performances via des mécanismes de cache

#### Intégration Symfony

Il existe un composant FeatureFlag en cours de développement pour Symfony (PR #53213). Ce composant vise à fournir un support natif des feature flags dans l'écosystème Symfony.

### Avec API Platform

Les feature flags peuvent être facilement testés via un bundle séparé : [ajgarlag/feature-flag-bundle](https://github.com/ajgarlag/feature-flag-bundle).

#### Étapes d'implémentation

1. **Décoration du provider API Platform** - Utilisez le pattern decorator pour envelopper les providers existants avec la logique de feature flag
2. **Utilisez l'interface du composant FeatureFlag WIP** - Intégrez-vous avec le futur composant FeatureFlag de Symfony

#### Exemple avec le fournisseur GitLab

GitLab fournit un service de feature flags qui utilise Unleash en arrière-plan. Cette intégration vous permet de :

- **Gérer les flags via l'interface GitLab** - Interface familière pour les équipes utilisant déjà GitLab
- **Tirer parti des capacités d'Unleash** - Moteur de feature flags puissant sous le capot
- **Intégrer avec les pipelines CI/CD** - Gestion automatique des flags dans le cadre du processus de déploiement

#### Intégration du Profiler

L'implémentation inclut l'intégration du Symfony Profiler, fournissant :

- **Informations de débogage** - Voyez quels flags sont actifs pendant le développement
- **Informations de performance** - Surveillez l'impact des vérifications de feature flags
- **Workflow de développement** - Test et débogage faciles du comportement des flags

### Avantages

L'implémentation des feature flags apporte plusieurs avantages significatifs :

#### Déploiement continu
- **Découpler le déploiement de la release** - Déployez le code en toute sécurité avec les fonctionnalités désactivées
- **Réduire le risque de déploiement** - Moins de chances de casser la production
- **Cycles d'itération plus rapides** - Déploiements plus fréquents et plus petits

#### Tests progressifs
- **Capacités de tests A/B** - Comparez différentes approches avec de vrais utilisateurs
- **Déploiements progressifs** - Commencez avec de petits groupes d'utilisateurs et étendez
- **Décisions basées sur les données** - Faites des choix basés sur des métriques d'utilisation réelles

#### Désactivation rapide
- **Pas de redéploiement nécessaire** - Désactivez instantanément les fonctionnalités problématiques
- **Réponse d'urgence** - Réaction rapide aux problèmes de production
- **Continuité d'activité** - Gardez les fonctionnalités principales opérationnelles pendant la résolution des problèmes

#### Séparer le code de la release de fonctionnalité
- **Calendriers indépendants** - Les plannings de développement et de release métier peuvent différer
- **Coordination marketing** - Alignez les releases de fonctionnalités avec les campagnes marketing
- **Gestion des parties prenantes** - Donnez aux équipes métier le contrôle sur le moment où les fonctionnalités sont mises en ligne

Les feature flags représentent un changement de paradigme puissant dans notre façon de concevoir le déploiement logiciel et la gestion des releases, permettant des pratiques de développement plus flexibles, plus sûres et basées sur les données.

---

## PIE : La prochaine grande chose (Alexandre Daubois)

### Les extensions ?

Les extensions sont comme des paquets Composer, mais écrites en C, C++, Rust, et maintenant Go.
Elles vivent à un niveau plus bas, ce qui les rend beaucoup plus rapides que le code PHP pur.

Des frameworks comme **Phalcon** sont eux-mêmes distribués comme des extensions.

### Installation d'une bibliothèque tierce

Traditionnellement, installer une extension est beaucoup plus pénible qu'un `composer install`.
Cela implique généralement :

1. Télécharger le code source.
2. Le compiler avec `phpize` et `make`.
3. Ajouter une ligne dans `php.ini` pour l'activer.
4. Redémarrer PHP-FPM ou Apache pour la charger.

Ce workflow rend les extensions plus difficiles à distribuer et à standardiser par rapport aux paquets Composer.

### PECL

- Lourd et obsolète.
- Lent à installer.
- Manque de sécurité appropriée (pas de signature de paquets).
- Pas officiellement soutenu par PHP, et certains dans la communauté veulent le supprimer progressivement.

### docker-php-extension-installer

Un projet communautaire largement utilisé qui simplifie l'installation des extensions dans les images Docker.
Au lieu d'écrire des commandes complexes `apt-get` + `phpize` + `make`, vous ajoutez simplement :

```dockerfile
COPY --from=ghcr.io/mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions xdebug redis
```

C'est excellent, mais pas encore parfait — cela reste spécifique à Docker et ne s'intègre pas avec Composer ou Packagist.

### Projet pour remplacer PECL

Le dépôt **pie-design** définit les bases de **PIE**, une nouvelle façon d'installer les extensions aussi facilement que les paquets PHP.

- Lancé en mars 2024.
- Version 1 publiée en juin 2025.
- PIE est distribué sous forme d'un seul fichier `phar` : il suffit de le télécharger et de l'utiliser.
- Toutes les métadonnées des extensions sont stockées dans Packagist.

#### Options de commande

- `pie install ext-xdebug` → installe une extension et met à jour `php.ini`.
- `pie uninstall ext-redis` → supprime une extension.
- `pie update` → met à jour vers la dernière version disponible.
- `pie search redis` → recherche des extensions dans Packagist.
- Exécuter `pie` sans arguments lit les extensions depuis `composer.json` et les installe.

Autres fonctionnalités :

- Ajout de dépôts via Composer, VCS ou chemins locaux.
- Mise à jour automatique de `php.ini`.
- Support de `GH_TOKEN` pour installer depuis des dépôts privés.
- Restrictions de compatibilité OS.
- Intégration Symfony CLI : `symfony pie install`.

### L'avenir des extensions

PIE est le remplacement théorique de PECL.
Un vote RFC a eu lieu, clos le **20 septembre 2025**.
Presque tout le monde a voté *oui*, ce qui signifie que PIE est désormais le successeur officiel de PECL.

---

## Rendez vos développeurs heureux en normalisant vos erreurs API (Clément Herreman)

Les erreurs ne sont pas seulement des bugs. Ce sont des opportunités de donner de l'autonomie aux utilisateurs grâce à des retours clairs.

### Qu'est-ce qu'une erreur ?

Une erreur est tout comportement — intentionnel ou non — qui empêche l'utilisateur de terminer sa tâche.

### Pourquoi normaliser les erreurs ?

1. Pour réagir correctement à un problème précis :
    - Réessayer un token.
    - Gérer les défaillances de systèmes distribués.
    - Corriger des problèmes de configuration.

2. Pour présenter les erreurs de manière cohérente :
    - Messages clairs et compréhensibles pour les utilisateurs finaux.
    - Identification précise pour faciliter le support.
    - Garder certains détails vagues pour des raisons de sécurité.

### Comment ?

Les erreurs peuvent être classées en trois catégories :

1. Les erreurs qui appartiennent à votre domaine : vous les possédez, donc enrichissez-les avec du contexte.
2. Les erreurs qui n'appartiennent pas à votre domaine mais qui se produisent quand même : enveloppez-les avec un code et enrichissez-les.
3. Erreurs rares/imprévues : conservez la sortie JSON par défaut.

#### RFC 7807 : Détails du problème pour les API HTTP

Cette RFC définit une structure JSON standard pour les erreurs :

- `type` : code unique lisible par machine.
- `title` : résumé court et lisible par un humain.
- `detail` : explication contextuelle de cette erreur particulière.
- `instance` : URL du catalogue d'erreurs.
- `...` : tous les champs personnalisés que vous souhaitez.

##### Exemple de réponse HTTP

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json

{
  "type": "https://example.com/errors/authentication_failed",
  "title": "Authentication failed",
  "detail": "Your token has expired. Please request a new one.",
  "instance": "/login"
}
```

#### API Platform

API Platform fournit une classe prête à l'emploi `ApiPlatform\Problem\Error` pour implémenter la RFC 7807.

#### Organisation des erreurs

- Gardez uniquement les exceptions métier dans la couche domaine.
- Enveloppez les erreurs d'infrastructure avant de les envoyer au client.

#### Documentation des erreurs

Les erreurs peuvent être déclarées comme des attributs sur les opérations, les rendant explicites dans la documentation API.

#### Améliorations : RFC 9457

La RFC 9457 est essentiellement la même que la RFC 7807, avec quelques ajouts :

- Un registre des erreurs via `schema.org`.
- Un mécanisme pour retourner plusieurs erreurs à la fois (bien que fortement déconseillé).

Comme l'a souligné Clément : la RFC 9457 n'apporte pas beaucoup de valeur pratique, et certaines de ses suggestions sont même déconseillées dans la spécification.

---

## Symfony et l'injection de dépendances : Du passé au futur (Imen Ezzine)

L'injection de dépendances (DI) est le « D » de SOLID, et elle est une pierre angulaire de la conception de Symfony depuis près de deux décennies.
Cette conférence a exploré son histoire, son évolution et ce qui nous attend.

### Les débuts

**2007 – Symfony 1**
- Les services étaient instanciés directement, souvent via `sfContext()` (un singleton).
- Difficile à tester, rigide, fortement couplé.
- Pas de véritable conteneur.

### Symfony 2 et le changement de paradigme

**2011 – Symfony 2**
- Introduction d'un conteneur central.
- Services configurés via YAML et paramètres.
- Dépendances injectées comme arguments du constructeur.
- L'autowiring introduit dans **Symfony 2.8**.

**2015 – API Platform v1**
- Forte dépendance à l'autowiring (alors expérimental).

**2016 – API Platform v2**
- La magie des annotations `@ApiResource` propulsée par le composant DI.
- Les data persisters et providers devaient être tagués manuellement.

**2017 – Symfony 3.3 / API Platform 2.2**
- Autowiring + autoconfigure.
- Le tagging manuel a été presque éliminé (providers/persisters automatiquement câblés).
- Symfony 3.4 : services privés par défaut.

### Symfony 5 à Symfony 7

**2021 – Symfony 5.3**
- DI propulsée par les attributs → beaucoup moins de YAML.
- Attribut `#[When]` pour les services conditionnels.

**Symfony 6.0 – 6.3**
- Nouveaux attributs pour les cas particuliers.
- Attribut `#[Autowire]` pour l'injection de service précise.
- Support des variables d'environnement et paramètres via attributs.
- `#[AsAlias]` pour créer des alias de services.

**2022 – API Platform 3.0**
- Nouveaux state processors et providers remplacent l'ancien modèle persister/provider.

**2023 – Symfony 7**
- `#[AutoconfigureTag]` → tagging automatique (utilisé dans les filtres API Platform).
- `TaggedIterator` → injection de plusieurs services tagués.
- `AutowireIterator` → autowire de toutes les classes implémentant une interface.

**Symfony 7.1 – 7.3**
- `#[AutowireMethodOf]` pour autowirer une seule méthode.
- `#[WhenNot]` pour les services conditionnels.
- Paramètre `when` dans `#[AsAlias]`.

### Points à retenir

En 20 ans, la DI dans Symfony a évolué de :

- L'instanciation manuelle →
- La configuration manuelle →
- La configuration automatique via les **attributs**.

Ce parcours a rendu les projets Symfony **plus testables, maintenables et conviviaux pour les développeurs** tout en réduisant le code répétitif.

## Crédits
Image de couverture par [Nicolas Detrez](https://ncls.tv/)
