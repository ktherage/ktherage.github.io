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
