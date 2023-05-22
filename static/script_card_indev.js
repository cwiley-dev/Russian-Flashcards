// caiden wiley 2020 sends his apologies

'use strict';
import * as api from './word_api.js';
import Word from './word_api.js';

/*

Cards are for independent memorization, Questions are for interactive learning
Cards are used mainly for definition memorization, Questions DO NOT QUIZ THE DEFINITION OF THE WORD.

Card class:
Has a word
Has one property to associate with the word
Has a prompt that tells the user what property is on the card

Question class:
Has a word
Has a question based on a form of the word (NOT THE DEFINITION)
Has four choices, only one is correct

*/

// temporary (== TODO: remove this)
let page = {
	"textBoxes":{
		"verbs":"учиться\nесть\nизучать\nзаказать\nпить\nспать",
		"nouns":"радио\nлампа\nковёр\nджаз",
		"adjectives":"милий\nфиолетовый\nсупер",
		"others":"тоже\nуже\nдаже\nещё\nмного"
	}
};

class Set {
	constructor() {
		this.fullSet = [];
		this.currentSet = [];
		this.setPosition = 0;

		this.correct = [];	// confident cards
		this.incorrect = [];// review cards
	}

	// Returns (Word object)
	next() {
		if (this.setPosition >= this.currentSet.length - 1) this.endOfSet();
		else this.setPosition += 1;
		return this.current();
	}

	// Returns (Word object)
	previous() {
		if (this.setPosition > 0) this.setPosition -= 1;
		return this.current();
	}

	// Returns (Word object)
	current() {
		return this.currentSet[this.setPosition];
	}

	reset() {
		this.currentSet = this.fullSet;
		this.setPosition = 0;
		this.correct = [];
		this.incorrect = [];
	}

	markCorrect() {
		this.correct.push(this.current());
	}

	markIncorrect() {
		this.incorrect.push(this.current());
	}

	reviewSet() {
		this.setPosition = 0;
		this.currentSet = this.incorrect;
		if (this.currentSet.length == 0) this.emptySet();
	}

	endOfSet() { this.reviewSet(); }

	populate(count = 10, type = "all", maxObscurity = 200) {
		getRandomWords(count, type, maxObscurity).then( result => {
			this.loadSet(result);
		});
	}

	// (Word array) words
	// Returns (boolean) success
	loadSet(words) { }
	clearSet() { }
	populate() { }
	emptySet() { }
}

class CardSet extends Set {
	loadSet(words) {
		this.fullSet = [];
		for (let word of words)
			fullSet.push(new Card(word));
		this.reset();
	}
}

class QuestionSet extends Set {
	loadSet(words) {
		this.fullSet = [];
		for (let word of words)
			fullSet.push(new Question(word));
		this.reset();
	}
}

// FYI the word.info contains the properties as a dict (not array) eg "bare":"даже"
class Word {
  constructor(wordInfo) {
  	// JSON.parse wordInfo automatically
    this.info = typeof wordInfo == "string" ? JSON.parse(wordInfo) : wordInfo;
    this.id = this.info.id;
    this.type = this.info.type;
    this.sid = this.info.type.slice(0, 1) + this.info.id; // Storage ID
    this.bare = this.info.bare; // bare str

    // this.properties = DICT of all the this.info keys paired with the definition of the matching value {property:propertyLabel}
    this.properties = {};
    this.assignProperties();

    // this.validProperties = ARRAY of property dict KEYS for all the quizzable declensions/conjugations for this word
    this.validProperties = [];
    const invalidPorperties = ["translations_en", "translations_de", "bare"];
    for (let [key, value] of Object.entries(this.info))
    	if (value != "" && this.properties[key] != "" && !invalidPorperties.includes(key)) this.validProperties.push(key);
  }

  // Returns random key from validProperties
  getRandomValidProperty() {
  	return this.validProperties[randomInt(this.validProperties.length)];
  }

  // Returns label from this.properties
  getPropertyLabel(prop) {
  	return this.properties[prop];
  }

  // Returns the property value from info, not the label
  getProperty(prop) {
  	return this.info[prop];
  }

  assignProperties() {
	if (this.type == "verb") {
		this.properties = { // "tell me the ... of this word"
			"bare":"unaccented infinitive form",
			"accented":"infinitive form",
			"translations_en":"english translation",
			"translations_de":"german translation",
			"aspect":"aspect",
			"partner":"aspectual partner",
			"imperative_sg":"singular imperative form",
			"imperative_pl":"plural imperative form",
			"past_m":"past tense masculine form",
			"past_f":"past tense feminine form",
			"past_n":"past tense neuter form",
			"past_pl":"past tense plural form",
			"presfut_sg1":"first person singular " + (this.info[4] == "perfective" ? "future" : "present") + " tense form",
			"presfut_sg2":"second person singular " + (this.info[4] == "perfective" ? "future" : "present") + " tense form",
			"presfut_sg3":"third person singular " + (this.info[4] == "perfective" ? "future" : "present") + " tense form",
			"presfut_pl1":"first person plural " + (this.info[4] == "perfective" ? "future" : "present") + " tense form",
			"presfut_pl2":"second person plural " + (this.info[4] == "perfective" ? "future" : "present") + " tense form",
			"presfut_pl3":"third person plural " + (this.info[4] == "perfective" ? "future" : "present") + " tense form"
		};
	}
	if (this.type == "noun") {
    	this.properties = { // "tell me the ... of this word"
			"bare":"unaccented nominative form",
			"accented":"nominative form",
			"translations_en":"english translation",
			"translations_de":"german translation",
			"gender":"gender",			// m, f, or n
			"partner":"opposite gender variant",			// usually blank, may contain feminine/masculine counterpart EG американец parterner is американка
			"animate":"",			// 0: no, 1: yes, does noun decline to genitive in accusative, sans-female?
			"indeclinable":"",		// 0: no, 1: yes, for foreign borrow words EG радио does not decline !!WARNING!! Words with this may not have declensions listed!
			"sg_only":"",			// 0: no, 1: yes, Words that appear only in singular
			"pl_only":"",			// 0: no, 1: yes, Words that appear only in plural
			"sg_nom":"singlular nominative form",
			"sg_gen":"singular genitive form",
			"sg_dat":"singular dative form",
			"sg_acc":"singular accusative form",
			"sg_inst":"singular instrumental form",
			"sg_prep":"singular prepositional form",
			"pl_nom":"plural nominative form",
			"pl_gen":"plural genitive form",
			"pl_dat":"plural dative form",
			"pl_acc":"plural accusative form",
			"pl_inst":"plural instrumental form",
			"pl_prep":"plural prepositional form",
		};
	}
	if (this.type == "adjective") {
		this.properties = { // "tell me the ... of this word"
			"bare":"unaccented nominative masculine form",
			"accented":"nominative masculine form",
			"position":"",			// ?
			"translations_en":"english translation",
			"translations_de":"german translation",
			"incomparable":"",		// ?
			"comparative":"",		// ?
			"superlative":"",		// ?
			"short_m":"masculine short form",			// Short forms !!WARNING!! Some don't have short forms
			"short_f":"feminine short form",
			"short_n":"neuter short form",
			"short_pl":"plural short form",
			"decl_m_nom":"nominative masculine form",		// Masculine forms
			"decl_m_gen":"genitive masculine form ",
			"decl_m_dat":"dative masculine form ",
			"decl_m_acc":"accusative masculine form ",
			"decl_m_inst":"instrumental masculine form ",
			"decl_m_prep":"prepositional masculine form ",
			"decl_f_nom":"nominative feminine form",		// Feminine forms
			"decl_f_gen":"genitive feminine form",
			"decl_f_dat":"dative feminine form",
			"decl_f_acc":"accusative feminine form",
			"decl_f_inst":"instrumental feminine form",
			"decl_f_prep":"prepositional feminine form",
			"decl_n_nom":"nominative neuter form",		// Neuter forms
			"decl_n_gen":"genitive neuter form",
			"decl_n_dat":"dative neuter form",
			"decl_n_acc":"accusative neuter form",
			"decl_n_inst":"instrumental neuter form",
			"decl_n_prep":"prepositional neuter form",
			"decl_pl_nom":"nominative plural form",		// Plural forms
			"decl_pl_gen":"genitive plural form",
			"decl_pl_dat":"dative plural form",
			"decl_pl_acc":"accusative plural form",
			"decl_pl_inst":"instrumental plural form",
			"decl_pl_prep":"prepositional plural form"
		};
	}
	if (this.type == "other") {
		this.properties = { // "tell me the ... of this word"
			"bare":"unaccented form",
			"accented":"regular form",
			"translations_en":"english translation",
			"translations_de":"german translation"
		};
	}
  }
}

/* Card class
Contains a word and its definition
Used for simple flashcard studying
by default, front = rus, back = eng
*/
class Card {
	constructor(word, flippedByDefault = false) {
		this.word = word;
		this.front = this.word.info.accented;
		this.back = this.word.info.translations_en;
		if (this.back == "") this.back = "There wasn't a definition in the database!";

		this.isFlipped = flippedByDefault;
		this.canFlip = true;
	}

	flip(callback) {
		if (canFlip) this.isFlipped != this.isFlipped;
		callback();
	}
}

/* Question class
Contains a word,
  a declension/conjugation to study,
  and 3 incorrect answers for multiple choice questions
Used for multiple choice declension/conjugation studying
*/
class Question {
	// (Word) word
	constructor(word) {
		this.word = word;
		this.displayWord = this.word.info.accented;

		this.questionProperty = "accented";
		this.question = "ungenerated question";
		this.answer = "ungenerated answer";
		this.generateQuestion();

		// Choices: 3 wrong, 1 right
		// choices are word declensions, not property labels, eg [отец, отца, отцу, отцов]
		// this.answer = the correct choice
		this.choices = [];
		this.generateChoices();
	}

	// (string) property = choose question subject, eg: "past_pl"
	generateQuestion(property = false) {
		if (property != false) this.questionProperty = property;
		else this.questionProperty = this.word.getRandomValidProperty();
		this.question = `What is the ${this.word.getPropertyLabel(this.questionProperty)} of ${this.displayWord}`;
		this.answer = this.word.getProperty(this.questionProperty);
	}

	generateChoices() {
		let possibleChoices = [];
		if (this.word.type == "noun") possibleChoices = ["sg_nom", "sg_gen", "sg_dat", "sg_acc", "sg_inst", "sg_prep",
														 "pl_nom", "pl_gen", "pl_dat", "pl_acc", "pl_inst", "pl_prep"];
		if (this.word.type == "verb") possibleChoices = ["imperative_sg", "imperative_pl", "past_m", "past_f", "past_n", "past_pl", 
														 "presfut_sg1", "presfut_sg2", "presfut_sg3", "presfut_pl1", "presfut_pl2", "presfut_pl3"];
		if (this.word.type == "adjective") {
			// Adds all property labels starting from "short_m", there's a lot.
			let adding = false;
			for (let [key, value] of Object.entries(this.word.info)) {
				if (key == "short_m") adding = true;
				if (adding) possibleChoices.push(key);
			}
		}
		if (this.word.type == "other") throw "cannot generate declension question for adverb";
		if (possibleChoices == []) throw "empty array?"; // u never know

		let answerPos = randomInt(3);
		let outOfChoices = false;
		loop1:
		for (let i=0; i<4; i++) {
			if (i == answerPos) this.choices.push(this.answer);
			else {

				let tempIndex = -1;
				let valid = false;
				let tempChoice;
				loop2:
				while (!valid) {
					if (tempIndex != -1) possibleChoices.splice(tempIndex, 1);
					if (possibleChoices.length == 0) outOfChoices = true;
					if (outOfChoices) break loop1;

					tempIndex = randomInt(possibleChoices.length-1);
					tempChoice = this.word.getProperty(possibleChoices[tempIndex]);
					for (let c of this.choices)
						if (tempChoice == c) continue loop2;
					if (tempChoice == this.answer) continue;
					break;
				}
				if (outOfChoices) break;
				this.choices.push(tempChoice);
			}
		}
		if (!this.choices.includes(this.answer)) this.choices.push(this.answer);
		if (outOfChoices && this.choices.length < 4) // if ran out of properties/unique declensions, fill choices.
			while (this.choices.length < 4) this.choices.push(this.choices[this.choices.length-1]);
    	//console.log(this.choices);
	}

	isChoiceCorrect(choice) {
		return choice.toLowerCase() == this.answer.toLowerCase();
	}
}

// can be 0, can be max
function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max + 1));
}

// Returns a (Promise) returns (Word array)
function getRandomWords(count, type = "all", maxObscurity = 200) {
	let requests = [];
	let tempType = type;
	for (let i=0; i<count; i++) {
		if (type == "all") tempType = ["noun","verb","adjective","other"][randomInt(3)];
		requests.push( {"type":tempType, "id":`${tempType.charAt(0)}${randomInt(maxObscurity)}`} );
	}

	return api.getMixedWordsList(requests);
}

/*
TODO:
 - merge current Word class with word_api Word class
     this file depends on this word class.
*/