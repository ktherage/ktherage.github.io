Feature: Accessibility
  As a responsible developer
  I want the site to meet accessibility standards
  So that all users can access the content

  Scenario Outline: No critical/serious axe violations on <path>
    When I visit the "<path>" page
    Then axe should report no critical or serious violations

    Examples:
      | path                                                 |
      | /                                                    |
      | /blog/                                               |
      | /about-me/                                           |
      | /legal/                                              |
      | /tags/                                               |
      | /blog/2026/the-cache-that-silently-wasnt/            |
      | /fr/blog/2026/the-cache-that-silently-wasnt/         |

  Scenario Outline: Single main landmark on <path>
    When I visit the "<path>" page
    Then exactly 1 "main" element should exist

    Examples:
      | path                                                 |
      | /                                                    |
      | /blog/                                               |
      | /about-me/                                           |
      | /legal/                                              |
      | /tags/                                               |
      | /blog/2026/the-cache-that-silently-wasnt/            |
      | /fr/blog/2026/the-cache-that-silently-wasnt/         |

  Scenario Outline: Landmarks present on <path>
    When I visit the "<path>" page
    Then exactly 1 "main" element should exist
    And at least 1 "nav" element should exist

    Examples:
      | path                                                 |
      | /                                                    |
      | /blog/                                               |
      | /about-me/                                           |
      | /legal/                                              |
      | /tags/                                               |
      | /blog/2026/the-cache-that-silently-wasnt/            |
      | /fr/blog/2026/the-cache-that-silently-wasnt/         |

  Scenario Outline: Headings do not skip levels on <path>
    When I visit the "<path>" page
    Then the main content headings should not skip levels

    Examples:
      | path                                                 |
      | /                                                    |
      | /blog/                                               |
      | /about-me/                                           |
      | /legal/                                              |
      | /tags/                                               |
      | /blog/2026/the-cache-that-silently-wasnt/            |
      | /fr/blog/2026/the-cache-that-silently-wasnt/         |

  Scenario Outline: Every image has an alt attribute on <path>
    When I visit the "<path>" page
    Then every image should have an alt attribute

    Examples:
      | path                                                 |
      | /                                                    |
      | /blog/                                               |
      | /about-me/                                           |
      | /legal/                                              |
      | /tags/                                               |
      | /blog/2026/the-cache-that-silently-wasnt/            |
      | /fr/blog/2026/the-cache-that-silently-wasnt/         |

  Scenario: The skip link bypasses the navigation
    When I visit the "/" page
    And I press the "Tab" key
    Then the focused element should be the skip link
    When I press the "Enter" key
    Then the main landmark should be focused and targeted by the URL

  Scenario: Long code blocks are reachable with the keyboard
    Given the viewport is 1024 by 800
    When I visit the blog post "/blog/2026/building-a-rag-powered-code-review-assistant/"
    Then overflowing code blocks should be keyboard focusable and named

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
