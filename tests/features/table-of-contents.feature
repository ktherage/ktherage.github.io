Feature: Table of contents
  As a reader
  I want a table of contents on blog posts
  So that I can jump straight to any section

  Scenario: The panel lists every section of the article
    When I visit the blog post "/blog/2026/the-cache-that-silently-wasnt/"
    Then the table of contents should be visible
    And it should link every heading of the article

  Scenario: A section entry scrolls to its heading
    When I visit the blog post "/blog/2026/the-cache-that-silently-wasnt/"
    And I click the first entry of the table of contents
    Then the first heading of the article should be in the viewport

  Scenario: On a narrow screen the panel collapses behind a button
    Given the viewport is 1024 by 800
    When I visit the blog post "/blog/2026/the-cache-that-silently-wasnt/"
    Then the table of contents panel should be hidden
    And the table of contents button should be visible
    When I click the table of contents button
    Then the table of contents should be visible

  Scenario: The table of contents does not wait for the mermaid bundle
    Given the mermaid bundle is delayed by 3000 milliseconds
    When I start loading the blog post "/blog/2026/the-cache-that-silently-wasnt/" without waiting for its assets
    Then the table of contents should be filled within 2000 milliseconds
    And no diagram should be rendered yet
