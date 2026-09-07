Feature: Accessibility
  As a responsible developer
  I want the site to meet accessibility standards
  So that all users can access the content

  Scenario Outline: No critical/serious axe violations on <path>
    When I visit the "<path>" page
    Then axe should report no critical or serious violations

    Examples:
      | path        |
      | /           |
      | /blog/      |
      | /about-me/  |
      | /legal/     |
      | /tags/      |

  Scenario Outline: Single main landmark on <path>
    When I visit the "<path>" page
    Then exactly 1 "main" element should exist

    Examples:
      | path        |
      | /           |
      | /blog/      |
      | /about-me/  |
      | /legal/     |
      | /tags/      |

  Scenario Outline: Landmarks present on <path>
    When I visit the "<path>" page
    Then exactly 1 "main" element should exist
    And at least 1 "nav" element should exist

    Examples:
      | path        |
      | /           |
      | /blog/      |
      | /about-me/  |
      | /legal/     |
      | /tags/      |

  Scenario: No empty href links on any page
    When I visit the "/" page
    Then no links with href="#" should exist
    When I visit the "/blog/" page
    Then no links with href="#" should exist
    When I visit the "/about-me/" page
    Then no links with href="#" should exist
    When I visit the "/legal/" page
    Then no links with href="#" should exist
    When I visit the "/tags/" page
    Then no links with href="#" should exist
