var fs = require('fs');

module.exports = class {

  constructor (dirs) {
    this.cards = new Array();
    this.drawn = new Array();

    for (let file of dirs) {
      var file_ar = fs.readFileSync(file, 'utf8').split('\n').filter(elem => elem !== '');
      this.cards = this.cards.concat(file_ar);
    };

  }

  draw (amount=1, removeFromDeck=true) {
    /*Draws card (defaults to one) and removes from the deck (by default). Returns an array of drawn cards.*/

    var ret = new Array();
    for (var i = 0; i < amount; i++) {
      var index = Math.floor(Math.random() * this.cards.length);
      ret.push(this.cards[index]);

      if (removeFromDeck) {
        var drawn = this.cards.splice(index, 1);
        this.drawn.push(drawn);
      };
    };
    return ret;
  }

  reassemble () {
    /*Puts all drawn cards back into main deck. Independent of game!*/

    this.cards = this.cards.concat(this.drawn);
    this.drawn = new Array();
  }

  addDeck (dir) {
    /*Adds a deck of cards given the file directory*/

    var file_ar = fs.readFileSync(dir, 'utf8').split('\n').filter(elem => elem !== '');
    this.cards = this.cards.concat(file_ar);
  }

  insert (card) {
    this.cards.push(card);

    // Check if in drawn deck.
    for (var i = this.drawn.length - 1; i >= 0; i--) {
      if (this.drawn[i] === card) {
        this.drawn.splice(i, 1);
      };
    };

    return this;
  }

};
