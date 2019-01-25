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
  // DeckNameIntent() {
  //     this.$session.$data.deckName = this.$inputs.deckName.value;
  //     const speech = `Just to confirm, you want to create a deck named
  //         ${this.$session.$data.deckName} is that correct?`;
  //     this.ask(speech, speech);
  // },
  // DeckNameConfirmIntent() {
  //     if (!this.$user.$data.decks) {
  //         this.$user.$data.decks = {};
  //     }
  //
  //     // Create a deck whose key is the deck name, and populate with an empty array of cards
  //     this.$user.$data.decks[this.$session.$data.deckName] = [];
  //
  //     const speech = `OK, I have created a new deck called ${this.$session.$data.deckName}.
  //         Would you like to now add a card to this deck?`;
  // },
  CreateCardIntent() {

  },
});

module.exports.app = app;
