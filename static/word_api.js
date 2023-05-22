// caiden wiley 2020 sends his apologies

// Comment key:
// (type)	argument_name = example, example2, ...
// Returns (type)

////////////////////////
// Exported functions //
////////////////////////

// (string)			type = "noun", "verb",... 
// (string)			requested = "голоса", "n9122"
// Returns (promise) resolves (Word object)
function getWord(type, requested) {
	if (typeof type != "string" || typeof requested != "string" ) throw "Invalid word request: wrong type";
	if (type != "noun" && type != "verb" && type != "adjective" && type != "other") throw "Invalid word request: \"type\" attribute value not recognized";
	return new Promise( (resolve, reject) => {
		if (isWordStored(requested)) resolve(retrieveWord(requested));
		else {
			requestWord(type, requested).then( result => {
				storeWord(result);
				resolve(result);
			})
		}
	});
}

// (string)			type = "noun", "verb",... 
// (string array)	requested = ["a324", "милий", ...]
// Returns (promise) resolves (Word object array)
function getWordList(type, requested) {
	if (typeof type != "string") throw "Invalid word request: wrong type";
	if (type != "noun" && type != "verb" && type != "adjective" && type != "other") throw "Invalid word request: \"type\" attribute value not recognized";
	let wordList, uncached = [];
	Array.from(requested).forEach( word => {
		if (isWordStored(word)) wordList.push(retrieveWord(word));
		else uncached.push(word);
	});
	return new Promise( (resolve, reject) => {
		if (uncached.length != 0) {
			requestWordList(type, uncached).then( result => {
				wordList = wordList.concat(result);
				resolve(wordList);
			});
		}
	});
}

// (object array)	requested = [{"type":<type>,"id":<id/word>}, ...]
// Returns (promise) resolves (Word object array)
function getMixedWordList(requested) {
	let wordList, uncached = [];
	Array.from(requested).forEach( item => {
		if (isWordStored(item.id)) wordList.push(retrieveWord(item.id));
		else uncached.push(item.id);
	});
	return new Promise( (resolve, reject) => {
		if (uncached.length != 0) {
			requestMixedWordList(uncached).then( result => {
				wordList.concat(result);
				resolve(wordList);
			});
		}
	});
}


// Object for simpler word transactions
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


//////////////////////////////////
// Non-exported functions below //
//////////////////////////////////



// (string)			type = "noun", "verb",... 
// (string)			requested = "голоса", "n9122"
// Returns (promise) resolves (Word object)
function requestWord(type, requested) {
	let requestString;
	if (!isNaN(parseInt(requested.slice(1))))
		requestString = `/word?type=${type}&id=${requested.slice(1)}`;
	else requestString = `/word?type=${type}&word=${requested}`;

	return new Promise( (resolve, reject) => {
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				let response = JSON.parse(xhttp.responseText);
				resolve(new Word(response.wordInfo));
			}
		};
		xhttp.open("GET", requestString, true);
		xhttp.send();
	});
}

// (string)			type = "noun", "verb",... 
// (string array)	requested = ["a324", "милий", ...]
// Returns (promise) resolves (Word object array)
function requestWordList(type, requested) {
	return new Promise( (resolve, reject) => {
		let wordList = [];
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				let response = JSON.parse(xhttp.responseText);
				Array.from(response).forEach( item => {
					wordList.push(new Word(item));
				});
				resolve(wordList);
			}
		};
		xhttp.open("POST", "/word", true);
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send(`type=${type}&list=${requested.join("+")}`);
	});
}

// (object array)	requested = [{"type":<type>,"id":<id/word>}, ...]
// Returns (promise) resolves (Word object array)
function requestMixedWordList(requested) {
	let requestString = "";
	Array.from(requested).forEach( item => {
		if (requestString != "") requestString += "+";
		requestString += item.type + "+" + item.id;
	});
	return new Promise( (resolve, reject) => {
		let wordList = [];
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				let response = JSON.parse(xhttp.responseText);
				Array.from(response).forEach( item => {
					wordList.push(new Word(item));
				});
				resolve(wordList);
			}
		};
		xhttp.open("POST", "/word", true);
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send(`mixed=true&list=${requestString}`);
	});
}


// Storing and retrieving verbs from sessionStorage
// Functions which take in "word" below want in string either a sid ( "a571" ) or a bare russian word ( "горячий" )

function clearCachedWords() {
	let cachedList = JSON.parse(sessionStorage.getItem("cached_word_list#"));
	Array.from(cachedList).forEach( item => sessionStorage.removeItem(`cached_word#${item}`) );
	sessionStorage.removeItem("cached_word_list#");

	cachedList = JSON.parse(sessionStorage.getItem("cached_word_list@"));
	Array.from(cachedList).forEach( item => sessionStorage.removeItem(`cached_word@${item}`) );
	sessionStorage.removeItem("cached_word_list@");
}

function printCachedWords() {
	let cachedList = JSON.parse(sessionStorage.getItem("cached_word_list@"));
	Array.from(cachedList).forEach( item => console.log(`cached_word@${item}`) );
	sessionStorage.removeItem("cached_word_list@");
}

// (Word object) word = Word{...}
function storeWord(word) {
	if (isWordStored(word.sid)) throw `Error: Word \"${word.sid}\"already stored!`
	let cachedIdList = JSON.parse(sessionStorage.getItem("cached_word_list#"));
	if (cachedIdList == null) cachedIdList = []
	cachedIdList.push(word.sid);
	sessionStorage.setItem("cached_word_list#", JSON.stringify(cachedIdList));

	let cachedWordList = JSON.parse(sessionStorage.getItem("cached_word_list@"));
	if (cachedWordList == null) cachedWordList = []
	cachedWordList.push(word.info.bare);
	sessionStorage.setItem("cached_word_list@", JSON.stringify(cachedWordList));

	sessionStorage.setItem(`cached_word#${word.sid}`, JSON.stringify(word.info));
	sessionStorage.setItem(`cached_word@${word.info.bare}`, word.sid);
}

// (Word object array) wordList = [Word{...}, ...]
function storeWordList(wordList) {
	Array.from(wordList).forEach( item => storeWord(item) );
}

// typeof word == "string", sid = 'n243', bare = 'заказать'
// DIFFERENCE between sid & bare: isNaN(parseInt( sid.slice(1) )) == false, isNaN( bare ) == true

// (string) word = "v63", "заказать"...
// Returns (Word object)
function retrieveWord(word) {
	if (typeof word != "string") throw "Invalid word retrieval request: wrong type";
	word = word.replace("\u0301", "");
	let sid;
	if (isNaN(parseInt(word.slice(1)))) { // if bare
		sid = sessionStorage.getItem(`cached_word@${word}`);
		if (sid == null) throw `Word @${word} is not cached`;
	} else sid = word;
	let str = sessionStorage.getItem(`cached_word#${sid}`);
	if (str == null) throw `Word #${word} is not cached`;
	return new Word(str);
}

// (string) word = "v63", "заказать"...
// Returns (boolean)
function isWordStored(word) {
	if (typeof word != "string") return false;
	word = word.replace("\u0301", "");
	let sid;
	if (isNaN(parseInt(word.slice(1)))) { // if bare
		sid = sessionStorage.getItem(`cached_word@${word}`);
		if (sid == null) return false;
	} else sid = word;
	let str = sessionStorage.getItem(`cached_word#${sid}`);
	if (str == null) return false;
	return true;
}

export {getWord, getWordList, getMixedWordList, Word}