Feature: Start the app

  Scenario: I visit the Google Assistant Simulator

    Given I login to Google Action Console
    And I pause for 10 seconds
    And I say ""
    And the response is "blah"
