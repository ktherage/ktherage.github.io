Feature: Mermaid diagrams
  As a reader
  I want the diagrams embedded in an article to be rendered as charts

  Scenario: A post with a diagram renders it as a chart
    When I visit the blog post "/blog/2026/the-cache-that-silently-wasnt/"
    Then the article should show 2 rendered diagrams

  Scenario: The translated post renders its diagram too
    When I visit the blog post "/fr/blog/2026/the-cache-that-silently-wasnt/"
    Then the article should show 2 rendered diagrams

  Scenario: A post with several diagrams renders them all
    When I visit the blog post "/blog/2026/building-a-rag-powered-code-review-assistant/"
    Then the article should show 5 rendered diagrams

  Scenario: A post without a diagram does not load the mermaid bundle
    When I visit the blog post "/blog/2026/symfony-session-vs-http-cache/"
    Then no mermaid bundle should have been requested
