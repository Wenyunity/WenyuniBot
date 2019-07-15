const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const helpText = require('./help.json');
const fs = require('fs');
const easterEgg = JSON.parse(fs.readFileSync('./easterEgg.json', 'utf8'));
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');
const arena = require('./Arena.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord client
const client = new Discord.Client({
});

client.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(client.username + ' - (' + client.id + ')');

	// Check if the table "points" exists.
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
		// Ensure that the "id" row is always unique and indexed.
		sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
		sql.pragma("synchronous = 1");
		sql.pragma("journal_mode = wal");
	}

    // And then we have two prepared statements to get and set the score data.
    client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
    client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");
});

client.on('message', msg => {
    // It will listen for messages that will start with `WY!`
	// Except for those that came from the client itself.
    if ((msg.content.substring(0, 3) == 'WY!' || msg.content.substring(0, 3) == 'wy!') && !msg.author.bot) {
		// Get rid of WY!
        let args = msg.content.substring(3).split(' ');
		// Find the main command
        let mainCommand = args[0];
		// And then the rest of the arguments
		let commandArgs = args.slice(1);
		
		// These messages will only work if it's a guild
		//if (message.guild) {
			switch(mainCommand) {
				case 'arena':
					arena.arenaCommand(sql, msg);
					break;
				// Default Test Message.
				case 'Yuni':
					msg.channel.send('Wen-Yuni-Ty. Uh...');
					break;
				// Waluigi is not an easter egg.
				case 'waluigi':
				case 'Waluigi':
				case 'WALUIGI':
					let luigiRoll = Math.random()
					if (luigiRoll < 0.1) {
						msg.channel.send('Oh yeah! Luigi time!');
					}
					else {
						msg.channel.send('WALUIGI');
					};
					break;
				// Main commands
				case 'help':
					helpCommand(commandArgs, msg)
					break;
				case 'choose':
					chooseCommand(commandArgs, msg)
					break;
				case 'random':
					randomCommand(commandArgs, msg)
					break;
				case 'easterEgg':
					easterEggCommand(commandArgs, msg)
					break;
				// Not found
				default:
					// Easter Egg Support
					if (mainCommand in easterEgg) {
						easterEggFound(mainCommand, msg)
					}
					else {
						msg.channel.send("Sorry!\r\nCommand not found. Try WY!help for a list of commands.");
					}
					break;
			//}
		}
     }
});

function easterEggFound(mainCommand, msg) {
	// Create text
	let easterEggEmbed = new Discord.RichEmbed()
		.setColor(easterEgg[mainCommand]["color"])
		.setTitle(mainCommand)
		.setAuthor('Wenyuniclient')
		.setDescription(easterEgg[mainCommand]['text'])
		.setFooter(textWenyuniFooter());
	
	// Determine if first find
	if (easterEgg[mainCommand]["num"] == 0) {
		easterEggEmbed.addField("First find!", "Congrats!")
		easterEgg[mainCommand]["found"] = msg.author.tag
	}
	else {
		easterEggEmbed.addField("Easter Egg!", "Number of times used prior: " + easterEgg[mainCommand]["num"])
		easterEggEmbed.addField("First Found By", easterEgg[mainCommand]["found"])
	}
	
	// Send message
	msg.channel.send(easterEggEmbed);
	
	// Write the find down
	easterEgg[mainCommand]["num"] = easterEgg[mainCommand]["num"] + 1;
	fs.writeFile ("easterEgg.json", JSON.stringify(easterEgg, null, 4), function(err) {
		if (err) throw err;
		console.log('complete');
	})
}

// Footer
function textWenyuniFooter() {
	let currentDate = new Date()
	return 'Wenyuniclient thinks today is ' + currentDate.getFullYear() + '/' + (currentDate.getMonth()+1)
		+ '/' + currentDate.getDate()
}

// Lists all unfound easter egg text
function easterEggCommand(commandArgs, msg) {
	if (commandArgs[0] == "found") {
		message = ""
		count = {}
		for (x in easterEgg) {
			if (easterEgg[x]["num"] != 0) {
				message += "\r\n" + x
			}
		}
		// If there's none
		if (message == "") {
			message += "\r\n" + "None at this time!"
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#987654")
			.setTitle("Found Easter Eggs")
			.setAuthor('Wenyuniclient')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}
	else {
		message = ""
		for (x in easterEgg) {
			if (easterEgg[x]["num"] == 0) {
				message += "\r\n" + easterEgg[x]["text"]
			}
		}
		// If there's none
		if (message == "") {
			message += "\r\n" + "None at this time!"
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#567890")
			.setTitle("Unfound Easter Egg Quotes")
			.setAuthor('Wenyuniclient')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}
}
// For help
function helpCommand(commandArgs, msg) {
	// Replaced by a dictionary
	if (commandArgs.length > 0) {
		foundCommand = false;
		for (x in helpText) {
			if (commandArgs[0] in helpText[x]) {
				const helpEmbed = new Discord.RichEmbed()
				.setColor('#559955')
				.setTitle(commandArgs[0])
				.setAuthor('Wenyuniclient')
				.setDescription(helpText[x][commandArgs[0]])
				.setFooter(textWenyuniFooter());
				
				// Send
				msg.channel.send(helpEmbed);
				foundCommand = true;
			}
		}
		if (!foundCommand) { // Failed to find
		msg.channel.send("Command not found!");
		}
	}
	// Generic command if no arguments given
	else {
		// Create list of all commands
		const helpEmbed = new Discord.RichEmbed()
			.setColor('#DECADE')
			.setTitle('Wenyunity Help')
			.setAuthor('Wenyuniclient')
			.setDescription("Wenyuniclient is here to list all of the commands!")
			.setFooter(textWenyuniFooter())
			for (x in helpText) {
				desc = ""
				for (y in helpText[x]) {
					desc = desc + " - " + y
				}
				desc = desc + " - "
				helpEmbed.addField(x, desc)
			};
			//.setThumbnail('https://i.imgur.com/wSTFkRM.png')

			//.addBlankField()
			//.addField('Inline field title', 'Some value here', true)
			//.addField('Inline field title', 'Some value here', true)
			//.addField('Inline field title', 'Some value here', true)
			//.setImage('https://i.imgur.com/wSTFkRM.png')
			//.setTimestamp()
		msg.channel.send(helpEmbed);
	}
}

// Chooses between choices
function chooseCommand(commandArgs, msg) {
	if (commandArgs.length == 0) {
		msg.channel.send("I choose the empty set!")
	}
	else if (commandArgs.length == 1) {
		msg.channel.send("It appears I have no choice. I choose " + commandArgs[0]);
	}
	else {
		randomNumber = Math.floor(Math.random() * (commandArgs.length))
		msg.channel.send("I choose " + commandArgs[randomNumber])
	}
}

// Chooses a random number
function randomCommand(commandArgs, msg) {
	// Two numbers: Minimum and maximum
	if (commandArgs.length == 2) {
		let randomNum = Math.random() * (Number(commandArgs[1]) - Number(commandArgs[0])) + Number(commandArgs[0])
		if (isNaN(randomNum)) {
			msg.channel.send("Those don't look like numbers to me...")
		}
		else {
			msg.channel.send("Here's a number between " + commandArgs[0] + " and " + commandArgs[1] + ": " + randomNum)
		}
	}
	// One number: Assumed the other is 0
	else if (commandArgs.length == 1) {
		let randomNum = Math.random() * Number(commandArgs[0])
		if (isNaN(randomNum)) {
			msg.channel.send("That doesn't look like a number to me...")
		}
		else {
			msg.channel.send("Here's a number between 0 and " + commandArgs[0] + ": " + randomNum)
		}
	}
	// No arguments: Between 0 and 1
	else {
		msg.channel.send("Here's a number between 0 and 1: " + Math.random())
	}
}

client.login(auth.token);