// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: false,

  intentMap: {
    'AMAZON.StopIntent': 'END',
    'AMAZON.YesIntent': 'YesIntent',
    'AMAZON.NoIntent': 'NoIntent',
    'AMAZON.HelpIntent': 'HelpIntent',
    'AMAZON.CancelIntent': 'CancelIntent',
    'AMAZON.NavigateHomeIntent': 'NavigateHomeIntent',
  },

  db: {
    FileDb: {
      pathToFile: '../db/db.json',
    }
  },
  cms: {
    GoogleSheetsCMS: {
      spreadsheetId: '1MHErZu1Lby7d7lARWaauaibsdnnewozMo5VlGpOcNoc',
      access: 'public',
      sheets: [
        {
          name: 'responses',
          type: 'Responses',
          position: 1,
        },
        {
          name: '1',
          type: 'KeyValue',
          position: 2,
        },
        {
          name: '2',
          type: 'KeyValue',
          position: 3,
        },
        {
          name: '3',
          type: 'KeyValue',
          position: 4,
        },
      ],
    }
  },

};
