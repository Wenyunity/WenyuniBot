const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
const helpText = require('./help.json');

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
    if (message.substring(0, 3) == 'WY!') {
		// Get rid of WY!
        let args = message.substring(3).split(' ');
		// Find the main command
        let mainCommand = args[0];
		// And then the rest of the arguments
		let commandArgs = args.slice(1);
       
        switch(mainCommand) {
            // Easter Egg Messages
            case 'Yuni':
                bot.sendMessage({
                    to: channelID,
                    message: "Wen-Yuni-Ty. That's not how this works."
                });
				break;
			case 'Iori':
                bot.sendMessage({
                    to: channelID,
                    message: "That happened! But how...?"
                });
				break;
			case 'Sayuri':
                bot.sendMessage({
                    to: channelID,
                    message: "Oh. You're here."
                });
				break;
			case 'Erina':
                bot.sendMessage({
                    to: channelID,
                    message: "Didn't think this one would be found out."
                });
				break;
			case 'Riyu':
                bot.sendMessage({
                    to: channelID,
                    message: "Hi!"
                });
				break;
			case 'Tama':
                bot.sendMessage({
                    to: channelID,
                    message: "What?"
                });
				break;
			case 'June':
                bot.sendMessage({
                    to: channelID,
                    message: "Isn't summer great?"
                });
				break;
			case 'Aria':
                bot.sendMessage({
                    to: channelID,
                    message: "Ah... that sky..."
                });
				break;
			case 'Luna':
                bot.sendMessage({
                    to: channelID,
                    message: "Not yet... it's not time yet..."
                });
				break;
			case 'Momo':
                bot.sendMessage({
                    to: channelID,
                    message: "Hey! We're here!"
                });
				break;
			case 'Kanon':
                bot.sendMessage({
                    to: channelID,
                    message: "This is silly."
                });
				break;				
			case 'Pia':
                bot.sendMessage({
                    to: channelID,
                    message: "I don't think this bot is sellable yet."
                });
				break;	
			case 'Yoyui':
                bot.sendMessage({
                    to: channelID,
                    message: "Did you need something?"
                });
				break;
			case 'waluigi':
			case 'Waluigi':
			case 'WALUIGI':
                bot.sendMessage({
                    to: channelID,
                    message: "WALUIGI"
                });
				break;
			// help
			case 'help':
				helpCommand(commandArgs, channelID)
				break;
			case 'choose':
				chooseCommand(commandArgs, channelID)
				break;
			default:
				bot.sendMessage({                    
					to: channelID,
						message: "Guess that command isn't supported yet. Try *WY!help* for commands."
                });
				break;
            // Just add any case commands if you want to..
         }
     }
});

// For help
function helpCommand(commandArgs, channelID) {
	// Probably should be replaced by a dictionary
	if (commandArgs.length > 0) {
		bot.sendMessage({                    
			to: channelID,
			message: helpText[commandArgs[0]] || "Command not found!"
		});
	}
	// Generic command if no arguments given
	else {
		bot.sendMessage({                    
			to: channelID,
			message: "List of commands would go here! Unfortunately that's not quite done yet!"
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
		randomNumber = Math.floor(Math.random() * (commandArgs.length + 1))
		bot.sendMessage({                    
			to: channelID,
			message: "I choose " + commandArgs[randomNumber]
		});
	}
}