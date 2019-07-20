const Discord = require('discord.js');
const auth = require('./auth.json');
const helpText = require('./help.json');
const fs = require('fs');
const easterEgg = JSON.parse(fs.readFileSync('./easterEgg.json', 'utf8'));
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');
const arena = require('./Arena/Arena.js');
const chess = require('./Chess/Chess.js');

// Initialize Discord client
const client = new Discord.Client({
});

// Prepare SQL
client.on('ready', function (evt) {
    console.log(`Logged in as ${client.user.tag}!`);

	// Check if the table "points" exists.
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, points INTEGER, work INTEGER);").run();
		// Ensure that the "id" row is always unique and indexed.
		sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
		sql.pragma("synchronous = 1");
		sql.pragma("journal_mode = wal");
	}

    // And then we have two prepared statements to get and set the score data.
    client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ?");
    client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, points, work) VALUES (@id, @user, @points, @work);");
	//client.addColumn = sql.prepare("ALTER TABLE scores ADD name = ? type = ? NOT NULL DEFAULT default = ?")
});

// Upon getting a message
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
		if (msg.guild) {
			switch(mainCommand) {
				case 'arena':
					arena.arenaCommand(sql, msg);
					break;
				case 'chess':
					chess.chessCommand(msg);
					break;
				// Default Test Message.
				case 'Yuni':
					msg.channel.send('Wen-Yuni-Ty. Uh...');
					break;
				// Waluigi is not an easter egg.
				case 'waluigi':
				case 'Waluigi':
				case 'WALUIGI':
					waluigiCommand(msg);
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
				case 'easteregg':
					easterEggCommand(commandArgs, msg)
					break;
				case 'work':
					workCommand(commandArgs, msg)
					break;
				case 'admin':
					if (msg.author.id === auth.admin) {
						msg.channel.send("Wenyunity.")
					}
					else {
						msg.channel.send("You are not Wenyunity! Access denied!");
					}
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
			}
		}
     }
});

// Waluigi
function waluigiCommand(msg) {
	// Look for WALUIGI and Luigi roles
	const guildMember = msg.member;
	const waluigiAdd = msg.guild.roles.find(role => role.name === "WALUIGI");
	const luigiAdd = msg.guild.roles.find(role => role.name === "Luigi");
	
	// Pick between Waluigi and Luigi
	let luigiRoll = Math.random()
	
	// Luigi
	if (luigiRoll < 0.5) {
		if (luigiAdd) {
			guildMember.addRole(luigiAdd);
		}
		if (waluigiAdd) {
			guildMember.removeRole(waluigiAdd);
		}
		msg.channel.send('Oh yeah! Luigi time!');
	} // Waluigi
	else {
		if (waluigiAdd) {
			guildMember.addRole(waluigiAdd);
		}
		if (luigiAdd) {
			guildMember.removeRole(luigiAdd);
		}
		msg.channel.send('WALUIGI');
	};
	break;
}

// Gets user data
function getData(msg) {
	let data = client.getScore.get(msg.author.id);
	
	if (!data) {
		data = {
			id: `${msg.guild.id}-${msg.author.id}`,
			user: msg.author.id,
			points: 0,
			work: 0
		}
	}
	
	return data;
}

// Work for your money
function workCommand(args, msg) {
	data = getData(msg);
	
	if (Date.now() > data.work) {
		// Gain money
		pointGain = Math.floor(Math.random() * 1200) + 600;
		// Gain points
		data.points += pointGain;
		// Set date
		data.work = Date.now() + pointGain * 1000 * 60 * 1;
		let nextWork = new Date(data.work);
		
		// You got money!
		msg.channel.send("You got " + pointGain + " points! You have a total of " + data.points + " points.\r\nYou can work again on " + nextWork.toString() + 
				"\r\nThat's in " + pointGain + " minutes, about " + Math.floor((pointGain/60)*100)/100 + " hours.");
		client.setScore.run(data);
	}
	else {
		let workDate = new Date(data.work);
		let hours = (data.work - Date.now()) / (60 * 60 * 1000) 
		hours = Math.round(hours * 100)/100;
		// Singular special message
		if (hours === 1) {
			msg.channel.send("You can work again in one hour!");
		} // Normal message
		else {
			msg.channel.send("You need to wait until " + workDate.toString() + " to work again!\r\nThat's about " + hours + " hours, by the way.");
		}
	}
}

// All about easter eggs
function easterEggFound(mainCommand, msg) {
	// Create text
	let easterEggEmbed = new Discord.RichEmbed()
		.setColor(easterEgg[mainCommand]["color"])
		.setTitle(mainCommand)
		.setAuthor('Wenyunibot')
		.setDescription(easterEgg[mainCommand]['text'])
		.setFooter(textWenyuniFooter());
	
	// Determine if first find
	if (easterEgg[mainCommand]["num"] == 0) {
		// Tell user it's first find
		easterEggEmbed.addField("First find!", "Congrats!")
		// Get tag of user
		easterEgg[mainCommand]["found"] = msg.author.tag
	}
	else { // Not first find
		// How many times used
		easterEggEmbed.addField("Easter Egg!", "Number of times used prior: " + easterEgg[mainCommand]["num"])
		// Who found it first
		easterEggEmbed.addField("First Found By", easterEgg[mainCommand]["found"])
	}
	
	// Send message
	msg.channel.send(easterEggEmbed);
	
	// Write the number down
	easterEgg[mainCommand]["num"] = easterEgg[mainCommand]["num"] + 1;
	fs.writeFile ("easterEgg.json", JSON.stringify(easterEgg, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to easterEgg.json');
	})
}

// Footer
function textWenyuniFooter() {
	let currentDate = new Date()
	return 'Wenyunibot thinks today is ' + currentDate.getFullYear() + '/' + (currentDate.getMonth()+1)
		+ '/' + currentDate.getDate()
}

// Lists all unfound easter egg text
function easterEggCommand(commandArgs, msg) {
	// Default
	if (commandArgs.length == 0) {
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
			.setAuthor('Wenyunibot')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}	
	else if (commandArgs[0] == "found") { // Found
		let message = ""
		let count = []
		for (x in easterEgg) {
			if (easterEgg[x]["num"] != 0) {
				count.push([x, easterEgg[x]["num"]])
			}
		}
		// If there's none
		if (count == []) {
			message += "\r\n" + "None at this time!"
		}
		else {
			// Sort all items
			count.sort(function (a, b){return b[1]-a[1]});
			let rank = 0
			let lastSeen = -1
			
			// And then rank them.
			for (x = 0; x < count.length; x++) {
				if (lastSeen != count[x][1]) {
					rank += 1;
					lastSeen = count[x][1]
				}
				message += "R" + rank + " - " + count[x][0] + ": " + count[x][1] + "\r\n";
			}
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#987654")
			.setTitle("Found Easter Eggs")
			.setAuthor('Wenyunibot')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}
	else if (commandArgs[0] == "first") { // Found
		let message = ""
		let counter = []
		// For each easter egg
		for (egg in easterEgg) {
			// Check if iser already found one
			if (easterEgg[egg]["num"] != 0) { // If they did
				found = false;
				for (x = 0; x < counter.length; x++) { // Add
					if (easterEgg[egg]["found"] === counter[x][0]) {
						counter[x][1] += 1;
						found = true;
					}
				}
				if (!found) { // Push user onto list
					counter.push([easterEgg[egg]["found"], 1])
				}
			}
		}
		// If there's none
		if (counter == {}) {
			message += "\r\n" + "None at this time!"
		}
		else {
			// Sort all items
			counter.sort(function (a, b){return b[1]-a[1]});
			let rank = 0
			let lastSeen = -1
			
			// And then rank them.
			for (x = 0; x < counter.length; x++) {
				if (lastSeen != counter[x][1]) {
					rank += 1;
					lastSeen = counter[x][1]
				}
				message += "R" + rank + " - " + counter[x][0] + ": " + counter[x][1] + "\r\n";
			}
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#24e857")
			.setTitle("Easter Egg Finders")
			.setAuthor('Wenyunibot')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}
	else {
		if (commandArgs[0] in easterEgg) {
			easterEggFound(commandArgs[0], msg)
		}
		else {
			msg.channel.send("Invalid easter egg! All easter eggs are written without spaces and use PascalCase.");
		}
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
				.setAuthor('Wenyunibot')
				.setDescription(helpText[x][commandArgs[0]]["desc"])
				.setFooter(textWenyuniFooter());
				
				// Add argument message
				argsmessage = "";
				for (key in helpText[x][commandArgs[0]]["args"]) {
					argsmessage += "**" + key + "** - " + helpText[x][commandArgs[0]]["args"][key] + "\r\n"
				}
				if (argsmessage) {
					helpEmbed.addField("Command Arguments", argsmessage);
				}
				
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
			.setAuthor('Wenyunibot')
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
		msg.channel.send(helpEmbed);
	}
}

// Chooses between choices
function chooseCommand(commandArgs, msg) {
	let chooseText = "";
	for (i = 0; i < commandArgs.length; i++) {
			chooseText += commandArgs[i] + " ";
	}
	let chooseArgs = chooseText.split(', ');
	
	if (chooseArgs.length == 0) {
		msg.channel.send("I choose the empty set!")
	}
	else if (chooseArgs.length == 1) {
		msg.channel.send("It appears I have no choice. I choose " + chooseArgs[0]);
	}
	else {
		randomNumber = Math.floor(Math.random() * (chooseArgs.length))
		msg.channel.send("I choose " + chooseArgs[randomNumber])
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

// Log in
client.login(auth.token);