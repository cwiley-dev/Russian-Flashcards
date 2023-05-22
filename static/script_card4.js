//jshint esnext:true
import * as api from './script_api.js';

/*
Options for flashcards:
- English -> Russian (Reversable to Russian -> English)
  * English to verb infinitive
  * English to adjective
  * English to noun
  * English to adverb/other

- Russian -> Russian (Russian declension / conjugation practice)
  * Adjectives
    - gender + plurality
    - case
    - short form
  * Nouns
    - singular and plural
    - case
  * Verbs
    - first, second, third person
    - gender + plurality
    - present and past tense
    - imperative
    - aspect
  * Adverbs
    - none
*/






class Card {
  constructor(node) {
    
    this.info = {
      "id":"",
      "verb":"",
      "aspect":"",
      "aspect_shorthand":"",
      "partner":"",
      "partner_aspect":"",
      "partner_aspect_shorthand":"",
      "definition":"",
      "presfut_sg1":"",
      "presfut_sg2":"",
      "presfut_sg3":"",
      "presfut_pl1":"",
      "presfut_pl2":"",
      "presfut_pl3":"",
      "past_m":"",
      "past_f":"",
      "past_n":"",
      "past_pl":"",
      "imperative_sg":"",
      "imperative_pl":""
    }
    
    this.nodes = {
      "node":"",
      "wrapper":"",
      "front":"",
      "back":"",
      "leftButton":"",
      "rightButton":""
    }
    
    this.endCardNodes = {
      "node":"",
      "wrapper":"",
      "front":"",
      "leftButton":"",
      "rightButton":""
    }
    
    this.rotation = {
      'x':0,
      'y':0,
      'z':0,
      'deg':0
    }
    
    this.translation = {
      'x':0,
      'y':0,
      'z':0
    }
    
    this.set = "none";
    
    this.bind(node);
    
    this.canFlip = true; // Prevents flip when buttons pressed
    this.isFlipping = false;
    this.isFlipped = false;
    this.nodes.wrapper.onclick = () => { this.flip(); };
    this.nodes.leftButton.onclick = () => { this.leftButton(); };
    this.nodes.rightButton.onclick = () => { this.rightButton(); };
    
    this.backfaceVisibilityFix();
    
  }
  
  clear() {
    // For each [key, value] pair
    Object.entries(this.info).forEach((pair) => {
      // Reset value to "" to reuse class
      this.info[pair[0]] = "";
    });
  }
  
  // Pass in a card-wrapper-wrapper
  bind(node) {
    this.nodes = {
      "node":node,
      "wrapper":node.getElementsByClassName("card-wrapper")[0],
      "front":node.getElementsByClassName("card-front-wrapper")[0],
      "back":node.getElementsByClassName("card-back-wrapper")[0],
      "leftButton":node.getElementsByClassName("card-button-left")[0],
      "rightButton":node.getElementsByClassName("card-button-right")[0]
    }
  }
  
  // Apply the info inside class onto the card's HTML node
  apply() {
    // Nodes listed in the order they appear
    this.nodes.node.getElementsByClassName("card-id")[0].innerHTML = `id#${this.info.id}`;
    this.nodes.node.getElementsByClassName("card-front-verb")[0].innerHTML = this.info.accented;
    
    this.nodes.node.getElementsByClassName("card-verb")[0].innerHTML = this.info.accented;
    this.nodes.node.getElementsByClassName("card-verb-aspect")[0].innerHTML = `(${this.info.aspect_shorthand})`;
    this.nodes.node.getElementsByClassName("card-verb-partner-verb")[0].innerHTML = this.info.partner;
    this.nodes.node.getElementsByClassName("card-verb-partner-aspect")[0].innerHTML = `(${this.info.partner_aspect_shorthand})`;
    
    this.nodes.node.getElementsByClassName("card-definition")[0].innerHTML = this.info.definition;
    this.nodes.node.getElementsByClassName("card-presfut-sg1")[0].innerHTML = this.info.presfut_sg1;
    this.nodes.node.getElementsByClassName("card-presfut-pl1")[0].innerHTML = this.info.presfut_pl1;
    this.nodes.node.getElementsByClassName("card-presfut-sg2")[0].innerHTML = this.info.presfut_sg2;
    this.nodes.node.getElementsByClassName("card-presfut-pl2")[0].innerHTML = this.info.presfut_pl2;
    this.nodes.node.getElementsByClassName("card-presfut-sg3")[0].innerHTML = this.info.presfut_sg3;
    this.nodes.node.getElementsByClassName("card-presfut-pl3")[0].innerHTML = this.info.presfut_pl3;
    
    this.nodes.node.getElementsByClassName("card-past-m")[0].innerHTML = this.info.past_m;
    this.nodes.node.getElementsByClassName("card-past-pl")[0].innerHTML = this.info.past_pl;
    this.nodes.node.getElementsByClassName("card-past-f")[0].innerHTML = this.info.past_f;
    this.nodes.node.getElementsByClassName("card-past-n")[0].innerHTML = this.info.past_n;
    
    this.nodes.node.getElementsByClassName("card-imperative-sg")[0].innerHTML = this.info.imperative_sg;
    this.nodes.node.getElementsByClassName("card-imperative-pl")[0].innerHTML = this.info.imperative_pl;
    
    //this.backfaceVisibilityFix();
  }
  
  // Temporary fix to ensure backface is loaded prior to card flip
  backfaceVisibilityFix() {
    /*
    this.nodes.back.style.backfaceVisibility = "visible";
    this.nodes.back.style.opacity = "0.1";
    setTimeout(() => {
      this.nodes.back.style.backfaceVisibility = "hidden";
      this.nodes.back.style.opacity = "1";
    }, 50);
    */
    
    /*
    let tempTransform = this.nodes.back.style.transform;
    this.nodes.back.style.transform = "rotateY(180deg) scale3d(1,1,1)";
    */
    
    //let tempStyle = window.getComputedStyle(this.nodes.back).display;
    this.nodes.back.style.display = 'inline-block';
    //this.nodes.back.offsetHeight += 0;
    this.nodes.back.style.display = 'block';
  }
  
  updateTransform(speed = 0.4) {
    this.nodes.wrapper.style.transition = `transform ${speed}s`;
    
    this.nodes.wrapper.style.transform = `translate3d(${this.translation.x}px, ${this.translation.y}px, ${this.translation.z}px)`;
    this.nodes.wrapper.style.transform += `rotate3d(${this.rotation.x}, ${this.rotation.y}, ${this.rotation.z}, ${this.rotation.deg}deg)`;
    
    setTimeout(function() {
      this.nodes.wrapper.style.transition = "transform 0s";
    }.bind(this), speed*1000);
  }
  
  // flips card-wrapper, this.nodes.wrapper
  flip() {
    if (!this.canFlip || this.isFlipping) {
      this.canFlip = true;
      return;
    }
    this.isFlipping = true;
    
    let speed = 0.4; // in seconds
    this.nodes.wrapper.style.transition = `transform ${speed}s`;

    if (this.isFlipped === false) {
      this.rotation = { 'x':0, 'y':1, 'z':0, 'deg':180 };
      this.translation.z = 0;
      this.updateTransform();
    }  
    else {
      this.rotation = { 'x':0, 'y':1, 'z':0, 'deg':360 };
      this.translation.z = -200;
      this.updateTransform();
    }
    
    this.isFlipped = !this.isFlipped;

    setTimeout(function() {
      this.nodes.wrapper.style.transition = "transform 0s";
      if (this.isFlipped === false) {
        this.rotation = { 'x':0, 'y':0, 'z':0, 'deg':0 };
        this.translation.z = -200;
        this.updateTransform(0);
      }
      this.canFlip = true;
      this.isFlipping = false;
    }.bind(this), speed*1000);
  }
  
  flick(toLeft, runBeforeVisible) {
    this.canFlip = false;
    let speed = 0.4;
    if (toLeft) {
      this.rotation = { 'x':0, 'y':0, 'z':1, 'deg':-90 };
      this.translation = { 'x':-500, 'y':0, 'z':-200 };
    } else {
      this.rotation = { 'x':0, 'y':0, 'z':1, 'deg':90 };
      this.translation = { 'x':500, 'y':0, 'z':-200 };
    }
    this.nodes.node.style.transition = `opacity ${speed}s`;
    this.nodes.node.style.opacity = "0.0"
    this.updateTransform(speed);
    this.isFlipped = false;
    setTimeout( () => {
      this.rotation = { 'x':0, 'y':0, 'z':0, 'deg':0 };
      this.translation = { 'x':0, 'y':0, 'z':-200 };
      this.updateTransform(0);
      runBeforeVisible();
      this.nodes.node.style.transition = `opacity ${speed}s`;
      this.nodes.node.style.opacity = "1"
      setTimeout( () => {
        this.nodes.node.style.transition = "";
        this.canFlip = true;
      }, speed*1000);
    }, speed*1000);
  } // TODO: don't make card visible until the new verb information is received! Use callback
  
  leftButton() {
    this.canFlip = false;
    this.flick(true, () => {

      let cardPromise = this.set.getNextCard(true);
      cardPromise.then( newCard => {
        if (newCard == "end of set")
          this.displayEndCard();
        else {
          this.info = newCard;
          this.apply();
        }
      });
      
    });
  }
  
  rightButton() {
    this.canFlip = false;
    this.flick(false, () => {

      let cardPromise = this.set.getNextCard(false);
      cardPromise.then( newCard => {
        if (newCard == "end of set")
          this.displayEndCard();
        else {
          this.info = newCard;
          this.apply();
        }
      });
      
    });
  }
  
  bindEndCard(node) {
    this.endCardNodes = {
      "node":node,
      "wrapper":node.getElementsByClassName("card-wrapper")[0],
      "front":node.getElementsByClassName("card-front-wrapper")[0],
      "leftButton":node.getElementsByClassName("card-button-left")[0],
      "rightButton":node.getElementsByClassName("card-button-right")[0]
    }
    
    this.endCardNodes.leftButton.onclick = () => { this.endCardLeftButton(); };
    this.endCardNodes.rightButton.onclick = () => { this.endCardRightButton(); };
  }

  displayEndCard() {
    console.log("end of set");
    this.nodes.node.style.display = 'none';
    this.endCardNodes.node.style.display = 'inline-block';
    this.setEndCardStats();
    this.endCardNodes.node.style.transform = '';
    this.endCardNodes.node.style.opacity = '0';
    this.endCardNodes.node.style.transition = 'opacity 0.4s, transform 0.4s';
    setTimeout( () => {
      this.endCardNodes.node.style.opacity = '1';
      this.endCardNodes.node.style.transform = 'translateZ(200px)';
    }, 100);
  }
  
  setEndCardStats() {
    let setSize = this.set.fullSet.length;
    let reviewed = this.set.studySet.length;
    let confident = this.set.fullSet.length - this.set.studySetProto.length;
    let leftToReview = this.set.studySetProto.length;
    
    this.endCardNodes.node.getElementsByClassName("card-stats")[0].innerHTML = `Set size: ${setSize}<br> Reviewed: ${reviewed}<br> Confident: ${confident}<br> Left to review: ${leftToReview}<br>`;
  }

  hideEndCard(runBeforeVisible) {
    this.endCardNodes.node.style.transform = 'rotateY(90deg)';
    setTimeout( () => {
      this.endCardNodes.node.style.display = 'none';
      this.endCardNodes.node.style.opacity = '0';

      this.nodes.node.style.opacity = '0';
      this.nodes.node.style.display = 'inline-block';

      runBeforeVisible();

      this.nodes.node.style.transition = 'opacity 0.4s';
      setTimeout( () => {
        this.nodes.node.style.opacity = '1';
      }, 100);


    }, 400);
  }
  
  // Review remaining button
  endCardLeftButton() {
    this.set.reviewSet();
    this.hideEndCard( () => {
      this.set.getCard().then( newCard => {
        this.info = newCard;
        this.apply();
      });
    });
  }
  
  // Restart set button
  endCardRightButton() {
    this.set.restartSet();
    this.hideEndCard( () => {
      this.set.getCard().then( newCard => {
        this.info = newCard;
        this.apply();
      });
    });
  }

  initSet() {
    this.set.getCard().then( newCard => {
      this.info = newCard;
      this.apply();
    });
  }
  
}

class Set {
  constructor(arr = []) {
    this.fullSet = arr;
    this.studySet = arr;
    this.studySetProto = [];
    this.current = 0;

    this.settings = {
      "translation":{
        "verbs":true,
        "adjectives":true,
        "nouns":true,
        "adverbs":true
      },

      "adjectives":{
        "enabled":true,
        "gender":{
          "male":true,
          "female":true,
          "neuter":true,
          "plural":true
        },
        "case":{
          "nominative":true,
          "prepositional":true,
          "accusative":true,
          "genitive":true,
          "dative":true,
          "instrumental":true
        },
        "form":{
          "long":true,
          "short":true
        }

      },

      "nouns":{
        "enabled":true,
        "singular":true,
        "plural":true,
        "case":{
          "nominative":true,
          "prepositional":true,
          "accusative":true,
          "genitive":true,
          "dative":true,
          "instrumental":true
        }
      },

      "verbs":{
        "enabled":true,
        "subject":{
          "singular":true,
          "plural":true,
          "gender":{
            "male":true,
            "female":true,
            "neuter":true,
            "plural":true
          }
        },
        "aspect":{
          "imperfective":true,
          "perfective":true
        },
        "tense":{
          "past":true,
          "present":true,
          "future":false // Unimplemented, might be "is it будет or conjugated?" based on aspect
        },
        "imperative":true
      },

      "adverbs":{
        "enabled":true
      }
    };
    
    tracker.remainingCount = this.studySet.length;
  }

  // Preload current set ID list into sessionStorage
  preloadSet(callback) {
    if (this.fullSet.length === 0) return;
    console.log('Preloading set ' + this.fullSet);

    let promiseCount = 0;
    api.getVerbInfoList(this.fullSet).then( verbInfoList => {
      // Queries server for missing verbs and caches them

      callback();
    });
  }

  // Returns a verb info object in promise from server
  getCard() {
    
    let cardPromise = new Promise((resolve, reject) => {
      if (this.current >= this.studySet.length) {
        resolve("end of set");
        return;
      }
      api.getVerbInfo(this.studySet[this.current]).then( result => {
        resolve(result);
      });
    });
    
    return cardPromise;
  }

  getNextCard(toReview = false) {
    this.nextCard(toReview);
    return this.getCard();
  }
  
  nextCard(toReview = false) {
    if (toReview) {
      this.addCardToReview();
      tracker.reviewCount ++;
    }
    else tracker.confidentCount ++;
    
    this.current ++;
    tracker.remainingCount = this.studySet.length - this.current;
  }
  
  addCardToReview() {
    this.studySetProto.push(this.studySet[this.current]);
  }
  
  reviewSet() {
    if (this.studySetProto.length === 0) {
      this.restartSet();
      return;
    }
    this.current = 0;
    this.studySet = this.studySetProto;
    this.studySetProto = [];
    
    tracker.resetCount();
    tracker.remainingCount = this.studySet.length;
  }
  
  restartSet() {
    this.current = 0;
    this.studySet = this.fullSet;
    this.studySetProto = [];
    
    tracker.resetCount();
    tracker.remainingCount = this.studySet.length;
  }
  
}

class Tracker {
  constructor() {
    this.reviewNode = document.getElementById("review");
    this.confidentNode = document.getElementById("confident");
    this.remainingNode = document.getElementById("remaining");
    this._reviewCount = 0;
    this._confidentCount = 0;
    this._remainingCount = 0;
    
    this.reviewCount = 0;
    this.confidentCount = 0;
    this.remainingCount = 0;
  }
  
  set reviewCount(num) {
    this._reviewCount = num;
    this.reviewNode.innerHTML = `Review: ${this._reviewCount}`;
  }
  
  get reviewCount() {
    return this._reviewCount;
  }
  
  set confidentCount(num) {
    this._confidentCount = num;
    this.confidentNode.innerHTML = `Confident: ${this._confidentCount}`;
  }
  
  get confidentCount() {
    return this._confidentCount;
  }
  
  set remainingCount(num) {
    this._remainingCount = num;
    this.remainingNode.innerHTML = `Remaining: ${this._remainingCount}`;
  }
  
  get remainingCount() {
    return this._remainingCount;
  }
  
  resetCount() {
    this.reviewCount = 0;
    this.confidentCount = 0;
    this.remainingCount = 0;
  }
}

let tracker = new Tracker();

let card = new Card(document.getElementsByClassName("card-wrapper-wrapper")[0]);
card.bindEndCard(document.getElementsByClassName('endcard-wrapper-wrapper')[0]);

let idArray = [];
let set = new Set([1, 2, 3, 4, 5]);
if (sessionStorage.getItem('setIdList') != null)
  idArray = JSON.parse(sessionStorage.getItem('setIdList'));
if (idArray.length !== 0) set = new Set(idArray);
set.preloadSet( () => {
  card.set = set;
  card.initSet();
});