'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`ProceedingToNextCardState` , () => {
  test(`the skill should route you to the global NavigateHomeIntent if you say you do not want to proceed to the next question`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`NoIntent`);
    request.setState(`ProceedingToNextCardState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`choose-a-set-by-saying-its-number`);
    expect(response.hasState(`ChoosingSetState`)).toBe(true);
  });
});
