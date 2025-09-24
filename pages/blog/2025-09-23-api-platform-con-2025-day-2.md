---
title: "API Platform con 2025 - DAY 2"
date: 2025-09-23
published: true
tags: ["Conferences", "API", "API Platform Con", "2025"]
excerpt: >-
  I had the opportunity to attend the API Platform Con 2025 thanks to SensioLabs and here is what I learned through the talks I viewed.
---

I had the opportunity to attend the API Platform Con 2025 thanks to SensioLabs and here is what I learned through the talks I viewed.

Table of contents :

[toc]

---

## How LLMs are changing the way we should build APIs (Fabien Potentier)

**Slides of this talk are available : [https://speakerdeck.com/fabpot/how-ai-agents-are-changing-the-way-we-should-build-apis](https://speakerdeck.com/fabpot/how-ai-agents-are-changing-the-way-we-should-build-apis)**

Fabien Potentier shared insights about how Large Language Models are fundamentally changing the way we need to think about API design. As he mentioned, this is a world that changes so fast that some assertions might already be outdated.

### Agents ?

LLMs are evolving beyond simple text generation into autonomous agents. According to Anthropic's definition, an agent is an LLM using tools in a loop. These LLMs are self-directed - they can reason about things, they can plan, and have memory.

An AI agent is kind of a mix between a machine and a human, combining the computational power of machines with human-like reasoning capabilities.

### Who can consume your app ?

Back in the days, the consumers were clearly defined:

**Website:**
- Human users only

**CLI tools:**
- Only for developers

**API:**
- Only for machines
- Semi-private (to decouple frontend) or public

Nowadays, APIs are mostly used to expose data, but AI agents have changed the game completely. They are able to interact with all three interfaces:

- **Websites can be scraped by AI** - agents can navigate and extract information from web interfaces
- **CLI tools can be used through MCP servers** - providing structured tool access
- **APIs** - LLMs (e.g., in chatbots) are often wrappers on top of APIs. Furthermore, LLMs can also write API calls directly.

But all three have different expectations, and this creates new challenges.

### The Challenge: APIs for Humans vs. Machines vs. AI Agents

APIs are optimized for machines, but when something breaks, you need a human in the loop. However, AI agents are autonomous but, like humans, they need help and guidance.

Take HTTP status codes as an example. They provide information about problems, but AI agents need more context.
HTTP responses can provide context about errors, but responses provided by APIs might not be up-to-date or accurate, causing LLMs to get stuck.

Here is a common workflow pattern followed by LLM : Thought → Action → Observation.
Without guidance provided via prompts, it can loop over the same problem, encountering the same Observation after performing the same Action—potentially forever.
LLMs will try to guess and self-correct, which is probably bad for two reasons:
- **Costly** - more API calls and processing
- **Time loss** - inefficient problem resolution
- **Resource greedy** - GPU time and electricity are consumed without solving the problem

**Tip:** The fewer round trips you have with an LLM, the more "deterministic" it becomes, even though LLMs are inherently not deterministic.

### Best Practices for LLM-Friendly APIs

Everything that is valid for LLMs is also valid for humans.

#### Error Messages
Be precise with your error messages: "Bad date format. Use 'YYYY-MM-DD'."
Benefits:
- Fewer tokens consumed
- Smaller context window usage
- Faster resolution

#### Consistent Naming
Use the same naming pattern everywhere. For example, use `user_id` consistently across all endpoints.
Benefits:
- Predictable patterns
- LLMs like consistency
- Easier to understand and use

#### Documentation
- Fix examples and remove outdated content
- Fewer problems and hallucinations
- Consider using `llms.txt` files - documentation specifically formatted for LLMs in Markdown

#### Performance Considerations
AI agents are slow, so reducing the number of requests provides a significant performance boost.

#### Intent-First API Design
Design your APIs to capture and preserve user intent rather than just exposing CRUD operations.

### Testing Challenges

Testing AI agents is super difficult because:
- LLMs are not deterministic
- You need to set temperature to 0 for more consistent results
- Use concise prompts
- Ultimately, you need a human to judge the quality of actions performed by the LLM, making automated testing complex

### Technical Considerations

#### Tokens vs. Text

Understanding tokenization is crucial. Tools like [tiktokenizer.vercel.app](https://tiktokenizer.vercel.app) help visualize how text is tokenized:

- **Language matters:** English costs less in tokens than French or Japanese for example
- **Unique IDs are problematic:** UUIDs are bad for tokenizers, ULIDs are better
- **Shorter is not always better** in terms of token efficiency
- **Date formats matter** for token consumption
- **JSON is not the best format** for LLMs - Markdown is better and uses fewer tokens

More tokens require more money and create larger context windows, which negatively impact AI agent response times and relevance.

#### Security and Credentials

AI agents are bad at dealing with credentials. The solution is to use MCP (Model Context Protocol) servers that:
- Handle credentials securely
- Provide tools to AI agents
- Give limited scope permissions to MCP actions
- Act as a secure intermediary between the LLM and your APIs

### Log Everything

Given the complexity and unpredictability of AI agent interactions, comprehensive logging becomes essential for debugging and improving the system.

### The New Experience: AX (AI Experience)

Fabien introduced the concept of AX (AI Experience) alongside the familiar UX (User Experience) and DX (Developer Experience). This represents a new dimension of API design focused on how well your API works with AI agents.

Key aspects of good AX include:
- Up-to-date documentation and examples (avoiding outdated examples that could mislead the LLM)
- Using `llms.txt` files with all useful documentation for the LLM in Markdown format
- Clear, consistent error messages
- Intent-preserving API design
- Efficient token usage

The fascinating aspect is that many improvements for AX also benefit traditional DX, making APIs better for both human developers and AI agents.

---

## Build a decoupled application with API Platform and Vue.js (Nathan de Pachtere)

Nathan de Pachtere shared his experience building decoupled applications using API Platform for the backend and Vue.js for the frontend. His insights covered the differences between headless and decoupled approaches, practical implementation strategies, and the benefits of monorepo architecture.

### Headless

Headless architecture involves creating a business-focused API that anyone can use independently. Think of the GitHub API - it's designed as a standalone service that provides all the functionality needed to interact with GitHub's features, completely independent of any specific frontend implementation.

The goal is to create business logic and provide an API that everyone can utilize for their own purposes.

### Decoupled

Decoupled architecture is similar but more focused. You provide a frontend that relies specifically on your API, creating what's essentially a backend-for-frontend pattern. The API doesn't seem to be made for independent use outside of the specific application - it's tailored to serve the frontend's exact needs.

### Why Choose This Approach?

#### Advantages

- **Separation of responsibilities** - Clear boundaries between frontend and backend concerns
- **Team management** - Enables specialist teams to work independently on their expertise areas
- **Capitalization** - Reusable components and logic across different projects
- **Future-proofing** - AI might be the interface used in the future, making an API-first approach valuable

#### Disadvantages

- **Complexity** - More complex setup for existing projects that need to be refactored

### Headless Implementation

#### using API Platform

The process follows a business-driven approach:

1. **Represent the API based on business needs** - Focus on what the business actually does
2. **Translate into entities and workflows** - Convert business processes into technical implementations
3. **Write only the necessary code** - Keep it simple initially
4. **Then optimize and refactor** - Improve performance and code quality
5. **Iterate** - Continuously improve based on feedback
6. **Go beyond CRUD** - Implement meaningful business operations, not just basic data manipulation

#### Providing API Keys

For machine-to-machine authentication:

- **Create a simple interface** for creating/deleting configurable keys with specific permissions
- **Consider external identity providers** like Keycloak or Zitadel for more advanced use cases
- **Important principle:** Don't mix human users with machine users - they have different needs and security requirements

Nathan emphasized making tests simple and easy to implement, integrating them naturally into the development workflow rather than treating them as an afterthought.

#### Deprecation Strategy

When evolving your API:

- **Deprecate endpoints, resources, and properties** gradually
- **Give consumers time to adapt** to changes
- **Communicate changes clearly** before removing functionality

This approach maintains backward compatibility while allowing the API to evolve.

### Decoupled Implementation

#### using Vue.js

Nathan chose Vue.js for several reasons:

- **Independent and community-driven** - Not controlled by a single corporation
- **Composition API (Vue 3)** - Promotes code reusability and better organization
- **Excellent Developer Experience** - Great tooling and development workflow
- **Top performance** - Fast and efficient (until the next framework comes along, as he joked)

#### API Connection

For connecting the Vue.js frontend to the API Platform backend:

##### Code Generation

Use **openapi-ts.dev** to generate TypeScript types and composables from your OpenAPI specification. This ensures type safety and reduces manual work.

**Important principle:** Don't use the generated types directly as base objects in your frontend. Create your own models to maintain proper decoupling between frontend and backend representations.

##### HTTP Client and State Management

- **Tanstack Query** - For efficient data fetching and caching
- **TypeScript throughout** - Ensures type safety across the application
- **VS Code for Vue.js development** - Better integration compared to JetBrains IDEs for Vue.js work

##### High-Level SDKs

Provide high-level SDKs to facilitate API integration, making it easier for developers to work with your API.

### Version Management

#### Polyrepo vs Monorepo

**Monorepo doesn't mean monolith** - this is a crucial distinction:

- **Monorepo** = Multiple separate projects in a single repository
- **Monolith** = Single application handling everything

#### Monorepo Benefits

The goal is to simplify the workflow:

- **Unified way of thinking about code** - Consistent patterns across projects
- **Consistency** - Shared tooling and configurations
- **Facilitates sharing** - Easy code and component reuse
- **More efficient teamwork** - Simplified collaboration and dependency management

#### Tooling

Nathan recommended **moonrepo.dev** as an open-source tool for managing monorepos. You can find more information at **monorepo.tools**.

#### Real-World Example

Nathan shared their experience with enormous benefits:

- **Code generalization** - Reusable patterns and components
- **Functionality sharing** - Common libraries across projects
- **Technology-based organization** - Projects use shared libraries organized by technology stack

You can see a practical example of this approach in the [Lychen project](https://github.com/alpsify/lychen) ([lychen.fr](https://lychen.fr/)), which demonstrates a well-structured monorepo with clear separation between backend, frontend, and shared tools.

The Lychen project shows how to organize a monorepo with:

- **Backend** (API Platform/PHP)
- **Frontend** (Vue.js/TypeScript)
- **Shared tooling** (Moonrepo, Docker, testing tools)
- **Clear technology boundaries** while maintaining efficient code sharing

---

## Jean-Beru presents: Fun with flags (Hubert Lenoir)

**Slides of this talk are available : [https://jean-beru.github.io/2025_09_apiplatformcon_fun_with_flags](https://jean-beru.github.io/2025_09_apiplatformcon_fun_with_flags)**

Jean-Beru (Hubert Lenoir) presented the fascinating world of feature flags and their practical implementation. As Uncle Ben said in Spider-Man: "With great power comes great responsibility" - and feature flags are indeed a powerful tool that requires careful consideration.

### What are Feature Flags?

Feature flags (also known as feature flipping or feature toggles) are a software development technique that allows you to turn features on or off without deploying new code. They act as conditional statements in your code that determine whether a particular feature should be enabled or disabled for specific users, environments, or conditions.

### Types of Feature Flags

#### Release Flags

Mainly used to test new features in production environments safely.

- **Continuous development** - Even if a feature is not ready, you can continue developing and deploying (not ready = disabled)
- **Safe deployment** - Deploy code with features turned off, then enable them when ready
- **Gradual rollout** - Enable features for small groups before full release

#### Experiment Flags

Used to compare different versions of your application.

- **A/B testing** - Compare different implementations or user experiences
- **Must be followed by metrics** - Track performance and user behavior
- **Partial enablement** - Enable for specific percentages (e.g., 20% of users)

This approach allows data-driven decisions about which features or implementations work best for your users.

#### Permission Flags

Control access to features based on user permissions or subscription levels.

- **Blocking access based on permissions** - For example, paid features only available to premium subscribers
- **Role-based feature access** - Different features for different user types
- **Subscription tiers** - Enable advanced features for higher-tier customers

#### Operational Flags

Security belt and kill switch functionality.

- **Allow disabling cumbersome features** - Quickly turn off resource-intensive features during high load
- **Emergency response** - Disable problematic features without deployment
- **Performance management** - Control system load by toggling expensive operations

For more detailed information about feature flag patterns, Martin Fowler has an excellent article at [https://martinfowler.com/articles/feature-toggles.html](https://martinfowler.com/articles/feature-toggles.html).

### Implementation

There are many feature flag providers available in the market, but the implementation doesn't necessarily need to use Symfony's Security component.

#### Why Not Security Component?

- **Restricted to current user context** - Limitations when flags need to work across different user contexts
- **Authentication timing issues** - Authentication happens after routing, which can lead to unwanted forbidden error codes
- **Flexibility needs** - Custom implementations can better integrate with existing providers like Unleash

#### Requirements for a Good Implementation

A solid feature flag system should provide:

- **Simplicity** - Easy to implement and use
- **Integrated debugging** - Clear visibility into which flags are active
- **Multiple sources** - Ability to switch between different flag providers
- **Various provider support** - Work with different feature flag services
- **Cacheable** - Performance optimization through caching mechanisms

#### Symfony Integration

There's a work-in-progress FeatureFlag component for Symfony (PR #53213). This component aims to provide native support for feature flags within the Symfony ecosystem.

### With API Platform

Feature flags can be easily tested via a separated bundle: [ajgarlag/feature-flag-bundle](https://github.com/ajgarlag/feature-flag-bundle).

#### Implementation Steps

1. **Decoration of API Platform provider** - Use the decorator pattern to wrap existing providers with feature flag logic
2. **Use FeatureFlag WIP component interface** - Integrate with the upcoming Symfony FeatureFlag component

#### Example with GitLab Provider

GitLab provides a feature flag service that uses Unleash in the background. This integration allows you to:

- **Manage flags through GitLab UI** - Familiar interface for teams already using GitLab
- **Leverage Unleash capabilities** - Powerful feature flag engine under the hood
- **Integrate with CI/CD pipelines** - Automatic flag management as part of deployment process

#### Profiler Integration

The implementation includes Symfony Profiler integration, providing:

- **Debug information** - See which flags are active during development
- **Performance insights** - Monitor the impact of feature flag checks
- **Development workflow** - Easy testing and debugging of flag behavior

### Advantages

Implementing feature flags brings several significant benefits:

#### Deploy Continuously
- **Decouple deployment from release** - Deploy code safely with features disabled
- **Reduce deployment risk** - Lower chance of breaking production
- **Faster iteration cycles** - More frequent, smaller deployments

#### Progressive Testing
- **A/B testing capabilities** - Compare different approaches with real users
- **Gradual rollouts** - Start with small user groups and expand
- **Data-driven decisions** - Make choices based on actual usage metrics

#### Quick Turn Off
- **No redeployment needed** - Instantly disable problematic features
- **Emergency response** - Rapid reaction to production issues
- **Business continuity** - Keep core functionality working while fixing problems

#### Separate Code from Feature Release
- **Independent timelines** - Development and business release schedules can differ
- **Marketing coordination** - Align feature releases with marketing campaigns
- **Stakeholder management** - Give business teams control over when features go live

Feature flags represent a powerful paradigm shift in how we think about software deployment and release management, enabling more flexible, safer, and data-driven development practices.

---

## PIE : The next Big Thing (Alexandre Daubois)

### Extensions ?

Extensions are like composer packages, but written in C, C++, Rust, and now Go.  
They live at a lower level, which makes them much faster than pure PHP code.

Frameworks like **Phalcon** are themselves shipped as extensions.

### Installing a third-party lib

Traditionally, installing an extension is much more painful than a `composer install`.  
It usually involves:

1. Downloading the source code.
2. Compiling it with `phpize` and `make`.
3. Adding a line to `php.ini` to enable it.
4. Restarting PHP-FPM or Apache to load it.

This workflow makes extensions harder to distribute and standardize compared to Composer packages.

### PECL

- Clunky and outdated.
- Slow to install.
- Lacks proper security (no package signing).
- Not officially backed by PHP, and some in the community want to phase it out.

### docker-php-extension-installer

A widely used community project that simplifies extension installation inside Docker images.  
Instead of writing complex `apt-get` + `phpize` + `make` commands, you just add:

```dockerfile
COPY --from=ghcr.io/mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions xdebug redis
```

This is great, but still not perfect—it remains Docker-specific and doesn’t integrate with Composer or Packagist.

### Project to replace PECL

The **pie-design** repository defines the foundations of **PIE**, a new way to install extensions as easily as PHP packages.

- Started in March 2024.
- Version 1 released in June 2025.
- PIE is distributed as a single `phar` file: just download it and use it.
- All extension metadata is stored in Packagist.

#### Command options

- `pie install ext-xdebug` → installs an extension and updates `php.ini`.
- `pie uninstall ext-redis` → removes an extension.
- `pie update` → upgrades to the latest available version.
- `pie search redis` → searches for extensions in Packagist.
- Running `pie` without arguments reads extensions from `composer.json` and installs them.

Other features:

- Add repositories via Composer, VCS, or local paths.
- Automatic `php.ini` update.
- Support for `GH_TOKEN` to install from private repositories.
- OS compatibility restrictions.
- Symfony CLI integration: `symfony pie install`.

### The future of extensions

PIE is the theoretical replacement for PECL.  
An RFC vote was held, closing on **September 20, 2025**.  
Almost everyone voted *yes*, which means PIE is now the official successor to PECL.

---

## Make your devs happy by normalizing your API errors (Clément Herreman)

Errors are not just bugs. They’re an opportunity to give users autonomy through clear feedback.

### What is an error?

An error is any behavior—intentional or not—that prevents the user from completing their task.

### Why normalize errors?

1. To react properly to a precise issue:
    - Retrying a token.
    - Handling distributed system failures.
    - Fixing configuration issues.

2. To present errors consistently:
    - Clear and understandable messages for end-users.
    - Precise identification to ease support.
    - Keeping some details vague for security reasons.

### How?

Errors can be classified into three categories:

1. Errors that belong to your domain: you own them, so enrich them with context.
2. Errors that don’t belong to your domain but still happen: wrap them with a code and enrich them.
3. Rare/unexpected errors: keep the default JSON output.

#### RFC 7807: Problem Details for HTTP APIs

This RFC defines a standard JSON structure for errors:

- `type`: unique machine-readable code.
- `title`: short, human-readable summary.
- `detail`: contextual explanation of this particular error.
- `instance`: URL to the error catalog.
- `...`: any custom fields you want.

##### Example HTTP response

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

API Platform provides a ready-to-use `ApiPlatform\Problem\Error` class to implement RFC 7807.

#### Organizing errors

- Keep only business exceptions in the domain layer.
- Wrap infrastructure errors before sending them to the client.

#### Documenting errors

Errors can be declared as attributes on operations, making them explicit in the API docs.

#### Improvements: RFC 9457

RFC 9457 is essentially the same as RFC 7807, with some additions:

- A registry of errors via `schema.org`.
- A mechanism for returning multiple errors at once (though strongly discouraged).

As Clément highlighted: RFC 9457 doesn’t bring much practical value, and some of its suggestions are even discouraged in the spec.

---

## Symfony and Dependency Injection: From past to future (Imen Ezzine)

Dependency Injection (DI) is the “D” in SOLID, and it has been a cornerstone of Symfony’s design for nearly two decades.  
This talk explored its history, evolution, and what’s next.

### The early days

**2007 – Symfony 1**
- Services instantiated directly, often via `sfContext()` (a singleton).
- Hard to test, rigid, tightly coupled.
- No real container.

### Symfony 2 and the paradigm shift

**2011 – Symfony 2**
- Introduction of a central container.
- Services configured via YAML and parameters.
- Dependencies injected as constructor arguments.
- Autowiring introduced in **Symfony 2.8**.

**2015 – API Platform v1**
- Heavy reliance on autowiring (then experimental).

**2016 – API Platform v2**
- `@ApiResource` annotation magic powered by the DI component.
- Data persisters and providers had to be tagged manually.

**2017 – Symfony 3.3 / API Platform 2.2**
- Autowiring + autoconfigure.
- Manual tagging mostly eliminated (providers/persisters automatically wired).
- Symfony 3.4: services private by default.

### Symfony 5 to Symfony 7

**2021 – Symfony 5.3**
- DI powered by attributes → much less YAML.
- `#[When]` attribute for conditional services.

**Symfony 6.0 – 6.3**
- New attributes for corner cases.
- `#[Autowire]` attribute for precise service injection.
- Support for env vars and parameters via attributes.
- `#[AsAlias]` to alias services.

**2022 – API Platform 3.0**
- New state processors and providers replace older persister/provider pattern.

**2023 – Symfony 7**
- `#[AutoconfigureTag]` → automatic tagging (used in API Platform filters).
- `TaggedIterator` → inject multiple tagged services.
- `AutowireIterator` → autowire all classes implementing an interface.

**Symfony 7.1 – 7.3**
- `#[AutowireMethodOf]` to autowire a single method.
- `#[WhenNot]` for conditional services.
- `when` parameter in `#[AsAlias]`.

### Takeaways

Over 20 years, DI in Symfony evolved from:

- Manual instantiation →
- Manual configuration →
- Automatic configuration through **attributes**.

This journey has made Symfony projects **more testable, maintainable, and developer-friendly** while reducing boilerplate.
