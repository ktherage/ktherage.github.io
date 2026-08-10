---
title: "Building a RAG-Powered Code Review Assistant with PHP, Ollama, and Qdrant"
description: "How I turned 20 years of Symfony code reviews into a local AI assistant with PHP, Ollama, and Qdrant — no GPU required."
cover:
  image: "img/pexels-cottonbro-6153344.jpg"
  alt: "Close-up of a human fist punching a prosthetic hand, symbolizing technology and human connection."
  caption: "Photo by <a href=\"https://www.pexels.com/@cottonbro/\">cottonbro studio</a> on <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [AI, Symfony, PHP, RAG, MCP, LLM, Ollama, Qdrant]
excerpt: >-
  Ask an LLM to review your code and you'll get generic advice. Give it 10,000 Symfony Core code reviews
  as reference — and it'll produce reviews that sound like nicolas-grekas and stof reviewed your PR.
  Here's how I built a RAG pipeline in 100% PHP to make that happen.
---

[LLMs](https://en.wikipedia.org/wiki/Large_language_model) are great at producing code reviews that sound right. But "sounding right" isn't the same as being useful. A review that tells you to "fix the Code Style" is correct but useless — every project applies a Code Style that may differ.

Symfony has more than **20 years of public code reviews** on [GitHub](https://github.com/). Every merged PR contains comments from [nicolas-grekas](https://github.com/nicolas-grekas), [stof](https://github.com/stof), [dunglas](https://github.com/dunglas), [xabbuh](https://github.com/xabbuh), and dozens of other reviewers from the core team and contributors. It's a goldmine of domain-specific review patterns: which arguments convince, which patterns get rejected, what the community considers good Symfony code.

The problem? No one had built a search engine to exploit it. So I did it 🤣.

## The lore behind this crazy idea

This story starts at the [Symfony Live in Paris](https://live.symfony.com/). As you can imagine, this year's edition was very AI-focused. I saw quite a few talks about it and wanted to play around with this novelty, but until then I didn't have a concrete use case.

I attended a talk by [Grégoire Pineau](https://github.com/lyrixx) where he explained how, with [Symfony AI](https://ai.symfony.com/), [Clickhouse](https://clickhouse.com/) and [redirection.io](https://redirection.io/), he had successfully migrated an e-commerce site while reducing traffic loss.

Later, the [Console Bundle](https://symfony.com/blog/new-in-symfony-8-1-http-less-symfony-applications) arrived.

I had already asked an LLM to review the changes I had made _(on personal projects of course)_ and, as you might guess, I got advice like `consider using dependency injection`, `maybe extract this logic into a service` or `remember to check the code style`. These pieces of feedback are technically correct, but above all universally applicable and completely generic. In short, nothing that can't be fixed with good tools and a little rigor.

Coming out of Symfony Live, a somewhat crazy idea came to me.
What if I could ask the same LLM: 
> "Review this code the way stof would"

I'd get ultra-sharp feedback and code that would come out stronger.

Or

> "Review this code the way any Symfony contributor would"

Then I'd get the whole community's point of view on the code I just created. 

Or even

> "Review this code the way any member of the Symfony core team would"

I'd have a panel of experts at my disposal to explain what's wrong with what I did.

That's what **Symfony Reviewer MCP** does: a [semantic search engine (RAG)](https://en.wikipedia.org/wiki/Retrieval-augmented_generation) over all of Symfony's historical code reviews, accessible via the [GitHub](https://docs.github.com/en/rest) API, exposed through the [Model Context Protocol (MCP)](https://en.wikipedia.org/wiki/Model_Context_Protocol), all with [Symfony AI](https://ai.symfony.com/) and in a [Symfony HTTP-less](https://symfony.com/blog/new-in-symfony-8-1-http-less-symfony-applications) application.

I built it in [PHP 8.5](https://www.php.net/releases/8.5/) with [Symfony 8.1](https://symfony.com/), using [Ollama](https://ollama.com/) locally for vectorization with a model from [huggingface.co](https://huggingface.co/) (embeddinggemma-300m, 768 dimensions) and [Qdrant](https://qdrant.tech/) as the vector database.

No GPU required — if you accept the trade-off: indexing all historical reviews ran on my machine's CPU _for several days_ 😅. For a one-off project, I found this trade-off largely acceptable and cost-efficient.

How does it work?

## Global architecture

The global architecture is split into two big blocks:
1. **RAG generation:** 
    1. Data fetching and caching
    2. Dataset generation and indexing into [Qdrant](https://qdrant.tech/)
2. **The MCP server**

### RAG generation

Here is the complete RAG generation pipeline:

Don't worry if this diagram looks dense — I'll walk through every step of the pipeline in the rest of the article, from fetching GitHub reviews to semantic search.

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A["GitHub API (symfony/symfony)"] --> B["PullsFetcher (merged PRs only)"]
    B --> C["ReviewsFetcher (comments + replies)"]
    C --> D["DatasetGenerator (var/dataset/pull-{id}.txt)"]
    D --> E["Builder::build"]
    E --> F["Ollama (embeddinggemma-300m)"]
    F --> G["Qdrant (collection: reviews)"]
</pre>

#### Fetching the data

Before all this HTTP decorator machinery matters, you first have to walk the [GitHub API](https://docs.github.com/en/rest) and decide what's worth keeping.

`PullsFetcher` pages through `GET /repos/symfony/symfony/pulls?state=all&per_page=100`, keeping only PRs whose `merged_at` isn't null — no point training the system on rejected ideas. Rather than blindly paging until hitting an empty page, it first sends a single `HEAD` request and reads the total page count directly from the [Link header](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api). That `HEAD` call is exactly why `BLACKLISTED_PATTERN` exists: it's a discovery request, not something worth caching for 365 days.

`ReviewsFetcher` then walks [`GET /repos/symfony/symfony/pulls/{id}/comments`](https://docs.github.com/en/rest/pulls/comments) for each PR and rebuilds the actual conversation tree — parent comments with their replies attached. The catch: GitHub's API doesn't guarantee comment ordering. If a reply arrives before its parent, `ReviewsFetcher` parks it in a temporary pool (`$repliesTempPool`) instead of dropping it, and reattaches it as soon as the parent is found. A small piece of bookkeeping, but without it, any thread where three people argue about tabs vs. spaces out of order would silently lose replies.

##### The HTTP decorator chain: Logging & Caching

###### The architecture

Both fetchers go through the same small [HTTP decorator chain](https://symfony.com/doc/current/http_client.html#decorating-the-client):

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    A["GithubHttpClient (scoping + Bearer auth)"] --> B["CachedHttpClient (filesystem cache, 365d TTL)"]
    B --> C["LoggedHttpClient (structured logging)"]
    C --> D["HttpClient::create() (Symfony native)"]
</pre>

Each decorator adds one responsibility:

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

###### The serialization problem along the way

This chain contains a trap I already documented in my previous article — Symfony's [`HttpClient::getInfo()`](https://symfony.com/doc/current/http_client.html#information-related-to-the-response) contains a `pause_handler` key with a `Closure`, impossible to serialize. The `CachedResponse` class handles this by filtering out non-serializable values:

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

Without this filter, [`FilesystemAdapter`](https://symfony.com/doc/current/components/cache.html) silently fails — the serialization exception is caught by `DefaultMarshaller` with `throwOnSerializationFailure` set to `false`, and the cache key is quietly ignored.

#### Dataset generation

The `BuildCommand` class orchestrates the vectorization pipeline:

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

##### The base file

Once the data is fetched, `DatasetGenerator` transforms each PR and its reviews into a structured text file:
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

These files live in `var/dataset/pull-{id}.txt` and serve as the ground truth for vectorization.


##### Qdrant integration

The vector store is wired into the container as `StoreInterface`, via Qdrant's `StoreFactory`:

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

Two details are worth mentioning. 
1. The `Vectorizer` uses exactly the same [Ollama](https://ollama.com/) model as at build time — an embedding model `hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0` producing 768-dimension vectors.
This part is extremely important if you don't want to end up comparing apples with oranges during MCP search. Indeed, a vector generated with a specific model can't be compared with a vector generated with another model.
2. The store reuses the `LoggedHttpClient` decorator, so every Qdrant round-trip benefits from structured logging on top of Symfony's native HTTP client.

##### Vectorization & storage

This is where things get hairy — this part alone took me days.

###### What happens during vectorization?

The file from `var/dataset/pull-{id}.txt` is read, then sent to [Ollama](https://ollama.com/) to ask an embedding model — in my case `hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0` — which generates a 768-dimension vector _(a number that depends on the embedding model)_ before it's sent back to symfony-ai by Ollama, to finally be saved into a vector space in [Qdrant](https://qdrant.tech/).

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
sequenceDiagram
    participant AI as Symfony AI (Builder)
    participant Ollama
    participant Model as embeddinggemma-300m
    participant Qdrant

    AI->>Ollama: vectorize(dataset file content)
    Ollama->>Model: model inference
    Model-->>Ollama: 768 float values
    Ollama-->>AI: Vector (768 dimensions)
    AI->>Qdrant: add(VectorDocument)
    Qdrant-->>AI: confirmation
</pre>

Example vector:

```bash
❯ ollama run hf.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF:Q8_0 'Hello world !'
[0.058340553,0.017256556,-0.0023928124,0.062416226,-0.019779362,-0.069838926,0.003351966,0.029903421,0.01617497,0.009088458,-0.024585545,-0.07013172,0.0077750348,0.03643439,-0.02245716,0.02035499,0.005985676,0.008291158,0.013118213,-0.074038,0.014411658,0.011837681,0.027627029,-0.008276582,0.059961967,0.018847544,0.040701613,0.020481525,0.004880007,-0.026033,0.028065553,-0.015691148,-0.06859542,-0.04025022,-0.0046045044,-0.033632968,0.01929922,0.01854895,-0.000545488,-0.37636346,0.05929959,0.0069747632,-0.026434837,0.018491298,-0.00945082,0.0009028575,0.024641853,-0.053274404,-0.043102805,0.0016308841,-0.04315744,-0.0024387056,-0.007468653,-0.03491168,-0.00315068,-0.023274362,-0.0016503683,-0.027008653,-0.0016653507,0.029124975,0.015810343,-0.020706663,0.03261976,-0.015973076,-0.0104695875,0.0027727042,0.03187403,0.25363848,0.016416604,0.027735965,0.009674886,-0.031506274,-0.01176536,-0.060261074,-0.0031871377,-0.01684568,0.029581062,-0.05600014,-0.02623269,0.04637347,-0.04044786,0.0036846441,0.008154481,0.0190515,-0.023374602,-0.011516434,0.01098124,0.008980432,-0.02016589,-0.020812696,0.046533223,0.009594602,-0.033848874,-0.046110246,0.027529772,0.029260637,-0.04092383,0.00048074988,0.01185442,0.0059498977,0.02239185,-0.0014466406,-0.00841961,-0.011190161,0.05701471,-0.015211558,-0.052781906,0.014623615,-0.0012096912,0.029300302,0.0044483966,0.028927691,-0.032093737,0.048145276,0.034030333,0.03062545,0.015509856,-0.008765529,-0.027545273,0.010858431,0.021899927,-0.008150199,0.0034826857,-0.03487983,-0.039671477,0.009751623,-0.019133179,-0.0030401512,-0.010503486,-0.017615957,0.0365356,0.001852526,-0.013896455,0.04652015,-0.049408674,0.0120107075,0.0065035336,0.0004583914,0.0074103116,-0.028435387,-0.0110742645,-0.0012466233,0.0014801751,-0.015979966,-0.028333941,0.0053472416,0.014286039,0.00054261123,0.049599133,-0.026553018,-0.021315206,0.043478087,0.032634746,0.0031313808,-0.0007238099,-0.0033655402,0.02283678,0.012112167,-0.019739753,-0.0080446005,0.018196804,0... (line truncated to 2000 chars)
```

###### Why a sequential approach?

As explained in the intro, without a dedicated GPU, it's my CPU — more precisely the iGPU integrated into my CPU — that has to do the vectorization work.
Even though the iGPU shares RAM with the CPU and even though 32 GB are available _(depending on my system usage, running programs, ...)_, RAM speed has nothing to do with graphics card memory, which is far faster and dedicated.
Moreover, the CPU can only process a few operations in parallel, where the GPU executes thousands simultaneously, which makes matrix computations very slow and saturates my machine at 100%.

As a result, only one vectorization at a time is possible.
And so yes, a batch upsert would be faster, but the goal was to build a working pipeline using only local resources.

It's not a limitation of PHP or Qdrant, just a pragmatic trade-off tied to the available hardware.

###### File-rename atomicity

This is the most interesting design decision. Instead of a database table to track processed files, the `Builder` uses atomic `rename()` calls:

```
pull-{id}.txt               → ready to process
processing_pull-{id}.txt    → currently vectorizing
ragged_pull-{id}.txt        → vectorized successfully
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
            continue; // another process claimed it
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

Crash-safe by design: if the script dies mid-way, `recoverOrphanedProcessingFiles()` re-queues orphaned `processing_*` files on the next run. No locks, no database, no race conditions.


Yes, the code shows that, despite what I said above:

> As a result, only one vectorization at a time is possible.

Yes, I still tried 🤣.


#### Usage

The CLI exposes two commands:

```bash
# Full pipeline: fetch → dataset → vectorize
php bin/console mcp:build

# Re-vectorize without re-fetching
php bin/console mcp:build --skip-generation

# Re-fetch without re-vectorizing
php bin/console mcp:build --skip-build
```

### The MCP server

For the LLM to have access to these freshly indexed reviews and run its searches by itself, you have to give it access.
Everything happens through the MCP protocol following this simplified call pipeline:

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
flowchart TD
    H["MCP Tool Call (review_as_group/person)"] --> I["Retriever (semantic search)"]
    I --> G["Qdrant (collection: reviews)"]
    I --> J["LLM Client (Claude Desktop)"]
</pre>

The generation pipeline (fetch → dataset → vectorize) and the serving pipeline (retrieve → respond) share a single point in common: the [Qdrant](https://qdrant.tech/) collection. 

The MCP server exposes two **tools** and four **prompts**:

| Tool | Role |
|---|---|
| `review_as_group` | Search by affiliation group (MEMBER, CONTRIBUTOR, NONE) |
| `review_as_person` | Search by a specific reviewer (nicolas-grekas, stof, etc.) |

| Prompt | Role |
|---|---|
| `review_as_group` | Formatted message using `review_as_group` |
| `review_as_person` | Formatted message using `review_as_person` |
| `get_stofed` | Forces the reviewer to "stof" — the most prolific reviewer of Symfony Core |
| `hq_review` | Multi-review: queries 14 reviewers and synthesizes a markdown report |

#### Retrieval: MCP Tools

When a user sends a query through an MCP tool, here is what happens:
1. The tool builds a query combining reviewer, file path, and diff
2. `RetrieverInterface::retrieve()` vectorizes the query via Ollama
3. A cosine similarity search runs on Qdrant
4. The matching `VectorDocument` objects are returned
5. Their `metadata['content']` is extracted and assembled into context

<pre class="mermaid d-flex flex-column m-2 justify-content-center align-items-center">
sequenceDiagram
    participant Client as Claude Desktop
    participant MCP as MCP Server (stdio)
    participant Tool as review_as_person
    participant Retriever
    participant Ollama
    participant Qdrant

    Client->>MCP: call_tool(review_as_person)
    MCP->>Tool: __invoke(pseudonym, file, diff, limit)
    Tool->>Retriever: retrieve(query, ['limit' => limit])
    Retriever->>Ollama: vectorize(query)
    Ollama-->>Retriever: query vector
    Retriever->>Qdrant: cosine similarity search
    Qdrant-->>Retriever: closest documents
    Retriever-->>Tool: VectorDocument[]
    Tool-->>MCP: found reviews (text)
    MCP-->>Client: tool result
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

#### The HQ Review prompt

The `hq_review` prompt is the showcase feature. It queries 14 top-tier Symfony reviewers ([GromNaN](https://github.com/GromNaN), [dunglas](https://github.com/dunglas), [welcoMattic](https://github.com/welcoMattic), [nicolas-grekas](https://github.com/nicolas-grekas), [chalasr](https://github.com/chalasr), [stof](https://github.com/stof), [yceruto](https://github.com/yceruto), [mtarld](https://github.com/mtarld), [OskarStark](https://github.com/OskarStark), [xabbuh](https://github.com/xabbuh), [lyrixx](https://github.com/lyrixx), [kbond](https://github.com/kbond), [jderusse](https://github.com/jderusse), [alexandre-daubois](https://github.com/alexandre-daubois)), collects their historical feedback on the same file/diff, and asks the LLM to synthesize a markdown report with feedback weighted per reviewer.

The result is a code review that reads like a mini-symposium of Symfony Core maintainers — without requiring their time.

#### Usage

```bash
docker build -t symfony-reviewer-mcp-cli /path/to/Dockerfile
docker run -i --rm --add-host=host.docker.internal:host-gateway -e QDRANT_DSN=http://host.docker.internal:6333 -e OLLAMA_DSN=http://host.docker.internal:11434 symfony-reviewer-mcp-cli
```

Then configure Claude Desktop (or any MCP client) by adding the server to `claude_desktop_config.json`:

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

## Environment variables

All the configuration goes through `.env` variables:

| Variable | Role |
|---|---|
| `GITHUB_TOKEN` | [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) |
| `QDRANT_DSN` | Qdrant service URL |
| `OLLAMA_DSN` | Ollama service URL |
| `BLACKLISTED_PATTERN` | JSON array of URL patterns to exclude from the cache |
| `APP_VERSION` | Version displayed in the MCP metadata |

## Lessons learned

This project taught me how the MCP protocol works, what a vector database is and how to use it. The architecture presented here is fairly standard for a RAG pipeline, but it was built with Symfony and can serve as a base for other experiments or use cases.

### What worked well

- **File-rename atomicity**: This pattern is elegant, crash-safe, and requires no infrastructure. Every PHP developer understands `rename()`. No Redis locks, no database migrations.
- **Incremental pipeline**: Re-running `mcp:build` with existing files is a no-op. Iteration is fast — you can tweak the vectorization and only process new files.
- **PHP 8.x features**: Constructor promotion, readonly properties, the pipe operator (`|>`), and invokable commands make the code significantly cleaner.
- **[Ollama](https://ollama.com/) locally**: embeddinggemma-300m runs on CPU without issues. 768 dimensions is modest enough for fast queries but rich enough for semantic search over code reviews.

### What needs improvement

Had I had a more powerful machine with a dedicated GPU or unified memory (👋 Mac owners), I might have been able to change the following:
- **Naive Qdrant interaction**: Documents are added one at a time. A batch upsert would be significantly faster for large volumes.
- **No incremental RAG updates**: The pipeline is add-only. There's no "builtin" mechanism _(it's possible via the Qdrant dashboard)_ to purge or update existing vectors when PR comments are edited on GitHub. Which is a real/false problem in itself, since you rarely find new comments on already-merged pull requests.
- **Add your own conventions**: I added Symfony's reviews, but you too can modify and adapt the code to rely on an additional data corpus, like your colleagues' reviews.

### What I'd do differently

1. **Batch vectorization**: Group documents and vectorize in batches for higher throughput
2. **Async fetching**: The data fetching phase is sequential per PR. Concurrent requests would significantly cut the initial build time.
3. **GitHub webhook**: Instead of periodically rebuilding, listen for merged PR events and update the dataset incrementally
4. **Embedding model evaluation**: 768 dimensions works well, but I should compare different models: smaller ones (like [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), 384 dimensions) to improve performance, or much larger ones to assess the potential gain in search quality.
5. **Wider context: PR comments and full diff**: the current dataset only keeps review comments attached to a specific diff. It ignores general PR comments (issue comments, description) and above all the PR's full diff — a reviewer never judges an isolated line, they judge it in the context of the whole change. Injecting both would give the model far more material to understand why a review was worded the way it was.
6. **Exploit the `metadata` field for GitHub's raw JSON**: [`symfony/ai-store`](https://github.com/symfony/ai-store) attaches a `Metadata` object (`Symfony\AI\Store\Document\Metadata`) to every `VectorDocument`, which travels all the way to the chosen store. With Qdrant, this `Metadata` maps exactly to the notion of *payload*: an arbitrary JSON object attached to each point, natively indexable and filterable — for example filtering by `reviewer_association`, by date, or by reaction count, without re-parsing the dataset text. Today, only `content` (the assembled dataset file text) is stored there; I would have added GitHub's raw API response (PR + review + reactions), to keep an exploitable trace independent of the generated text format.
7. **Exploit the GitHub JSON reactions**: Reactions would actually lend themselves to more than a simple filter: they could weight the search score itself, not just be returned in the `content`. Since version 1.14, Qdrant offers a [*Formula Query*](https://qdrant.tech/documentation/search/hybrid-queries/) that lets you compose a final score from the initial similarity score and payload fields, in a single re-ranking formula. A review with ten `+1` would then rank above an isolated review with zero reactions, at equal vector similarity — a way to surface the opinions the community itself validated. A feature worth exploring.

## Does it work?

The big question: "are the reviews produced actually better?".

Answering Yes would be partially wrong. Indeed, today my evaluation remains essentially based on a general feeling rather than on real, tangible, quantifiable data.
The generated answers seem to me far more in the tone of a review that would have been made on Symfony's GitHub repository, and therefore closer to its conventions, than the answers obtained with a context-free LLM.
Finally, since an LLM is "probabilistic" by nature, I don't believe it's relevant to assert, based on my own observations and personal feeling alone, that the functioning of a tool is established.

Here is a example of a review done on that project to give you an idea :
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

## To conclude

<div style="width:100%;height:0;padding-bottom:56%;position:relative;">
    <iframe src="https://giphy.com/embed/NRiRXQTwbijNba2l2l" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
</div>

<p><a href="https://giphy.com/gifs/The-Animal-Crackers-Movie-baking-try-it-NRiRXQTwbijNba2l2l">via GIPHY</a></p>

Try it yourself — the [project](https://github.com/ktherage/symfony-review-mcp) is designed to be self-contained and independent. The data is publicly accessible, and you can spin up a Qdrant and Ollama instance easily with [Docker](https://www.docker.com/).

To install it:

```bash
git clone https://github.com/ktherage/symfony-review-mcp
cd symfony-review-mcp
docker compose run --rm cli composer install
docker compose run --rm cli bin/console mcp:build
docker compose up -d
```

The most surprising thing I learned building this project: PHP is a perfectly viable language for RAG pipelines. Symfony's HttpClient, Cache, and Console components, combined with the [`symfony/ai-*`](https://github.com/symfony/ai) packages, handle everything from HTTP decoration to vector database operations. 

You don't need Python to do semantic search.

Sometimes the best tool for the job is the one you already master.
