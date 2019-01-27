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

function addCard() {
  let deckName;
  let speech;
  let phrase;
  let deck;

  if (this.$session.$data.deckName) {
    deckName = this.$session.$data.deckName;
  } else {
    deckName = this.$inputs.deckName.value;
  }

  if (!deckName) {
    speech = `What is the name of the deck to which you want to add the card?`;
    this.ask(speech, speech);
  }

  if (this.$inputs.phrase.value) {
    phrase = this.$inputs.phrase.value;
  }

  if (!phrase) {
    speech = `What phrase in English should we write on the card?`;
    this.ask(speech, speech);
  }

  deck = this.$user.$data.decks[deckName];

  // Get the locale of the request
  const locale = this.$user.getLocale();
  const languageCode = locale.substr(0, 1);

  const newCard = {};
  newCard[languageCode] = phrase;

  deck.cards.push(newCard);

  let confirmation = `OK, I added a card with the phrase ${phrase} to the deck ${deckName}.`;
  speech = `Add another card or return to the main menu?`;

  this.ask(`${confirmation} ${speech}`, speech);
}

function addDeckToDatabase(deckName) {
  if (!this.$user.$data.decks) {
    this.$user.$data.decks = {};
  }

  let newDeck = {
    cards: [],
  };

  this.$user.$data.decks[deckName] = newDeck;
}

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
    let deckName;
    let confirmation;
    let question;

    // Ask for deckName if not provided
    if(this.$inputs.deckName.value === '') {
      confirmation = `OK, creating a deck.`;
      question = `What would you like to call the deck?`;
      this.followUpState('CreatingDeckState')
        .ask(confirmation + ' ' + question, question);
    }

    // Create a new deck if deckName is provided
    deckName = this.$inputs.deckName.value;

    addDeckToDatabase.call(this, deckName);

    // Add deckName to session data
    this.$session.$data.deckName = deckName;

    confirmation = `OK, I have created a new deck called ${deckName}.`;
    question =`Would you like to add a new card to this deck?`;

    this.followUpState('AddingCardState')
      .ask(confirmation + ' ' + question, question);
  },
  AddCardIntent() {
    addCard.bind(this);
  },
  END() {

  },
  CreatingDeckState: {
    Unhandled() {
      // Getting deck name
      let deckName = this.$request.conversation;
    }
  },
  // AddingCardDeckNameState: {
  //   DeckNameIntent() {
  //     return this.toIntent('AddCardIntent');
  //   }
  // },
  // AddingCardPhraseState: {
  //   PhraseIntent() {
  //     return this.toIntent('AddCardIntent');
  //   }
  // }

});

module.exports.app = app;
