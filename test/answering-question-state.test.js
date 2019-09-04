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
    request.addSessionData(`cards`, [
        {
          "en-US": `Card 1 phrase`,
          "fr-FR": `phrase pour carte 1`,
        },
        {
          "en-US": `Card 2 phrase`,
          "fr-FR": `phrase pour carte 2`,
        },
      ]
    );
    request.addSessionData(`cardIndex`, 2);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`reminder-to-preface-answer question_introduction answer_preface_reminder`);
    expect(response.hasState(`AnsweringQuestionState`)).toBe(true);
  });

  test(`the skill should route you to the global HelpIntent if you ask for help while in AnsweringQuestionState`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`HelpIntent`);
    request.setState(`AnsweringQuestionState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`help`);
    expect(response.hasState(`DecideWhetherToStudyState`)).toBe(true);
  });

  test(`the skill should route you to the global END if you trigger it while in AnsweringQuestionState`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`END`);
    request.setState(`AnsweringQuestionState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`goodbye`);
    expect(response.hasSessionEnded()).toBe(true);
  });

  test(`the skill should route you to the global CancelIntent if you trigger it while in AnsweringQuestionState`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`CancelIntent`);
    request.setState(`AnsweringQuestionState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`goodbye`);
    expect(response.hasSessionEnded()).toBe(true);
  });

  test(`the skill should route you to the global NavigateHomeIntent if you trigger it while in AnsweringQuestionState`, async () => {
    const conversation = testSuite.conversation({ locale: `keys-only` });
    const request = await testSuite.requestBuilder.intent(`NavigateHomeIntent`);
    request.setState(`AnsweringQuestionState`);

    const response = await conversation.send(request);

    expect(response.getSpeech()).toBe(`StudyIntent`);
    expect(response.hasState(`ChoosingSetState`)).toBe(true);
  });
});

