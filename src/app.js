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

/**
 * Wrap a string with SSML which includes the voice and locale markup for speaking the string in a given language.
 * @param inputString The string that you want to wrap in SSML.
 * @param locale THe locale that you want the string to be spoken in.
 * @returns {string} The string wrapped with the correct voice and locale markup.
 */
function wrapStringWithLanguageSsml(inputString, locale) {
  // A map between locale and voice name for that locale
  const voices = {
    'en-US': 'Joanna',
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

app.setHandler({
  LAUNCH() {
    let speech = this.t('welcome');

    this.followUpState('DecideWhetherToStudyState')
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
    this.tell(this.t('goodbye'));
  },
  HelpIntent() {
    let speech = '';
    speech += ' ' + this.$cms.t('help');
    speech += ' ' + this.$cms.t('welcome');
    this.ask(speech, speech);
  },
  CancelIntent() {
    return this.toStatelessIntent('END');
  },
  NavigateHomeIntent() {
    return this.toStateIntent('DecideWhetherToStudyState', 'YesIntent');
  },
  DecideWhetherToStudyState: {
    /**
     * @this object
     */
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
        setName = this.$cms[i]['name'][this.getLocale()];
        setNameLowercase = setName.toLowerCase();

        setNamesWithCapitalization.push(setName);
        this.$session.$data.setNames.push(setNameLowercase);

      }

      const setNamesString = setNamesWithCapitalization.join(', ');

      speech += this.$cms.t('StudyIntent', {
        setNamesString: setNamesString,
      });

      this.followUpState('ChoosingSetState')
        .ask(speech, speech);
    },
    NoIntent() {
      let speech = this.$cms.t(`sorry-you-dont-want-to-play`);
      this.tell(speech);
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

        // Save the set's cards so we can ask them later
        this.$session.$data.cards = this.$cms[currentSetIndex]['cards'];
        this.$session.$data.cardIndex = 1;

        const setIntroductionPhrase = this.$cms[currentSetIndex]['introduction'][this.getLocale()];

        speech = this.t('ChooseSetIntent', {
          setIntroductionPhrase: setIntroductionPhrase,
        });

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

      let card = this.$session.$data.cards[this.$session.$data.cardIndex];

      const deviceLocale = this.getLocale();

      /**
       * Choose the side of the card that is not in the locale of the device. For example, if the device locale is
       * en-US, then choose the side of the card that is in fr-FR. We assume that each card has two different locales
       * (for example, one side of the card is in en-US, while the other is in fr-FR).
       */
      let questionLocale = '';
      let question = '';
      for (questionLocale in card) {
        if (questionLocale !== deviceLocale) {
          question = card[questionLocale];
        }
      }

      const questionWrappedWithSsml = wrapStringWithLanguageSsml(question, questionLocale);

      speech = this.t('question_introduction', {
        cardIndex: this.$session.$data.cardIndex,
        cardQuestion: questionWrappedWithSsml,
      });

      speech += ' ' + this.t('answer_preface_reminder');

      speech = wrapStringWithSpeakTags(speech);

      this.followUpState('AnsweringQuestionState')
        .ask(speech, speech);
    },
  },
  AnsweringQuestionState: {
    AnswerQuestionIntent() {
      let speech = '';

      let userAnswer = this.$inputs['answer'].value;

      let card = this.$session.$data.cards[this.$session.$data.cardIndex];

      const deviceLocale = this.getLocale();

      /**
       * Choose the side of the card that is in the same locale as the device
       */
      let answerLocale = '';
      let cardAnswer = '';
      for (answerLocale in card) {
        if (answerLocale === deviceLocale) {
          cardAnswer = card[answerLocale];
          break;
        }
      }

      const cardAnswerWrappedWithSsml = wrapStringWithLanguageSsml(cardAnswer, answerLocale);

      speech += this.t('your_response_was', {
        userAnswer: userAnswer,
      });

      speech += ' ' + this.t('correct_answer', {
        correctAnswer: cardAnswerWrappedWithSsml,
      });

      this.followUpState('ProceedingToNextCardState')
        .ask(speech,speech);
    },
  },
  ProceedingToNextCardState: {
    YesIntent() {
      let speech;

      // Get next question if there is one
      this.$session.$data.cardIndex++;

      // If a question exists for the new question index
      if (this.$session.$data.cards[this.$session.$data.cardIndex]) {
        return this.toStateIntent('AskingQuestionState', 'YesIntent');
      } else {
        // We've reached the end of the deck
        speech = this.t('EndOfDeck');

        this.followUpState('EndOfDeckState')
          .ask(speech, speech);
      }
    }
  },
  EndOfDeckState: {
    YesIntent() {
      return this.toStateIntent('DecideWhetherToStudyState', 'YesIntent');
    },
    NoIntent() {
      return this.toStatelessIntent('END');
    }
  }
});

module.exports.app = app;
