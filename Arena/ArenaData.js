// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- CONSTANTS --
const rewardList = JSON.parse(fs.readFileSync('./Arena/rewards.json', 'utf8'));

// Well, we don't need to make it that hard
// But basically
// We should probably put this in a JSON.
// Again!
function matchEnd(battle, result) {
	// Results depend on which team is the winner
	if (result === "front") {
		addRewards(battle.front, battle.back);
	}
	else {
		addRewards(battle.back, battle.front);
	}
}

// Add rewards for both teams
function addRewards(winner, loser) {
	let rewards = {};
	// Check if winning team was enemy
	if (winner.type === "enemy") {
		rewards = rewardList.official[winner.arenaRank];
	}
	else if (loser.type === "enemy") { // Check if losing team was enemy
		rewards = rewardList.official[loser.arenaRank];
	}
	else { // Neither team was, spar
		rewards = rewardList.unofficial.normal;
	}
	
	// Winner was player
	if (winner.type === "player") {
		console.log(rewards.win);
	}
	
	// Loser was player
	if (loser.type === "player") {
		console.log(rewards.lose);
	}
}

module.exports = {
	matchEnd: matchEnd,
}