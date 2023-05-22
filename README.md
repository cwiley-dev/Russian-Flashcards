# Russian-Flashcards
An ambitious language-learning app focusing on Russian verbs on flashcards. In early development.

I made this a couple years ago and stopped working on it when a semester began. I never finished it, but I was very proud of the early visuals (the flashcard flip) and the review system. I haven't touched this since July of 2020.

Install flask `pip install flask`, then run `python -m flask --app main_page.py run`

Go to `localhost:5000/flashcards` to practive Russian verb flashcards. In flashcard mode, it randomly assigns you 5 verbs as a demo. Later it can be used on a custmizable library of verbs.

Go to `localhost:5000/dev` to practive noun declension. Press the "start with new options" button in the left-hand menu to begin.

Go to `localhost:5000/dev2` to practive adjective AND noun declension! This is so cool! I can't believe I stopped working on this.

In the quiz modes, if you fail a word, it will keep coming up every few questions until you get it correct!

.

TODO:
- Design a custom dictionary system where users can define the words they want to practice.
- Integrate it as a web extension where a user can highlight text and add words to their dictionary automatically.
- Let the user create "sets" of flashcards or words.
- Find a way to extrapolate this to other languages, because it seems hella useful.
