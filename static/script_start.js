//jshint esnext:true

let textarea = document.getElementById("verbs");
let loading = document.getElementById("loading");

let idArray = [];

document.getElementById("submit").onclick = () => convertVerbsToIds();

function convertVerbsToIds() {
  loading.style.display = 'initial';
  
  let verbs = textarea.value.split("\n");
  let verbList = "";
  for (let i=0;i<verbs.length;i++) {
    if (verbList.length !== 0) verbList += "+";
    verbList += verbs[i];
  }
  console.log(verbList);
  
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = () => {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      let response = JSON.parse(xhttp.responseText);
      idArray = response.idlist;
      complete();
    }
  };
  xhttp.open("POST", '/verbs', true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(`verbidrequest=${verbList}`);
  
}

function complete() {
  loading.style.display = 'none';
  
  sessionStorage.setItem('setIdList', JSON.stringify(idArray));
  
  window.location.href = '/flashcards';
}