'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`DecideWhetherToStudyState` , () => {
  test(`should say sorry you don't want to play if the user says that they don't want to study flashcards`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });

    const request = await testSuite.requestBuilder.intent();
    request.addSessionData(`_JOVO_STATE_`, `DecideWhetherToStudyState`);
    request.setIntentName(`NoIntent`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`sorry-you-dont-want-to-play`);
  });
});

