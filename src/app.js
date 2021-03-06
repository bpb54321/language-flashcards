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
  Unhandled() {
    const speech = this.$cms.t(`unhandled`);
    this.followUpState('DecideWhetherToStudyState')
      .ask(speech, speech);
  },
  END() {
    this.tell(this.t('goodbye'));
  },
  HelpIntent() {
    const speech = this.$cms.t('help');
    this.followUpState('DecideWhetherToStudyState')
      .ask(speech, speech);
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

      let setName;

      for (let i = 1; i <= 3; i++) {

        // Each data sheet is named by a simple number/index
        setName = this.$cms[i]['name'][this.getLocale()];

        // Append a number in front of the set name
        setName = `${i}. ` + setName;

        this.$session.$data.setNames.push(setName);

      }

      speech += this.$cms.t('choose-a-set-by-saying-its-number', {
        setNamesString: this.$session.$data.setNames.join(', '),
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
      let setNumber = this.$inputs[`setNumber`].value;

      if ((setNumber <= this.$session.$data.setNames.length) && (setNumber > 0)) {

        // Save the set's cards so we can ask them later
        this.$session.$data.cards = this.$cms[setNumber][`cards`];
        this.$session.$data.cardIndex = 1;

        const speech = this.t(`introduce-set`);

        this.followUpState(`AskingQuestionState`)
          .ask(speech, speech);

      } else {

        const speech = this.t(`you-have-selected-an-invalid-set-number`, {
          setNamesString: this.$session.$data.setNames.join(', '),
        });

        this.followUpState(`ChoosingSetState`)
          .ask(speech, speech);
      }
    }
  },
  AskingQuestionState: {
    YesIntent() {
      let speech = ``;

      if (this.$session.$data.speechFromPreviousHandler) {
        speech += this.$session.$data.speechFromPreviousHandler;
        this.$session.$data.speechFromPreviousHandler = null;
      }

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
          break;
        }
      }

      const questionWrappedWithSsml = wrapStringWithLanguageSsml(question, questionLocale);

      speech += ` ` + this.t(`question_introduction`, {
        cardIndex: this.$session.$data.cardIndex,
        cardQuestion: questionWrappedWithSsml,
      });

      speech += ` ` + this.t(`answer_preface_reminder`);

      speech = wrapStringWithSpeakTags(speech);

      this.followUpState(`AnsweringQuestionState`)
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
    HelpIntent() {
      return this.toStatelessIntent(`HelpIntent`);
    },
    END() {
      return this.toStatelessIntent(`END`);
    },
    CancelIntent() {
      return this.toStatelessIntent(`CancelIntent`);
    },
    NavigateHomeIntent() {
      return this.toStatelessIntent(`NavigateHomeIntent`);
    },
    Unhandled() {
      this.$session.$data.speechFromPreviousHandler = this.$cms.t(`reminder-to-preface-answer`);
      return this.toStateIntent(`AskingQuestionState`, `YesIntent`);
    }
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
    },
    NoIntent() {
      return this.toStatelessIntent(`NavigateHomeIntent`);
    },
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
