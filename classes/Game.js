var fs = require('fs');
var path = require('path');
var Card = require('./Card.js');

var config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', "config.json")));

module.exports = class {

  constructor (players, configuration) {

    players = shuffle(players);

    // Construct players
    this.players = new Array();
    for (var i = 0; i < players.length; i++) {
      this.players.push({'id': players[i], 'score': 0, 'rotation': i, 'cards': new Array()});
    };

    this.cards = {
      "prompts": new Card(apx(config["directories"]["prompts"], configuration.decks.prompts)),
      "responses": new Card(apx(config["directories"]["responses"], configuration.decks.responses))
    };

    this.round = 0;
    this.win_score = configuration["win-score"];
    this.top_up = configuration["starting-cards"];
    this.logs = new Array();

    this.topUpCards(this.top_up);

    return this;

  }

  kick (id) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        this.players.splice(i, 1);
      };
    };
    return this;
  };

  assignCards (amount, exceptions=[]) {
    player_loop:
    for (var i = 0; i < this.players.length; i++) {
      for (var j = 0; j < exceptions.length; j++) {
        if (this.players[i].id === exceptions[j]) {
          continue player_loop;
        };
      };
      this.players[i].cards = this.players[i].cards.concat(this.cards.responses.draw(amount));
    };
    return this;
  }

  next () {

    this.topUpCards(this.top_up);

    // Draw one card from prompts
    var prompt = this.cards.prompts.draw()[0];
    //prompt = "blah blah ______ bleh bleh ______";
    var draws = (prompt.match(/__+/g) || new Array()).length;

    var [pick, draw] = [1, 0];

    var ax = /\[([0-9]*);([0-9]*)\]/g;
    if (ax.test(prompt)) {
      var varbs = ax.exec(prompt.match(ax)[0]);
      [pick, draw] = [varbs[1], varbs[2]];

      prompt = prompt.replace(ax, '').trim();

    } else if (draws > 0) {
      [pick, draw] = [draws, (draws > 2 ? draws - 1 : 1)];
    };

    // Pick Tsar
    var czar = this.players[this.round % this.players.length].id;

    this.round++;

    var action = {'prompt': prompt, 'pick': pick, 'draw': draw, 'czar': czar};

    this.logs.push({action: action, picks: new Array()});

    // Count the number of cards to assign;
    return action;
  }

  topUpCards (to) {
    for (var i = 0; i < this.players.length; i++) {
      var delta = to - this.players[i].cards.length;
      this.players[i].cards = this.players[i].cards.concat(this.cards.responses.draw(delta));
    };
    return this;
  };

  getPlayer (id) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        return this.players[i];
      };
    };
  };

  redeckCards (id, index, backInDeck=true) {
    var spliced = this.getPlayer(id).cards.splice(index, 1);

    this.cards.responses.insert(spliced);

    return this;

  }

  appendResponse (id, indices, backInDeck=true) {

    if (!Array.isArray(indices)) {
      throw "Response should be array.";
    };

    var player = this.getPlayer(id);
    var cards = new Array();

    for (var i = 0; i < indices.length; i++) {
      cards.push(player.cards[indices[i]]);
    };

    // Arrange indices
    indices.sort(function (a, b) {
      return a - b;
    });

    for (var i = indices.length - 1; i >= 0; i--) {
      this.redeckCards(id, indices[i], true);
    };

    this.logs[this.round - 1].picks.push({id: id, response: cards});

    return this;

  }

  presentResponses () {
    this._temp = shuffleK(this.logs[this.round - 1].picks);
    return this._temp;
  }

  trackScore (index) {

    return this._temp[index];

  }

  getScoreCard () {

    var scores = new Array();
    for (var i = 0; i < this.players.length; i++) {
      scores.push({id: this.players[i].id, score: this.players[i].score});
    };

    return scores.sort(function (a, b) {
      return b.score - a.score;
    });

  }

  verifyWin () {

    if (this.players.length < 3) {
      var max = new Array();
      for (var i = 0; i < this.players.length; i++) {
        max.push(this.players[i].score);
      };

      max = Math.max(... max);

      var winners = new Array();

      for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].score === max) {
          winners.push(this.players[i]);
        };
      };

      return {win: true, true_win: false, winner: winners};

    };

    for (var i = 0; i < this.players.length; i++) {
      // Check if anyone has won
      if (this.players[i].score >= this.win_score) {
        return {win: true, true_win: true, winner: this.players[i]};
      };
    };

    return {win: false};

  }

  score (id) {
    this.getPlayer(id).score++;

    this.logs[this.round - 1].winner = id;

    return this;
  }

};

function shuffleK (x) {
  return shuffle(Array.from(x));
};

function shuffle (x) {
  // Using standard Fisher-Yates shuffling
  for (var i = 0; i < x.length; i++) {
    var jumble = Math.floor(Math.random() * i);
    var cache = x[i];
    x[i] = x[jumble];
    x[jumble] = cache;
  };
  return x;
};

function apx (dir, rules=["*"]) {
  dir = path.join(__dirname, '..', dir);

  var directories = fs.readdirSync(dir);
  var finals = new Array();

  for (var i = 0; i < rules.length; i++) {
    if (rules[i].startsWith('-')) {
      var itr = autoEscape(rules[i].substring(1, rules[i].length));

      for (var j = 0; j < finals.length; j++) {
        if (finals[j].match(itr) !== null) {
          finals[j] = 'remove';
        };
      };

      finals = finals.filter(x => x !== 'remove');

    } else {
      var itr = autoEscape(rules[i]);

      for (var j = 0; j < directories.length; j++) {

        if (directories[j].match(itr) !== null) {
          finals.push(directories[j]);
        };

        // Remove potential duplicates in catches
        finals = finals.filter(function (value, index, self) {
          return self.indexOf(value) === index;
        });

      };

    };
  };

  function autoEscape (str) {
    var reg = str.replace("*", "(?:)");
    return new RegExp(reg, "gi");
  };

  console.log(finals);

  var arx = finals.map(x => dir + '/' + x);

  if (arx.length < 1) {
    // Set everything
    return directories.map(x => dir + '/' + x);
  };

  return arx;
};
