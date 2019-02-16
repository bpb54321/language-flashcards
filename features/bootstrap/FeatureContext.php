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
}
