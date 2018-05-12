var Game = require('./Game.js');

module.exports = class {

  /* Class handles configurations, joins, etc. */
  constructor (options={}) {

    this.players = new Array();

    this.configuration = {
      "max-players": options.max_players || 6,
      "win-score": 3,
      "starting-cards": 10,
      "decks": {
        "prompts": ["us-*", "expansion-*"],
        "responses": ["us-*", "expansion-*"]
      }
    };

    this.status = 'waiting';

  }

  resetConfig () {
    this.configuration = {
      "max-players": 6,
      "win-score": 3,
      "starting-cards": 10,
      "decks": {
        "prompts": ["us-*", "expansion-*"],
        "responses": ["us-*", "expansion-*"]
      }
    };
    return this;
  }

  set (key, value) {
    this.configuration[key] = value;
  }

  setDeckRules (deck, rules) {
    this.configuration.decks[deck] = rules;
    return this;
  }

  join (id) {
    if (this.players.length >= this.configuration["max-players"] - 1) {
      return false;
    };

    this.players.push(id);

    return this;
  }

  kick (id) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i] === id) {
        this.players.splice(i, 1);
      };
    };
    return this;
  }

  inGame (id) {
    /* For verification purposes */
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i] === id) {
        return true;
      };
    };
    return false;
  }

  start () {
    this.status = 'running';
    return new Game(this.players, this.configuration);
  }

};
