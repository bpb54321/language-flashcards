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

  test(`should tell the user the set number is invalid and ask again for the set number when the user provides a set number that is greater than the number of sets`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });

    const setNames = [`set 1`, `set 2`, `set 3`];

    const request = await testSuite.requestBuilder.intent(`ChooseSetIntent`, {
      setNumber: `4`,
    });

    request.addSessionData(`setNames`, setNames);
    request.setState(`ChoosingSetState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`you-have-selected-an-invalid-set-number`);
    expect(response.getSessionData()).toHaveProperty(`_JOVO_STATE_`, `ChoosingSetState`);

  });

  test(`should tell the user the set number is invalid and ask again for the set number when the user provides a set number that is less than 1`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });

    const setNames = [`set 1`, `set 2`, `set 3`];

    const request = await testSuite.requestBuilder.intent(`ChooseSetIntent`, {
      setNumber: `0`,
    });

    request.addSessionData(`setNames`, setNames);
    request.setState(`ChoosingSetState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`you-have-selected-an-invalid-set-number`);
    expect(response.getSessionData()).toHaveProperty(`_JOVO_STATE_`, `ChoosingSetState`);

  });
});

