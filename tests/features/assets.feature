Feature: Front-end assets
  As a reader
  I want every page to load its stylesheets and scripts
  So that the site looks and behaves the same in both languages

  Scenario: A French post resolves its vendor assets
    When I visit the blog post "/fr/blog/2026/the-cache-that-silently-wasnt/"
    Then every vendor asset of the page should resolve in the build

  Scenario: An English post resolves its vendor assets
    When I visit the blog post "/blog/2026/the-cache-that-silently-wasnt/"
    Then every vendor asset of the page should resolve in the build

  Scenario: The French home page resolves its vendor assets
    When I visit the "/fr/" page
    Then every vendor asset of the page should resolve in the build
