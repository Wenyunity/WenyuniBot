const Discord = require('discord.io');
const DiscordJS = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const helpText = require('./help.json');
const easterEgg = require('./easterEgg.json');

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
			default:
				bot.sendMessage({                    
					to: channelID,
						message: (easterEgg[mainCommand] || "Sorry!") + "\r\n Command not found. Try WY!help for a list of commands."
                });
				break;
            // Just add any case commands if you want to..
         }
     }
});

// For help
function helpCommand(commandArgs, channelID) {
	// Replaced by a dictionary
	if (commandArgs.length > 0) {
		foundCommand = false;
		for (x in helpText) {
			if (commandArgs[0] in helpText[x]) {
				bot.sendMessage({                    
					to: channelID,
					message: helpText[x][commandArgs[0]]
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
		let messageSend = "List of Commands:\r\n`";
		messageSend = messageSend + "`";
		let currentDate = new Date()
		const helpEmbed = new DiscordJS.RichEmbed()
			.setColor('#DECADE')
			.setTitle('Wenyunity Help')
			.setAuthor('WenyuniBot')
			.setDescription("Wenyunibot is here to list all of the commands!")
			.setFooter('WenyuniBot thinks today is: ' + currentDate.getFullYear()+'/'+(currentDate.getMonth()+1)+'/'+currentDate.getDate())
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

function randomCommand(commandArgs, channelID) {
		bot.sendMessage({                    
			to: channelID,
			message: "Here's the random number: " + Math.toString(Math.random())
		});
}