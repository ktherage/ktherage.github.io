Feature: Open Source contributions
  As a visitor
  I want to see merged pull requests on public open-source projects
  So that I can evaluate the author's community involvement

  Scenario: Open Source page loads with contribution cards
    When I visit the "/open-source/" page
    Then a visible "main" element should exist
    And contribution cards should be displayed

  Scenario: French Open Source page loads
    When I visit the "/fr/open-source/" page
    Then a visible "main" element should exist
    And contribution cards should be displayed

  Scenario: Contribution cards link to GitHub pull requests
    When I visit the "/open-source/" page
    Then contribution cards should link to pull requests

  Scenario: Homepage shows call-to-action linking to Open Source page
    When I visit the homepage
    Then a "View my contributions" link should be visible

  Scenario: French homepage shows call-to-action
    When I visit the "/fr/" page
    Then a "Voir mes contributions" link should be visible
