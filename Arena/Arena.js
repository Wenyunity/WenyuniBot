const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');
const newMove = JSON.parse(fs.readFileSync('./Arena/movelist.json', 'utf8'));

// Creates an attack/basic move
function createAttackMove(isBasic) {
	let nameObject = {MP: 0, team: "enemy"}
	
	// Name
	nameObject["name"] = newMove["name"]["adjective"][Math.floor(Math.random() * (newMove["name"]["adjective"].length))] +
		" " + newMove["name"]["noun"][Math.floor(Math.random() * (newMove["name"]["noun"].length))];
	
	// Base power
	nameObject["power"] = newMove["base"];
	
	let moveType = "attack"
	if (isBasic) {
		moveType = "basic"
	}
	
	// Target selection
	let targetType = newMove[moveType]["target"][Math.floor(Math.random() * newMove[moveType]["target"].length)]
	nameObject["target"] = targetType[0];
	nameObject["power"] = nameObject["power"] + targetType[1];
	
	// Effect selection
	if (Math.random() > 0.5) {
		// Get effect and length
		let effectType = newMove[moveType]["effect"][Math.floor(Math.random() * newMove[moveType]["effect"].length)]
		let lengthType = newMove[moveType]["length"][Math.floor(Math.random() * newMove[moveType]["length"].length)]
		
		// Set effect and length and calculate power difference
		nameObject["effect"] = effectType[0];		
		nameObject["length"] = lengthType[0];
		nameObject["power"] = nameObject["power"] + lengthType[1] * effectType[1];
	}
	else { // No effect (50% chance)
		nameObject["effect"] = "None";
		nameObject["length"] = 0;
	}
	
	// MP adjust
	if (nameObject["power"] < 0) {
		nameObject["MP"] = -1 * nameObject["power"];
		nameObject["power"] = 0;
	}
	
	// Add more power
	if (!isBasic) {
		let powerAdd = Math.floor(Math.random() * 9) + 1
		nameObject["MP"] = powerAdd + nameObject["MP"];
		nameObject["power"] = nameObject["power"] + powerAdd;
	}
	
	return nameObject;
}

// Creates a support move
function createSupportMove() {
	let nameObject = {name: "", target: "", effect: "", length: 0, MP: 0, team: "ally"};
	
	// Name
	nameObject.name = newMove["name"]["adjective"][Math.floor(Math.random() * (newMove["name"]["adjective"].length))] +
		" " + newMove["name"]["noun"][Math.floor(Math.random() * (newMove["name"]["noun"].length))];
	
	// Move type
	let moveType = "support"
	
	// Target selection
	let targetType = newMove[moveType]["target"][Math.floor(Math.random() * newMove[moveType]["target"].length)]
	nameObject.target = targetType[0];
	nameObject.MP = nameObject.MP + targetType[1];
	
	// Effect selection
	// Get effect and length
	let effectType = newMove[moveType]["effect"][Math.floor(Math.random() * newMove[moveType]["effect"].length)]
	let lengthType = newMove[moveType]["length"][Math.floor(Math.random() * newMove[moveType]["length"].length)]
	
	// Set effect and length and calculate power difference
	nameObject.effect = effectType[0];		
	nameObject.length = lengthType[0];
	nameObject.MP = nameObject.MP + lengthType[1] * effectType[1];
	
	return nameObject;
}

// Creates a character
/*function create(msg, arguments) {
	if(arguments.length == 0) {
		msg.channel.send("Please select the number of magic attack moves! (Between 0 and 5)")
	}
	else if(arguments[0] > 5) {
		msg.channel.send("Only up to five magic moves allowed!")
	}
	else {
		const createEmbed = new Discord.RichEmbed()
				.setColor('#ED9105')
				.setTitle('Create a Character')
				.setAuthor('Wenyunibot')
				.setDescription("Beta Character")
				.addField("Basic Move", readMove(createAttackMove(true)));
		for (i = 0; i < Math.floor(arguments[0]); i++) {
			//createEmbed.addField("Magic Move " + i, JSON.stringify(createAttackMove(false), null, 1))
			createEmbed.addField("Magic Move " + i, readMove(createAttackMove(false)))
		};
		for (i = Math.floor(arguments[0]); i < 5; i++) {
			//createEmbed.addField("Magic Move " + i, JSON.stringify(createSupportMove(), null, 1))
			createEmbed.addField("Magic Move " + i, readMove(createSupportMove()))
		}
		msg.channel.send(createEmbed);
	}
}*/

function create(msg, arguments) {
	if(arguments.length < 2) {
		msg.channel.send("Please send two numbers indicating the number of magic attack moves! (Between 0 and 5)")
		return;
	}
	
	if (isNaN(parseInt(arguments[0])) || isNaN(parseInt(arguments[0]))) {
		msg.channel.send("These are not numbers!")
		return;
	}
	
	if(arguments[0] > 5 || arguments[1] > 5) {
		msg.channel.send("Only up to five magic moves allowed!")
		return;
	}
	else {
		for (m = 0; m < 2; m++) {
			const createEmbed = new Discord.RichEmbed()
					.setColor('#ED9105')
					.setTitle('Create a Character')
					.setAuthor('Wenyunibot')
					.setDescription("Beta Character")
					.addField("Basic Move", readMove(createAttackMove(true)));
			for (i = 0; i < Math.floor(arguments[m]); i++) {
				//createEmbed.addField("Magic Move " + i, JSON.stringify(createAttackMove(false), null, 1))
				createEmbed.addField("Magic Move " + i, readMove(createAttackMove(false)))
			};
			for (i = Math.floor(arguments[m]); i < 5; i++) {
				//createEmbed.addField("Magic Move " + i, JSON.stringify(createSupportMove(), null, 1))
				createEmbed.addField("Magic Move " + i, readMove(createSupportMove()))
			}
			msg.channel.send(createEmbed);
		}
	}
}

// Turns object move into readable text
function readMove(move) {
	message = "";
	
	// Move Name
	message = message + "**" + move["name"] + "** *(" + move["MP"] + " MP)*: ";
	// Attack Move
	if (move["team"] == "enemy") {
		// Power
		message = message + "Deals " + move["power"] + " damage to ";
		// All
		if (move["target"] == "all") {
			message += "all enemies."
		} // Any
		else if (move["target"] == "any") {
			message += "any enemy."
		} // Front
		else {
			message += "the front enemy."
		}
		// Effect
		if (move["length"]) {
			message += " Gives the " + move["effect"] + " status for ";
			if (move["length"] == 1) {
				message += "1 turn.";
			}
			else {
				message += move["length"] + " turns."
			}
		}
	}
	else {
		message += " Gives " 
		if (move["target"] == "all") {
			message += "all allies"
		} // Any
		else if (move["target"] == "any") {
			message += "any ally"
		} // Front
		else {
			message += "self"
		}
		message += " the " + move["effect"] + " status for ";
		if (move["length"] == 1) {
			message += "1 turn.";
		}
		else {
			message += move["length"] + " turns.";
		}
	}
	
	return message;
}

function fight() {
    console.log('in admin 2 command');
    // your command code here
}

module.exports = {
    arenaCommand: function(sql, msg) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!arena mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
            case 'help':
                // set found equal to true so your index.js file knows
                //   to not try executing 'other' commands
                // execute function associated with this command
                msg.channel.send("WALUIGI")
                break;

            // your second admin command (similar setup as above)
            case 'create':
                create(msg, arguments);
                break;

            // ... more admin commands
        }
	}
}