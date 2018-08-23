
# Discord Misanthropic Petrichor: Cards Against Humanity

![](https://github.com/Chokyotager/discord-cards-against-humanity/blob/master/display/other_server_bot.png?raw=true)

Misanthropic Petrichor is an attempt of an implementation of Cards Against Humanity in Discord. It is coded in JavaScript using the Discord.js library.
This implementation is **not supported or endorsed by** https://cardsagainsthumanity.com/.

# Features and preview
![](https://github.com/Chokyotager/discord-cards-against-humanity/blob/master/display/card_selection.png?raw=true)

*Private message card selection*

![](https://github.com/Chokyotager/discord-cards-against-humanity/blob/master/display/czar_selection.png?raw=true)

*Reactions-based Czar card selection*

![](https://github.com/Chokyotager/discord-cards-against-humanity/blob/master/display/name_display.png?raw=true)

*Displaying of names of who's the nastiest after a Czar picks*

![](https://github.com/Chokyotager/discord-cards-against-humanity/blob/master/display/available_preinstalled_decks.png?raw=true)

*Available pre-installed decks*

![](https://github.com/Chokyotager/discord-cards-against-humanity/blob/master/display/in_discord_configuration.png?raw=true)

*In-Discord game configuration*


This game is fully automatic and requires no commands to be input during gameplay.

## Bot set-up
Clone or download this repository and run it remotely on your server. Please note that you require the minimum Node version **10.1.0** to run this bot.

I strongly recommend using PM2 (http://pm2.keymetrics.io/) as the process manager to keep this bot running smoothly (hopefully) on your server.

You will also need to create a bot user on Discord and add it to your server. I suggest reading this guide: https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token

## Dependencies
**You have to install Discord.js through NPM**, NodeJS' package manager to run this bot. For help in installing Discord.js, kindly visit: https://discord.js.org/#/.

Other packages used by this module (such as FileSystem) should already be installed by default with NodeJS.

## Bot configuration
There is only one configuration file for this bot: `config.json`. Edit it accordingly to suit your needs. It should be pretty self-explanatory, I hope.

## Adding new cards

To add new cards, plop them into the cards folder. Blanks (where the white cards are supposed to fill in the content) can be indicated by a series of underscores (minimum 2) in the black card decks.

Each card is to be separated by a newline.

Refer to the current examples if you need any.

### Custom card rules

Suppose you have a black card like "make a haiku" which requires three cards. To indicate this to the bot, append square parentheses at the end of the card, with a semi-colon separating two numbers. For example, `[3;2]` would tell the bot to assign 2 extra cards to the players that round, while they have to pick three cards.

## In-situ Discord configuration with commands

Bot commands are **not controlled by permissions** as of the latest version. Do `c!help` in Discord for a list of commands as well as a document detailing how to change the card decks, max players, score to win, etc.

Document for command-based configuration: https://docs.google.com/document/d/1IOAMHEbOiyRQXrT4d6DHgc31pI-Dh2jvZXrNu2LvyZo/edit?usp=sharing

### Contact

I'm reachable through Discord, Twitter, and email.


Discord: `ChocoParrot#8925`

Twitter: @ChocoParrotFox

Email: lachocoparrot@gmail.com (I don't check this often)


If you need to contact me for anything, Discord is probably the best way.
