'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`HelpIntent` , () => {
  test(`should return a helpful message and place the user in choosing set state`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent();
    request.setIntentName(`HelpIntent`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`help`);
    expect(response.getSessionData()).toHaveProperty(`_JOVO_STATE_`, `DecideWhetherToStudyState`);
  });
});

