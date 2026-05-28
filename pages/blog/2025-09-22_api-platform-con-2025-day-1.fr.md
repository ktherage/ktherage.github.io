---
title: "API Platform con 2025 - JOUR 1"
date: 2025-09-23
description: "API Platform con 2025 - JOUR 1 - un aperçu des conférences auxquelles j'ai assisté à l'API Platform Conference en 2025."
cover:
  image: "img/54799605114_49f6d7d4e1_k.jpg"
  alt: "Image de l'API Platform con 2025 - Crédits Nicolas Detrez"
  caption: "Image de l'API Platform con 2025 - Crédits <a href=\"https://ncls.tv/\">Nicolas Detrez</a>"
published: true
tags:
  - Conférences
  - API
  - API Platform Con
  - 2025
category: Conférences
excerpt: >-
  J'ai eu l'opportunité d'assister à l'API Platform Con 2025 grâce à SensioLabs et voici ce que j'ai appris lors des conférences auxquelles j'ai assisté.
---

J'ai eu l'opportunité d'assister à l'API Platform Con 2025 grâce à SensioLabs et voici ce que j'ai appris lors des conférences auxquelles j'ai assisté.

Table des matières :

[toc]

---

## Améliorez vos API Platform avec Go grâce à FrankenPHP (Kévin Dunglas)

**Les slides de cette conférence sont disponibles : [https://dunglas.dev/2025/09/the-best-of-both-worlds-go-powered-grpc-for-your-php-and-api-platform-apps/](https://dunglas.dev/2025/09/the-best-of-both-worlds-go-powered-grpc-for-your-php-and-api-platform-apps/)**

API Platform fête ses 10 ans cette année, ayant été créé le 20 janvier 2015. À l'origine un bundle Symfony, il est désormais utilisable avec Laravel ou même sans framework. Avec plus de 14 000 étoiles sur GitHub et 921 contributeurs de code et de documentation, API Platform est devenu un outil essentiel pour la création d'API.

Kevin a souligné qu'il a également été le point de départ de nombreux projets connexes tels que Mercure et FrankenPHP, et que de nombreux composants Symfony ont d'abord été développés pour API Platform.

Il a également rendu hommage à Ryan Weaver, un contributeur clé, et a encouragé les participants à soutenir sa famille via le [GoFundMe « In memory of Ryan Weaver: For his son Beckett »](https://gofund.me/31ec53011).

### Un modèle, plusieurs architectures d'API

Avec API Platform, vous pouvez utiliser le même DTO, le même code et la même classe PHP pour générer différents formats de sortie avec seulement quelques changements de configuration.

Voici quelques-uns des formats pris en charge :
- Hydra
- OpenAPI
- HAL
- JSON:API
- GraphQL
- Mercure (support SSE)

Cette approche élimine la duplication de code entre les différents formats d'API.

### Pourquoi gRPC est absent d'API Platform

Actuellement, gRPC n'est pas pris en charge par API Platform. Voici pourquoi :

- gRPC ne suit pas les principes REST.
- Il est différent de GraphQL.
- Il utilise Protobuf (un format binaire) au lieu de JSON pour le format de sortie.

La plupart du temps, dans l'architecture gRPC classique, PHP n'est pas un candidat.

![Schéma d'une architecture gRPC typique qui n'inclut pas de serveur gRPC côté PHP mais un serveur C++, un client android/java et un client ruby](img/IMG_20250918_100400.jpg "Schéma d'une architecture gRPC typique")

Cependant, gRPC présente plusieurs avantages :

- Rapide et efficace
- Fortement typé
- Indépendant du langage : un générateur de code permet de générer des structures de données dans de nombreux langages.

Les cas d'utilisation de gRPC incluent :

- Microservices
- Internet des objets (IoT)
- Composants critiques où la performance est essentielle

### Comment fonctionne gRPC

gRPC fonctionne sur HTTP/2 et utilise des fichiers `.proto` de Protocol Buffer pour définir les contrats de service. Ces définitions permettent la génération automatique de code dans plusieurs langages de programmation. Le format de sérialisation binaire offre une transmission de données plus efficace que JSON, tandis que le multiplexage d'HTTP/2 prend en charge les communications haute performance.

De plus, la documentation officielle de gRPC déconseille l'utilisation de PHP pour les serveurs gRPC en raison des limitations du cycle de vie des requêtes PHP-FPM.

### gRPC avec FrankenPHP

Heureusement, FrankenPHP offre un moyen d'écrire des extensions en Go qui peuvent être exposées en PHP, rendant ainsi possible l'utilisation de gRPC avec API Platform. L'extension gRPC de FrankenPHP est disponible sur GitHub et est testable. Elle utilise le serveur gRPC Go et est conçue pour être utilisée avec ou sans API Platform.

Pour plus d'informations sur la configuration et l'utilisation de cette extension, veuillez vous référer à la [documentation du dépôt GitHub](https://github.com/dunglas/frankenphp-grpc).

Les tests peuvent être effectués avec gRPCui. Il est important de noter que cette solution est encore expérimentale.

---

## Étendre le serveur Web Caddy avec votre langage préféré (Sylvain Combraque)

Caddy est un serveur Web moderne, rapide et facile à utiliser qui simplifie le processus de服务 des sites Web et des applications Web. Il est connu pour sa configuration HTTPS automatique et sa syntaxe simple. Matt Holt, le créateur de Caddy, a apporté des contributions significatives au paysage des serveurs Web avec les fonctionnalités uniques et la facilité d'utilisation de Caddy.

### Étendre Caddy

#### Avec la construction xcaddy

L'extension de Caddy peut être réalisée à l'aide de l'outil de construction `xcaddy`, qui permet de personnaliser et d'étendre Caddy avec des plugins écrits en Go. Cet outil offre un moyen simple d'ajouter de nouvelles fonctionnalités à Caddy.

#### Avec l'interface Web du site Caddy

Caddy propose également une interface Web accessible depuis le site Web de Caddy. Cette interface offre un moyen simple de gérer et de configurer votre serveur Web Caddy.

### Étendre Caddy avec Go

![Un exemple d'extension Caddy réalisée avec GO](img/IMG_20250918_100400.jpg "Un exemple d'extension Caddy réalisée avec GO")

Pour des informations plus détaillées sur la façon d'étendre Caddy avec Go, vous pouvez consulter la [documentation officielle](https://caddyserver.com/docs/extending-caddy).

### Utilisation d'un interpréteur

L'utilisation d'interpréteurs pour étendre Caddy présente des avantages, mais aussi quelques inconvénients :

- Vous avez besoin d'un interpréteur par langage.
- Les nouvelles versions du langage nécessitent de nouveaux interpréteurs.
- Chaque interpréteur est maintenu séparément.
- Vous devrez peut-être réimplémenter des types.

### WASM x WASI x darkweak/wazemmes pour une extension Caddy dans n'importe quel langage

WebAssembly (WASM) est un format d'instruction binaire qui promet de permettre aux programmes de s'exécuter à une vitesse proche du natif sur le Web. La promesse de « construire une fois, exécuter partout » fait de WASM une option attrayante pour étendre Caddy. Cependant, la documentation actuelle n'est pas conviviale et il existe quelques bogues à connaître.

WebAssembly System Interface (WASI) est une interface système conçue pour permettre aux modules WebAssembly d'interagir avec le système d'exploitation de manière sécurisée et portable. Cette combinaison de WASM et WASI permet aux développeurs d'écrire du code dans leur langage préféré et de le compiler en WASM pour une exécution dans un navigateur ou un environnement serveur.

Pour plus d'informations sur l'utilisation de WASM et WASI dans Caddy, vous pouvez consulter le [dépôt darkweak/wazemmes sur GitHub](https://github.com/darkweak/wazemmes).

---

## Mercure, SSE, API Platform et un LLM pour améliorer un Chat(bot) (Mathieu Santostefano)

**Les slides de cette conférence sont disponibles : [https://welcomattic.github.io/slides-real-time-ai-chatbot-with-mercure/1](https://welcomattic.github.io/slides-real-time-ai-chatbot-with-mercure/1)**

### Origine du sujet
Le besoin initial du client était de créer des échanges de chat experts payants. La première version utilisait une API + React, mais manquait d'historique des messages. Mercure a été choisi pour la distribution sécurisée des messages aux clients via JWT.

Évolution des besoins :
- Assister les experts avec un assistant IA
- Permettre à l'IA de gérer la première partie de la conversation
- Permettre aux experts de prendre le relais si nécessaire

### Boîte à outils

#### Mercure - Échanges en temps réel
Architecture :
- Serveur => Hub => Client
- Client => Hub => Client

#### SSE
Les Server-Sent Events (SSE) sont une technologie qui permet à un serveur d'envoyer des mises à jour en temps réel à un client via une connexion HTTP persistante. Le client écoute un flux d'événements envoyés par le serveur.

#### API Platform

##### LLM
Génération de données et réponses intelligentes

##### Symfony Messenger
Gestion des processus asynchrones

##### Symfony AI
Équivalent de Mailer/Notifier mais pour les fournisseurs d'IA :
- **Platform** : interface unifiée pour tous les fournisseurs d'IA
- **Agent** : création d'IA agentique
- **Store** : abstraction de stockage de données
- **MCP SDK** : désormais officiellement pris en charge par Anthropic
- **AI Bundle** : intégration complète avec Symfony
- **MCP Bundle** : composants supplémentaires

### Implémentation

Flux technique :
`Utilisateur => message => Mercure (Stockage) <= Client SSE Symfony => Symfony Messenger => Mistral => Mercure => réponse IA => Utilisateur`

Chat privé sécurisé via JWT (JSON Web Tokens) - une norme ouverte pour échanger des données en toute sécurité entre les parties.

#### Envoyer un message à Mercure
```javascript
fetch(this.hubURL, {
    method: 'POST',
    credentials: 'include', // Send JWT cookie
    body: new URLSearchParams({
        topic: topic,
        data: JSON.stringify(
            new MercureUpdateData(
                conversationId,
                msg,
            ),
        ),
        private: 'on' // restrict message to subscribed clients
    })
});
```

#### Se connecter à Mercure
```javascript
const eventSource = new EventSource('/sse-endpoint');
eventSource.onmessage = (event) => {
  console.log('New event received: ', event.data);
};
```

#### Client SSE Symfony

EventSourceHttpClient intégré :

```php
use Symfony\Component\HttpClient\Chunk\ServerSentEvent;
use Symfony\Component\HttpClient\EventSourceHttpClient;
use Symfony\Component\HttpClient\HttpClient;

$eventSourceClient = new EventSourceHttpClient(HttpClient::create());

$connection = $eventSourceClient->connect("YOUR-MERCURE-URL");

while (true) {
    foreach ($eventSourceClient->stream($connection, 2) as $r => $chunk) {
        if ($chunk->isTimeout()) continue; // Keep the connection alive.
        if ($chunk->isLast()) return; // Connection closed by server.
        if ($chunk instanceof ServerSentEvent) $this->processSSE($chunk);
    }
}
```
#### Distribuer les messages avec Messenger

```php
use Symfony\Component\HttpClient\Chunk\ServerSentEvent;

function processSSE(ServerSentEvent $event): void
{
    $data = $event->getArrayData();
    
    // do some checks before asking LLM
    if (!$this->shouldProcessWithAi($data)) {
        return;
    }
    
    // Dispacth message to ask LLM
    $this->messageBus->dispatch(
        new ProcessAiResponseMessage(
            conversationId: $data['conversationId'],
            userMessage: $data['message'],
            sseMessageId: $event->getId(),
            timestamp: $data['timestamp']
        ),
    );
}
```

#### Configuration Symfony AI

##### Configuration YAML du bundle AI avec Mistral

```yaml
ai:
    platform:
        mistral:
            api_key: '%env(MISTRAL_API_KEY)%'
    
    agent:
        default:
            platform: 'symfony_ai.platform.mistral'
            model:
                class: 'Symfony\AI\Platform\Bridge\Mistral\Mistral'
                name: !php/const Symfony\AI\Platform\Bridge\Mistral\Mistral::MISTRAL_LARGE
```

##### Exemple de Handler

```php
// Symfony AI Bundle code example
use Symfony\AI\Agent\AgentInterface;
use Symfony\AI\Agent\Chat;
use Symfony\AI\Platform\Message\Message;
use Symfony\AI\Platform\Message\MessageBag;
use Symfony\AI\Store\StoreInterface;

class MessageHandler
{
    public function __construct(
        private readonly AgentInterface $agent,
        private readonly StoreInterface $messageStore,
    ) {
    }

    public function __invoke(ProcessAiResponseMessage $message)
    {
        $chat = new Chat($this->agent, $this->messageStore, "UNIQUE_ID_TO_PROMPT");
        $messages = $this->messageStore->load("UNIQUE_ID_TO_PROMPT");

        if ($messages->count() === 0) {
            // retrieve system prompt from somewhere ...

            // Programmatic System prompt injection
            $chat->initiate(new MessageBag(
                Message::forSystem("SYSTEM_PROMPT_INJECTION"),
            ));
        }

        $llmAnswer = $chat->submit(Message::ofUser($message->userMessage));

        // do something with the answer
    }
}
```

Dans ses mots de la fin, Mathieu a dédié sa conférence à la mémoire de Ryan Weaver, dont les contributions continuent d'inspirer la communauté Symfony. Il a également remercié Christopher Hertel pour l'initiative Symfony AI.

---

## Comment API Platform 4.2 redéfinit le développement d'API (Antoine Bluchet)

**Les slides de cette conférence sont disponibles : [https://soyuka.me/api-platform-4-2-redefining-api-development/](https://soyuka.me/api-platform-4-2-redefining-api-development/)**

Retour sur la version 4.0 :
- 610 commits
- ~200 000 lignes de code
- 291 issues ouvertes
- 230 issues fermées

### Quoi de neuf dans la 4.2

Fonctionnalités clés de cette version :
- Intégration FrankenPHP
- State Options
- Améliorations des paramètres de requête
- Améliorations des performances
- Compatibilité Laravel
- Métadonnées par fichiers PHP

### Améliorations des métadonnées

#### Métadonnées depuis les fichiers PHP

![Un exemple de métadonnée de fichier PHP](img/IMG_20250918_134546.jpg "Un exemple de métadonnée de fichier PHP")

Nouveau système de métadonnées permettant d'extraire la configuration API directement depuis les fichiers PHP. Ce n'est pas encore documenté (à ma connaissance) mais vous pouvez voir la PR associée de Loïc Frémont https://github.com/api-platform/core/pull/7017.

#### Metadata Mutator
Une nouvelle façon de modifier les métadonnées par programmation :
- Configuration plus flexible
- Ajustements à l'exécution
- Architecture plus propre

### Du filtre API aux paramètres

#### Rétrospective sur ApiFilter

L'attribut `#[ApiFilter]` faisait beaucoup de choses en arrière-plan, telles que :
- Déclarer des services avec des tags de filtre
- Générer la documentation
- Appliquer des opérations sur la base de données
- Fonctionner avec plusieurs propriétés

C'était déroutant et ne respectait pas le principe de responsabilité unique. C'est pourquoi les mainteneurs d'API Platform ont décidé de retravailler cela en paramètres.

#### Améliorations de la documentation des filtres

Désormais, les documentations sont générées séparément. Cela peut être fait avec deux nouvelles interfaces :
- `JsonSchemaFilterInterface`
- `OpenApiParameterFilter`

#### Système de filtrage

Maintenant, les filtres sont indépendants via une nouvelle `FilterInterface` avec :
- Méthode `apply()` simplifiée
- Aucune exigence de constructeur
- Conception sans dépendance

#### Système de paramètres

L'attribut `#[ApiFilter]` laissera sa place à une nouvelle propriété des attributs d'opérations appelée `parameters`.

![Un exemple d'utilisation des paramètres](/img/IMG_20250918_135352.jpg "Un exemple d'utilisation des paramètres")

#### Nouveaux types de filtres
- Capacités de recherche en texte libre
- Fournisseur de variables URI

### Améliorations du JSON Schema

Quelques améliorations ont été apportées à la génération du JSON Schema. Ces changements pourraient impliquer une rupture de compatibilité ascendante pour les outils utilisant l'ancien JSON Schema.

Améliorations :
- Mutualisation des schémas
- Fichiers de spécification OpenAPI 30% plus petits
- Opérations I/O réduites

Un nouvel outil est désormais recommandé : [pb33f.io](https://pb33f.io) car il est plus riche en fonctionnalités et mieux maintenu que Swagger UI.

### Performances

Benchmarks de performance comparant Nginx et FrankenPHP :

![Comparaison de performance entre Nginx et FrankenPHP 1](/img/IMG_20250918_140008.jpg "Comparaison de performance entre Nginx et FrankenPHP 1")

![Comparaison de performance entre Nginx et FrankenPHP 2](/img/IMG_20250918_140037.jpg "Comparaison de performance entre Nginx et FrankenPHP 2")

Plus de benchmarks disponibles sur [soyuka.github.io/sylius-benchmarks/](https://soyuka.github.io/sylius-benchmarks/)

Améliorations du JSON Streamer :
- ~32,4% de meilleure performance en requêtes/seconde
- Configurable via les paramètres

### State Options

Nouvelles fonctionnalités pour l'interrogation des sous-ressources :
- Chargement de données plus efficace
- Entity class magic (RIP Ryan)

### Data Mapping

Nouvelles capacités de mapping :
- Mapping de la base de données vers la représentation API
- Intégration Symfony ObjectMapper
- Meilleure transformation des données

### Débogage

Les outils de profilage sont de retour !

### Rétrocompatibilité

- De nombreuses nouvelles fonctionnalités ajoutées
- Aucune dépréciation dans cette version
- Le système de paramètres n'est plus expérimental

### Perspectives pour API Platform 5.0

Changements prévus :
- Dépréciation de `#[ApiFilter]` (script de migration à venir)
- Utilisation accrue du JSON Streamer
- Demandes de fonctionnalités pour Object Mapper
- Améliorations pilotées par la communauté

---

## Design pattern, le trésor est dans le vendor (Smaïne Milianni)

**Les slides de cette conférence sont disponibles : [https://ismail1432.github.io/conferences/2025/apip_con/index.html](https://ismail1432.github.io/conferences/2025/apip_con/index.html)**

Dans cette conférence, Smaïne a fait un tour des design patterns qui sont couramment utilisés sans que l'on sache qu'ils se trouvent dans les vendors que nous utilisons quotidiennement. Il a également présenté des extraits de code PHP petits et compréhensibles expliquant certains d'entre eux.

Parmi eux, on trouvait :
- Le Pattern Strategy
- Le Pattern Adapter
- Le Pattern Factory
- Le Pattern Builder
- Le Pattern Proxy
- Le Pattern Observer
- Le Pattern Event Dispatcher
- Le Pattern Decorator
- Le Pattern Facade
- Le Pattern Template
- Le Pattern Chain of Responsibility

Smaïne a également terminé par un clin d'œil à Ryan Weaver.

---

## Et si on faisait de l'Event Storming dans nos projets API Platform ? (Gregory Planchat)

### Event Storming

L'Event Storming est une technique d'atelier collaboratif qui réunit à la fois les utilisateurs et les développeurs dans la même pièce. Cette méthodologie met en lumière les incompréhensions qui existent souvent entre les parties prenantes métier et les équipes techniques.

La beauté de l'Event Storming réside dans sa simplicité : il utilise des post-it physiques pour encourager les différents membres de l'équipe à échanger des idées, se voir, partager leurs connaissances, se rencontrer en personne et confronter leur compréhension du domaine métier.

### Préparation

Le processus d'Event Storming suit une approche structurée avec plusieurs étapes clés :

1. **Lister les événements** - Commencez par identifier tous les événements significatifs qui se produisent dans votre domaine métier
2. **Organiser les événements** - Disposez ces événements dans un ordre chronologique ou logique
3. **Établir les commandes** - Identifiez les actions qui déclenchent chaque événement
4. **Identifier les acteurs** - Déterminez qui ou quoi initie chaque commande
5. **Post-it verts** - Ajoutez les données nécessaires aux utilisateurs pour prendre des décisions
6. **Ajouter les systèmes externes** - Incluez les systèmes tiers qui interagissent avec votre domaine
7. **Agrégats** - Regroupez les événements et commandes connexes en concepts métier cohérents

L'équipe a mentionné avoir mené plusieurs sessions « jusqu'à ce que plus personne n'ait de questions, que ce soit de la part de l'équipe technique ou de l'équipe métier ». C'est un processus auto-documenté qui peut être répété à mesure que le métier évolue.

### Avantages

L'Event Storming apporte plusieurs bénéfices concrets aux équipes de développement :

- **Documentation des processus** - L'atelier crée naturellement une documentation vivante de vos processus métier
- **Intégration facilitée** - Les nouveaux membres de l'équipe peuvent rapidement comprendre le domaine en regardant les artefacts de l'Event Storming
- **Révélation des incertitudes** - Les hypothèses cachées et les exigences floues émergent pendant les sessions collaboratives

### Avec API Platform

#### Le problème du modèle anémique

La plupart des applications souffrent de ce qu'on appelle l'anti-patron du modèle anémique, où :
- La logique métier est dispersée dans de nombreux services
- Perte du suivi de l'intention de l'utilisateur
- Les entités deviennent de simples conteneurs de données avec des getters et setters

Typiquement, lorsque vous souhaitez modifier des informations dans votre entité, vous appelez une méthode setter. Cela se produit souvent dans plusieurs services et classes, d'où le problème de « logique métier disséminée dans de nombreux services ».

L'intention est essentielle pour que les systèmes tiers comprennent ce qui s'est réellement passé dans votre application.

#### Modèles riches

L'approche alternative utilise des modèles de domaine riches qui :
- **Nécessitent un coût important** - Plus complexes à implémenter initialement
- **Nécessitent une compréhension détaillée de l'application** - L'équipe a besoin d'une connaissance approfondie du domaine
- **Garantissent la cohérence dans le temps** - Les règles métier sont appliquées au niveau du modèle
- **Appliquent les contraintes métier** - La logique de validation vit là où elle doit être
- **Centralisent la logique métier** - Tout ce qui concerne un concept vit dans une ou deux classes
- **Le modèle garantit l'intégrité** - Les états invalides deviennent impossibles

Avec un modèle riche, toutes les modifications se produisent dans l'entité elle-même, gardant la logique métier centralisée et cohérente.

#### Le problème du CRUD

Les opérations CRUD traditionnelles sont :
- Limitées à 4 opérations (Create, Read, Update, Delete)
- Centrées sur la pensée SQL
- Des outils comme PostgREST génèrent des API REST automatiquement mais apportent peu de valeur métier

Pour faire mieux, nous pouvons tirer parti de la puissance des State Providers et State Processors d'API Platform.

Mais comment préserver l'intention dans notre application ?

La solution suit ce flux :
**Repository → EventBus → Event → Handler**

#### Modification du modèle

L'équipe a implémenté un modèle avec trois méthodes clés dans leurs entités :

- **recordThat()** - Enregistre qu'un événement s'est produit (par exemple, « un déploiement a été lancé »)
- **apply()** - Applique les modifications liées à l'événement (par exemple, met à jour la date de déploiement)
- **releaseEvents()** - Une étape de nettoyage qui se produit pendant le processus de sauvegarde, juste avant le persist/flush, puis distribue les événements dans l'application

Cette approche garantit que chaque action métier est capturée comme un événement significatif, préservant l'intention de l'utilisateur et fournissant une piste d'audit claire de ce qui s'est passé dans le système.

### Résultats

L'équipe a rapporté plusieurs améliorations concrètes après avoir implémenté cette approche :

- **Une API et une base de code qui ressemblent davantage au domaine métier de l'entreprise**
- **L'intention de l'utilisateur a été préservée** tout au long du cycle de vie de l'application
- **Meilleure compréhension des actions effectuées** dans l'application, à la fois pour les développeurs et les parties prenantes métier

![Extrait de la documentation OpenAPI d'une API conçue avec Event Storming](/img/IMG_20250919_103045.jpg "Extrait de la documentation OpenAPI d'une API conçue avec Event Storming")

---

## Passage à l'échelle des bases de données (Tobias Petry)

Tobias Petry a partagé des informations sur les stratégies de passage à l'échelle des bases de données. Sa conférence a souligné pourquoi les problèmes de scalabilité proviennent généralement du niveau de la base de données et a passé en revue les solutions les plus courantes, leurs avantages et leurs pièges.

### Solutions

Il n'y a pas de solution miracle : chaque application a ses propres contraintes. Néanmoins, plusieurs stratégies bien connues existent :

- **Trouver et corriger les requêtes lentes**
  Avant d'envisager l'infrastructure, vérifiez toujours les bases. Des outils comme [mysqlexplain.com](https://mysqlexplain.com) peuvent aider à détecter les requêtes inefficaces et suggérer des améliorations.

- **Mettre en cache les résultats**
  Servir des réponses mises en cache réduit considérablement la charge sur la base de données et évite de répéter des opérations coûteuses.

- **Scaling vertical (machines plus puissantes)**
  Parfois, l'option la plus simple est d'augmenter la puissance : déplacer la base de données vers un serveur plus performant. Cependant, cette approche atteint rapidement des limites physiques et financières.

- **Réplication multi-maître**
  Dans cette configuration, plusieurs serveurs acceptent à la fois les lectures et les écritures. Cela améliore la scalabilité des écritures mais crée un risque de conflits lors d'écritures parallèles. Des stratégies de résolution de conflits peuvent atténuer ce problème, mais la complexité augmente avec le nombre de nœuds.

- **Réplication en lecture**
  Ici, un nœud principal unique gère les écritures, tandis que les réplicas servent les requêtes de lecture.
  - **La réplication synchrone** garantit que les modifications sont propagées à tous les réplicas avant d'accuser réception de l'écriture. Cela garantit la cohérence mais ajoute de la latence, car chaque réplica doit confirmer.
  - **La réplication asynchrone** accuse réception de l'écriture immédiatement et met à jour les réplicas plus tard. Cela réduit la latence mais risque une incohérence temporaire entre les nœuds.
    En pratique, la plupart des applications tolèrent la cohérence éventuelle. Une couche de cache devant le primaire masque souvent le retard de réplication. Néanmoins, des études montrent que 90 à 98 % des applications rencontrent des problèmes de latence si elles ne comptent que sur les réplicas pour les lectures.

- **Sharding**
  Le sharding distribue les données sur plusieurs bases de données. Cela permet une *scalabilité théoriquement infinie*. Par exemple, les utilisateurs peuvent être répartis entre différents shards en fonction de leur ID.
  Le défi vient des requêtes cross-shard : si vous devez récupérer toutes les commandes d'un utilisateur dans plusieurs boutiques, et que les utilisateurs et les boutiques sont shardés différemment, vous devez interroger plusieurs shards et agréger les résultats manuellement. Certaines entreprises introduisent même des *shards de shards*, ajoutant une couche supplémentaire de complexité.
  En raison de cette complexité, le sharding est généralement réservé aux systèmes à très grande échelle. Pour la plupart des cas d'utilisation, la réplication en lecture est suffisante.

En général, ces stratégies sont conçues pour les workloads CRUD. Les requêtes analytiques (tableaux de bord, rapports) sont plus difficiles à scaler avec une base de données relationnelle standard. Les développeurs peuvent explorer des ressources comme [sqlfordevs.com](https://sqlfordevs.com) (cours gratuit pour accélérer l'analytique) ou des systèmes spécialisés comme [TimescaleDB](https://www.timescale.com).

### Ça semble compliqué

Tobias a souligné un point crucial : les décisions de mise à l'échelle doivent être prises avant d'atteindre les goulots d'étranglement de la base de données. Une fois les données structurées et les stratégies de scaling en place, revenir en arrière devient presque impossible. L'architecture de base de données est l'un de ces domaines où il est bien plus facile de prendre la bonne décision tôt que de corriger les erreurs plus tard.

---

## API Platform, JsonStreamer et ESA pour des API fulgurantes (Mathias Arlaud)

**Les slides de cette conférence sont disponibles : [https://www.canva.com/design/DAGyYPxkygw/M1RzOiv8_cMp0Pa7Mh0u4g/view](https://www.canva.com/design/DAGyYPxkygw/M1RzOiv8_cMp0Pa7Mh0u4g/view)**

Histoire : imaginez une librairie. Un client commande **tous** les livres liés à Symfony. Le libraire essaie de tous les rassembler, mais c'est lourd — ça prend du temps, beaucoup de livres. La deuxième fois, même demande, mais la pile est si grande que le libraire s'effondre sous le poids.

Dans le monde des API, **JSON est roi**.

Au cœur de notre stack se trouve **API Platform**, qui repose sur le Serializer de Symfony. Mais parfois, le Serializer est comme ce libraire : il fonctionne bien jusqu'à ce que la charge devienne trop lourde.

### Sérialisation / Normalisation dans Symfony

La sérialisation dans Symfony (et dans API Platform) consiste à transformer des objets PHP en tableaux ou valeurs scalaires, puis à les encoder dans des formats comme JSON ou XML. La **normalisation** transforme le graphe d'objets interne en une structure de données neutre (tableaux, scalaires), en appliquant des métadonnées comme les groupes ou les attributs. L'**encodage** convertit ensuite cette structure en la chaîne JSON finale. Le processus inverse (**dénormalisation**) gère l'entrée JSON → tableaux → objets.

Quand les objets ou les collections sont petits, cela fonctionne bien. Mais avec des milliers d'éléments, de grands graphes, des associations profondes et des tableaux imbriqués, l'utilisation mémoire et le temps jusqu'au premier octet se dégradent. La sérialisation devient un goulot d'étranglement.

### Le streaming comme solution

Au lieu de construire une énorme structure en mémoire, le streaming émet les morceaux JSON **progressivement**. Vous ne gardez en mémoire que ce qui est nécessaire à chaque instant.

Symfony 7.3 introduit le composant **JsonStreamer** à cet effet.

Quelques fonctionnalités clés :

- Fonctionne mieux avec les **POPOs** (Plain Old PHP Objects) ayant des propriétés publiques, sans constructeurs complexes.
- L'attribut `#[JsonStreamable]` peut être utilisé sur les classes pour les marquer comme streamables. Cela permet également la pré-génération de code pendant le warm-up du cache.
- Utilisez le composant **TypeInfo** ([lien](https://symfony.com/blog/new-in-symfony-7-3-jsonstreamer-component)) pour décrire les types des collections et des objets (par exemple, `Type::list(Type::object(MyDto::class))`). Cela aide JsonStreamer à deviner la forme du JSON de sortie sans tout charger en mémoire.

Voici un extrait de code de la documentation Symfony montrant l'utilisation de base :

```php
// Example class
namespace App\Dto;

use Symfony\Component\JsonStreamer\Attribute\JsonStreamable;

#[JsonStreamable]
class User
{
    public string $name;
    public int $age;
    public string $email;
}

// In controller
use Symfony\Component\JsonStreamer\StreamWriterInterface;
use Symfony\Component\TypeInfo\Type;
use Symfony\Component\HttpFoundation\StreamedResponse;

public function retrieveUsers(StreamWriterInterface $jsonStreamWriter, UserRepository $userRepository): StreamedResponse
{
    $users = $userRepository->findAll();
    $type = Type::list(Type::object(User::class));
    $json = $jsonStreamWriter->write($users, $type);
    return new StreamedResponse($json);
}
```

Benchmarks et comparaisons

Pour un jeu de données de 10 000 objets :

| Method                   | Time      | Memory usage / footprint (rough / relative) |
| ------------------------ | --------- | ------------------------------------------- |
| Serializer (traditional) | \~ 204 ms | \~ 16 MB (grows with size)                  |
| JsonStreamer             | \~ 87 ms  | \~ 8 MB (much more constant)                |

Défis avec les métadonnées, JSON-LD et comment API Platform s'adapte

API Platform ajoute des métadonnées, des contextes JSON-LD, des métadonnées de propriétés, etc. Cela ajoute de la surcharge à la sérialisation. Pour intégrer JsonStreamer tout en préservant les métadonnées riches :

Ils utilisent les points d'extension PropertyMetadataLoader pour fournir des métadonnées à JsonStreamer. Cela permet à JsonStreamer de connaître les noms des propriétés, si elles sont exposées, etc., sans parcourir l'arbre d'objets complet en mémoire.

API Platform

Utilisation de ValueTransformers qui peuvent transformer n'importe quelle valeur à l'exécution. Mais attention : une logique lourde dans les transformers peut dégrader les performances (ils s'exécutent par valeur).

Symfony
+1

Utilisation d'ObjectMapper pour convertir les entités (par exemple, les objets Doctrine) en POPOs (DTOs) adaptés au streaming. Cela aide car les entités ont souvent des propriétés paresseuses, des proxies, des relations, etc., qui compliquent le streaming.

ESA (Edge Side APIs)

Les Edge Side APIs consistent à diviser de grandes charges utiles JSON en appels ou morceaux progressifs plus petits, souvent délivrés depuis la périphérie / le CDN pour améliorer les performances perçues, en particulier dans les réseaux à latence élevée/lente. Dans le contexte de cette conférence :

Au lieu d'envoyer une seule énorme structure JSON, partitionnez ou paginez pour que le client puisse commencer à recevoir des données rapidement.

Combinez avec le streaming pour que des parties de la réponse commencent à être livrées tôt (le TTFB s'améliore).

Bonne expérience utilisateur : l'utilisateur voit quelque chose rapidement plutôt que d'attendre le chargement complet.

Points à retenir

Le Serializer fonctionne, mais pour les grands ensembles de données, il devient inefficace.

JsonStreamer apporte des améliorations significatives à la fois en utilisation mémoire et en temps jusqu'au premier octet.

Lorsque vous avez des couches de métadonnées (API Platform, JSON-LD), utilisez les points d'extension fournis pour brancher le streaming sans perdre de fonctionnalités.

Évitez les calculs/transformations lourds dans les chemins chauds à l'exécution (par exemple, ValueTransformers).

Concevez votre API en connaissant ces options tôt, car une fois que le chemin de sérialisation principal est profondément intégré, le changer est difficile.

### Benchmarks et comparaisons

Pour un jeu de données de **10 000 objets** :

| Méthode                   | Temps      | Utilisation mémoire / empreinte             |
| ------------------------- | ---------- | ------------------------------------------- |
| Serializer (traditionnel) | ~204 ms    | ~16 Mo (augmente avec la taille)            |
| JsonStreamer              | ~87 ms     | ~8 Mo (beaucoup plus constante)             |

### Défis avec les métadonnées, JSON-LD et comment API Platform s'adapte

API Platform ajoute des **métadonnées**, des contextes JSON-LD et des métadonnées de propriétés. Cette surcharge alourdit la sérialisation. Pour intégrer JsonStreamer tout en conservant ces fonctionnalités :

- Utilisez les points d'extension **PropertyMetadataLoader** pour fournir des métadonnées à JsonStreamer. Cela lui indique quelles propriétés exposer, sans parcourir l'arbre d'objets complet.
- Utilisez les **ValueTransformers** pour ajuster les valeurs à l'exécution. Mais attention : une logique lourde ici dégradera les performances, car les transformers s'exécutent pour chaque valeur.
- Utilisez **ObjectMapper** pour convertir les entités (par exemple, les objets Doctrine) en POPOs (DTOs) plus faciles à streamer.

### Le pattern ESA (Edge Side APIs)

Les **Edge Side APIs (ESA)** consistent à diviser de grandes charges utiles JSON en morceaux progressifs plus petits, souvent délivrés depuis la périphérie ou un CDN pour améliorer les performances perçues, en particulier dans les réseaux à latence élevée ou lente.

En pratique :
- Au lieu d'envoyer une seule énorme structure JSON, partitionnez ou paginez pour que le client commence à recevoir les données plus tôt.
- Combinez avec le streaming pour que des parties de la réponse arrivent progressivement, améliorant le temps jusqu'au premier octet.
- L'expérience utilisateur est meilleure : les données apparaissent rapidement au lieu d'attendre que tout soit chargé.

### Points à retenir

- Le Serializer de Symfony est satisfaisant pour les ensembles de données petits à moyens.
- JsonStreamer offre des **améliorations significatives** en utilisation mémoire et en TTFB.
- API Platform l'intègre via des points d'extension (PropertyMetadataLoader, ValueTransformers, ObjectMapper).
- Évitez les transformations lourdes à l'exécution pour de meilleures performances.
- Concevez votre API avec ces options à l'esprit dès le début — les décisions de sérialisation sont très difficiles à modifier par la suite.

## Crédits
Image de couverture par [Nicolas Detrez](https://ncls.tv/)
