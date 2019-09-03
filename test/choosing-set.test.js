'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`ChoosingSetState` , () => {
  test(`should start practicing when the user chooses a valid set`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });

    const setNames = [`set 1`, `set 2`, `set 3`];

    const request = await testSuite.requestBuilder.intent(`ChooseSetIntent`, {
      setNumber: `1`,
    });

    request.addSessionData(`setNames`, setNames);
    request.setState(`ChoosingSetState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`introduce-set`);
    expect(response.getSessionData()).toHaveProperty(`_JOVO_STATE_`, `AskingQuestionState`);

  });
});

