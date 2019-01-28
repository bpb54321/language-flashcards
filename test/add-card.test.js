'use strict';
const { App, Util } = require('jovo-framework');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
jest.setTimeout(500);

const googleAssistant = new GoogleAssistant();
const testSuite = googleAssistant.makeTestSuite();

describe(`The Add Card feature` , () => {
    test('should work when you include all necessary inputs', async () => {
        const conversation = testSuite.conversation();

        const launchRequest = await testSuite.requestBuilder.launch();
        const responseLaunchRequest = await conversation.send(launchRequest);
        expect(
            responseLaunchRequest.isAsk('Hello World! What\'s your name?', 'Please tell me your name.')
        ).toBe(true);

    });
});
