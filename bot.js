var Discord = require('discord.js');
var client = new Discord.Client();
var fs = require('fs');
var Cah = require('./classes/CAH.js');
var path = require('path');

var config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

var _local = {reactables: new Array(), temp: {}};

var actions = new Object();

actions.startGame = async function (mr, user) {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var userx = user.id;

  if (!_local.lobby.inGame(userx)) {
    mr.remove(user);
    return null;
  };

  if (mr.count >= _local.lobby.players.length + 1/*mr.count >= Math.ceil(_local.lobby.players.length / 2) + 1*/) {
    startGame();
  };
};

actions.triggerFlag = async function (mr, user) {

  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var userx = user.id;

  if (_local.lobby.inGame(userx)) {
    //mr.message.channel.send(name + " has left the game.");
    _local.lobby.kick(userx);

    removePlayer(userx);

    if (_local.temp.pycx !== undefined) {
      _local.temp.pycx.reactions.find(x.emoji === "🏁").remove(user);
    };

    var current_players = _local.lobby.players.join(', ').length === 0 ? ' ' : toUserX(_local.lobby.players).join(', ');

    _local.temp.pycm.edit("Current players:\n```" + current_players + "```");

    if (_local.lobby.players.length < 3 && _local.temp.pycx !== undefined) {
      await removeReactables(_local.temp.pycx, clearReactions=false, deleteMessage=true);
      _local.temp.pycx === undefined;
    };

    if (_local.lobby.players.length === 0 && _local.temp.timeoutOpt !== undefined) {
      // Clear TO
      clearTimeout(_local.temp.timeoutOpt);
    };

  } else {

    if (_local.lobby.join(userx) === false) {
      user.send("Hey! That game is full, so I'm afraid you'll have to wait for the next one. Sorry!");
    } else {

      addPlayer(userx);

      var current_players = _local.lobby.players.join(', ').length === 0 ? ' ' : toUserX(_local.lobby.players).join(', ');

      _local.temp.pycm.edit("Current players:\n```" + current_players + "```");

      if (_local.lobby.players.length === 3) {
        _local.temp.pycx = await channel.send("React to this message to start the game. [Everyone must vote to start]");
        _local.temp.pycx.react("🏁");

        addReactable(_local.temp.pycx, actions.startGame, "🏁");

      };

      if (_local.lobby.players.length === 1) {
        _local.temp.timeoutOpt = setTimeout(function () {
          for (var i = 0; i < _local.lobby.players.length; i++) {
            channel.members.find(x => x.id === _local.lobby.players[i]).send("Hey! I had to reset the Cards Against Humanity game because it hasn't been started for too long! Join again and start it if you want to play! If you need help with commands, do `" + config["command-prefix"] + "help` in a main channel! Remember to react to chequered flag to start the game!");
          };
          reset();
        }, 10*60*1000);
      };

    };
  };

  if (mr !== null) {
    mr.remove(user);
  };
};

client.on("ready", function () {
  console.log("Cards Against Humanity bot ready.");
  client.user.setPresence({
    status: 'online',
    game: {name: 'Misanthropic petrichor', type: 'PLAYING'}
  });

  reset();

});

client.on("message", function (msg) {
  var checks = msg.author.id !== client.id //&& msg.content.substring(0, 2) === 'c!';
  var is_command = msg.content.startsWith(config["command-prefix"]);
  var is_in_main = msg.channel.type === 'text';

  if (checks && is_command && is_in_main) {
    var command = msg.content.substring(config["command-prefix"].length, msg.content.length).split(' ');
    iterateCommands(msg, command);
  };

});

client.on("messageReactionAdd", function (mr, user) {

  var message = mr.message;

  if (user.id === client.user.id) {
    return null;
  };

  // Search through reactables
  for (var i = 0; i < _local.reactables.length; i++) {
    if (_local.reactables[i].message.id === message.id && _local.reactables[i].emote === mr.emoji.toString()) {
      _local.reactables[i].action(mr, user);
      return null;
    };
  };

});

function toUserX (arx) {
  var ret = new Array();
  for (var i = 0; i < arx.length; i++) {
    ret.push(fetchUserX(arx[i]));
  };
  return ret;
};

function fetchUserX (id) {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var member = channel.members.find(x => x.id === id);

  return member.user.username + '#' + member.user.discriminator;
};

async function iterateCommands (msg, command) {

  switch (command[0]) {
    case "help":
      msg.channel.send("**__Available commands__** (command prefix: `" + config["command-prefix"] + "`):\n\nGeneral: `help`, `credits`\nConfiguration: `acr`/`addCardRule`, `ecr`/`emptyCardRules`, `presets`, `preset`, `setConfig`, `cardRules`, `config`, `listPrompts`, `listResponses`\nGame: `startGame`, `resetGame`\n\nConfiguration guide: <https://docs.google.com/document/d/1IOAMHEbOiyRQXrT4d6DHgc31pI-Dh2jvZXrNu2LvyZo/edit?usp=sharing>");
      break;

    case "credits":
      msg.channel.send("__**Misanthropic petrichor: Cards Against Humanity**__\n\nDeveloper: ChocoParrot\nBeta-testers: Arduano, Arjen, Alexy98, Lia, Scrable, Jobbiis (theWeakGuy48_), Federick, Visualbbasic, Unusual_dude, RaizzanX, Potato, Nariek, ErrorTech, Rut\n\nModules used: Discord.js");
      break;

    case "startGame":
      if (_local.lobby.status !== 'waiting') {
        msg.channel.send("You can't start the game now!");
        return null;
      } else if (_local.lobby.players.length < 3) {
        msg.channel.send("I cannot start a game with fewer than three players! Get more people to join or make more friends!");
        return null;
      };
      msg.channel.send("Attempting forced game initiation.");
      startGame();
      msg.channel.send("Forced game to start. Ripperoni.");
      break;

    case "resetGame":
      await reset();
      break;

    case "listPrompts":
      var send = fs.readdirSync(__dirname + config["directories"]["prompts"]).filter(x => x.endsWith('.txt'));

      for (var i = 0; i < send.length; i++) {
        send[i] = (i+1) + ". " + send[i].replace(".txt", "").toUpperCase();
      };

      send = "Available prompt (black) card decks:\n```js\n" + send.join("\n") + "```";
      msg.channel.send(send);
      break;

    case "listResponses":
      var send = fs.readdirSync(__dirname + config["directories"]["responses"]).filter(x => x.endsWith('.txt'));

      for (var i = 0; i < send.length; i++) {
        send[i] = (i+1) + ". " + send[i].replace(".txt", "").toUpperCase();
      };

      send = "Available response (white) card decks:\n```js\n" + send.join("\n") + "```";
      msg.channel.send(send);
      break;

    case "config":
      var conf = _local.lobby.configuration;
      msg.channel.send("Current game configuration: \n```js\n" + JSON.stringify(conf) + "```");
      break;

    case "acr":
      command[0] = "addCardRule";

    case "addCardRule":
      if (_local.lobby.status !== 'waiting') {
        msg.channel.send("The game's configuration is read-only at this point!");
        return null;
      };

      try {
        command[1] = command[1].toLowerCase();

        var current_rules = _local.lobby.configuration.decks[command[1]];

        if (current_rules === undefined) {
          throw "Unknown card rule";
        };

        var items = command.splice(2, command.length - 1);

        _local.lobby.setDeckRules(command[1], current_rules.concat(items));

        var arx = Array.from(_local.lobby.configuration.decks[command[1]]);

        for (var i = 0; i < arx.length; i++) {
          arx[i] = (i+1) + ": " + arx[i].toUpperCase();
        };

        msg.channel.send("Appended rule(s). Current card rules for `" + command[1].toUpperCase() + "`: \n```js\n" + arx.join("\n") + "```");

      } catch (err) {
        console.log(err);
        msg.channel.send("An error occurred. Verify the syntax of your command.");
      }
      break;

    case "ecr":
      command[0] = "emptyCardRules";

    case "emptyCardRules":
      if (_local.lobby.status !== 'waiting') {
        msg.channel.send("The game's configuration is read-only at this point!");
        return null;
      };

      try {
        command[1] = command[1].toLowerCase();

        var current_rules = _local.lobby.configuration.decks[command[1]];

        if (current_rules === undefined) {
          throw "Unknown card rule";
        };

        _local.lobby.setDeckRules(command[1], new Array());

        msg.channel.send("Emptied rule(s). Current card rules for `" + command[1].toUpperCase() + "`: \n```js\n ```");

      } catch (err) {
        console.log(err);
        msg.channel.send("An error occurred. Verify the syntax of your command.");
      };
      break;

    case "cardRules":
      var arx = Array.from(_local.lobby.configuration.decks["prompts"]);

      for (var i = 0; i < arx.length; i++) {
        arx[i] = (i+1) + ": " + arx[i].toUpperCase();
      };

      var ary = Array.from(_local.lobby.configuration.decks["responses"]);

      for (var i = 0; i < ary.length; i++) {
        ary[i] = (i+1) + ": " + ary[i].toUpperCase();
      };

      msg.channel.send("Current card rules for: \n\n`PROMPTS`:\n```js\n" + arx.join("\n") + "```\n`RESPONSES`:\n```js\n" + ary.join("\n") + "```");
      break;

    case "forceGame":
      _local.lobby.start();
      break;

    case "presets":
      msg.channel.send("Available presets:\n```py\n" + fs.readFileSync(__dirname + "/" + config["directories"]["presets"]) + "```");
      break;

    case "preset":
      if (_local.lobby.status !== 'waiting') {
        msg.channel.send("The game's configuration is read-only at this point!");
        return null;
      };

      var jx = JSON.parse(fs.readFileSync(__dirname + "/" + config["directories"]["presets"]));

      if (jx[command[1]] === undefined) {
        msg.channel.send("Unrecognised preset! Use the `presets` command to list available ones!");
      } else {
        _local.lobby.configuration.decks = jx[command[1]];
        msg.channel.send("Successfully set the game card preset! 🎵");
      };
      break;

    case "setConfig":
      if (_local.lobby.status !== 'waiting') {
        msg.channel.send("The game's configuration is read-only at this point!");
        return null;
      };

      try {
        command[1] = command[1].toLowerCase();

        if (_local.lobby.configuration[command[1]] !== undefined && typeof _local.lobby.configuration[command[1]] !== 'object') {

          if (!Number.isInteger(parseInt(command[2]))) {
            throw "Non-integer parsed into config.";
          };

          if (parseInt(command[2]) < 3 || parseInt(command[2]) > 25) {
            msg.channel.send("Please don't be ridiculous, my lad. 🤔");
            return null;
          };

          _local.lobby.configuration[command[1]] = parseInt(command[2]);
          msg.channel.send("Current game configuration: \n```js\n" + JSON.stringify(_local.lobby.configuration) + "```");
        } else {
          msg.channel.send("Cannot set that property in the game configuration!.");
        };

      } catch (err) {
        console.log(err);
        msg.channel.send("An error occurred. Verify the syntax of your command.");
      };

      _local.lobby.configuration

      break;

    case "shutdown":
      msg.channel.send("Forcing bot to stop.");
      process.exit();
      break;

    case "kick":
      break;

    case "deck":
      break;

  };

};

async function reset () {

  if (_local.temp.timeoutOpt !== undefined) {
    clearTimeout(_local.temp.timeoutOpt);
  };

  if (_local.temp.delayedReset !== undefined) {
    clearTimeout(_local.temp.delayedReset);
  };

  _local.temp = new Object();
  await setLobby();
  if (config["purge-game-messages"]) {
    await purgeMessages();
  };

  if (config["purge-chat-messages"]) {
    await purgeChatMessages();
  };

  await new Promise(function(resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 1000);
  });

  await sendIntro();
  await unblockMain();
  await removePlayers();
};

async function blockMain () {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var role = channel.guild.roles.find(x => x.name === "@everyone");

  var perms = {
    READ_MESSAGES: false,
  };

  await channel.overwritePermissions(role, perms, "[Auto] Game start");

};

async function unblockMain () {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var role = channel.guild.roles.find(x => x.name === "@everyone");``

  var perms = {
    READ_MESSAGES: true,
    SEND_MESSAGES: false,
    EMBED_LINKS: false,
    ATTACH_FILES: false,
    ADD_REACTIONS: false
  };

  await channel.overwritePermissions(role, perms, "[Auto] Game reset");
};

async function addPlayer (userx) {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var role = channel.guild.roles.find(x => x.name === config["roles"]["player"]);

  await channel.members.get(userx).addRole(role, "[Auto] Game join");

};

async function removePlayer (userx) {
  var channel = client.channels.get(config["active-channel"]);
  var role = channel.guild.roles.find(x => x.name === config["roles"]["player"]);

  await channel.members.find(x => x.id === userx).removeRole(role, "[Auto] Game kick/leave");

};

async function removePlayers () {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var role = channel.guild.roles.find(x => x.name === config["roles"]["player"]);

  var members = role.members.array();

  for (var i = 0; i < members.length; i++) {
    members[i].removeRole(role);
  };

};

async function sendIntro () {
  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var attachment = new Discord.Attachment(fs.readFileSync(path.join(__dirname, "assets/banner.jpg")), 'banner.jpg');

  await channel.send(attachment);
  var react_to = await channel.send("**Misanthropic petrichor: Cards Against Humanity**\n\nHow to play: <https://s3.amazonaws.com/cah/CAH_Rules.pdf>\n\n*React to this message to join.*");

  var current_players = _local.lobby.players.join(', ') === '' ? ' ' : _local.lobby.players.join(', ');

  _local.temp.pycm = await channel.send("Current players:\n```" + current_players + "```");
  _local.temp.pycr = react_to;

  await react_to.react("🚩");
  addReactable(react_to, actions.triggerFlag, "🚩");
};

async function purgeMessages () {

  var channel = client.channels.find(x => x.id === config["active-channel"]);

  while ((await channel.fetchMessages({ limit: 1 })).array().length >= 1) {
    console.log("Attempting to purge max 100.");
    var forced_message = (await channel.fetchMessages({ limit: 1 })).array()[0];

    if (!forced_message) {
      break;
    };

    try {

      await forced_message.delete();

      await channel.bulkDelete(100, false);

    } catch (err) {

      break;

    };

  };
};

async function purgeChatMessages () {

  var channel = client.channels.find(x => x.id === config["chat-channel"]);

  while ((await channel.fetchMessages({ limit: 1 })).array().length >= 1) {
    console.log("Attempting to purge max 100 on chat.");
    var forced_message = (await channel.fetchMessages({ limit: 1 })).array()[0];

    if (!forced_message) {
      break;
    };

    try {

      await forced_message.delete();

      await channel.bulkDelete(100, false);

    } catch (err) {

      break;

    };

  };
};

async function removeReactables (message, clearReactions=false, deleteMessage=false) {
  for (var i = 0; i < _local.reactables.length; i++) {
    if (message.id === _local.reactables[i].message.id) {
      _local.reactables.splice(i, 1);
    };
  };

  if (deleteMessage && message !== undefined) {
    await message.delete();
  } else if (clearReactions) {
    await message.clearReactions();
  };

};

function addReactable (message, action, emote) {
  _local.reactables.push({message: message, action: action, emote: emote});
};

function setLobby () {
  var def_config = {
    max_players: 6
  };

  _local.lobby = new Cah.Lobby(def_config);
};

async function startGame () {
  var channel = client.channels.find(x => x.id === config["active-channel"]);

  if (_local.temp.timeoutOpt !== undefined) {
    clearTimeout(_local.temp.timeoutOpt);
  };

  if (config["block-channels"]) {
    await blockMain();
  };

  removeReactables(_local.temp.pycr, clearReactions=true);
  removeReactables(_local.temp.pycx, clearReactions=false, deleteMessage=true);

  _local.temp.pycr.edit("**Misanthropic petrichor: Cards Against Humanity**\n\nHow to play: <https://s3.amazonaws.com/cah/CAH_Rules.pdf>");

  var game_begin = new Discord.Attachment(fs.readFileSync(__dirname + "/assets/Game-begin.jpg"), 'Game-begin.jpg');
  await channel.send(game_begin);

  // Initialise game - assign cards
  _local.temp.game = _local.lobby.start();

  // Assign cards

  round();

};

async function nextRound () {
  var channel = client.channels.find(x => x.id === config["active-channel"]);

  if (_local.temp.timeoutOpt !== undefined) {
    clearTimeout(_local.temp.timeoutOpt);
  };

  var attachment = new Discord.Attachment(fs.readFileSync(path.join(__dirname, "assets/Next-round.jpg")), 'Next-round.jpg');
  await channel.send(attachment);

  round();

};

async function round () {

  var channel = client.channels.find(x => x.id === config["active-channel"]);

  var game = _local.temp.game;
  var actions = game.next();

  game.assignCards(actions.draw, [actions.czar]);

  channel.send("**Round " + game.round + "!**");
  _local.temp.blackCard = sendCard(channel, actions.prompt, 'BLACK', false);
  channel.send("**" + fetchUserX(actions.czar) + "** is the Card Czar for this round!");

  var picks = new Array();

  // PM every player with their cards (except Czar since they don't need to pick)
  for (var i = 0; i < game.players.length; i++) {

    if (game.players[i].id !== actions.czar) {

      var message = "You now have `" + game.players[i].cards.length + "` response cards.";

      if (actions.pick > 1) {
        var concatable = "\nPlease pick " + actions.pick + " cards by entering their indices *separated by a comma*.";
      } else {
        var concatable = "\nPlease pick a card by entering its index.";
      };

      var avails = "```";

      var cards = game.players[i].cards;
      for (var j = 0; j < cards.length; j++) {
        avails += "\n" + (j + 1) + ": " + cards[j];
      };

      avails += "```\n**You have 60 seconds to pick your card.**";

      var user = channel.members.find(x => x.id === game.players[i].id).user;

      sendCard(user, actions.prompt, 'BLACK', false);

      user.send(message + concatable + avails);
      var dmc = await user.createDM();

      function filter (x) {

        if (x.author.id === client.user.id) {
          return false;
        };

        var content = x.content.split(',').map(x => x.trim()).filter(function (value, index, self) {
          return self.indexOf(value) === index;
        });

        if (content.length !== actions.pick) {
          x.channel.send("Invalid number of unique suggestions.");
          return false;
        };

        if (verifyContent(content)) {
          x.channel.send("**Selection confirmed.**");
          return true;
        } else {
          return false;
        };

        function verifyContent (a) {

          for (var i = 0; i < a.length; i++) {

            var index = parseInt(a[i]);

            if (isNaN(index) || a[i] % 1 !== 0) {
              x.channel.send("Invalid.");
              return false;
            };

            if (game.getPlayer(x.author.id).cards[index - 1] === undefined) {
              x.channel.send("Card(s) selected contain an invalid range.");
              return false;
            };
          };

          return true;

        };

      };

      picks.push({id: game.players[i].id, promise: dmc.awaitMessages(filter, {max: 1, time: 60*1000})});

    };
  };

  for (var i = 0; i < picks.length; i++) {
    var colx = (await picks[i].promise).array()[0];

    colx = colx !== undefined ? colx.content.split(',').map(x => x.trim()) : new Array();

    if (colx.length < 1) {

      channel.members.find(x => x.id === picks[i].id).user.send("You didn't send in your choices, so I randomly picked your response from your choice of white cards! :yum:");

      var pick = shuffle(createArx(game.getPlayer(picks[i].id).cards.length));

      var arx = pick.slice(0, actions.pick);

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

      function createArx (x) {
        var ret = new Array();

        for (var i = 0; i < x; i++) {
          ret.push(i);
        };

        return ret;
      };

    } else {

      var arx = colx.map(x => x - 1);

    };

    game.appendResponse(picks[i].id, arx, true);

  };

  czarPick(actions.czar);

};

async function czarPick (czar) {
  var game = _local.temp.game;
  var channel = client.channels.find(x => x.id === config["active-channel"]);

  var presentables = game.presentResponses();

  _local.temp.czarPicks = new Array();

  for (var i = 0; i < presentables.length; i++) {
    // Await
    await sendReactableCard(channel, presentables[i].response, [255, 255, 255], "✅", presentables[i].id);
  };

  await new Promise(function(resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 60*1000);
  });

  channel.send("<@" + czar + "> please pick a card!");

  var timeout = 60*1000;

  warnAndKick();

  function warnAndKick () {
    _local.temp.timeoutWarn = setTimeout(function () {
      channel.send("!!! **<@" + czar + ">, you have " + Math.round((timeout - .75*timeout)/1000) + " seconds left to choose a white card or you will be kicked!** !!!");
    }, .75*timeout);

    _local.temp.timeoutKick = setTimeout(function() {
      removePlayer(czar);
      channel.send("**" + fetchUserX(czar) + " has been kicked from the game for idling as a Card Czar!** *F*.");
      clearReactionsAndEdit();
      game.kick(czar);
      verifyWin();
    }, timeout);

  };

  async function sendReactableCard (channel, contents, colour, reaction, id) {
    var message = await sendMultiCard(channel, contents, colour);
    message.react(reaction);

    async function done (mx) {

      clearTimeout(_local.temp.timeoutWarn);
      clearTimeout(_local.temp.timeoutKick);

      clearReactionsAndEdit();

      for (var i = 0; i < _local.temp.czarPicks.length; i++) {
        if (_local.temp.czarPicks[i].message.id === mx.id) {
          var winner = _local.temp.czarPicks[i];
          game.score(winner.id);
          break;
        };
      };

      // Announce winner of round, print scores
      channel.send("**" + fetchUserX(winner.id) + "** has won the round! " + wittyQuote());

      _local.temp.czarPicks = new Array();

      await new Promise(function(resolve, reject) {
        setTimeout(function () {
          resolve();
        }, 2*1000);
      });

      verifyWin();

    };

    function filter (mr, user) {

      if (user.id === client.user.id) {
        return false;
      };

      if (user.id !== czar) {
        mr.remove(user);
        return false;
      };

      done(mr.message);
      return true;

    };

    // Using await reactables instead of in-built system;
    var collector = message.awaitReactions(filter, {time: timeout, max: 1});

    _local.temp.czarPicks.push({collector: collector, id: id, message: message, contents: contents});

    //addReactable(message, actions.czarReact, reaction);
  };

  async function clearReactionsAndEdit() {
    for (var i = 0; i < _local.temp.czarPicks.length; i++) {
      _local.temp.czarPicks[i].message.clearReactions();
      // Edit cards to show username

      _local.temp.czarPicks[i].message.edit(makeMultiCard(channel, _local.temp.czarPicks[i].contents, [255, 255, 255], _local.temp.czarPicks[i].id));

    };

    function makeMultiCard (channel, contents, colour, id) {
      var embed = new Discord.RichEmbed({title: "White card"});

      embed.setColor(colour);
      embed.setAuthor(fetchUserX(id), channel.members.find(x => x.id === id).user.avatarURL);

      for (var i = 0; i < contents.length; i++) {
        embed.addField("Card " + (i+1), contents[i], false);
      };

      return embed;
    };

  };

};

async function verifyWin () {

  var channel = client.channels.find(x => x.id === config["active-channel"]);
  var game = _local.temp.game;

  // Continue the game where viable
  var verif = game.verifyWin();
  if (verif.win) {

    var attachment = new Discord.Attachment(fs.readFileSync(path.join(__dirname, "assets/Game-over.jpg")), 'Game-over.jpg');
    await channel.send(attachment);

    await new Promise(function(resolve, reject) {
      setTimeout(function () {
        resolve();
      }, 5000);
    });

    if (verif.true_win) {
      await channel.send("**" + fetchUserX(verif.winner.id) + "** has won the game! " + wittyQuote());
    } else {
      await channel.send("**" + toUserX(verif.winner.map(x => x.id)).join(", ") + "** has/have won the game by default due to a lack of players (or *some* people You win when all threats to the town have been eliminated and you survive to see it.ting kicked, quietttttt). " + wittyQuote());
    };
    await channel.send("Final scores:\n" + createScorePres(false));

    delayedReset(channel);

    // Autoreset
  } else {
    // Fetch scores
    await channel.send("Current scores:\n" + createScorePres(true));

    await new Promise(function(resolve, reject) {
      setTimeout(function () {
        resolve();
      }, 8000);
    });

    nextRound();

  };

  function createScorePres (append=true) {
    var scores = game.getScoreCard();

    var ret = new String();
    for (var i = 0; i < scores.length; i++) {
      ret += "\n" + (i + 1) + ": " + fetchUserX(scores[i].id) + " [" + scores[i].score + "]";
    };

    ret = "```" + ret + "```";

    if (append) {
      ret += "\n**It takes `" + game.win_score + "` points to win this game.**";
    }

    return ret;

  };

};

function sendMultiCard (channel, contents, colour) {
  var embed = new Discord.RichEmbed({title: "White card"});

  embed.setThumbnail("https://i.imgur.com/A8A5EI3.jpg");
  embed.setColor(colour);

  for (var i = 0; i < contents.length; i++) {
    embed.addField("Card " + (i+1), contents[i], false);
  };

  return channel.send(embed);
};

function delayedReset (channel, time=2*60*1000) {
  channel.send("Thanks for playing! The channel will automatically reset in " + Math.round(time/1000) + " seconds.");
  _local.temp.delayedReset = setTimeout(reset, time);
};

async function sendCard (channel, content, colour, pin=false) {
  var embed = new Discord.RichEmbed({title: "Black card", description: content});

  embed.setThumbnail("https://i.imgur.com/WQAzJ5k.jpg");
  embed.setColor(colour);

  var message = await channel.send(embed);
  if (pin) {
    message.pin();
  };

  return message;
};

function wittyQuote () {
  var wits = fs.readFileSync(__dirname + '/' + config["directories"]["witty-quotes"], 'utf8').split('\n').filter(x => x.length > 0);

  return wits[Math.floor(Math.random() * wits.length)];
};

client.login(config["credentials"]["bot-token"]);
