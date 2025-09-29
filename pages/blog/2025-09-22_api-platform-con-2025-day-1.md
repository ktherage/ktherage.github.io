---
title: "API Platform con 2025 - DAY 2"
date: 2025-09-23
description: "API Platform con 2025 - DAY 2 - an overview of the talks I attended at the API Platform Conference in 2025."
image: ~
published: true
tags:
  - Conferences
  - API
  - API Platform Con
  - 2025
category: Conferences
excerpt: >-
  I had the opportunity to attend the API Platform Con 2025 thanks to SensioLabs and here is what I learned through the talks I viewed.
---

I had the opportunity to attend the API Platform Con 2025 thanks to SensioLabs and here is what I learned through the talks I viewed.

Table of contents :

[toc]

---

## Enhance your API Platform APIs with Go thanks to FrankenPHP (Kévin Dunglas)

**Slides of this talk are available : [https://dunglas.dev/2025/09/the-best-of-both-worlds-go-powered-grpc-for-your-php-and-api-platform-apps/](https://dunglas.dev/2025/09/the-best-of-both-worlds-go-powered-grpc-for-your-php-and-api-platform-apps/)**

API Platform is celebrating its 10th anniversary this year, having been created on January 20, 2015. Originally a Symfony bundle, it is now usable with Laravel or even without any framework. With over 14,000 stars on GitHub and 921 code and documentation contributors, API Platform has become an essential tool for creating APIs.

Kevin highlighted that it has also been the starting point for many related projects such as Mercure and FrankenPHP, and many Symfony components were first developed for API Platform.

He also paid tribute to Ryan Weaver, a key contributor, and encouraged attendees to support his family through the [GoFundMe "In memory of Ryan Weaver: For his son Beckett"](https://gofund.me/31ec53011).

### One Model, Many API Architecture Types

With API Platform, you can use the same DTO, the same code, and the same PHP class to generate different output formats with just a few configuration changes.

Here are some of the supported formats:
- Hydra
- OpenAPI
- HAL
- JSON:API
- GraphQL
- Mercure (SSE support)

This approach eliminates code duplication across different API format requirements.

### Why gRPC is missing in API Platform

Currently, gRPC is not supported by API Platform. Here's why:

- gRPC does not follow REST principles.
- It is different from GraphQL.
- It uses Protobuf (a binary format) instead of JSON for the output format.

Most of the time, in classic gRPC architecture, PHP is not a candidate.


![Schema of Typical gRPC Architecture which does not include a PHP side gRPC server but a C++ server, android/java client and a ruby client](img/IMG_20250918_100400.jpg "Schema of Typical gRPC Architecture")


However, gRPC has several advantages:

- Fast and efficient
- Strongly typed
- Language agnostic: a code generator allows generating data structures in many languages.

Use cases for gRPC include:

- Microservices
- Internet of Things (IoT)
- Critical components where performance is essential

### How gRPC Works

gRPC operates on HTTP/2 and uses Protocol Buffer `.proto` files to define service contracts. These definitions enable automatic code generation across multiple programming languages. The binary serialization format provides more efficient data transmission than JSON, while HTTP/2's multiplexing supports high-performance communication.

Moreover, the official gRPC documentation recommends using non-PHP languages for gRPC servers due to PHP-FPM's request lifecycle limitations.

### gRPC with FrankenPHP

Thankfully, FrankenPHP offers a way to write extensions in Go that can be exposed in PHP, making it possible to use gRPC with API Platform. The FrankenPHP gRPC extension is available on GitHub and is testable. It uses the Go gRPC server and is designed to be used with or without API Platform.

For more information on configuration and usage of this extension, please refer to the [GitHub repository documentation](https://github.com/dunglas/frankenphp-grpc).

Testing can be done with gRPCui. It is important to note that this solution is still experimental.

---

## Extend Caddy Web Server with Your Favorite Language (Sylvain Combraque)

Caddy is a modern, fast, and easy-to-use web server that simplifies the process of serving websites and web applications. It is known for its automatic HTTPS configuration and simple syntax. Matt Holt, the creator of Caddy, has made significant contributions to the web server landscape with Caddy's unique features and ease of use.

### Extending Caddy

#### Using xcaddy Build

Extending Caddy can be done using the `xcaddy` build tool, which allows you to customize and extend Caddy with plugins written in Go. This tool provides a straightforward way to add new functionalities to Caddy.

#### Using WebUI from Caddy Website

Caddy also offers a WebUI that can be accessed from the Caddy website. This interface provides an easy way to manage and configure your Caddy web server.

### Extending Caddy with Go

![An example of a Caddy extension made with GO](img/IMG_20250918_100400.jpg "An example of a Caddy extension made with GO")

For more detailed information on how to extend Caddy with Go, you can refer to the [official documentation](https://caddyserver.com/docs/extending-caddy).

### Using Interpreter

While using interpreters to extend Caddy has its advantages, there are also some drawbacks:

- You need one interpreter per language.
- New versions of the language require new interpreters.
- Each interpreter is maintained separately.
- You may need to re-implement types.

### WASM x WASI x darkweak/wazemmes for Caddy Extension in Any Language

WebAssembly (WASM) is a binary instruction format that promises to enable programs to run at near-native speed on the web. The promise of "build once, run everywhere" makes WASM an attractive option for extending Caddy. However, the current documentation is not user-friendly, and there are some bugs to be aware of.

WebAssembly System Interface (WASI) is a system interface designed to allow WebAssembly modules to interact with the operating system in a secure and portable way. This combination of WASM and WASI allows developers to write code in their preferred language and compile it to WASM for execution in a browser or server environment.

For more information on using WASM and WASI in Caddy, you can check out the [darkweak/wazemmes repository on GitHub](https://github.com/darkweak/wazemmes).

---

## Mercure, SSE, API Platform and an LLM Elevate a Chat(bot) (Mathieu Santostefano)

**Slides of this talk are available : [https://welcomattic.github.io/slides-real-time-ai-chatbot-with-mercure/1](https://welcomattic.github.io/slides-real-time-ai-chatbot-with-mercure/1)**

### Origin of the Subject
The initial customer need was to create paid expert chat exchanges. The first version used an API + React, but lacked message history. Mercure was chosen for secure message distribution to customers via JWT.

Evolved needs:
- Assist experts with an AI assistant
- Allow AI to handle the first part of the conversation
- Allow experts to take over when needed

### Toolbox

#### Mercure - Real-time Exchanges
Architecture:
- Server => Hub => Client
- Client => Hub => Client

#### SSE
Server-Sent Events (SSE) is a technology that allows a server to send real-time updates to a client via a persistent HTTP connection. The client listens to a stream of events sent by the server.

#### API Platform

##### LLM
Data generation and intelligent responses

##### Symfony Messenger
Asynchronous process management

##### Symfony AI
Equivalent to Mailer/Notifier but for AI providers:
- **Platform**: unified interface for all AI providers
- **Agent**: agentic AI creation
- **Store**: data storage abstraction
- **MCP SDK**: now officially supported by Anthropic
- **AI Bundle**: full integration with Symfony
- **MCP Bundle**: additional components

### Implementation

Technical flow:
`User => message => Mercure (Storage) <= Symfony SSE client => Symfony Messenger => Mistral => Mercure => AI response => User`

Secure private chat via JWT (JSON Web Tokens) - an open standard for securely exchanging data between parties.

#### Sending a message to Mercure
```javascript
// JavaScript code from Mercure documentation
const data = encodeURIComponent(JSON.stringify({ message: 'Hello!' }));
const response = await fetch('https://your-mercure-hub/.well-known/mercure', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: `topic=https://your-topic-url&data=${data}`
});
```

#### Connecting to Mercure

```javascript
// JavaScript code from Mercure documentation 
const eventSource = new EventSource('https://your-mercure-hub/.well-known/mercure?topic=https://your-topic-url');
eventSource.onmessage = e => console.log(e.data);
```

#### Symfony SSE Client

Built-in EventSourceHttpClient:

```php
// Symfony code example 
use Symfony\Component\Mercure\EventSourceHttpClient;
$client = new EventSourceHttpClient('https://your-mercure-hub/.well-known/mercure');
$response = $client->subscribe(['https://your-topic-url']);
```
#### Dispatching messages with Messenger

```php
// Symfony code example 
use Symfony\Component\Messenger\MessageBusInterface;
$bus->dispatch(new YourMessage($data));
```
#### Symfony AI Configuration

##### YAML configuration of AI bundle with Mistral

```yaml
framework:
  ai:
    providers:
      mistral:
        type: mistral
        api_key: "%env(MISTRAL_API_KEY)%"
```

##### Handler Example

```php
// Symfony AI Bundle code example
use Symfony\Component\Ai\ClientInterface;

class MessageHandler
{
     public function __construct(private ClientInterface \$aiClient) {}
     
     public function __invoke(YourMessage \$message)
     {
         $response = this->aiClient->generateText([
             'model' => 'mistral-tiny',
             'prompt' => \$message->getContent()
         ]);
         // Processing the AI response
     }
}
```

In his final words Mathieu dedicated his talk in memory of Ryan Weaver, whose contributions continue to inspire the Symfony community. He also thanked Christopher Hertel for the Symfony AI initiative.

---

## How API Platform 4.2 is Redefining API Development (Antoine Bluchet)

**Slides of this talk are available : [https://soyuka.me/api-platform-4-2-redefining-api-development/](https://soyuka.me/api-platform-4-2-redefining-api-development/)**

Looking back at version 4.0:
- 610 commits
- ~200,000 lines of code
- 291 issues opened
- 230 issues closed

### What's New in 4.2

Key features of this release:
- FrankenPHP integration
- State Options
- Query parameters enhancements
- Performance improvements
- Laravel compatibility
- PHP File Metadata

### Metadata Enhancements

#### Metadata from PHP Files

![An example of a PHP file metadata](img/IMG_20250918_134546.jpg "An example of a PHP file metadata")

New metadata system allows extracting API configuration directly from PHP files. It is not documented yet (AFAIK) but you can see the related PR of Loïc Frémont https://github.com/api-platform/core/pull/7017.

#### Metadata Mutator
A new way to programmatically modify metadata:
- More flexible configuration
- Runtime adjustments
- Cleaner architecture

### From API Filter to Parameters

#### API Filter Retrospective

The `#[ApiFilter]` attribute was doing a lot of things in the background, such as:
- Declare services with filter tags
- Generate documentation
- Apply database operations
- Work with multiple properties

This was confusing and also not respecting Single Responsibility Principle. That's the reason why API Platform maintainers have decided to rework that to Parameters.

#### Filter Documentation Improvements

Now documentations are generated separately. This can be done with two new interfaces
- `JsonSchemaFilterInterface`
- `OpenApiParameterFilter`

#### Filtering System

Now Filter are independent through a new `FilterInterface` with:
- Simplified `apply()` method
- No constructor requirements
- Dependency-free design

#### Parameter System

The `#[ApiFilter]` attribute will leave his place to a new property of Operations attributes called `parameters`

![An example of Parameters usage](/img/IMG_20250918_135352.jpg "An example of Parameters usage")


#### New Filter Types
- Free text search capabilities
- URI variable provider

### JSON Schema Enhancements

Some improvements were made on JSON Schema generation. Those changes could imply a backward compatibility break for tools using the former JSON Schema.

Improvements
- Schema mutualization
- 30% smaller OpenAPI specification files
- Reduced I/O operations

A new tool is now recommended : [pb33f.io](https://pb33f.io) as it is more feature-rich and better maintained than Swagger UI.

### Performance

Performance benchmarks comparing Nginx vs FrankenPHP:

![Performance comparison between Nginx and FrankenPHP 1 ](/img/IMG_20250918_140008.jpg "Performance comparison between Nginx and FrankenPHP 1")

![Performance comparison between Nginx and FrankenPHP 2](/img/IMG_20250918_140037.jpg "Performance comparison between Nginx and FrankenPHP 2")

More benchmarks available at [soyuka.github.io/sylius-benchmarks/](https://soyuka.github.io/sylius-benchmarks/)

JSON Streamer improvements:
- ~32.4% better request/second performance
- Configurable via settings

### State Options

New features for querying subresources:
- More efficient data loading
- Entity class magic (RIP Ryan)

### Data Mapping

New mapping capabilities:
- Database to API representation mapping
- Symfony ObjectMapper integration
- Better data transformation

### Debugging

Profiling tools are back!

### Backward Compatibility

- Many new features added
- No deprecations in this version
- Parameters system is no longer experimental

### Looking Ahead to API Platform 5.0

Planned changes:
- `#[ApiFilter]` deprecation (migration script coming soon)
- More JSON Streamer usage
- Object Mapper feature requests
- Community-driven improvements

---

## Design pattern the treasure is in the vendor (Smaïne Milianni)

**Slides of this talk are available : [https://ismail1432.github.io/conferences/2025/apip_con/index.html](https://ismail1432.github.io/conferences/2025/apip_con/index.html)**

In this talk Smaïne made a tour on Design Pattern that are commonly used without any knowledge that they are in the vendors we use on a daily basis. He also showcased small and comprehensible code PHP snippets explaining some of them.

Among them were :
- The Strategy Pattern
- The Adapter Pattern
- The Factory Pattern
- The Builder Pattern
- The Proxy Pattern
- The Observer Pattern
- The Event Dispatcher Pattern
- The Decorator Pattern
- The Facade Pattern
- The Template Pattern
- The Chain of Responsibility Pattern

Smaïne also ended with a shoutout to Ryan Weaver.

---

## What if we do Event Storming in our API Platform projects ? (Gregory Planchat)

### Event Storming

Event Storming is a collaborative workshop technique that brings together both users and developers in the same room. This methodology shines a light on misunderstandings that often exist between business stakeholders and technical teams.

The beauty of Event Storming lies in its simplicity: it uses physical post-it notes to encourage different team members to exchange ideas, see each other, share knowledge, meet face-to-face, and confront their understanding of the business domain.

### Preparation

The Event Storming process follows a structured approach with several key steps:

1. **List the events** - Start by identifying all the significant events that happen in your business domain
2. **Organize the events** - Arrange these events in a chronological or logical order
3. **Set up the commands** - Identify what actions trigger each event
4. **Set up the actors** - Determine who or what initiates each command
5. **Green post-its** - Add the data necessary for users to make decisions
6. **Add external systems** - Include third-party systems that interact with your domain
7. **Aggregates** - Group related events and commands into cohesive business concepts

The team mentioned that they conducted multiple sessions "until no one had any more questions, whether from the technical team or the business team." It's a self-documenting process that can be repeated as the business evolves.

### Advantages

Event Storming brings several concrete benefits to development teams:

- **Process documentation** - The workshop naturally creates living documentation of your business processes
- **Facilitated onboarding** - New team members can quickly understand the domain by looking at the Event Storming artifacts
- **Reveals uncertainties** - Hidden assumptions and unclear requirements surface during the collaborative sessions

### With API Platform

#### The Anemic Model Problem

Most applications suffer from what's called the anemic model anti-pattern, where:

- Business logic is scattered across numerous services
- Loss of user intention tracking
- Entities become mere data containers with getters and setters

Typically, when you want to modify information in your entity, you call a setter method. This often happens across multiple services and classes, hence the "business logic disseminated in numerous services" problem.

The intention is essential for third-party systems to understand what actually happened in your application.

#### Rich Models

The alternative approach uses rich domain models that:

- **Require significant cost** - More complex to implement initially
- **Require detailed application understanding** - Team needs deep domain knowledge
- **Guarantee consistency over time** - Business rules are enforced at the model level
- **Apply business constraints** - Validation logic lives where it belongs
- **Centralize business logic** - Everything related to a concept lives in one or two classes
- **The model guarantees integrity** - Invalid states become impossible

With a rich model, all changes happen within the entity itself, keeping the business logic centralized and coherent.

#### The CRUD Problem

Traditional CRUD operations are:

- Limited to 4 operations (Create, Read, Update, Delete)
- SQL-centric thinking
- Tools like PostgREST generate REST APIs automatically but provide little business value

To do better, we can leverage the power of API Platform's State Providers and State Processors.

But how do we preserve intention in our application?

The solution follows this flow:
**Repository → EventBus → Event → Handler**

#### Model Modification

The team implemented a pattern with three key methods in their entities:

- **recordThat()** - Records that an event occurred (e.g., "a deployment was launched")
- **apply()** - Applies the modifications related to the event (e.g., updates the deployment date)
- **releaseEvents()** - A cleanup step that happens during the save process, just before persist/flush, then dispatches events throughout the application

This approach ensures that every business action is captured as a meaningful event, preserving the user's intention and providing a clear audit trail of what happened in the system.

### Results

The team reported several concrete improvements after implementing this approach:

- **An API and codebase that better resembled the company's business domain**
- **User intention was preserved** throughout the application lifecycle
- **Better understanding of actions performed** in the application, both for developers and business stakeholders

![Abstract of the OpenAPI documentation of an Event Stormed done API](/img/IMG_20250919_103045.jpg "Abstract of the OpenAPI documentation of an Event Stormed done API")

---

## Scaling Databases (Tobias Petry)

Tobias Petry shared insights on database scaling strategies. His talk highlighted why scalability issues usually originate at the database level and walked through the most common solutions, their advantages, and their pitfalls.

### Solutions

There is no silver bullet: every application has its own constraints. Still, several well-known strategies exist:

- **Find and fix slow queries**  
  Before considering infrastructure, always check the basics. Tools like [mysqlexplain.com](https://mysqlexplain.com) can help detect inefficient queries and suggest improvements.

- **Cache results**  
  Serving cached responses drastically reduces the load on the database and avoids repeating costly operations.

- **Vertical scaling (bigger machines)**  
  Sometimes the simplest option is to scale up: move the database to a more powerful server. However, this approach quickly reaches physical and financial limits.

- **Multi-master replication**  
  In this setup, several servers accept both reads and writes. It improves write scalability but creates the risk of conflicts when parallel writes occur. Conflict resolution strategies can mitigate this, but complexity grows with the number of nodes.

- **Read replication**  
  Here, a single primary node handles writes, while replicas serve read queries.
    - **Synchronous replication** ensures that changes are propagated to all replicas before acknowledging the write. This guarantees consistency but adds latency, as every replica must confirm.
    - **Asynchronous replication** acknowledges the write immediately and updates replicas later. It reduces latency but risks temporary inconsistency between nodes.  
      In practice, most applications tolerate eventual consistency. A cache layer in front of the primary often hides replication lag. Still, studies show that 90–98% of applications encounter latency issues if relying only on replicas for reads.

- **Sharding**  
  Sharding distributes data across multiple databases. This enables *theoretically infinite scalability*. For example, users might be split across shards based on their ID.  
  The challenge comes with cross-shard queries: if you need to fetch all orders of a user across multiple shops, and users and shops are sharded differently, you must query several shards and aggregate results manually. Some companies even introduce *shards of shards*, adding another layer of complexity.  
  Because of this overhead, sharding is usually reserved for very large-scale systems. For most use cases, read replication is sufficient.

In general, these strategies are designed for CRUD workloads. Analytical queries (dashboards, reports) are harder to scale with a standard relational database. Developers can explore resources like [sqlfordevs.com](https://sqlfordevs.com) (free course on making analytics faster) or specialized systems such as [TimescaleDB](https://www.timescale.com).

### Sounds complicated

Tobias emphasized a crucial point: scaling decisions must be made before hitting database bottlenecks. Once data is structured and scaling strategies are in place, rolling back becomes almost impossible. Database architecture is one of those areas where it is far easier to make the right decision early than to correct mistakes later.


---

## API Platform, JsonStreamer and ESA for skyrocketing API (Mathias Arlaud)

**Slides of this talk are available : [https://www.canva.com/design/DAGyYPxkygw/M1RzOiv8_cMp0Pa7Mh0u4g/view](https://www.canva.com/design/DAGyYPxkygw/M1RzOiv8_cMp0Pa7Mh0u4g/view)**

Storytelling: imagine a bookstore. A customer orders **all** Symfony-related books. The bookseller tries to gather them all, but it's heavy—takes time, lots of books. The second time, the same request, but the pile is so large that the bookseller collapses under the weight.

In the API world, **JSON is king**.

At the heart of our stack is **API Platform**, which relies on Symfony’s Serializer. But sometimes the Serializer is like that bookseller: it works well until the load becomes too heavy.

### Serialization / Normalization in Symfony

Serialization in Symfony (and in API Platform) involves turning PHP objects into arrays or scalar values, then encoding to formats like JSON or XML. **Normalization** transforms the internal object graph into a neutral data structure (arrays, scalars), applying metadata such as groups or attributes. **Encoding** then converts that structure into the final JSON string. The reverse process (**denormalization**) handles input JSON → arrays → objects.

When objects or collections are small, this works fine. But with thousands of items, large graphs, deep associations, and nested arrays, memory usage and time-to-first-byte degrade. Serialization becomes a bottleneck.

### Streaming as a solution

Instead of building a huge in-memory structure, streaming emits JSON pieces **incrementally**. You only keep in memory what’s necessary at each moment.

Symfony 7.3 introduces the **JsonStreamer** component for that purpose.

Some key features:

- Works best with **POPOs** (Plain Old PHP Objects) having public properties, without complex constructors.
- The `#[JsonStreamable]` attribute can be used on classes to mark them as streamable. This also allows pre-generation of code during cache warm-up.
- Use the **TypeInfo** component ([link](https://symfony.com/blog/new-in-symfony-7-3-jsonstreamer-component)) to describe types of collections and objects (e.g., `Type::list(Type::object(MyDto::class))`). This helps JsonStreamer guess the shape of the output JSON without loading everything in memory.

Here is a code snippet from the Symfony documentation showing basic usage:

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

Benchmarks & comparisons

For a dataset of 10,000 objects:

| Method                   | Time      | Memory usage / footprint (rough / relative) |
| ------------------------ | --------- | ------------------------------------------- |
| Serializer (traditional) | \~ 204 ms | \~ 16 MB (grows with size)                  |
| JsonStreamer             | \~ 87 ms  | \~ 8 MB (much more constant)                |

Challenges with metadata, JSON-LD and how API Platform adapts

API Platform adds metadata, JSON-LD contexts, property metadata, etc. That adds overhead in serialization. To integrate JsonStreamer while preserving rich metadata:

They use PropertyMetadataLoader extension points to provide metadata to JsonStreamer. This lets JsonStreamer know property names, whether they're exposed, etc., without traversing the full object tree in memory.

API Platform

Use of ValueTransformers that can transform any value at runtime. But caution: heavy logic in transformers can degrade performance (they run per value).

Symfony
+1

Use of ObjectMapper to convert entities (e.g., Doctrine objects) into POPOs (DTOs) that are suitable for streaming. This helps because entities often have lazy properties, proxies, relations etc., which complicate streaming.

ESA (Edge Side APIs) pattern

Edge Side APIs refers to breaking large JSON payloads into smaller, progressive calls or chunks, often delivered from the edge / CDN to improve perceived performance, especially in high latency/slow networks. In context of this talk:

Instead of sending one huge JSON structure, partition or paginate so the client can start receiving some data quickly.

Combine with streaming so that parts of the response start being delivered early (TTFB improves).

Good user experience: user sees something quickly rather than waiting for full load.

Takeaways

Serializer works, but for large data sets it becomes inefficient.

JsonStreamer gives significant improvements in both memory usage and time to first byte.

When you have metadata layers (API Platform, JSON-LD), use the extension points provided to plug streaming without losing features.

Avoid heavy computations / transformations in runtime‐hot paths (e.g., ValueTransformers).

Design your API knowing these options early, because once core serialization path is deeply embedded, changing is hard.
### Benchmarks & comparisons

For a dataset of **10,000 objects**:

| Method                   | Time      | Memory usage / footprint                 |
| ------------------------ | --------- | ---------------------------------------- |
| Serializer (traditional) | ~204 ms   | ~16 MB (grows with size)                 |
| JsonStreamer             | ~87 ms    | ~8 MB (much more constant)               |

### Challenges with metadata, JSON-LD and how API Platform adapts

API Platform adds **metadata**, JSON-LD contexts, and property metadata. That overhead makes serialization heavier. To integrate JsonStreamer while keeping these features:

- Use **PropertyMetadataLoader** extension points to provide metadata to JsonStreamer. This tells it which properties to expose, without traversing the full object tree.
- Use **ValueTransformers** to adjust values at runtime. But beware: heavy logic here will degrade performance, since transformers run for every value.
- Use **ObjectMapper** to convert entities (e.g., Doctrine objects) into POPOs (DTOs) that are easier to stream.

### ESA (Edge Side APIs) pattern

**Edge Side APIs (ESA)** refers to breaking large JSON payloads into smaller, progressive chunks, often delivered from the edge or a CDN to improve perceived performance, especially in high-latency or slow networks.

In practice:

- Instead of sending one huge JSON structure, partition or paginate so the client starts receiving data earlier.
- Combine with streaming so that parts of the response arrive incrementally, improving time-to-first-byte.
- The user experience is better: data appears quickly instead of waiting for everything.

### Takeaways

- Symfony’s Serializer is fine for small to medium datasets.
- JsonStreamer provides **significant improvements** in memory usage and TTFB.
- API Platform integrates it through extension points (PropertyMetadataLoader, ValueTransformers, ObjectMapper).
- Avoid heavy runtime transformations for best performance.
- Design your API with these options in mind early—serialization decisions are very difficult to change later.
