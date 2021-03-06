// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');
const Battle = require('./Battle.js');
const Data = require('./ArenaData.js');

// -- CONSTANTS --
const newMove = JSON.parse(fs.readFileSync('./Arena/movelist.json', 'utf8'));
const moduleColor = "#ED9105"
const nameLimit = 40;
const enemyList = JSON.parse(fs.readFileSync(`./Arena/Enemy/Season1.json`, 'utf8'));
const hour = 1000 * 60 * 60;
const minute = 1000 * 60;
const helpText = JSON.parse(fs.readFileSync('./Arena/arenaHelp.json', 'utf8'));

// -- CHARACTER CREATION --

// Sanitizes names. For now, replaces them all with "+".
function sanitize(name) {
	return name.replace(/(@|\\|\*)/g, "+").substring(0, nameLimit);
}

// Creates a character
function create(msg, client, arguments) {
	team = {};
	try { // If a team is loaded, you already have one
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
		client.basicEmbed("You already have a team!", "Use `wy!arena delete` to delete your team.", msg.channel, moduleColor);
		return;
	}
	catch (err) { // No team, time to make one.
		team = {};
	}

	if(arguments.length < 2) {
		client.basicEmbed("Create Error", "Please send two numbers indicating the number of magic attack moves! (Between 0 and 5)", msg.channel, moduleColor);
		return;
	}
	
	if (isNaN(parseInt(arguments[0])) || isNaN(parseInt(arguments[0]))) {
		client.basicEmbed("Create Error", "These are not numbers!", msg.channel, moduleColor);
		return;
	}
	
	// Team type
	team.type = "player";
	team.teamName = `${msg.author.tag}'s Team ` + Math.floor(Math.random() * 100);
	team.ownerID = `${msg.author.id}`;
	team.arenaRank = false;
	if(arguments[0] > 5 || arguments[1] > 5) {
		client.basicEmbed("Create Error", "Only up to five magic moves allowed!", msg.channel, moduleColor);
		return;
	}
	else {
		team.characterList = [];
		for (m = 0; m < 2; m++) {
			// Create character
			character = {};
			// Name
			if (arguments.length > m+3) {
				character.name = sanitize(arguments[m+4]);
			}
			else {
				character.name = "Character " + m
			}
			// Defense
			if (arguments[m+2]) {
				if (["0", "1", "2", "3"].includes(arguments[m+2])) {
					character.DEF = parseInt(arguments[m+2]);
				}
				else {
					client.basicEmbed("Create Error", "Defense must be between 0 and 3.", msg.channel, moduleColor);
					return;
				}
			}
			else {
				character.DEF = Math.floor(Math.random() * 4)
			}
			character.HP = 40 - 5 * character.DEF;
			character.MaxHP = character.HP;
			character.HPGain = 6 - character.DEF;
			character.MP = 20;
			character.MaxMP = character.MP;
			character.MPGain = 4;
			character.slots = 2;
			// Statuses
			character.statusList = [];
			// Create thing to hold moves
			character.move = [];
			character.move.push(createAttackMove(true));
			for (i = 0; i < Math.floor(arguments[m]); i++) {
				character.move.push(createAttackMove(false))
			};
			for (i = Math.floor(arguments[m]); i < 5; i++) {
				character.move.push(createSupportMove())
			}
			team.characterList.push(character);
		}
	}
	
	Data.createData(msg.author, team.teamName);
	
	fs.writeFile(`./Arena/Fighter/${msg.author.id}.json`, JSON.stringify(team, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena');
	})
	
	displayPlayerTeam(msg, team);
}

// Creates an attack/basic move
function createAttackMove(isBasic) {
	let nameObject = {name: "", MP: 0, team: "enemy"}
	
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
		nameObject["power"] = nameObject["power"] + Math.ceil(lengthType[1] * effectType[1]);
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
	let nameObject = {name: "", MP: 0, team: "ally", target: "", effect: "", length: 0};
	
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
	nameObject.MP = nameObject.MP + Math.ceil(lengthType[1] * effectType[1]);
	
	return nameObject;
}

// -- CHARACTER DISPLAY --

// Displays a character.
function displayPlayerTeam(msg, team) {
	const teamEmbed = new Discord.RichEmbed()
			.setColor(moduleColor)
			.setTitle('Team Name')
			.setAuthor('Wenyunibot')
			.setDescription(`Team Owner: ${msg.author.tag}`)
			.addField("Summary Statistics", displayTeamStats(team.characterList));
	for (z = 0; z < 2; z++) {
		teamEmbed.addField(team.characterList[z].name +"'s Moves", displayMoves(team.characterList[z].move));
	}
	teamEmbed.addField("Growth Statistics", displayGrowthStats(team.characterList));
	
	msg.channel.send(teamEmbed);
}

// Displays stats for team
function displayTeamStats(characterList) {
	
	message = "";
	for (c = 0; c < characterList.length; c++) {
		message += "`[" + c + "]` - " + displayPlayerStats(characterList[c]) + "\r\n";
	}
	return message;
}

// Displays a player's stats
function displayPlayerStats(player) {
	let cross = "";
	let statusText = "";
	if (player.HP <= 0) {
		cross = "~~";
	}
	if (player.statusList.length > 0) {
		statusText = getStatusText(player.statusList);
	}
	return cross + `**${player.name}** - ${player.HP}/${player.MaxHP} HP, ${player.MP}/${player.MaxMP} MP, ${player.DEF} DEF ${statusText}` + cross;
}

// Displays a player's growth
function displayGrowthStats(characterList) {
	message = "";
	for (c = 0; c < characterList.length; c++) {
		message += `\r\n**${characterList[c].name}** - +${characterList[c].HPGain} HP/level, +${characterList[c].MPGain} MP/level`;
	}
	return message;
}

// Displays character moves
function displayMoves(moveset) {
	// Basic move
	message = "";
	for (i = 0; i < moveset.length; i++) {
		message += "\r\n`[" + i + "]` " + readMove(moveset[i]);
	}
	return message;
}

// Turns object move into readable text
function readMove(move) {
	message = "";
	
	// Move Name
	message = message + "- **" + move["name"] + " (" + move["MP"] + " MP)**: ";
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

// Views a team.
function viewTeam(msg, client) {
	// Try to load team
	team = {};
	try {
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No team found!", `Could not find a team for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	displayPlayerTeam(msg, team);
}

// Levels up team
function levelUp(msg, client) {
	team = {};
	try {
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No team found!", `Could not find a team for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	for (m = 0; m < team.characterList.length; m++) {
		let character = team.characterList[m];
		character.HP += character.HPGain;
		character.MaxHP += character.HPGain;
		character.MP += character.MPGain;
		character.MaxMP += character.MPGain;
	}
	
	fs.writeFile(`./Arena/Fighter/${msg.author.id}.json`, JSON.stringify(team, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena');
	})
}

// -- ENEMY DISPLAY --

// Displays enemy stats
function displayEnemyTeamStats(characterList) {
	message = "";
	for (c = 0; c < characterList.length; c++) {
		message += "`[" + c + "]` - " + displayEnemyStats(characterList[c]) + "\r\n";
	}
	return message;
}

// Helper function
function displayEnemyStats(enemy) {
	let cross = "";
	let statusText = "";
	if (enemy.HP <= 0) {
		cross = "~~";
	};
	if (enemy.statusList.length > 0) {
		statusText = getStatusText(enemy.statusList);
	}
	message = cross + `**${enemy.name}** - ${enemy.HP}/${enemy.MaxHP} HP, ${enemy.ATK} ATK, ${enemy.DEF} DEF ` + statusText + cross;
	return message;
}

// -- DISPLAY --

// Display status text
function getStatusText(statusList) {
	let statusText = "*( - ";
	
	// Add status names
	for (x = 0; x < statusList.length; x++) {
		statusText += `${(statusList[x].name.charAt(0).toUpperCase() + statusList[x].name.substring(1))}! [${statusList[x].length}] - `;
	}
	
	// Add status text
	statusText += " )*";
	return statusText;
}

// Display current battle state.
function displayBattle(msg, client, battle, moveList) {
	// Setup Embed
	const battleEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle('Battle!')
		.setAuthor('Wenyunibot')
		.setDescription(`${msg.author.tag}'s current battle.`)
	
	// Add moves
	if (moveList) {
		moveList.forEach(item => addMoveField(item, battleEmbed));
	}
	
	// Front team
	if (battle.front.type === "player") {
		battleEmbed.addField(`${battle.front.teamName}` || "Front Team", displayTeamStats(battle.front.characterList));
	}
	else {
		battleEmbed.addField(`${battle.front.teamName}` || "Front Team", displayEnemyTeamStats(battle.front.characterList));
	}
	
	// Back Team
	if (battle.back.type === "player") {
		battleEmbed.addField(`${battle.back.teamName}` || "Back Team", displayTeamStats(battle.back.characterList));
	}
	else {
		battleEmbed.addField(`${battle.back.teamName}` || "Back Team", displayEnemyTeamStats(battle.back.characterList));
	}
	
	// Who can move
	battleEmbed.addField("Able To Move", battle.moves);
	
	return battleEmbed;
}

// For view function.
function viewBattle(msg, client, battle) {
	// Check if battle exists.
	battle = {};
	try {
		battle = JSON.parse(fs.readFileSync(`./Arena/Battle/BA${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No battle found!", `Could not find a battle for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	// Send battle text.
	msg.channel.send(displayBattle(msg, client, battle));
}

// Adding fields
function addMoveField(move, battleEmbed) {
	var titleText = `**${move.moveUser}** used **${move.moveName}**!`;
	var descriptionText = "";
	
	var descriptionTextArray = move.effectArray.filter(item => item.name).map(item => getArrayText(item));
	descriptionText = descriptionTextArray.join("\r\n");
	
	if (descriptionText === "") {
		descriptionText = "It didn't do anything...";
	}
	if (move.statusDamage) {
		descriptionText += `\r\n${move.moveUser}'s HP changed by ${move.statusDamage} due to statuses.`;
	}
	
	battleEmbed.addField(titleText, descriptionText);
}

// Gets text for a move
function getArrayText(effectItem) {
	// Name
	var effectText = `${effectItem.name} `;
	// Damage
	if (effectItem.damage) {
		// Miss
		if (effectItem.damage === "miss") {
			return `It missed ${effectItem.name}!`;
		}
		else { // Hit
			effectText += `took ${effectItem.damage} damage`
			// Status
			if (effectItem.statusText) {
				effectText += ` and now has the ${effectItem.statusText} effect for ${effectItem.statusLength} turn`
				if (effectItem.statusLength !== 1) {
					effectText += "s";
				}
			}
		}
	}
	// Else (Just Status)
	else if (effectItem.statusLength) {
		effectText += `got the ${effectItem.statusText} effect for ${effectItem.statusLength} turn`;
		if (effectItem.statusLength !== 1) {
			effectText += "s";
		}
	}
	else {
		effectText += "wasn't affected by the move?";
	}
	effectText += "!"
	return effectText;
}

// -- FIGHTING --

// Start a fight
function startFight(msg, client, arguments) {
	// So how do we do this...
	// Try to load team
	team = {};
	try {
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No team found!", `Could not find a team for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	// Try to load battle
	let battle = {};
	try {
		battle = JSON.parse(fs.readFileSync(`./Arena/Battle/BA${msg.author.id}.json`, 'utf8'));
		// If we succeed then don't let them through
		client.basicEmbed("Battle ongoing", `${msg.author.tag}, you have a battle ongoing!`, msg.channel, moduleColor);
		return;
	}
	catch (err) {
		console.log(`Battle available for ${msg.author.tag}`);
	}
	
	
	// Check if cooldown
	let time = Data.getTime(msg.author.id) - Date.now();
	if (time > 0) {
		client.basicEmbed("Cooldown!", `You'll need to wait about **${Math.floor(time/hour)} hours and ${Math.ceil((time%hour)/minute)} minutes** for the next match.`, msg.channel, moduleColor);
		return;
	}
	
	// Get enemy
	enemy = enemyList[Data.getNextMatch(msg.author.id)];
	if (!enemy) {
		client.basicEmbed("Something went wrong!", `Could not find an enemy team for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	// Start battle
	battle = {front: team, back: enemy, turn: "back", moves: [0, 0, 0, 0, 0]};
	// Switch to player turn
	Battle.switchTurn(battle);
	// Display battle
	msg.channel.send(displayBattle(msg, client, battle));
	
	// Set new cooldown
	Data.setTime(msg.author.id);
	
	// Save
	fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena battle');
	})
}

// Attacks
function attackMenu(msg, client, arguments) {
	// For now we'll leave it like this
    let battle = {};
	try {
		battle = JSON.parse(fs.readFileSync(`./Arena/Battle/BA${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No battle found!", `Could not find a battle for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	// Arguments
	if (!arguments || arguments.length < 2) {
		client.basicEmbed("Not Enough Arguments", "Could not find arguments", msg.channel, moduleColor);
		return;
	}
	
	if (isNaN(...arguments)) {
		client.basicEmbed("Arguments are not numbers", "Cannot input numbers", msg.channel, moduleColor);
	}
	
	let returnValue = [];
	try {
		returnValue.push(Battle.useMove(battle, arguments[0], arguments[1], arguments[2]));
	}
	catch (err) {
		client.basicEmbed("Move Error", err, msg.channel, moduleColor);
		return;
	}
	console.log(returnValue);
	console.log(returnValue[0].effectArray);
	
	// Send
	msg.channel.send(displayBattle(msg, client, battle, returnValue));
	
	// Winner found, end battle.
	if (returnValue[0].winner) {
		battleEnd(msg, client, battle, returnValue[0].winner);
	}
	// Player turn over, do enemy turn.
	else if (battle[battle.turn].type === "enemy") {
		enemyPhase(msg, client, battle);
	}
	else { // Save battle.
		fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
			if (err) throw err;
			console.log('completed writing to arena battle');
		});
	}

}

// Enemy phase
function enemyPhase(msg, client, battle) {
	// This turn
	var currentTurn = battle.turn;
	// Number of allies
	var numAlly = battle[battle.turn].characterList.length;
	var numEnemies = 0;
	// Number of enemies
	if (currentTurn === "back") {
		numEnemies = battle.front.characterList.length;
	}
	else {
		numEnemies = battle.back.characterList.length;
	}
	
	var moveText = [];
	var isWinner = false;
	// While this is true
	while (currentTurn === battle.turn && isWinner == false) {
		
		// Grab character who can move
		var nextChar = battle.moves.findIndex(x => x > 0);
		// Grab a random move
		var nextMove = Math.floor(Math.random() * battle[battle.turn].characterList[nextChar].move.length);
		
		// Grab target
		var target = 0;
		if (battle[battle.turn].characterList[nextChar].move.team === "ally") {
			var target = Math.floor(Math.random() * numAlly);
		}
		else {
			var target = Math.floor(Math.random() * numEnemies);
		}
		
		// Attack!
		try {
			moveText.push(Battle.useMove(battle, nextChar, nextMove, target));
			isWinner = moveText[moveText.length - 1].winner;
		}
		catch (error) {
			console.log(error);
		}
	}
	
	// Switched turn, save
	console.log(moveText);

	// Save
	fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena battle');
	})
	
	// Send
	msg.channel.send(displayBattle(msg, client, battle, moveText));
	
	console.log(moveText);
	
	// End battle, have winner.
	if (moveText[moveText.length-1].winner) {
		battleEnd(msg, client, battle, moveText[moveText.length-1].winner);
	}
}

// End battle
function battleEnd(msg, client, battle, winner) {
	// End the match, give XP and coins
	Data.matchEnd(battle, winner);
	// Delete the match
	deleteGame(msg, client);
	// Check if level up
	levelUpCheck = Data.checkLevelUp(msg.author.id);
	
	// Level up
	if (levelUpCheck) {
		levelUp(msg, client);
	}
	// Send message
	client.basicEmbed("The Battle is Over!", `Did you level up? ${levelUpCheck}`, msg.channel, moduleColor);
}

// Delete battle
function deleteGame(msg, client) {
	try {
		fs.unlinkSync(`./Arena/Battle/BA${msg.author.id}.json`);
		console.log(`${msg.author.tag}'s battle successfully deleted`);
		return true;
	}
	catch {
		console.log(`${msg.author.tag}'s battle not deleted`);
		return false;
	}
}

// -- FILE MANAGEMENT --

// Deletes profile
function deleteUser(msg, client, confirmation) {
	if (msg.author.tag === confirmation) {
		deleteProfile(msg, client);
		client.basicEmbed("Deleted Profile", `Deleted ${msg.author.tag}'s arena data.`, msg.channel, moduleColor);
	}
	else {
		client.basicEmbed("Delete Failure", `To delete your data, you need to pass your tag as an argument!\r\nYour tag: ${msg.author.tag}`, msg.channel, moduleColor);
	}
}

// Deletes everything
function deleteProfile(msg, client) {
	deleteGame(msg, client);
	
	try {
		fs.unlinkSync(`./Arena/Fighter/${msg.author.id}.json`);
		console.log(`${msg.author.tag}'s team successfully deleted`);
	}
	catch {
		console.log(`${msg.author.tag}'s team not deleted`);
	}
	
	console.log(Data.deleteUser(msg.author.id));
}

// -- STARTUP --

// Startup
function onStart() {
	Data.setup();
}

// -- HELP --
function help(msg, client) {
	var helpEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setAuthor("Wenyunibot")
		.setFooter(client.footer())
		.setTitle(helpText.title)
		.setDescription(helpText.description)
		
	// Add fields	
	helpText.fields.forEach(field => helpEmbed.addField(field.title, field.description));
	
	msg.channel.send(helpEmbed);
}

module.exports = {
    arenaCommand: function(sql, msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(/ +/);
		// We have the form WY!arena mainCommand [arguments]
		if (!args[1]) {
			help(msg, client);
			return;
		}
		
		let mainCommand = args[1].toLowerCase();
		let arguments = args.slice(2);
	
		if (mainCommand === "arena" && args[2]) {
			mainCommand = args[2].toLowerCase();
			arguments = args.slice(3);
		}
		
        switch(mainCommand) {
            case 'help':
                help(msg, client);
                break;

            case 'create':
                create(msg, client, arguments);
                break;
				
			case 'team':
				viewTeam(msg, client);
				break;
			
			case 'view':
				viewBattle(msg, client);
				break;
			
			case 'battle':
				startFight(msg, client, arguments);
				break;
				
			case 'move':
				attackMenu(msg, client, arguments);
				break;

			case 'profile':
				Data.viewData(msg, client);
				break;
				
			case 'deleteUser':
				deleteUser(msg, client, arguments.join(" "));
				break;
			
			default:
				help(msg, client);
				break;
        }
	},
	onStart: onStart()
}