Feature: Language switch
  As a bilingual visitor
  I want to switch between English and French
  So that I can read content in my preferred language

  Scenario: English homepage displays link to French version
    When I visit the homepage
    Then a "Passer en français" link should be visible
    And the link href should match "/fr/$"

  Scenario: English about-me page links to FR about-me
    When I visit the "/about-me/" page
    Then a "Passer en français" link should be visible
    And the link href should match "/fr/about-me/$"

  Scenario: French homepage displays link to English version
    When I visit the "/fr/" page
    Then a "Passer en anglais" link should be visible
    And the link href should match the English homepage

  Scenario: French about-me page links to EN about-me
    When I visit the "/fr/about-me/" page
    Then a "Passer en anglais" link should be visible
    And the link href should match the English about-me page

  Scenario: Switching languages updates html lang attribute
    Given I am on the homepage
    Then the html lang attribute should be "en"
    When I click the "Passer en français" link
    Then the html lang attribute should be "fr"
    When I click the "Passer en anglais" link
    Then the html lang attribute should be "en"

  Scenario: Switching languages preserves page slug
    Given I am on the "/about-me/" page
    When I click the "Passer en français" link
    Then the URL should contain "/fr/about-me/"
    When I click the "Passer en anglais" link
    Then the URL should be the English about-me page
