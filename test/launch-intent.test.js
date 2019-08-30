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

    test(`should say goodbye if the user says that they don't want to study flashcards`, async () => {
        const conversation = testSuite.conversation({ locale: `keys-only` });

        const request = await testSuite.requestBuilder.intent();
        request.addSessionData(`_JOVO_STATE_`, `StudyState`);
        request.setIntentName(`NoIntent`);

        const response = await conversation.send(request);

        console.log(response);
        expect(response.getSpeech()).toBe(`sorry_you_dont_want_to_play`);
    });
});

