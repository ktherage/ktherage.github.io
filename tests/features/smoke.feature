Feature: Smoke tests
  As a visitor
  I want to access the main pages of the site
  So that I can browse the content

  Scenario: Homepage loads with correct title and main element
    When I visit the homepage
    Then the page title should contain "Kévin THÉRAGE"
    And a visible "main" element should exist

  Scenario: Blog page loads with list of articles
    When I visit the "/blog/" page
    Then a visible "main" element should exist
    And blog post items should be displayed

  Scenario: Tags page loads
    When I visit the "/tags/" page
    Then a visible "main" element should exist

  Scenario: About page loads
    When I visit the "/about-me/" page
    Then a visible "main" element should exist

  Scenario: Legal page loads
    When I visit the "/legal/" page
    Then a visible "main" element should exist

  Scenario: Feed XML returns status 200 with XML content-type
    When I request the XML feeds
    Then each feed should return status 200
    And each XML feed should have content-type "xml"

  Scenario: Feed JSON returns status 200 with JSON content-type
    When I request the JSON feeds
    Then each feed should return status 200
    And each JSON feed should have content-type "json"

  Scenario: 404 page returns 404 status and shows main element
    When I visit a non-existent page
    Then the response status should be 404
    And a visible "main" element should exist
