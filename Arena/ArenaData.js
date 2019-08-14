// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- CONSTANTS --
const rewardList = JSON.parse(fs.readFileSync('./Arena/rewards.json', 'utf8'));
const arenasql = new SQLite('./Arena/Data/arena.sqlite');
const moduleColor = "#FF9900"
const cooldownTime = 1000 * 60 * 60 * 12 // 12 hours

// -- BATTLE MANAGEMENT --
// Battle is over, parse battle data
function matchEnd(battle, result) {
	// Results depend on which team is the winner
	if (result === "front") {
		findRewards(battle.front, battle.back);
	}
	else {
		findRewards(battle.back, battle.front);
	}
}

// Determines which rewards to give
function findRewards(winner, loser) {
	let rewards = {};
	let upRank = false;
	// Check if winning team was enemy
	if (winner.type === "enemy") {
		rewards = rewardList.official[winner.arenaRank];
		upRank = parseInt(winner.arenaRank);
	}
	else if (loser.type === "enemy") { // Check if losing team was enemy
		rewards = rewardList.official[loser.arenaRank];
		upRank = parseInt(loser.arenaRank);
	}
	else { // Neither team was, spar
		rewards = rewardList.unofficial.normal;
	}
	
	console.log(rewards);
	// Winner was player
	if (winner.type === "player") {
		console.log(winner.ownerID);
		addRewards(winner.ownerID, rewards.win, upRank);
	}
	
	// Loser was player
	if (loser.type === "player") {
		console.log('whoops');
		addRewards(loser.ownerID, rewards.lose, false);
	}
}

// -- SQL DATA MANAGEMENT --

// Setup data
function setup() {
	// Check if the table exists
    const table = arenasql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'arena';").get();
    if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		arenasql.prepare("CREATE TABLE arena (user TEXT PRIMARY KEY, tag TEXT, team TEXT, level INTEGER, SP INTEGER, coins INTEGER, nextBattle INTEGER, battleTime INTEGER);").run();
		// Ensure that the "user" row is always unique and indexed.
		arenasql.prepare("CREATE UNIQUE INDEX idx_scores_id ON arena (user);").run();
		arenasql.pragma("synchronous = 1");
		arenasql.pragma("journal_mode = wal");
	}
}

// Create user
function createData(user, teamName) {
	data = {
		user: user.id,
		tag: user.tag,
		team: teamName,
		level: 0,
		SP: 0,
		coins: 0,
		nextBattle: 20,
		battleTime: 0
	}
	
	// Save data
	arenasql.prepare("INSERT OR REPLACE INTO arena (user, tag, team, level, SP, coins, nextBattle, battleTime)"
		+ " VALUES (@user, @tag, @team, @level, @SP, @coins, @nextBattle, @battleTime);").run(data);
}

// Sets cooldown time
function setTime(userID) {
	data = arenasql.prepare(`UPDATE arena SET battleTime = ${(Date.now() + cooldownTime)} WHERE user = ?`).run(userID);	
}

// Gets cooldown time
function getTime(userID) {
	data = arenasql.prepare(`SELECT user, battleTime FROM arena WHERE user = ?`).get(userID);
	return data.battleTime;
}

// Views user data
function viewData(msg, client) {
	data = arenasql.prepare(`SELECT * FROM arena WHERE user = ${msg.author.id}`).get();
	if (!data) {
		// Return error message, since we can't make a new one straight up
		client.basicEmbed("Data not found", `Could not find data for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	// Embed
	let arenadataEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle(`Arena Data for ${msg.author.tag}`)
		.setAuthor('Wenyunibot')
		.setDescription("Arena Statistics.")
		.setFooter(client.footer());
	
	// Add fields
	Object.entries(data).forEach(function([key, value]) {
		if (!["user", "tag", "battleTime"].includes(key)) {
			arenadataEmbed.addField(`${(key[0].toUpperCase()+key.slice(1))}`, `${value}`, true)
		}
	});
	
	// Add battle time
	arenadataEmbed.addField("Battle Available", new Date(data.battleTime).toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"})); 
			
	msg.channel.send(arenadataEmbed);
}

// Add rewards
function addRewards(userID, rewards, upRank) {
	console.log(userID);
	console.log(rewards);
	// Get or create data
	data = arenasql.prepare(`SELECT user, SP, coins, nextBattle FROM arena WHERE user = ${userID}`).get();
	if (!data) {
		return;
	}
		
	// Up rank if appropriate
	if (upRank && data.nextBattle === upRank) {
		data.nextBattle--;
	}

	// Up SP
	data.SP += rewards.SP;
	data.coins += rewards.Coins;
	
	console.log(data);
	
	// Update the SQL
	arenasql.prepare(`UPDATE arena SET SP = ${data.SP}, coins = ${data.coins}, nextBattle = ${data.nextBattle} WHERE user = ?;`).run(userID);	
}

// Deletes user data
function deleteUser(userID) {
	try {
		data = arenasql.prepare(`DELETE FROM arena WHERE user = ${userID};`).run();
		return data;
	}
	catch (err) {
		console.log(err);
		return false;
	}
}

// Gets next match
function getNextMatch(userID) {
	data = arenasql.prepare(`SELECT user, nextBattle FROM arena WHERE user = ${userID}`).get();
	return data.nextBattle;
}

// Check for levelup
function checkLevelUp(userID) {
	data = arenasql.prepare(`SELECT user, SP, level FROM arena WHERE user = ?`).get(userID);
	
	if (data.SP >= 100) {
		data.SP -= 100;
		data.level++;
		arenasql.prepare(`UPDATE arena SET SP = ${data.SP}, level = ${data.level} WHERE user = ?;`).run(userID);	
		return true;
	}
	else {
		return false;
	}
}

// -- EXPORTS --

module.exports = {
	matchEnd: matchEnd,
	setup: setup,
	viewData: viewData,
	createData: createData,
	deleteUser: deleteUser,
	getNextMatch: getNextMatch,
	checkLevelUp: checkLevelUp,
	setTime: setTime,
	getTime: getTime
}