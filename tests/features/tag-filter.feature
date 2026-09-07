Feature: Tag filter
  As a visitor
  I want to filter blog posts by tag
  So that I can find articles on specific topics

  Background:
    Given I am on the "/blog/" page
    And filter badges are visible
    And blog post items are displayed

  Scenario: Filter badges are visible on the blog page
    Then all filter badges should be visible

  Scenario: "All" badge is active by default
    Then the "All" badge should have aria-pressed "true"
    And the "All" badge should have class "bg-primary"
    And the "All" badge should have class "active"

  Scenario: Clicking "All" shows all blog post items
    When I click the "All" badge
    Then all blog post items should be visible

  Scenario: Clicking a specific tag shows only posts with that tag
    When I click each non-"All" badge
    Then only posts matching that tag should be visible

  Scenario: aria-pressed toggles correctly between badges
    Then the "All" badge should have aria-pressed "true"
    And the first specific badge should have aria-pressed "false"
    When I click the first specific badge
    Then the first specific badge should have aria-pressed "true"
    And the "All" badge should have aria-pressed "false"
    When I click the "All" badge
    Then the "All" badge should have aria-pressed "true"
    And the first specific badge should have aria-pressed "false"

  Scenario: Active badge has bg-primary and inactive badges have bg-secondary
    Then the "All" badge should have class "bg-primary"
    And the first specific badge should have class "bg-secondary"
    When I click the first specific badge
    Then the first specific badge should have class "bg-primary"
    And the "All" badge should have class "bg-secondary"

  Scenario: Clicking a tag then "All" restores all posts
    When I click the first specific badge
    Then some posts should be hidden
    When I click the "All" badge
    Then all blog post items should be visible
