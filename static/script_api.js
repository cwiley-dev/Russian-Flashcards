function getWordInfo(type, requested) {

}





export function getVerbInfo(requested) {
	if (typeof requested != "string" && typeof requested != "number") throw "Invalid verb request: wrong type";
	return new Promise( (resolve, reject) => {
		if (isVerbInStorage(requested)) resolve(retrieveVerb(requested));
		else {
			requestVerbInfo(requested).then( result => {
				storeVerb(result);
				resolve(result);
			});
		}
	});
}

// Takes a homogeneous array of strings or numbers
export function getVerbInfoList(requested) {
	if (typeof requested != "object") throw "Invaid batch verb request: wrong type";
	return new Promise( (resolve, reject) => {
		let allStored = true;
		Array.from(requested).forEach( item => {
			if (!isVerbInStorage(item)) allStored = false;
		});
		if (allStored) {
			let verbInfoList = [];
			Array.from(requested).forEach( item => {
				verbInfoList.push(retrieveVerb(item));
			});
			resolve(verbInfoList);
		} else {
			requestVerbInfoList(requested).then( result => {
				storeVerbInfoList(result);
				resolve(result);
			});
		}
	});
}



export function requestVerbInfo(requested) {
	if (!isNaN(parseInt(requested))) requested = parseInt(requested);
	if (typeof requested == "number") {
		// Verb request is from an ID, more common
		return new Promise((resolve, reject) => {
			let xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = () => {
				if (xhttp.readyState == 4 && xhttp.status == 200) {
					let response = JSON.parse(xhttp.responseText);
					resolve(response.verbInfo);
				}
			};
			xhttp.open("GET", `/verb?id=${requested}`, true);
			xhttp.send();
		});
	} else if (typeof requested == "string") {
		// Verb request is from verb infinitive
		return new Promise( (resolve, reject) => {
			let xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = () => {
				if (xhttp.readyState == 4 && xhttp.status == 200) {
					let response = JSON.parse(xhttp.responseText);
					resolve(response.verbInfo);
				}
			};
			xhttp.open("GET", `/verb?verb=${requested}`, true);
			xhttp.send();
		});
	} else throw "Invalid verb request: wrong type";
}

export function requestVerbInfoList(requested) {
	if (typeof requested != "object") throw "Invaid batch verb request: wrong type";
	let firstItem = false;
	Array.from(requested).forEach( item => {
		if (firstItem === false) firstItem = item;
		if (typeof firstItem != typeof item) throw "Invalid array: array must contain only one type"
	});
	if (typeof firstItem == "number") {
		let idList = "";
		Array.from(requested).forEach( item => {
			if (idList.length != "") idList += "+";
			idList += item;
		});

		return new Promise( (resolve, reject) => {
			let xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = () => {
				if (xhttp.readyState == 4 && xhttp.status == 200) {
					let response = JSON.parse(xhttp.responseText);
					resolve(response);
				}
			};
			xhttp.open("POST", '/verb', true);
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhttp.send(`idlist=${idList}`);
		});
	} else if (typeof firstItem == "string") {
		let verbList = "";
		Array.from(requested).forEach( item => {
			if (verbList.length != "") verbList += "+";
			verbList += item;
		});

		return new Promise( (resolve, reject) => {
			let xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = () => {
				if (xhttp.readyState == 4 && xhttp.status == 200) {
					let response = JSON.parse(xhttp.responseText);
					resolve(response);
				}
			};
			xhttp.open("POST", '/verb', true);
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhttp.send(`verblist=${verbList}`);
		});
	} else throw "Invaid batch verb request: type not num or str";	
}


// Storing and retrieving verbs from sessionStorage
// Verbs ID is now alphanumerical, Noun#35 -> cached_word#n35

export function storeVerb(verbInfo) {
	sessionStorage.setItem(`cached_verb#${verbInfo.id}`, JSON.stringify(verbInfo));
	sessionStorage.setItem(`cached_verb@${verbInfo.bare}`, verbInfo.id); // For verb string lookup, sans ID
}


function addToCachedList(wordInfo) {
	cachedIdList = JSON.parse(sessionStorage.getItem('cached_word_list#'));
	cachedIdList.push(wordInfo.id);
	sessionStorage.setItem(JSON.stringify(cachedIdList));

	cachedWordList = JSON.parse(sessionStorage.getItem('cached_word_list@'));
	cachedWordList.push(wordInfo.bare);
	sessionStorage.setItem(JSON.stringify(cachedWordList));
}

function clearCachedWords() {
	cachedList = JSON.parse(sessionStorage.getItem('cached_word_list'));
	sessionStorage.removeItem('cached_word_list');
	Array.from(cachedList).forEach( item => {
		sessionStorage.removeItem(`cached_word#${item}`)
	});
}

function storeWord(wordInfo) {
	addToCachedList(wordInfo);
	sessionStorage.setItem(`cached_verb#${wordInfo.id}`, JSON.stringify(wordInfo));
	sessionStorage.setItem(`cached_verb@${wordInfo.bare}`, wordInfo.id);
}

function retrieveWord(word) {
	if (typeof word == "number") {
		let str = sessionStorage.getItem(`cached_word#`)
	}
}

export function storeVerbInfoList(verbInfoList) {
	Array.from(verbInfoList).forEach( item => {
		storeVerb(item);
	});
}

export function retrieveVerb(verb) {
	if (typeof verb == "number") {
		let str = sessionStorage.getItem(`cached_verb#${verb}`);
		if (str == null) throw `Verb #${verb} is not cached`;
		else return JSON.parse(str);
	} else if (typeof verb == "string") {
		verb = verb.replace("\u0301", "");
		let id = sessionStorage.getItem(`cached_verb@${verb}`);
		if (id == null) throw `Verb @${verb} is not cached`;
		id = parseInt(id);
		let str = sessionStorage.getItem(`cached_verb#${id}`);
		if (str == null) throw `Verb #${id} is not cached`;
		else return JSON.parse(str);
	} else throw "Invalid verb retrieval request: wrong type"
}

export function isVerbInStorage(verb) {
	if (typeof verb == "number") {
		let str = sessionStorage.getItem(`cached_verb#${verb}`);
		if (str == null) return false;
		return true;
	} else if (typeof verb == "string") {
		verb = verb.replace("\u0301", "");
		let id = sessionStorage.getItem(`cached_verb@${verb}`);
		if (id == null) return false;
		id = parseInt(id);
		let str = sessionStorage.getItem(`cached_verb#${id}`);
		if (str == null) return false;
		else return true;
	} else throw "Invalid verb storage query: wrong type"
}



class Word {
  constructor(wordInfo) {
    this.info = wordInfo;
    this.id = this.info.id;
    this.type = this.info.type;
    this.nid = this.info.type + this.info.id;
  }
}