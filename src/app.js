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
      'Add translations to cards with phrases in only one language in a deck\n' +
      'Study a deck.\n';
    this.ask(menu, menu);
  },
  CreateNewDeckIntent() {
    const deckName = this.$inputs.deckName.value;

    if (!this.$user.$data.decks) {
      this.$user.$data.decks = {};
    }

    let newDeck = {
      cards: [],
    };

    this.$user.$data.decks[deckName] = newDeck;

    const speech = `OK, I have created a new deck called ${deckName}.
            Would you like to add a new card to this deck?`;
    this.ask(speech, speech);
  },
  AddCardIntent() {
    const deckName = this.$inputs.deckName.value;
    const phrase = this.$inputs.phrase.value;

    const deck = this.$user.$data.decks[deckName];

    // Get the local of the request
    const locale = this.$user.getLocale();
    const languageCode = locale.substr(0, 1);

    const newCard = {};
    newCard[languageCode] = phrase;

    deck.cards.push(newCard);

    const confirmation = `OK, I added a card with the phrase ${phrase} to the deck ${deckName}.`;
    const speech = `Add another card or return to the main menu?`;

    this.ask(`${confirmation} ${speech}`, speech);
  },
  END() {

  },
});

module.exports.app = app;
