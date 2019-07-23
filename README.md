# WenyuniBot

Wenyunity's Discord Bot written in JS.

## Current Functionality

### choose

Chooses between the selection given.

### random

Randomly chooses a floating point number.

### easterEgg

Find the easter eggs! Easter eggs are found by typing wy!easteregg EggTitle.

### Waluigi

Randomly chooses between giving the Luigi and WALUIGI roles.

### Chess

Plays a game of chess.

### Work

Gives between 600 and 1800 points. Waiting time between two work periods is equal to the amount of points you get in minutes.

### Leaderboard

Shows the top 10 users in a certain category. Current categories are `points` and `best`.

### Eggplant

Buy eggplants for 100 points, and try to make a profit. The selling market can be very variable; keep rerolling the selling price, and then sell high. But be warned - Eggplants only last for seven days.

## Necessary Setup

auth.json will need a token field (to store your tokens) and an admin field (to store your discord user ID {*Not the bot's ID*}.)

easterEgg.json will need fields that look like this:
```
"EggTitle": {
    "text": "Egg flavor text goes here",
    "num": 0,
    "color": "#Pick your color (Ex: #FF0000)",
    "found": ""
},
```
