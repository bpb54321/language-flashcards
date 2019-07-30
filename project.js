// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    alexaSkill: {
       nlu: 'alexa',
    },
    googleAction: {
       nlu: 'dialogflow',
    },
    defaultStage: 'local',
    states: {
      local: {
        endpoint: '${JOVO_WEBHOOK_URL}',
      },
      dev: {
        endpoint: 'arn:aws:lambda:us-east-1:043616026455:function:jovoFlashcardApp',
      },
    }
};
 