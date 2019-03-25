<?php

use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;
use Behat\MinkExtension\Context\RawMinkContext;
use \Behat\Behat\Tester\Exception\PendingException;
use \PHPUnit\Framework\Assert;

/**
 * Defines application features from the specific context.
 */
class FeatureContext extends RawMinkContext
{
    // Used to store data between steps
    private $user_data = [];

    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
    }

    /**
     * Visits the given url in the browser.
     * Example: I visit "https://google.com"
     *
     * @Given I visit :url
     *
     * @param string $url The url to visit.
     */
    public function iVisitUrl($url)
    {
        $session = $this->getSession();
        $session->visit($url);
    }

    /**
     * Pause for a certain amount of time.
     *
     * @Given /^I pause for (\d+) seconds$/
     *
     * @param $num_seconds
     */
    public function iPauseForSeconds($num_seconds)
    {
        sleep($num_seconds);
    }

    /**
     * Based on a method in MinkContext, but with modifications.
     *
     * We need the element to be present before it can be filled,
     * so we need to use waitFor().
     *
     * Fills in form field with specified id|name|label|value
     * Example: When I fill in "username" with "bwayne"
     * Example: And I fill in "bwayne" for "username"
     *
     * @When /^(?:|I )fill in "(?P<field_locator>(?:[^"]|\\")*)" with "(?P<value>(?:[^"]|\\")*)"$/
     * @When /^(?:|I )fill in "(?P<field_location>(?:[^"]|\\")*)" with:$/
     * @When /^(?:|I )fill in "(?P<value>(?:[^"]|\\")*)" for "(?P<field_locator>(?:[^"]|\\")*)"$/
     * @param $field_locator
     * @param $value
     */
    public function fillField($field_locator, $value)
    {
        // Store for use in the waitFor() callback
        $this->user_data['field_locator'] = $field_locator;

        $page = $this->getSession()->getPage();

        $field_element = $page->waitFor(120, function ($page) {
            return $page->find('named', array('field', $this->user_data['field_locator']));
        });

        $field_element->setValue($value);
    }

    /**
     * Presses button with specified id|name|title|alt|value
     * Example: When I press "Log In"
     * Example: And I press "Log In"
     *
     * @When /^(?:|I )press "(?P<button>(?:[^"]|\\")*)"$/
     * @param $button
     *
     * @throws \Behat\Mink\Exception\ElementNotFoundException
     */
    public function pressButton($button)
    {
        $this->getSession()->getPage()->pressButton($button);
    }

    /**
     * @Given /^I login to Google Action Console$/
     */
    public function iLoginToGoogleActionConsole()
    {
        $credentials = parse_ini_file(
            'credentials.ini',
            true
        );

        $google_credentials = $credentials['google_credentials'];

        $session = $this->getSession();
        $page = $session->getPage();

        $session->visit($this->getMinkParameter('base_url'));

        $this->fillField('identifierId', $google_credentials['username']);

        sleep(1);

        $this->pressButton('identifierNext');

        sleep(2);

        $this->fillField('password', $google_credentials['password']);

        $next_button = $page->find('css', '#passwordNext > content > span');

//        $this->pressButton('passwordNext');

        $next_button->click();

        $session->visit($this->getMinkParameter('base_url') . '/project/jovohelloworldagent-4ac73/simulator');
    }

    /**
     * @Given /^I say "([^"]*)"$/
     */
    public function iSay($arg1)
    {
        throw new PendingException();
    }

    /**
     * @Given /^the response is "([^"]*)"$/
     */
    public function theResponseIs($arg1)
    {
        throw new PendingException();
    }

}
