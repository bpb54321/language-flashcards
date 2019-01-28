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

function addCard(deckName, phrase) {
  let confirmation;
  let question;
  let deck;
  let locale;
  let languageCode;
  let newCard;

  console.log(`deckName: ${deckName}`);

  deck = this.$user.$data.decks[deckName];
  console.log(`deck: ${deck}`);

  // Get the locale of the request
  locale = this.getLocale();
  languageCode = locale.substr(0, 1);

  newCard = {};
  newCard[languageCode] = phrase;

  deck.cards.push(newCard);

  confirmation = `OK, I added a card with the phrase ${phrase} to the deck ${deckName}.`;
  question = `Add another card or return to the main menu?`;

  this.followUpState(null)
    .ask(`${confirmation} ${question}`, question);
}

function createNewDeck(deckName) {
  if (!this.$user.$data.decks) {
    this.$user.$data.decks = {};
  }

  let newDeck = {
    cards: [],
  };

  this.$user.$data.decks[deckName] = newDeck;

  // Add deckName to session data
  this.$session.$data.deckName = deckName;

  let confirmation = `OK, I have created a new deck called ${deckName}.`;
  let question =`Would you like to add a new card to this deck?`;

  this.followUpState('AddingCardState')
    .ask(confirmation + ' ' + question, question);
}

app.setHandler({
  LAUNCH() {
    return this.toIntent('MenuIntent');
  },
  MenuIntent() {
    let speech;

    const menu = 'This is the Main Menu.\n' +
      'What would you like to do? You can:\n' +
      'Create a new deck.\n' +
      'Add a card to a deck.\n' +
      'Add translations to cards.\n' +
      'Study a deck.\n';

    // Check to see if there's an intro before listing the menu
    if (this.$session.$data.introduction) {
      speech = this.$session.$data.introduction + '\n' + menu;
    } else {
      speech = menu;
    }

    this.ask(menu, menu);
  },
  CreateNewDeckIntent() {

    // Ask for deckName if not provided
    if (this.$inputs.deckName.value === '') {
      let confirmation = `OK, creating a deck.`;
      let question = `What would you like to call the deck?`;

      // Return stops the function and sends the response
      this.followUpState('CreatingDeckState')
        .ask(confirmation + ' ' + question, question);
      console.log('deckName parameter is empty');
    } else {
      // Create a new deck if deckName is provided
      let deckName = this.$inputs.deckName.value;

      console.log(`deckName parameter is ${deckName}`);

      createNewDeck.call(this, deckName);
    }
  },
  AddCardIntent() {

    // Ask for deckName if not provided in input or session
    if (this.$inputs.deckName.value === '' && !this.$session.deckName) {
      let confirmation = `OK, adding a card.`;
      let question = `What is the name of the deck would you like to add this card to?`;

      // Return stops the function and sends the response
      this.followUpState('CreatingDeckState')
        .ask(confirmation + ' ' + question, question);
      return;
    }
    addCard.call(this);
  },
  YesIntent() {
    this.tell(`This is the global Yes Intent`);
  },
  NoIntent() {
    this.tell(`This is the global No Intent`);
  },
  Unhandled() {
    let speech = `You have hit the global unhandled state`;
    this.tell(speech);
  },
  END() {

  },
  CreatingDeckState: {
    // Grab deckName and create a deck
    Unhandled() {
      console.log(`Getting deck name from the user's text`);
      let deckName = this.$request.queryResult.queryText;

      createNewDeck.call(this, deckName);
    }
  },
  AddingCardState: {
    // We confirm that we want to add a card to the current deck
    YesIntent() {
      console.log(`AddingCardState:YesIntent`);
      let confirm = `OK, let's add a card to the deck ${this.$session.$data.deckName}.`;
      let question = `What is the phrase in English that you would like to write on the card?`;
      this.followUpState('AddingCardState.GettingPhraseState')
        .ask(confirm + ' ' + question, question);
    },
    Unhandled() {
      let speech = `This is an unhandled intent in Adding Card State`;
      this.tell(speech);
    },
    GettingDeckNameState: {
      Unhandled() {
        let confirm;
        let question;

        let deckName = this.$request.queryResult.queryText;
        let deck = this.$user.$data.decks[deckName];

        if (!deck) {
          confirm = `I'm sorry, I can't find a deck named ${deckName}.`;
          question = `Would you like me to list all the decks, and you can select one from the list?`;
          this.followUpState('GettingDeckNameState.ListingDeckNamesState')
            .ask(confirm + ' ' + question, question);
          return;
        }

        this.$session.$data.deckName = deckName;

        confirm = `OK, I'll add a card to the deck ${this.$session.$data.deckName}.`;
        question = `What is the phrase in English that you would like to write on the card?`;
        this.followUpState('AddingCardState.GettingPhraseState')
          .ask(confirm + ' ' + question, question);
        return;
      },
      ListingDeckNamesState: {
        YesIntent() {
          let decks = this.$user.$data.decks;
          let deckNames = Object.keys(decks);

          let speech = `OK, listing the deck names. To select the deck you want to add a card to, ` +
            `say the number of the deck.\n`;
          for (let i = 0; i < deckNames.length; i++) {
            speech += `${i}. ${deckNames[i]}`;
          }

          this.followUpState('ListingDeckNamesState.SelectingDeckState')
            .ask(speech);
        },
        NoIntent() {
          // Add an introduction to session data which will be prepended to the
          // menu speech. Then, route to menu.
          this.$session.$data.introduction = `OK, returning to Main Menu.`;
          this.toStatelessIntent('MenuIntent');
        },
      }
    },
    GettingPhraseState: {
      // We get the phrase for the card
      Unhandled() {
        let phrase = this.$request.queryResult.queryText;

        addCard.call(this, this.$session.$data.deckName, phrase);
      },
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
