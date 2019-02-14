// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: false,

  intentMap: {},

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
      ]
    }
  },

};
