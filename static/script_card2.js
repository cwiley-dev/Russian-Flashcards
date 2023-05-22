/* Maybe later implementation of multiple cards...?
cards = document.getElementsByClassName("card-wrapper");
Array.from(cards).forEach((el) => {
  console.log("setting onclick for " + el.tagName);
  el.onclick = () => {flip(el);};
});
*/

cards = document.getElementsByClassName("card-wrapper");
cards[0].onclick = () => { flip(cards[0]); };

// (Temporary??) Fix for the backface being culled from loading
cardBacks = document.getElementsByClassName("card-back-wrapper");
cardBacks[0].style.backfaceVisibility = "visible";
cardBacks[0].style.opacity = "0.1";
setTimeout(() => {
  cardBacks[0].style.backfaceVisibility = "hidden";
  cardBacks[0].style.opacity = "1";
}, 10);

leftButtons = document.getElementsByClassName("card-button-left");
rightButtons = document.getElementsByClassName("card-button-right");
leftButtons[0].onclick = () => {
  console.log("Left button!");
  reviewButton();
  buttonPressed = true;
};

rightButtons[0].onclick = () => {
  console.log("Right button!");
  confidentButton();
  buttonPressed = true;
};

// Prevent card flip if button is pressed
let buttonPressed = false;


function flip(e) {
  if (buttonPressed) {
    buttonPressed = false;
    return;
  }
  let speed = 0.4;
  e.style.transition = "transform "+speed+"s";
  if (e.isFlipped === undefined) e.isFlipped = false;
  
  if (e.isFlipped === false)
    e.style.transform = "rotateY("+180+"deg) translateZ(0px)";
  else
    e.style.transform = "rotateY("+360+"deg) translateZ(-200px)";
  e.isFlipped = !e.isFlipped;
  
  setTimeout(function() {
    e.style.transition = "transform 0s";
    if (e.isFlipped === false) e.style.transform = "rotateY("+0+"deg) translateZ(-200px)";
  }, speed*1000);
}

function reviewButton() {
  
}

function confidentButton() {
  
}


/*
TODO: Ask dad how I would go about requestiong a custom webpage with javascript, or how I would keep a session. I need to send which button I press to the server, and I need the server to serve me a new page based on that input.
Possibility: Store session cookie, javascript redirects to GET /flashcards?review=(true/false) and routing for that page reads session cookie, makes session data changes, and serves custom page.
Possibility 2: I use javascript to dynamically update the page with data received from the server, but never actually change the page.

*/