---
title: "Construire un assistant de code review RAG avec PHP, Ollama et Qdrant"
description: "Comment j'ai transformé 20 ans de code reviews Symfony en assistant IA local avec PHP, Ollama et Qdrant — sans GPU."
cover:
  image: "img/pexels-cottonbro-6153344.jpg"
  alt: "Gros plan d'un poing humain frappant une main prothétique, symbolisant la technologie et la connexion humaine."
  caption: "Photo par <a href=\"https://www.pexels.com/fr-fr/@cottonbro/\">cottonbro studio</a> sur <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [AI, Symfony, PHP, RAG, MCP, LLM, Ollama, Qdrant]
excerpt: >-
  Demandez à un LLM de review votre code et vous obtiendrez des conseils génériques. Donnez-lui
  10 000 code reviews du Core Symfony en référence — et il produira des reviews qui sonnent comme
  si nicolas-grekas et stof avaient relu votre PR. Voici comment j'ai construit un pipeline RAG
  en 100% PHP pour y parvenir.
---

Les [LLM](https://fr.wikipedia.org/wiki/Grand_mod%C3%A8le_de_langage) sont excellents pour produire des code reviews qui sonnent juste. Mais « sonner juste » n'est pas la même chose qu'être utiles. Une review qui vous dit de « corrige le Code Style » est correcte mais inutile — chaque projet applique Code Style qui peut différer.

Symfony a plus de **20 ans de code reviews publiques** sur [GitHub](https://github.com/). Chaque PR mergée contient des commentaires de [nicolas-grekas](https://github.com/nicolas-grekas), [stof](https://github.com/stof), [dunglas](https://github.com/dunglas), [xabbuh](https://github.com/xabbuh), et des dizaines d'autres reviewers de la core team et de contributeurs. C'est une mine d'or de patterns de review spécifiques au domaine : quels arguments convainquent, quels patterns sont rejetés, ce que la communauté considère comme du bon code Symfony.

Le problème ? Personne n'avait construit de moteur de recherche pour l'exploiter. Alors je l'ai fais 🤣.

## Le lore derrière cette idée folle

Cette histoire prends sa source au [Symfony Live de Paris](https://live.symfony.com/). Comme vous l'imaginez, celui de cette année était très orienté IA. J'ai vu bon nombre de Talks en parlé et j'ai voulu jouer un peu avec cette nouveautée mais jusque là, je n'avais pas de cas concrét.

J'y ai assisté au un Talk de [Grégoire Pineau](https://github.com/lyrixx) ou il expliquais comment avec [Symfony AI](https://ai.symfony.com/), [Clickhouse](https://clickhouse.com/fr) et [redirection.io](https://redirection.io/) il avait mené à bien la migration d'un site E-Commerce en réduissant la perte de trafic.

Plus tard est arrivé le [Console Bundle](https://symfony.com/blog/new-in-symfony-8-1-http-less-symfony-applications).

J'avais déjà demandé à un LLM de relire les modifications que j'avais faites _(sur des projets perso bien sûr)_ et, comme vous vous en doutez, j'ai obtenu des conseils du genre `pensez à utiliser l'injection de dépendances`, `peut-être extraire cette logique dans un service` ou `pense a vérifier le code style`. Ces retours sont techniquements corrects, mais surtout universellements applicables et complètements génériques. Bref, rien qui ne puisse être corrigé avec de bons outils et un peu de rigeur.

Sortant du Symfony Live, m'est venu une idée un peu dingue.
Et si je pouvais demander au même LLM : 
> « Review ce code comme le ferait stof »

J'aurais des retours ultra pointu et un code qui en ressortira grandi.

Ou

> « Review ce code comme le ferait n'importe quel contributeur Symfony »

J'aurais alors le point de vu de l'ensemble de la communauté sur le code que je viens de créé. 

Ou bien même

> « Review ce code comme le ferait n'importe quel membre de la core team Symfony »

J'aurais un panel d'experts à ma disposition pour m'expliquer ce qui ne vas pas dans ce que j'ai fait.

C'est ce que fait **Symfony Reviewer MCP** : un [moteur de recherche sémantique (RAG)](https://fr.wikipedia.org/wiki/G%C3%A9n%C3%A9ration_%C3%A0_enrichissement_contextuel) sur l'ensemble des code reviews historiques de Symfony accessibles via l'API [GitHub](https://docs.github.com/en/rest), exposé via le [Model Context Protocol (MCP)](https://fr.wikipedia.org/wiki/Model_Context_Protocol) le tout avec [Symfony AI](https://ai.symfony.com/) et dans une application [Symfony HTTP-Less](https://symfony.com/blog/new-in-symfony-8-1-http-less-symfony-applications).

Je l'ai construit en [PHP 8.5](https://www.php.net/releases/8.5/) avec [Symfony 8.1](https://symfony.com/), utilisant [Ollama](https://ollama.com/) en local pour la vectorisation avec un model issu de [huggingface.co](https://huggingface.co/) (embeddinggemma-300m, 768 dimensions) et [Qdrant](https://qdrant.tech/) comme base de donnée vectorielle.

Aucun GPU requis si on accepte la contrepartie, l'indexation complète des reviews historiques s'est exécutée sur le CPU de ma machine _pendant plusieurs jours_ 😅. Pour un projet ponctuel, ce compromis m'a semblé largement acceptable et "cost-efficient".

Comment ça fonctionne ?

## Architecture globale

L'architecture globale se découpe en deux gros blocs :
1. **La génération du RAG :** 
    1. Avec la récupération des données et leurs mise en cache
    2. Avec la génération du dataset et l'indexation dans [Qdrant](https://qdrant.tech/)
2. **Le serveur MCP**

### La génération du RAG

Voici le pipeline de génération RAG complet :

Ne vous inquiétez pas si ce schéma paraît dense, je vais parcourir chaque étape du pipeline dans le reste de l'article, depuis la récupération des reviews GitHub jusqu'à la recherche sémantique.

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A["API GitHub (symfony/symfony)"] --> B["PullsFetcher (PR mergées uniquement)"]
    B --> C["ReviewsFetcher (commentaires + réponses)"]
    C --> D["DatasetGenerator (var/dataset/pull-{id}.txt)"]
    D --> E["Builder::build"]
    E --> F["Ollama (embeddinggemma-300m)"]
    F --> G["Qdrant (collection: reviews)"]
</pre>

#### Récupération des données

Avant que toute cette mécanique de décorateurs HTTP ait de l'importance, il faut d'abord parcourir [l'API GitHub](https://docs.github.com/en/rest) et décider ce qui mérite d'être gardé.

`PullsFetcher` pagine `GET /repos/symfony/symfony/pulls?state=all&per_page=100`, en ne gardant que les PR dont `merged_at` n'est pas nul — inutile d'entraîner le système sur des idées rejetées. Plutôt que de paginer aveuglément jusqu'à tomber sur une page vide, il envoie d'abord une unique requête `HEAD` et lit le nombre total de pages directement dans le [header `Link`](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api). Cet appel `HEAD` est d'ailleurs exactement la raison d'être de `BLACKLISTED_PATTERN` : c'est une requête de découverte, pas quelque chose qui mérite d'être caché 365 jours.

`ReviewsFetcher` parcourt ensuite [`GET /repos/symfony/symfony/pulls/{id}/comments`](https://docs.github.com/en/rest/pulls/comments) pour chaque PR et reconstruit le véritable arbre de conversation — les commentaires parents avec leurs réponses attachées. Le piège : l'API GitHub ne garantit pas l'ordre des commentaires. Si une réponse arrive avant son parent, `ReviewsFetcher` la met de côté dans un pool temporaire (`$repliesTempPool`) au lieu de la perdre, et la rattache dès que le parent est trouvé. Un petit détail de tenue de registre, mais sans lui, n'importe quel thread où trois personnes se disputent sur tabs vs espaces dans le désordre perdrait silencieusement des réponses.

##### La chaîne de décorateurs HTTP : Logging & Caching

###### L'architecture

Les deux fetchers passent par la même petite [chaîne de décorateurs HTTP](https://symfony.com/doc/current/http_client.html#decorating-the-client) :

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A["GithubHttpClient (scoping + auth Bearer)"] --> B["CachedHttpClient (cache filesystem, TTL 365j)"]
    B --> C["LoggedHttpClient (logging structuré)"]
    C --> D["HttpClient::create() (Symfony natif)"]
</pre>

Chaque décorateur ajoute une responsabilité :

```php
final readonly class CachedHttpClient implements HttpClientInterface, ResetInterface
{
    public function __construct(
        private HttpClientInterface $client,
        private FilesystemAdapter $cache,
        private LoggerInterface $logger,
        private array $blacklistedPatterns = [],
    ) {
    }

    public function request(string $method, string $url, array $options = []): ResponseInterface
    {
        $pattern = array_map(static fn (string $pattern): string => preg_quote($pattern, '#'), $this->blacklistedPatterns)
            |> (static fn ($x): string => implode('|', $x))
            |> (static fn (string $x): string => \sprintf('#^%s$#', $x))
        ;
        $httpCall = $method.' '.$url;
        if (preg_match($pattern, $httpCall, $matches)) {
            return $this->client->request($method, $url, $options);
        }

        $key = md5($method.$url);
        $cacheItem = $this->cache->getItem($key);
        if ($cacheItem->isHit()) {
            return $cacheItem->get();
        }

        $response = new CachedResponse($this->client->request($method, $url, $options));

        $cacheItem->set($response);
        $this->cache->save($cacheItem);

        return $response;
    }
}
```

###### Le problème de sérialisation en chemin

Cette chaîne contient un piège que j'ai déjà documenté dans mon article précédent — [`HttpClient::getInfo()`](https://symfony.com/doc/current/http_client.html#information-related-to-the-response) de Symfony contient une clé `pause_handler` avec une `Closure`, impossible à sérialiser. La classe `CachedResponse` gère cela en filtrant les valeurs non sérialisables :

```php
final readonly class CachedResponse implements ResponseInterface
{
    private int $statusCode;

    /** @var array<string, list<string>> */
    private array $headers;

    private string $content;

    /** @var array<string|int, mixed> */
    private array $toArray;

    /** @var array<string|int, mixed> */
    private array $info;

    public function __construct(ResponseInterface $response)
    {
        $this->statusCode = $response->getStatusCode();
        $this->headers = $response->getHeaders();
        $this->content = $response->getContent();
        $this->toArray = $response->toArray();

        /** @var array<string|int, mixed> $info */
        $info = $response->getInfo();
        $this->info = array_filter($info, static fn ($v): bool => !$v instanceof \Closure);
    }
}
```

Sans ce filtre, [`FilesystemAdapter`](https://symfony.com/doc/current/components/cache.html) échoue silencieusement — l'exception de sérialisation est attrapée par `DefaultMarshaller` avec `throwOnSerializationFailure` à `false`, et la clé de cache est discrètement ignorée.

#### Génération du dataset

La commande `BuildCommand` orchestre le pipeline de vectorisation :

```php
#[AsCommand(
    name: self::NAME,
    description: "build a RAG over Symfony's official Github repository's code review",
    help: 'This command is a pre-requisites for the MCP server',
)]
final readonly class BuildCommand
{
    public const string NAME = 'mcp:build';

    public function __construct(
        private LoggerInterface $logger,
        private DatasetGenerator $datasetGenerator,
        private Builder $builder,
    ) {
    }

    public function __invoke(
        #[Option(description: 'Skip dataset generation and uses dataset cache', name: 'skip-generation', shortcut: 'G')]
        bool $skipGeneration = false,
        #[Option(description: 'Skip build of dataset cache', name: 'skip-build', shortcut: 'B')]
        bool $skipBuild = false,
    ): int {
        try {
            if (!$skipGeneration) {
                $this->datasetGenerator->generate();
            }

            if (!$skipBuild) {
                $this->builder->build();
            }

            return Command::SUCCESS;
        } catch (\Throwable $throwable) {
            $this->logger->error($throwable->getMessage());

            return Command::FAILURE;
        }
    }
}
```

##### Le fichier de base

Une fois les données récupérées, `DatasetGenerator` transforme chaque PR et ses reviews en fichier texte structuré :
```
[PULL_REQUEST]
    id: 54321
    author: nicolas-grekas
    author_association: MEMBER
    description:
        [HttpKernel] Fix edge case in exception handling

[REVIEWS]
    [REVIEW_1234]
        replyTo:
        reviewer: stof
        reviewer_association: MEMBER
        file: src/Component/HttpKernel/Event/ExceptionEvent.php
        diff:
            @@ -88,7 +88,7 @@
             public function getThrowable(): ?\Throwable
             {
        comment:
            We should keep the original exception here,
            the wrapper is only for internal use.

        reactions:
            +1: 5
            -1: 0
            laugh: 0
            hooray: 0
            confused: 0
            heart: 0
            rocket: 0
            eyes: 0
```

Ces fichiers vivent dans `var/dataset/pull-{id}.txt` et servent de vérité terrain pour la vectorisation.


##### Intégration Qdrant

La base vectorielle est câblée dans le conteneur comme `StoreInterface`, via le `StoreFactory` de [Qdrant](https://qdrant.tech/) :

```php
->set(StoreInterface::class, Store::class)
    ->autowire()
    ->factory(StoreFactory::create(...))
    ->args([
        '$collectionName' => 'reviews',
        '$endpoint' => env('QDRANT_DSN'),
        '$httpClient' => service(LoggedHttpClient::class),
        '$embeddingsDimension' => 768,
        '$embeddingsDistance' => 'Cosine',
    ])

->set(VectorizerInterface::class, Vectorizer::class)
    ->autowire()
    ->args([
        '$model' => 'hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0',
    ])
```

Deux détails valent le détour. 
1. Le `Vectorizer` utilise exactement le même modèle [Ollama](https://ollama.com/) qu'au build — un modèle d'embedding `hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0` produisant des vecteurs à 768 dimensions.
Cette partie est extrêment importante si vous ne voulez pas vous retrouver à comparer des pommes de terre avec des choux lors de la recherche via le MCP. En effet, un vecteur généré avec un modèle précis ne peux pas être comparé avec un vecteur généré avec un autre modèle.
2. La base réutilise le décorateur `LoggedHttpClient`, donc chaque aller-retour vers Qdrant bénéficie d'un logging structuré par-dessus le client HTTP natif de Symfony.

##### Vectorisation et stockage

C'est là que les choses se gâtent, cette partie à elle seule m'a pris des jours.

###### Qu'est qu'il se passe à la vectorisation ?

Le fichier issu de `var/dataset/pull-{id}.txt` sont lus puis envoyés a [Ollama](https://ollama.com/) pour demander à un modèle d'embedding, dans mon cas `hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0`, qui va en générer un vecteur de 768 dimensions _(chiffre qui dépends du modèle d'embedding)_ avant d'être renvoyé à symfony-ai par Ollama pour enfin être sauvegarder dans un espace vectoriel dans [Qdrant](https://qdrant.tech/)

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
sequenceDiagram
    participant AI as Symfony AI (Builder)
    participant Ollama
    participant Model as embeddinggemma-300m
    participant Qdrant

    AI->>Ollama: vectorize(contenu du fichier dataset)
    Ollama->>Model: inférence du modèle
    Model-->>Ollama: 768 valeurs flottantes
    Ollama-->>AI: Vector (768 dimensions)
    AI->>Qdrant: add(VectorDocument)
    Qdrant-->>AI: confirmation
</pre>

Exemple de vecteur :

```bash
❯ ollama run hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0 'Hello world !'
[0.058340553,0.017256556,-0.0023928124,0.062416226,-0.019779362,-0.069838926,0.003351966,0.029903421,0.01617497,0.009088458,-0.024585545,-0.07013172,0.0077750348,0.03643439,-0.02245716,0.02035499,0.005985676,0.008291158,0.013118213,-0.074038,0.014411658,0.011837681,0.027627029,-0.008276582,0.059961967,0.018847544,0.040701613,0.020481525,0.004880007,-0.026033,0.028065553,-0.015691148,-0.06859542,-0.04025022,-0.0046045044,-0.033632968,0.01929922,0.01854895,-0.000545488,-0.37636346,0.05929959,0.0069747632,-0.026434837,0.018491298,-0.00945082,0.0009028575,0.024641853,-0.053274404,-0.043102805,0.0016308841,-0.04315744,-0.0024387056,-0.007468653,-0.03491168,-0.00315068,-0.023274362,-0.0016503683,-0.027008653,-0.0016653507,0.029124975,0.015810343,-0.020706663,0.03261976,-0.015973076,-0.0104695875,0.0027727042,0.03187403,0.25363848,0.016416604,0.027735965,0.009674886,-0.031506274,-0.01176536,-0.060261074,-0.0031871377,-0.01684568,0.029581062,-0.05600014,-0.02623269,0.04637347,-0.04044786,0.0036846441,0.008154481,0.0190515,-0.023374602,-0.011516434,0.01098124,0.008980432,-0.02016589,-0.020812696,0.046533223,0.009594602,-0.033848874,-0.046110246,0.027529772,0.029260637,-0.04092383,0.00048074988,0.01185442,0.0059498977,0.02239185,-0.0014466406,-0.00841961,-0.011190161,0.05701471,-0.015211558,-0.052781906,0.014623615,-0.0012096912,0.029300302,0.0044483966,0.028927691,-0.032093737,0.048145276,0.034030333,0.03062545,0.015509856,-0.008765529,-0.027545273,0.010858431,0.021899927,-0.008150199,0.0034826857,-0.03487983,-0.039671477,0.009751623,-0.019133179,-0.0030401512,-0.010503486,-0.017615957,0.0365356,0.001852526,-0.013896455,0.04652015,-0.049408674,0.0120107075,0.0065035336,0.0004583914,0.0074103116,-0.028435387,-0.0110742645,-0.0012466233,0.0014801751,-0.015979966,-0.028333941,0.0053472416,0.014286039,0.00054261123,0.049599133,-0.026553018,-0.021315206,0.043478087,0.032634746,0.0031313808,-0.0007238099,-0.0033655402,0.02283678,0.012112167,-0.019739753,-0.0080446005,0.018196804,0.0334649,-0.04168719,-0.0046553654,-0.007058912,-0.0104055125,-0.033779215,0.0015363622,0.051331602,0.009603074,0.0061764405,-0.0047951997,0.0055726245,-0.013255206,-0.0184209,0.025034897,0.057538535,-0.022678796,0.029314326,-0.028992262,-0.024944754,0.005440558,-0.03586656,0.00470333,0.0039566993,-0.03774347,0.007882632,-0.019097507,0.019113457,-0.024320446,-0.012655296,-0.04030833,0.0036063064,0.017062565,-0.047738973,0.03617525,0.009754858,0.01101775,-0.03881582,-0.05497514,0.018249176,-0.02227283,-0.064608485,-0.009161445,-0.010031034,-0.0095641855,0.01916363,0.01516687,0.016545013,-0.002466866,0.05094877,-0.012659827,-0.014525608,-0.023728082,0.043452837,-0.0182468,0.0171756,-0.027970072,-0.07089399,0.030868053,-0.017713076,-0.012257217,-0.010346674,0.026055504,0.0060443725,0.017072264,0.008725935,0.013845085,-0.016069857,-0.015575777,-0.024176376,0.011916211,0.023472574,0.020805132,0.023326341,-0.032767452,-0.054396667,0.013436974,0.004714595,-0.033193223,0.018227011,0.021449534,0.035102192,0.014087173,-0.012364751,-0.02923529,-0.014678346,0.020951372,-0.046659384,-0.0001321898,-0.04854372,-0.008653948,-0.02752997,-0.039902873,0.059013035,-0.023333075,-0.002939849,-0.02412675,-0.004704963,0.005708739,0.0078358585,0.015467018,-0.017394196,-0.024916349,0.0033860407,-0.005256748,-0.019880958,0.02133062,-0.01909998,-0.03368627,-0.030686421,-0.046723425,-0.009353089,0.00718895,0.03141207,-0.005678604,0.010026497,0.017099433,0.09632587,-0.049855407,0.040112875,0.03521583,0.029755611,0.016151456,-0.011640585,-0.012128548,-0.028238969,0.015068383,-0.033082347,0.01045796,0.02537935,0.035929427,-0.066318564,0.0031127778,0.0012862016,-0.0036205864,0.025082638,-0.053492177,-0.0033758928,0.011705148,-0.0033429412,0.04687452,-0.008285868,0.0009990487,-0.032646406,0.009088849,-0.0041933167,-0.046134073,0.0067272885,0.009922917,0.01473402,-0.008017513,-0.042351346,-0.026370844,-0.013365593,-0.05842642,0.0053622974,0.07431096,-0.0013185574,-0.009227675,-0.023330051,-0.027747931,-0.009491263,0.021478329,-0.0059168683,-0.021412537,0.020145044,-0.039623715,-0.0428058,0.025570398,0.03506635,-0.037845273,0.05345302,-0.0574125,-0.00028089757,0.009052639,-0.019611377,0.04223033,0.014607936,0.04443048,0.0076912907,0.007895783,-0.0042047133,-0.0071978727,-0.005284037,0.019756729,0.006555163,0.0008758057,-0.017007992,0.050635543,0.0092563275,0.02716696,0.021407066,0.14517316,-0.02369811,0.0027539528,0.03910237,0.008360229,-0.021910692,0.011394674,0.011142392,-0.0015445971,0.0025348184,0.010536188,0.020002112,-0.025976151,0.02049012,-0.02106826,-0.032985732,0.019664701,0.021935249,0.0066386443,0.017932259,0.01572093,-0.010654519,0.023060553,-0.014906989,0.006019814,0.010056607,0.058398962,-0.033474576,0.0011755938,0.009262606,-0.01099747,-0.0015662273,-0.009874551,0.008189235,0.025591813,-0.018472403,0.04004355,-0.011285104,-0.014111953,-0.0063381894,0.0005300517,-0.023887232,-0.04470202,-0.0028616937,0.014985186,-0.03294004,-0.008383296,-0.043611214,-0.008217752,0.040103037,0.014903076,-0.0021273512,0.042627018,0.0010886613,0.41363978,0.03303489,-0.026918324,-0.051881365,-0.009240305,-0.017186431,-0.064830735,0.019849097,0.033434503,-0.0071105417,0.008766244,-0.017940182,-0.03069124,0.025611496,-0.0054379674,-0.018304668,0.035152443,0.017566781,-0.03807328,0.016257798,0.023560232,0.0043043825,0.08201138,-0.012402507,0.019028682,-0.018637981,0.0073655653,0.0015441499,-0.013527856,-0.0059385803,-0.022364056,-0.02425886,0.016911663,-0.0011785801,0.0053356686,0.016516488,-0.01820115,0.0032703253,-0.012067703,0.020428859,-0.004661816,0.0019089471,0.035107043,-0.04653369,0.032357465,0.037315182,-0.018799154,0.022463702,-0.020647656,0.021579335,-0.0511682,-0.016783282,-0.03466541,-0.0018399828,0.0013000914,-0.010348332,0.0012786519,-0.04518444,0.03560613,0.002523491,-0.005807527,0.010765285,-0.023149451,0.00044260465,0.0029642652,0.0010614877,-0.008083944,-0.022398435,-0.020968962,-0.014627337,0.008090492,0.005585011,-0.03377691,-0.011848554,0.0072662574,-0.03521151,-0.032203663,0.008255807,-0.040369254,0.030274471,-0.011215091,-0.008181156,0.053159524,-0.020998636,-0.002394821,0.0028064605,0.0074562496,0.007893967,-0.007300692,0.0015053308,-0.010529569,-0.0060634767,-0.024756493,-0.03676517,0.011349936,-0.015407753,-0.009043473,0.034528915,0.017980041,-0.021671167,-0.033637524,-0.049074188,-0.010759755,-0.016900545,0.054496538,0.09080891,-0.012992101,0.02599233,-0.0011818404,0.038375963,-0.0099124005,0.010196206,0.013038416,0.0007229094,0.058817368,-0.0010059974,0.031990774,0.05380181,0.024521016,0.002847628,0.07304043,0.0017232046,-0.031101514,-0.0050771832,0.024083985,0.005650839,0.013745816,0.037950784,-0.013184445,-0.030096699,0.0072532697,0.0069977636,0.012731625,-0.03473301,0.020486254,-0.028183239,-0.043638907,0.05255927,0.040101644,0.020626077,-0.00009298259,0.03147282,0.005550194,-0.0030457666,-0.015949357,-0.019966332,0.004474357,0.0073816148,-0.0966872,-0.0014123727,0.015428014,-0.00072764594,0.02582003,0.023952637,-0.013374169,-0.024338745,0.021395741,0.012303337,0.024213506,0.013632532,-0.016449485,-0.03322197,0.0039774035,0.00541838,0.0003197519,-0.031282444,0.021476608,0.006979306,0.024495661,0.008296023,-0.036932785,-0.031137321,-0.00706068,0.024338977,0.0073112054,0.06343152,0.010950803,-0.04011533,0.0023558561,0.005737587,-0.013831569,0.025473805,-0.017996674,0.030670065,-0.021311458,-0.014061837,-0.028316947,-0.016967898,0.05437623,-0.05517407,-0.011666794,-0.064273596,0.00039994833,-0.0016417564,0.00369619,-0.004408155,-0.033399895,0.010705014,0.022728024,-0.006053165,0.0031930788,-0.010684994,-0.05090471,-0.03378601,-0.016370287,0.00020012762,-0.022603909,0.036075003,0.030441662,0.03643664,0.01663764,0.010343481,-0.00867144,-0.015162774,-0.0014251935,0.03770172,-0.013012902,0.035615146,0.00044963427,0.012939211,-0.008898151,0.04329554,0.006962741,0.047645073,-0.058727764,0.0069460804,0.027805299,-0.0022572207,0.03155984,0.007940954,0.025537886,0.026445614,-0.01529072,0.01621024,0.0069643836,-0.013095124,-0.0015153071,-0.013846497,-0.0054590567,0.10567172,0.024595099,-0.021427441,-0.017892607,0.029084895,-0.044227537,-0.020952923,0.0037034317,-0.053684484,-0.026559578,0.0031811807,-0.0022820174,-0.07499727,-0.06748456,-0.031104647,-0.037120227,-0.0070385304,0.03623152,-0.06010997,-0.0040761833,-0.023788461,0.007862985,-0.0080264,0.0294231,-0.06763409,-0.027284352,0.02720548,0.012118604,-0.044641722,0.025212545,-0.0050499276,0.010612783,-0.0048592645,0.011480939,-0.038084067,0.050459232,-0.021653391,-0.016860519,-0.022343304,0.011578441,0.029444221,0.005036281,0.052007847,-0.00015478901,0.010757338,-0.008266853,-0.06438106,0.0038179888,0.010810128,0.014887702,0.041086577,0.09645378,-0.03697137,0.018508574,0.021505969,0.043335702,-0.015699612,0.006846198,0.059496786,0.042588223,-0.020572873,0.0042599905,0.0061774435,-0.0048375144,0.023622885,-0.013585687,0.012436588,-0.0031023244,-0.009659066,0.007284619,0.004994468,-0.03997744,0.025999822,-0.004322784,0.0021907475,0.027662035,0.013451684,0.0061220867,-0.053517137,0.011526667,-0.016668048,0.03389963,0.0024166985,-0.0087329345,0.0005349021,0.09292805,-0.024875147,0.01887172,-0.015814196,0.01548722,-0.0023607062,0.00095323403,0.040603366,-0.018233076,0.00050581084,-0.028851299,-0.05746257,-0.022262363,0.06411007,-0.015622854,0.02921695,0.032788914,-0.0042617223,-0.0026337528,0.029876161,0.026273958,-0.048925456,-0.014354729,0.0069950293,-0.046119038,-0.0015572214,-0.01648194,-0.018696893,-0.036625963,-0.0049027205,-0.002610518,-0.046027448,0.02675758,-0.033888668,0.0046032025,-0.017866787,-0.016139796]
```

###### Pourquoi une approche séquentielle ?

Comme expliqué en introduction, sans GPU dédié, c'est mon CPU — plus précisément l'iGPU intégré à mon CPU — qui doit faire le travail de vectorisation.
Même si l'iGPU partage la RAM avec le CPU et bien que 32 Go soient disponibles _(modulo l'utilisation de mon système, de programme en cours, ...)_, la vitesse de la RAM n'a rien à voir avec la mémoire des cartes graphiques, bien plus rapide et dédiée.
De plus, le CPU ne peut traiter que quelques opérations en parallèle, là où le GPU en exécute des milliers simultanément ce qui fait que les calculs matriciels deviennent très lents et mobilisent ma machine à 100%.

Résultat, une seul vectorisation n'est possible à la fois.
Et donc, oui, un batch upsert serait plus rapide, mais le but était de construire un pipeline fonctionnel avec uniquement des ressources locales.

Ce n'est pas une limite de PHP ou de Qdrant, seulement un compromis pragmatique lié au matériel disponible.

###### Atomicité par renommage de fichiers

C'est la décision de design la plus intéressante. Au lieu d'une table en base de données pour suivre les fichiers traités, le `Builder` utilise des `rename()` atomiques :

```
pull-{id}.txt               → prêt à traiter
processing_pull-{id}.txt    → en cours de vectorisation
ragged_pull-{id}.txt        → vectorisé avec succès
```

```php
public function build(): void
{
    $this->store->setup(); // ManagedStoreInterface

    $this->recoverOrphanedProcessingFiles();

    foreach (scandir($this->datasetDirectory) as $file) {
        if ('.' === $file || '..' === $file
            || str_starts_with($file, self::RAGGED_PREFIX)
            || str_starts_with($file, self::PROCESSING_PREFIX)) {
            continue;
        }
        if (!rename($this->datasetDirectory.'/'.$file, $this->datasetDirectory.'/'.('processing_'.$file))) {
            continue; // un autre processus l'a pris
        }

        try {
            $content = file_get_contents($this->datasetDirectory.'/processing_'.$file);
            $vector = $this->vectorizer->vectorize($content);
            if (768 !== \count($vector->getData())) {
                throw new \RuntimeException('Wrong dimensions');
            }

            $this->store->add(new VectorDocument(
                id: (int) preg_replace('/[^0-9]/', '', $file),
                vector: $vector,
                metadata: new Metadata(['content' => $content]),
            ));

            rename($this->datasetDirectory.'/processing_'.$file, $this->datasetDirectory.'/ragged_'.$file);
        } catch (\Throwable $e) {
            rename($this->datasetDirectory.'/processing_'.$file, $this->datasetDirectory.'/'.$file); // rollback
        }
    }
}
```

Crash-safe par conception : si le script meurt en plein milieu, `recoverOrphanedProcessingFiles()` remet en file les orphelins `processing_*` au prochain lancement. Pas de locks, pas de base de données, pas de race conditions.


Oui, le code montre que, malgrés ce que j'ai dis plus haut :

> Résultat, une seul vectorisation n'est possible à la fois.

Oui, j'ai quand même essayé 🤣.


#### Utilisation

La CLI expose deux commandes :

```bash
# Pipeline complet : récupération → dataset → vectorisation
php bin/console mcp:build

# Re-vectoriser sans re-récupérer
php bin/console mcp:build --skip-generation

# Re-récupérer sans re-vectoriser
php bin/console mcp:build --skip-build
```

### Le serveur MCP

Pour que le LLM puisse avoir accès a ces review fraichement indéxés et effectuer ses recherches lui même, il faut lui donner les accès.
Tout ça s'effectue via le protocole MCP suivant ce pipeline d'appel simplifié :

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    H["Appel Tool MCP (review_as_group/person)"] --> I["Retriever (recherche sémantique)"]
    I --> G["Qdrant (collection: reviews)"]
    I --> J["Client LLM (Claude Desktop)"]
</pre>

Le pipeline de génération (récupération → dataset → vectorisation) et le pipeline de service (recherche → réponse) partagent un seul point commun : la collection [Qdrant](https://qdrant.tech/). 

Le serveur MCP expose deux **tools** et quatre **prompts** :

| Tool | Rôle |
|---|---|
| `review_as_group` | Recherche par groupe d'affiliation (MEMBER, CONTRIBUTOR, NONE) |
| `review_as_person` | Recherche par reviewer spécifique (nicolas-grekas, stof, etc.) |

| Prompt | Rôle |
|---|---|
| `review_as_group` | Message formaté utilisant `review_as_group` |
| `review_as_person` | Message formaté utilisant `review_as_person` |
| `get_stofed` | Force le reviewer à « stof » — le plus prolifique reviewer du Core Symfony |
| `hq_review` | Multi-review : interroge 14 reviewers et synthétise un rapport markdown |

#### Recherche : les Tools MCP

Quand un utilisateur envoie une requête via un tool MCP, voici ce qui se passe :
1. Le tool construit une requête combinant reviewer, chemin de fichier et diff
2. `RetrieverInterface::retrieve()` vectorise la requête via Ollama
3. Une recherche par similarité cosinus s'exécute sur Qdrant
4. Les `VectorDocument` correspondants sont retournés
5. Leur `metadata['content']` est extrait et assemblé en contexte

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
sequenceDiagram
    participant Client as Claude Desktop
    participant MCP as Serveur MCP (stdio)
    participant Tool as review_as_person
    participant Retriever
    participant Ollama
    participant Qdrant

    Client->>MCP: call_tool(review_as_person)
    MCP->>Tool: __invoke(pseudonym, file, diff, limit)
    Tool->>Retriever: retrieve(query, ['limit' => limit])
    Retriever->>Ollama: vectorize(query)
    Ollama-->>Retriever: vecteur de la requête
    Retriever->>Qdrant: recherche par similarité cosinus
    Qdrant-->>Retriever: documents les plus proches
    Retriever-->>Tool: VectorDocument[]
    Tool-->>MCP: reviews trouvées (texte)
    MCP-->>Client: résultat du tool
</pre>

```php
#[McpTool(
    name: self::NAME,
    description: 'Tool retrieving a `limit` amount of reviews from `pseudonym` github user based on a given git a complete `file` path and `diff`. Results are separated by `\n\n---\n\n`.',
    annotations: new ToolAnnotations('Review matching file diff as github user', true, false, true, false)
)]
final readonly class ReviewAsPersonMatchingFileDiffTool
{
    public const string NAME = 'review_as_person';

    public function __invoke(string $pseudonym, string $file, string $diff, int $limit): string
    {
        $query = <<<TXT
        reviewer: $pseudonym
        file: $file
        diff:
        {$diff}
        TXT;

        try {
            $retrieved = $this->retriever->retrieve($query, ['limit' => $limit]);

            $return = [];
            foreach ($retrieved as $document) {
                $content = $document->getMetadata()['content'] ?? null;
                if (null === $content || !\is_string($content)) {
                    continue;
                }
                $return[] = $content;
            }
        } catch (\Throwable $exception) {
            return 'Error retrieving reviews: '.$exception->getMessage();
        }

        if (0 === \count($return)) {
            return 'No reviews found.';
        }

        return implode("\n\n---\n\n", $return);
    }
}
```

#### Le Prompt HQ Review

Le prompt `hq_review` est la fonctionnalité vedette. Il interroge 14 reviewers Symfony de premier plan ([GromNaN](https://github.com/GromNaN), [dunglas](https://github.com/dunglas), [welcoMattic](https://github.com/welcoMattic), [nicolas-grekas](https://github.com/nicolas-grekas), [chalasr](https://github.com/chalasr), [stof](https://github.com/stof), [yceruto](https://github.com/yceruto), [mtarld](https://github.com/mtarld), [OskarStark](https://github.com/OskarStark), [xabbuh](https://github.com/xabbuh), [lyrixx](https://github.com/lyrixx), [kbond](https://github.com/kbond), [jderusse](https://github.com/jderusse), [alexandre-daubois](https://github.com/alexandre-daubois)), collecte leurs feedbacks historiques sur le même fichier/diff, et demande au LLM de synthétiser un rapport markdown avec des retours pondérés par reviewer.

Le résultat est une code review qui ressemble à un mini-symposium des mainteneurs du Core Symfony — sans nécessiter leur temps.

#### Utilisation

```bash
docker build -t symfony-reviewer-mcp-cli /path/to/Dockerfile
docker run -i --rm --add-host=host.docker.internal:host-gateway -e QDRANT_DSN=http://host.docker.internal:6333 -e OLLAMA_DSN=http://host.docker.internal:11434 symfony-reviewer-mcp-cli
```

Puis configurer Claude Desktop (ou tout client MCP) en ajoutant le serveur à `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "symfony-reviewer": {
      "command": "docker",
      "args": [
            "run", "-i", "--rm",
            "--add-host=host.docker.internal:host-gateway",
            "-e", "QDRANT_DSN=http://host.docker.internal:6333",
            "-e", "OLLAMA_DSN=http://host.docker.internal:11434",
            "symfony-reviewer-mcp-cli"
        ]
    }
  }
}
```

## Les variables d'env

Toute la configuration passe par les variables `.env` :

| Variable | Rôle |
|---|---|
| `GITHUB_TOKEN` | [Token d'accès personnel GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) |
| `QDRANT_DSN` | URL du service Qdrant |
| `OLLAMA_DSN` | URL du service Ollama |
| `BLACKLISTED_PATTERN` | Tableau JSON de patterns URL à exclure du cache |
| `APP_VERSION` | Version affichée dans les métadonnées MCP |

## Leçons apprises

Ce projet m'a permis de comprendre comment fonctionne le protocole MCP, ce qu'est un base de données vectoriel et comment l'utiliser. L'architecture présentée ici est relativement classique pour un pipeline RAG mais il a été réalisé avec Symfony et peu servir de socle de base pour d'autres expérimentations ou usages.

### Ce qui a bien fonctionné

- **Atomicité par renommage de fichiers** : Ce pattern est élégant, crash-safe et ne nécessite aucune infrastructure. Chaque développeur PHP comprend `rename()`. Pas de locks Redis, pas de migrations de base de données.
- **Pipeline incrémental** : Relancer `mcp:build` avec des fichiers existants est un no-op. L'itération est rapide — on peut ajuster la vectorisation et ne traiter que les nouveaux fichiers.
- **Fonctionnalités PHP 8.x** : La promotion de constructeur, les propriétés readonly, l'opérateur pipe (`|>`), et les commandes invokables rendent le code bien plus propre.
- **[Ollama](https://ollama.com/) en local** : embeddinggemma-300m tourne sur CPU sans problème. 768 dimensions, c'est assez modeste pour des requêtes rapides mais assez riche pour la recherche sémantique sur des code reviews.

### Ce qui doit être amélioré

Si j'avais eu une machine plus efficace avec un GPU dédié ou une RAM unifiée (👋 les propriétaires de Mac), j'aurai peut-être pu changer ce qui suit :
- **Interaction Qdrant naïve** : Les documents sont ajoutés un par un. Un batch upsert serait nettement plus rapide pour les gros volumes.
- **Pas de mise à jour incrémentale du RAG** : Le pipeline est add-only. Il n'y a pas de mécanisme "builtin" _(c'est possible via le dashboard de qdrant)_ pour purger ou mettre à jour les vecteurs existants quand des commentaires de PR sont édités sur GitHub. Ce qui en soit est un vrai/faux problème puisqu'on retrouve rarement de nouveaux commentaire sur des Pull-Requests déjà mergées.
- **Ajoutez vos propres conventions** : J'ai ajouté les reviews de Symfony, mais vous pouvez vous aussi modifier et adapter le code pour qu'il s'appuie sur un corpus de données supplémentaire comme les revues de vos collaborateurs.

### Ce que je ferais différemment

1. **Vectorisation par lots** : Grouper les documents et vectoriser en lots pour un meilleur débit
2. **Récupération asynchrone** : La phase de récupération des données est séquentielle par PR. Des requêtes concurrentes réduiraient significativement le temps de construction initial
3. **Webhook GitHub** : Au lieu de reconstruire périodiquement, écouter les événements de PR mergées et mettre à jour le dataset de manière incrémentale
4. **Évaluation des modèles d'embeddings** : 768 dimensions fonctionne bien, mais je devrais comparer différents modèles : des modèles plus petits (comme [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), 384 dimensions) pour améliorer les performances, ou des modèles beaucoup plus gros afin d'évaluer le gain potentiel en qualité de recherche.
5. **Contexte élargi : commentaires de PR et diff complet** : le dataset actuel ne retient que les review comments attachés à un diff précis. Il ignore les commentaires généraux de la PR (issue comments, description) et surtout le diff complet de la PR — un reviewer ne juge jamais une ligne isolée, il la juge dans le contexte du changement entier. Injecter les deux donnerait au modèle bien plus de matière pour comprendre pourquoi une review a été formulée ainsi.
6. **Exploiter le champ `metadata` pour le JSON brut de GitHub** : [`symfony/ai-store`](https://github.com/symfony/ai-store) attache à chaque `VectorDocument` un objet `Metadata` (`Symfony\AI\Store\Document\Metadata`) qui voyage jusqu'au store choisi. Chez Qdrant, ce `Metadata` correspond exactement à la notion de *payload* : un objet JSON arbitraire attaché à chaque point, indexable et filtrable nativement — par exemple filtrer par `reviewer_association`, par date, ou par nombre de réactions, sans re-parser le texte du dataset. Aujourd'hui, seul `content` (le texte assemblé du fichier dataset) y est stocké ; j'y aurais ajouté la réponse JSON brute de l'API GitHub (PR + review + reactions), pour garder une trace exploitable indépendante du format texte généré.
7. **Exploiter les réactions du JSON GitHub**: Les réactions se prêteraient d'ailleurs à mieux qu'un simple filtre : elles pourraient pondérer le score de recherche lui-même, pas juste être renvoyées dans le `content`. Depuis la version 1.14, Qdrant propose une [*Formula Query*](https://qdrant.tech/documentation/search/hybrid-queries/) qui permet de composer un score final à partir du score de similarité initial et de champs du payload, dans une même formule de reclassement. Une review avec dix `+1` remonterait alors devant une review isolée à zéro réaction, à similarité vectorielle égale — une façon de faire remonter les avis que la communauté a elle-même validés, Une fonctionnalitée qui meriterai d'être explorée.

## Est-ce que ça fonctionne ?

La grande question : « est-ce que les reviews produites sont réellement meilleures ? ».

Répondre Oui serait en parti faux. En effet, aujourd'hui, mon évaluation reste essentiellement basée sur un sentiment générale plutôt que sur de vraies données tangibles et quantifiables.
Les réponses générées **me** paraissent beaucoup plus dans le ton d'une review qui aurait été effectuée sur le dépôt Github de Symfony, et donc plus proches des ses conventions, que les réponses obtenues avec un LLM sans contexte.
Enfin, comme un LLM et par nature "probabiliste", je ne crois pas qu'il soit pertinant de dire que sur la base de mes propres observations et mon sentiment personnel seul le fonctionnement d'un outil est établi.

Voici un exemple de revue effectuée sur ce projet pour vous donner un idée :
```markdown
---

### 1. fabpot
**Files:** `src/HTTP/CachedHttpClient.php`, `src/HTTP/CachedResponse.php`

> Thanks for the PR! A few things before we can merge:
>
> * Why is the cache key based on the URL only? For `POST` requests the body matters, otherwise all `/api/embed` calls will return the same result. This is a real bug, not an optimization issue.
> * Please add a test covering the "non-buffered" response case — `getContent()` then `toArray()` will fail on `EventSourceHttpClient` responses.
> * Do we need a `CHANGELOG` entry for the `CachedHttpClient`? I think we can keep it internal.
>
> Otherwise the approach is clean. Once the cache key is fixed, we can squash the commits.

---

### 2. nicolas-grekas
**Files:** `src/HTTP/CachedResponse.php`, `src/Kernel.php`

> Reading the response body twice is going to blow up the moment the response is not buffered. `toArray()` internally calls `getContent()` — so snapshot the content once and `json_decode` it, don't call both.
>
> Also, the decorated chain is wrong: `service(LoggedHttpClient::class)` no longer resolves to the logger once you decorate it with `CachedHttpClient`. Qdrant and Ollama are being routed through the GitHub cache without intent. Decorate a dedicated alias, e.g. `cached.github.http_client`, and keep `HttpClientInterface` as the plain chain.
>
> One more: `getContent(false)` is being snapshotted eagerly in the constructor — that defeats lazy streaming for large GitHub responses. Buffer lazily.

---

### 3. stof
**Files:** `src/Kernel.php`

> Service wiring nit: decoration replaces the decorated id, so `$httpClient => service(LoggedHttpClient::class)` gives you the `CachedHttpClient`, not the logging client. That's a scope leak — the Qdrant store is now coupled to a cache tuned for the GitHub API (see `BLACKLISTED_PATTERN`).
>
> I'd define a dedicated `logged.http_client` service for the store/platform and only decorate `cached.github.http_client` for the GitHub fetchers. Also check the `->decorate(..., priority: 1)` priorities — with equal priorities the order of application is by declaration order, which is fragile to read.
>
> And the `json:BLACKLISTED_PATTERN` env var — document its format in the README.

---

### 4. weaverryan
**Files:** `src/MCP/Tools/ReviewAsPersonMatchingFileDiffTool.php`

> Hey! Love the ergonomics of this tool — the `review_as_person` name makes the intent super clear. Great job composing the query with the pseudonym, file, and diff.
>
> One DX thought: when no reviews are found we return `No reviews found.` — that's good. But maybe give the caller a hint that they can reduce `limit` or widen the diff? Small thing, ignore if you want.
>
> Also, the metadata `content` check with the warning log is nice defensive coding. Keep it up! 🎉

---

### 5. derrabus
**Files:** `src/HTTP/CachedHttpClient.php`

> Two things:
>
> 1. `$key = md5($method.$url)` — please include the serialized options/body. Hash collisions here are silent correctness bugs, not just perf issues.
> 2. The `preg_match` on a compiled regex built via pipe chains is clever but hard to read. Since the blacklist is a list of exact strings, why not use `in_array` or a simple `str_starts_with` on the pattern list? Keep it simple.
>
> Also, the code is `final readonly` — good. But it implements `ResetInterface`; make sure the decorated inner `reset()` is reachable in `withOptions()` clones (it is, since you forward to the scoped client — just double-check the cache/lifecycle after cloning).

---

### 6. xabbuh
**Files:** `src/HTTP/CachedResponse.php`

> I have concerns about the snapshot in the constructor:
>
> * Calling `$response->getContent()` eagerly downloads and stores the whole payload. For the GitHub fetchers this is fine, but a general-purpose cache should stream lazily.
> * More importantly, `getContent()` followed by `toArray()` breaks for responses that disabled buffering (the Ollama `EventSourceHttpClient` forces `buffer => false`). This is an exploitable/observable crash — at minimum it should throw a clear `TransportException` or read once.
> * `getInfo()` filtering out closures is a nice touch, but the returned array is shallow — nested closures could still leak. Use a recursive filter or `json_encode/decode` the info array.

---

### 7. Tobion
**Files:** `src/HTTP/CachedHttpClient.php`

> The pipeline operator chains in `request()` are over-engineered for building a regex. `implode('|', array_map(preg_quote(...), $this->blacklistedPatterns))` is enough. As written, an empty blacklist produces the pattern `#^$#` which would match an empty call string — harmless, but misleading.
>
> More importantly: cache invalidation. There is none — responses are cached for a year (`defaultLifetime`). GitHub data changes; the fetchers need a way to bust the cache (e.g. include a version/tag in the key or a TTL per-URL). Otherwise reviews fetched once are served stale forever.

---

### 8. mpdude
**Files:** `src/RAG/Builder.php` (via `Store`)

> The Qdrant indexing loop swallows exceptions and logs `Index failed` — but the build then *continues* (I saw `Indexing document continues`). If a document fails vectorization, subsequent documents are still sent. That means the collection is only partially populated, and `review_as_person` will silently return "No reviews found" or partial results.
>
> Please make the build fail-fast or at least surface a summary count at the end ("indexed X / failed Y") so operators know the dataset is incomplete. Right now nothing tells us that only ~1106 of 8691 documents made it in.

---

### 9. WouterJ
**Files:** `src/Kernel.php`

> The container config reads really well — the decoration chain is easy to follow. Nice use of `env('json:BLACKLISTED_PATTERN')` and `StoreFactory::create(...)`.
>
> Minor: the `logged.http_client` vs `cached.github.http_client` distinction is muddied because both decorators use `priority: 1` and decorate each other's ids. I'd give them explicit service aliases (`github.logged.http_client`, etc.) so the intent is obvious. Also the unused `'stream_handler'` monolog handler and the commented-out `http` transport block could be cleaned up before merge.

---

### 10. alexislefebvre
**Files:** `tests/HTTP/CachedHttpClientTest.php`

> Nice test coverage — you test blacklist skipping, persistence across instances, `withOptions` cloning, and `reset`. 👍
>
> Missing cases I'd love to see:
>
> 1. A `POST` request with a body — assert that different bodies don't collide in the cache (this would catch the `md5(method.url)` bug).
> 2. A non-buffered/streaming response (`MockResponse` with `buffer => false` is hard to fake; but at least an SSE-like response) going through `CachedResponse` without throwing.
> 3. The cache should not be hit for `POST`/`PUT` (or should include the body in the key) — please encode that expectation in a test.

---

### 11. Nyholm
**Files:** `src/HTTP/LoggedHttpClient.php`, `src/HTTP/CachedHttpClient.php`

> As the http-client component maintainer: don't re-implement caching. Symfony's `HttpClient` supports a `cache` option natively via the `http_cache` from the contracts, and it handles cache keys, headers, `Vary`, and ETags properly. Rolling your own `md5(method.url)` cache key is a regression waiting to happen (it already broke on POST bodies).
>
> If you keep the custom decorator, at least delegate to `CacheItemPoolInterface` semantics and include the request payload + relevant headers in the key. And please make `stream()` forward correctly — it does, but note that cached responses can never stream, which may surprise callers.
>
> Also: `FileSystemAdapter` on a single Docker container is fine, but for multi-instance deploys you'll want a shared pool (Redis). Worth a comment.

---

### 12. jderusse
**Files:** `src/RAG/Builder.php`, `src/HTTP/CachedHttpClient.php`

> The elephant in the room: the per-document vectorization loop is serial. 8691 documents, ~10s each — that's ~24h to build the RAG, and with the cache bug most embeddings were identical (same URL → same key). That's why retrieval feels broken.
>
> Fixes I'd push for:
> * Parallelize vectorization with Symfony's `AsyncResponse` / `stream()` over batches.
> * Include the body in the cache key (obviously).
> * Index the docs that failed (`Index failed` ×636) with retry/backoff.
>
> Also `Builder` should checkpoint progress so a crash doesn't restart from zero.

---

### 13. chalasr
**Files:** `src/MCP/Tools/ReviewAsPersonMatchingFileDiffTool.php`, `src/Command/ServeCommand.php`

> Tool ergonomics are good — `limit` is explicit, errors are caught and surfaced. But: the error path returns `Error retrieving reviews: {message}` as a *successful* tool result. For an MCP server, real failures should be proper exceptions/tool errors, not strings, otherwise the client can't distinguish "no data" from "server broken".
>
> Also, the query string embeds the raw diff with no size guard — a huge diff will blow the embedding context window. Truncate or chunk the diff.
>
> And the serve command: make sure `APP_DEBUG` is off in prod and there's a graceful shutdown on SIGTERM.

---

### 14. yceruto
**Files:** `src/Kernel.php`, `src/HTTP/CachedHttpClient.php`

> The routing of the HTTP decorators deserves attention: `LoggedHttpClient::class` is decorated by `CachedHttpClient`, so every consumer referencing it — including the Qdrant store — ends up behind the GitHub cache. That coupling is accidental.
>
> I'd restructure like this:
> ```
> HttpClientInterface          # plain
>  └─ logged.http_client       # logging only (for Qdrant/Ollama)
>  └─ cached.github.http_client # cache + github token (for GitHub fetchers)
> ```
> Two separate chains, no cross-decorating. Then the cache key issue (URL-only, no body) also only affects GitHub GETs, which is safe.
>
> After that, the 14 `review_as_person` calls will stop returning the `buffering is disabled` error and start returning real reviews.

---
```

## Pour conclure

<div style="width:100%;height:0;padding-bottom:56%;position:relative;">
    <iframe src="https://giphy.com/embed/NRiRXQTwbijNba2l2l" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
</div>

<p><a href="https://giphy.com/gifs/The-Animal-Crackers-Movie-baking-try-it-NRiRXQTwbijNba2l2l">via GIPHY</a></p>

Essayez-le vous même, le [projet](https://github.com/ktherage/symfony-review-mcp) est conçu pour être autonome et indépendant. Les données sont publiquements accessibles, vous pouvez créé une instance Qdrant et Ollama facilement avec [Docker](https://www.docker.com/).

Pour l'installer :

```bash
git clone https://github.com/ktherage/symfony-review-mcp
cd symfony-review-mcp
docker compose run --rm cli composer install
docker compose run --rm cli bin/console mcp:build
docker compose up -d
```

La chose la plus surprenante que j'ai apprise en construisant ce projet : PHP est un langage parfaitement viable pour les pipelines RAG. Les composants HttpClient, Cache et Console de Symfony, combinés avec les packages [`symfony/ai-*`](https://github.com/symfony/ai), gèrent tout, de la décoration HTTP aux opérations sur bases vectorielles. 

Vous n'avez pas besoin de Python pour faire de la recherche sémantique.

Parfois, le meilleur outil pour le travail est celui que vous maîtrisez déjà.
