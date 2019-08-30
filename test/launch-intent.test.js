'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`Launch Intent` , () => {
    test(`should return a welcome message and ask for the name at "LAUNCH"`, async () => {
        const conversation = testSuite.conversation({ locale: `keys-only` });
        const launchRequest = await testSuite.requestBuilder.launch();
        const response = await conversation.send(launchRequest);
        expect(response.getSpeech()).toBe(`welcome`);
    });
});

