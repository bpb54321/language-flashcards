'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const {App} = require('jovo-framework');
const {Alexa} = require('jovo-platform-alexa');
const {GoogleAssistant} = require('jovo-platform-googleassistant');
const {JovoDebugger} = require('jovo-plugin-debugger');
const {FileDb} = require('jovo-db-filedb');

const app = new App();

app.use(
  new Alexa(),
  new GoogleAssistant(),
  new JovoDebugger(),
  new FileDb()
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
  LAUNCH() {
    return this.toIntent('MenuIntent');
  },
  MenuIntent() {
    const menu = 'What would you like to do? You can:\n' +
      'Create a new deck.\n' +
      'Add a card to a deck.\n' +
      'Study a deck.\n'
    this.ask(menu, menu);
  },
  CreateNewDeckIntent() {
    // const requiredParameters = {
    //   "deckName": "What's the name of the deck?",
    // };
    //
    // for (let parameter in requiredParameters) {
    //   if (!this.$inputs[parameter]) {
    //     switch (parameter) {
    //
    //     }
    //   }
    // }

    this.$session.$data.deckName = this.$inputs.deckName.value;

    if (!this.$user.$data.decks) {
      this.$user.$data.decks = [];
    }

    let newDeck = {
      name: this.$session.$data.deckName,
      cards: [],
    };

    this.$user.$data.decks.push(newDeck);

    const speech = `OK, I have created a new deck called ${this.$session.$data.deckName}.
            Would you like to add a new card to this deck?`;
    this.ask(speech, speech);
  },
  NewDeckCreatedState: {
    YesIntent() {
      return this.toIntent('CreateCardIntent');
    },
    NoIntent() {
      return this.toIntent('END');
    }
  },
  AddCardIntent() {
    console.log("Placeholder message");
    // this.$googleAction
  },
  END() {

  },
});

module.exports.app = app;
