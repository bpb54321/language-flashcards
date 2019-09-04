'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`UnhandledIntent` , () => {
  test(`the skill should say that it didn't understand, and route the user back to the main menu`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`UnhandledIntent`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`unhandled`);
    expect(response.hasState(`DecideWhetherToStudyState`)).toBe(true);
  });
});

