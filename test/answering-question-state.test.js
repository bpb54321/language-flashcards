'use strict';
const { App, Util } = require(`jovo-framework`);
const { Alexa } = require(`jovo-platform-alexa`);

const alexa = new Alexa();
const testSuite = alexa.makeTestSuite();

describe(`AnsweringQuestionState` , () => {
  test(`the skill should remind you to preface your response when you accidentally send an intent other than AnswerQuestionIntent while in AnsweringQuestionState`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`UnhandledIntent`);
    request.setState(`AnsweringQuestionState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`reminder-to-preface-answer`);
    expect(response.hasState(`AnsweringQuestionState`)).toBe(true);
  });
});

