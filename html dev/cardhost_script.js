//jshint esnext:true

class Card {
    constructor() {
        
        this.canFlip = true;
        this.isFlipped = false;
        
        this.nodes = {
            "card":document.getElementsByClassName("card")[0],
            "facewrapper":document.getElementsByClassName("card-face-wrapper")[0]
        }
        
        this.nodes.facewrapper.onclick = () => { this.flip() };
    }
    
    flip(spd = 0.4) {
        if (!this.canFlip) return;
        this.nodes.facewrapper.style.transition = `transform ${spd}s`;
        if (this.isFlipped) this.nodes.facewrapper.style.transform = "rotateY(360deg)";
        else this.nodes.facewrapper.style.transform = "rotateY(180deg)";
        this.isFlipped = !this.isFlipped;
        
        this.canFlip = false;
        setTimeout( () => {
            this.canFlip = true;
        }, spd*1000);
    }
}

let card = new Card();