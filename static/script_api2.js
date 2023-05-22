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
			requestWord(requested).then( result => {
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
				wordList.concat(result);
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
		xhttp.send(`list=${requested.join("+")}`);
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