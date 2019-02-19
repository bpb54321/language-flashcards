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
    let speech = this.t('welcome')[0];

    this.followUpState('StudyState')
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
  StudyState: {
    YesIntent() {
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
    }
  },
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
    AnswerQuestionIntent() {
      let speech;

      let answer = this.$inputs['answer'].value;

      let question = this.$session.$data.questions[this.$session.$data.questionIndex];

      speech = this.t('AnswerQuestionIntent', {
        correctAnswer: question.back,
      })[0];

      this.followUpState('ProceedingToNextCardState')
        .ask(speech,speech);
    }
  },
  ProceedingToNextCardState: {
    YesIntent() {
      let speech;

      // Get next question if there is one
      this.$session.$data.questionIndex++;

      // If a question exists for the new question index
      if (this.$session.$data.questions[this.$session.$data.questionIndex]) {
        return this.toStateIntent('AskingQuestionState', 'YesIntent');
      } else {
        // We've reached the end of the deck
        speech = this.t('EndOfDeck')[0];

        this.followUpState('EndOfDeckState')
          .ask(speech, speech);
      }
    }
  },
  EndOfDeckState: {
    YesIntent() {
      return this.toStateIntent('StudyState', 'YesIntent');
    },
    NoIntent() {
      return this.toStatelessIntent('END');
    }
  }
});

module.exports.app = app;
