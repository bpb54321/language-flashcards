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

function wrapStringWithLanguageSsml(inputString, locale) {
  // A map between locale and voice name for that locale
  const voices = {
    'en-US': 'Ivy',
    'fr-FR': 'Celine',
  };

  let wrappedString = `<voice name='${voices[locale]}'><lang xml:lang='${locale}'>`;
  wrappedString += inputString;
  wrappedString += `</lang></voice>`;

  return wrappedString;
}

/**
 * Necessary because if you start adding SSML tags inside the speech string,
 * the entire speech string must be wrapped with <speak></speak> tags.
 *
 * @param inputString A speech string.
 * @returns {string} The speech string wrapped with <speak></speak> tags.
 */
function wrapStringWithSpeakTags(inputString) {
  return '<speak>' + inputString + '</speak>';
}

function addLanguageAttributesToQuestion(question) {

  const deviceLocale = this.getLocale();
  const questionFields = ['front', 'back'];

  for (let questionField of questionFields) {

    if (this.$session.$data.questions[questionField]) {

      const questionFieldLocale = this.$session.$data.questions[questionField].locale;

      if (questionFieldLocale && (questionFieldLocale !== deviceLocale)) {

        question[questionField] =
          wrapStringWithLanguageSsml(question[questionField], questionFieldLocale);
      }
    }
  }
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

    // This might be a message saying that the requested set wasn't found
    if (this.$session.$data.speechFromPreviousHandler) {
      speech += this.$session.$data.speechFromPreviousHandler;
    }

    // Store an array of lowercase set names in the session
    this.$session.$data.setNames = [];

    // Will be used to list the set names in speech response to user
    let setNamesWithCapitalization = [];

    let setName;
    let setNameLowercase;

    for (let i = 1; i <= 3; i++) {

      // Each data sheet is named by a simple number/index
      setName = this.$cms[i]['name'];
      setNameLowercase = setName.toLowerCase();

      setNamesWithCapitalization.push(setName);
      this.$session.$data.setNames.push(setNameLowercase);

    }

    const setNamesString = setNamesWithCapitalization.join(', ');

    speech += this.$cms.t('StudyIntent', {
      setNamesString: setNamesString,
    })[0];

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
    this.tell('Goodbye!');
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
    ChooseSetIntent() {
      let speech;
      let setName = this.$inputs['setName'].value;
      let setNameLowercase = setName.toLowerCase();

      if (this.$session.$data.setNames.includes(setNameLowercase)) {

        const currentSetIndex =
          this.$session.$data.setNames.indexOf(setNameLowercase) + 1;

        // Save the set's questions so we can ask them later
        this.$session.$data.questions = this.$cms[currentSetIndex]['questions'];
        this.$session.$data.questionIndex = 1;

        const setIntroductionPhrase = this.$cms[currentSetIndex].introduction;

        speech = this.t('ChooseSetIntent', {
          setIntroductionPhrase: setIntroductionPhrase,
        })[0];

        this.followUpState('AskingQuestionState')
          .ask(speech, speech);

      } else {

        this.$session.$data.speechFromPreviousHandler = `Sorry, I couldn't find` +
          `a set called ${setName}.\n`;
        return this.toStatelessIntent('StudyIntent');

      }
    }
  },
  AskingQuestionState: {
    YesIntent() {
      let speech;

      let question = this.$session.$data.questions[this.$session.$data.questionIndex];

      addLanguageAttributesToQuestion.call(this,question);

      speech = this.t('question_introduction', {
        questionIndex: this.$session.$data.questionIndex,
        questionFront: question.front,
      })[0];

      speech = wrapStringWithSpeakTags(speech);

      this.followUpState('AnsweringQuestionState')
        .ask(speech, speech);
    },
  },
  AnsweringQuestionState: {
    Unhandled() {
      let speech;
      let userResponse = this.$request.queryResult.queryText;

      speech = this.t('response_confirmation', {
        userResponse: userResponse,
      })[0];

      this.followUpState('ConfirmingUserResponseState')
        .ask(speech,speech);
    }
  },
});

module.exports.app = app;
