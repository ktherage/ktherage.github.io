Feature: Theme toggle
  As a visitor
  I want to switch between dark and light themes
  So that I can read comfortably

  Background:
    Given I am on the homepage
    And the theme toggle button is visible

  Scenario: Click toggles data-bs-theme between dark and light
    Given I note the current theme
    When I click the theme toggle
    Then the theme should change to the opposite
    When I click the theme toggle
    Then the theme should be restored to the original

  Scenario: Icon changes between fa-moon and fa-sun
    Given I note the current theme
    Then the toggle icon should match the current theme
    When I click the theme toggle
    Then the toggle icon should match the new theme

  Scenario: Persists theme in localStorage
    When I click the theme toggle
    Then the theme should be stored in localStorage

  Scenario: Theme is restored after reload
    When I click the theme toggle
    And I reload the page
    Then the theme should match the stored preference
