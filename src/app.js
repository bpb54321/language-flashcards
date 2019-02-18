'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const {App} = require('jovo-framework');
const {Alexa} = require('jovo-platform-alexa');
const {GoogleAssistant} = require('jovo-platform-googleassistant');
const {JovoDebugger} = require('jovo-plugin-debugger');
const {FileDb} = require('jovo-db-filedb');
const {GoogleSheetsCMS} = require('jovo-cms-googlesheets');


const app = new App();

app.use(
  new Alexa(),
  new GoogleAssistant(),
  new JovoDebugger(),
  new FileDb(),
  new GoogleSheetsCMS()
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
    let speech = this.t('menu')[0];

    this.ask(speech, speech);
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
  StudyIntent() {
    let speech = '';

    if (this.$session.$data.speechFromPreviousHandler) {
      speech += this.$session.$data.speechFromPreviousHandler;
    }

    speech += this.$cms.t('choose_set')[0];

    this.$session.$data.setNames = [];

    let setNamesSpeech = '';
    let setName;
    let setNameLowercase;

    for (let i = 1; i <= 3; i++) {
      setName = this.$cms[i]['name'];
      setNameLowercase = setName.toLowerCase();

      // Save set names as an array for future reference
      this.$session.$data.setNames.push(setNameLowercase);
      setNamesSpeech += `\n${setName};`;
    }

    speech += `\n ${setNamesSpeech}`;

    this.followUpState('ChoosingSetState')
      .ask(speech, speech);
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
  ChoosingSetState: {
    Unhandled() {
      let speech;
      let setName = this.$request.queryResult.queryText;
      let setNameLowercase = setName.toLowerCase();

      if (this.$session.$data.setNames.includes(setNameLowercase)) {

        const currentSetIndex =
          this.$session.$data.setNames.indexOf(setNameLowercase) + 1;

        // Save the set's questions so we can ask them later
        this.$session.$data.questions = this.$cms[currentSetIndex]['questions'];

        const setIntroductionPhrase = this.$cms[currentSetIndex].introduction;
        speech = `OK. ${setIntroductionPhrase}. Shall we begin?`;

        this.followUpState('AskingQuestionsState')
          .ask(speech, speech);

      } else {

        this.$session.$data.speechFromPreviousHandler = `Sorry, I couldn't find` +
          `a set called ${setName}.\n`;
        return this.toStatelessIntent('StudyIntent');

      }
    }
  },
  AskingQuestionsState: {
    YesIntent() {
      this.tell('This will be your first question!');
    },
  }
});

module.exports.app = app;
