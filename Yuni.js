const Discord = require('discord.io');
const DiscordJS = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const helpText = require('./help.json');
const fs = require('fs');
const easterEgg = JSON.parse(fs.readFileSync('./easterEgg.json', 'utf8'));

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
let bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // It will listen for messages that will start with `WY!`
	// Except for those that came from the bot itself.
    if ((message.substring(0, 3) == 'WY!' || message.substring(0, 3) == 'wy!') && userID != bot.id) {
		// Get rid of WY!
        let args = message.substring(3).split(' ');
		// Find the main command
        let mainCommand = args[0];
		// And then the rest of the arguments
		let commandArgs = args.slice(1);
       
        switch(mainCommand) {
            // Default Test Message.
            case 'Yuni':
                bot.sendMessage({
                    to: channelID,
                    message: "Wen-Yuni-Ty. That's not how this works."
                });
				break;
			// Waluigi is not an easter egg.
			case 'waluigi':
			case 'Waluigi':
			case 'WALUIGI':
				let luigiRoll = Math.random()
				if (luigiRoll < 0.1) {
					bot.sendMessage({
						to: channelID,
						message: "Oh yeah! Luigi time!"
					});
				}
				else {
				    bot.sendMessage({
						to: channelID,
						message: "WALUIGI"
					});
				};
				break;
			// help
			case 'help':
				helpCommand(commandArgs, channelID)
				break;
			case 'choose':
				chooseCommand(commandArgs, channelID)
				break;
			case 'random':
				randomCommand(commandArgs, channelID)
				break;
			case 'easterEgg':
				easterEggCommand(channelID)
				break;
			default:
				// Easter Egg
				if (mainCommand in easterEgg) {
					easterEggFound(mainCommand, channelID)
				}
				else {
					bot.sendMessage({                    
						to: channelID,
						message: ("Sorry!\r\nCommand not found. Try WY!help for a list of commands.")
					});
				}
				break;
            // Just add any case commands if you want to..
         }
     }
});

function easterEggFound(mainCommand, channelID) {
	// Create text
	let easterEggEmbed = new DiscordJS.RichEmbed()
		.setColor(easterEgg[mainCommand]["color"])
		.setTitle(mainCommand)
		.setAuthor('WenyuniBot')
		.setDescription(easterEgg[mainCommand]['text'])
		.setFooter(textWenyuniFooter());
	
	// Determine if first find
	if (easterEgg[mainCommand]["num"] == 0) {
		easterEggEmbed.addField("First find!", "Congrats!", true)
	}
	else {
		easterEggEmbed.addField("Easter Egg!", "Number of times used: " + easterEgg[mainCommand]["num"], true)
	}
	
	// Send message
	bot.sendMessage({                    
		to: channelID,
		embed: easterEggEmbed
	});
	
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
	return 'WenyuniBot thinks today is ' + currentDate.getFullYear() + '/' + (currentDate.getMonth()+1)
		+ '/' + currentDate.getDate()
}

// Lists all unfound easter egg text
function easterEggCommand(channelID) {
	message = "-Easter Egg Board-"
	for (x in easterEgg) {
		if (easterEgg[x]["num"] == 0) {
			message += "\r\n" + easterEgg[x]["text"]
		}
	}
	// If there's none
	if (message == "-Easter Egg Board-") {
		message += "\r\n" + "None at this time!"
	}
	
	// Create text
	let easterEggEmbed = new DiscordJS.RichEmbed()
		.setColor("#567890")
		.setTitle("Unfound Easter Egg Quotes")
		.setAuthor('WenyuniBot')
		.setDescription(message)
		.setFooter(textWenyuniFooter());
	
	// Send message
	bot.sendMessage({                    
		to: channelID,
		embed: easterEggEmbed
	});
}
// For help
function helpCommand(commandArgs, channelID) {
	// Replaced by a dictionary
	if (commandArgs.length > 0) {
		foundCommand = false;
		for (x in helpText) {
			if (commandArgs[0] in helpText[x]) {
				const helpEmbed = new DiscordJS.RichEmbed()
				.setColor('#559955')
				.setTitle(commandArgs[0])
				.setAuthor('WenyuniBot')
				.setDescription(helpText[x][commandArgs[0]])
				.setFooter(textWenyuniFooter());
				bot.sendMessage({                    
					to: channelID,
					embed: helpEmbed
				});
				foundCommand = true;
			}
		}
		if (!foundCommand) {
		bot.sendMessage({                    
			to: channelID,
			message: "Command not found!"
		});
		}
	}
	// Generic command if no arguments given
	else {
		// Create list of all commands
		const helpEmbed = new DiscordJS.RichEmbed()
			.setColor('#DECADE')
			.setTitle('Wenyunity Help')
			.setAuthor('WenyuniBot')
			.setDescription("Wenyunibot is here to list all of the commands!")
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
		bot.sendMessage({                    
			to: channelID,
			embed: helpEmbed
		});
	}
}

// Chooses between choices
function chooseCommand(commandArgs, channelID) {
	if (commandArgs.length == 0) {
		bot.sendMessage({                    
			to: channelID,
			message: "I choose the empty set!"
		});
	}
	else if (commandArgs.length == 1) {
		bot.sendMessage({                    
			to: channelID,
			message: "It appears I have no choice. I choose " + commandArgs[0]
		});
	}
	else {
		randomNumber = Math.floor(Math.random() * (commandArgs.length))
		bot.sendMessage({                    
			to: channelID,
			message: "I choose " + commandArgs[randomNumber]
		});
	}
}

// Chooses a random number
function randomCommand(commandArgs, channelID) {
	// Two numbers: Minimum and maximum
	if (commandArgs.length == 2) {
		let randomNum = Math.random() * (Number(commandArgs[1]) - Number(commandArgs[0])) + Number(commandArgs[0])
		if (isNaN(randomNum)) {
			bot.sendMessage({                    
				to: channelID,
				message: "Those don't look like numbers to me..."
			});
		}
		else {
			bot.sendMessage({                    
				to: channelID,
				message: "Here's a number between " + commandArgs[0] + " and " + commandArgs[1] + ": " + randomNum
			});
		}
	}
	// One number: Assumed the other is 0
	else if (commandArgs.length == 1) {
		let randomNum = Math.random() * Number(commandArgs[0])
		if (isNaN(randomNum)) {
			bot.sendMessage({                    
				to: channelID,
				message: "That doesn't look like a number to me..."
			});
		}
		else {
			bot.sendMessage({                    
				to: channelID,
				message: "Here's a number between 0 and " + commandArgs[0] + ": " + randomNum
			});
		}
	}
	// No arguments: Between 0 and 1
	else {
		bot.sendMessage({                    
			to: channelID,
			message: "Here's a number between 0 and 1: " + Math.random()
		});
	}
}