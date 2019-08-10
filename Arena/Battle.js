const statusEffect = require('./Status.js');

// This should be able to handle battle flow
// I think

// Move Order
// Assumes player, move, target are all INT.
function useMove(battle, player, move, target) {
	
	// Get teams
	let currentTeam = battle[battle.turn]
	let enemyTeam = {}
	if (battle.turn === "front") {
		enemyTeam = battle.back;
	}
	else {
		enemyTeam = battle.front;
	}
	
	// Character check
	if (player < 0 || player > currentTeam.characterList.length) {
		throw "Character not found!";
	}
	
	// Character
	let moveUser = currentTeam.characterList[player];

	// Already moved, dead, whatever
	if (battle.moves[player] <= 0) {
		throw "Character is unable to move!";
	}
	
	// Check move
	if (move < 0 || move > moveUser.move.length) {
		throw "Move not found!";
	}
	
	// Correct move
	let moveSelected = moveUser.move[move];
	
	// Find the target
	if (moveSelected.target === "any") {
		var lengthSelect = 0;
		if (moveSelected.team === "enemy") {
			lengthSelect = enemyTeam.characterList.length;
		}
		else {
			lengthSelect = currentTeam.characterList.length;
		}
		
		// Target does not exist
		if (!arguments[2] || target < 0 || target > lengthSelect) {
			throw "Could not find the target!";
		}
	}
	
	// MP Error (Only for player, enemy does not use MP)
	if (moveSelected.MP > moveUser.MP) {
		throw "Character does not have enough MP!";
	}
	
	let returnValue = {};
	
	// Do move if legal
	returnValue = doMove(moveSelected, moveUser, currentTeam, enemyTeam, target);
	
	// Names
	returnValue.moveName = moveSelected.name;
	returnValue.moveUser = moveUser.name;
	
	// Move successful, subtract 1 from allowed moves
	battle.moves[player]--;
	
	// Subtract MP
	moveUser.MP -= moveSelected.MP;
	
	// Damage statuses
	returnValue.statusDamage = statusEffect.healthStatus(moveUser);
	
	// Reduce statuses
	statusEffect.postTurnStatus(moveUser);
	
	// Did a team die
	if (checkDead(battle.back)) {
		returnValue.winner = "front";
	} // In the case of a tie, front should win
	else if (checkDead(battle.front)) {
		returnValue.winner = "back";
	}
	else {
		returnValue.winner = false;
	}
	
	// Move Turn
	if (Math.max(...battle.moves) === 0) {
		switchTurn(battle);
	}
	
	return returnValue;
}

// Does move
// Throws error if unsuccessful
// Usable for both player and enemy
function doMove(moveSelected, moveUser, currentTeam, enemyTeam, target) {
	
	if (moveSelected.team === "ally" && target != -1 && currentTeam.characterList[target].HP <= 0) {
		throw "Target is dead!";
	}
	
	// move array
	let move = {};
	move.effectArray = [];
	
	// Those seem to be the only errors
	if (moveSelected.team === "enemy") { // Enemy attack
		move.type = "enemy";
		// Front Attack
		if (moveSelected.target === "front") {
			// Find the front enemy.
			let targetFind = 0;
			let targetFound = false;
			while (!targetFound) {
				if (enemyTeam.characterList[targetFind].HP > 0) {
					targetFound = true;
				}
				else {
					targetFind++;
				}
			}
			// Found the front enemy, attack them
			move.effectArray.push(attack(moveSelected, moveUser, enemyTeam.characterList[targetFind]));
			
		} // Attack anywhere
		else if (moveSelected.target === "any") {
			// Unless, of course, the target is dead.
			if (enemyTeam.characterList[target].HP <= 0) {
				throw "Target is dead!";
			}
			// Attack!
			move.effectArray.push(attack(moveSelected, moveUser, enemyTeam.characterList[target]));
		}
		else { // All attack
			enemyTeam.characterList.forEach(enemy => move.effectArray.push(attack(moveSelected, moveUser, enemy)));
		}
	}
	else { // Ally status move
		move.type = "ally";
		// Self status
		if (moveSelected.target === "self") {
			move.effectArray.push(checkStatus(moveSelected, moveUser, moveUser));
		} // Status to any
		else if (moveSelected.target === "any") {
			// The target is dead.
			if (currentTeam.characterList[target].HP <= 0) {
				throw "Target is dead!";
			}
			// Add Status!
			move.effectArray.push(checkStatus(moveSelected, moveUser, currentTeam.characterList[target]));
		}
		else { // Add status to all!
			currentTeam.characterList.forEach(ally => move.effectArray.push(checkStatus(moveSelected, moveUser, ally)));
		}
	}
	
	return move;
}

// Checks if team is dead
function checkDead(team) {
	
	// Checks character array if any are alive
	var index = team.characterList.findIndex(checkIfDead);
	
	// If not found, return false
	if (index === -1) {
		return true;
	}
	return false;
}

// Checks if unit is dead
function checkIfDead (member) {
	return (member.HP > 0);
}

// Checks if status is good to go and gets text
function checkStatus(move, user, target) {
	// Life check
	if (target.HP <= 0) {
		return {};
	}
	
	// Hitcheck
	let hitCheck = statusEffect.hitCheck(user);
	if (!hitCheck) {
		return {name: target.name, damage: "miss"};
	}
	
	// Status check
	if (statusEffect.addStatus(move.effect, move.length, target)) {
		return {name: target.name, statusText: move.effect, statusLength: move.length};
	}
	else {
		return {};
	}
}

// Attacks enemy
function attack(move, user, enemy) {
	
	// Life check
	if (enemy.HP <= 0) {
		return {};
	}
	
	// Check for hitting
	let hitCheck = statusEffect.hitCheck(user, enemy);
	if (!hitCheck) {
		return {name: enemy.name, damage: "miss"};
	}
	
	var x = false;
	// Add effect if possible
	if (move.effect != "None") {
		x = statusEffect.addStatus(move.effect, move.length, enemy);
	}
	
	// Status name
	let statusText = "";
	let statusLength = 0;
	if (x) {
		statusText = move.effect;
		statusLength = move.length;
	}
	
	// Check for damage and defense statuses
	let damageBoost = statusEffect.power(user);
	let defenseBoost = statusEffect.defense(enemy);
	
	// Damage is power - defense
	let damage = (move.power + damageBoost) - (enemy.DEF + defenseBoost);
	// Deal no damage
	if (damage < 0) {
		damage = 0;
	}
	
	// Deal damage
	enemy.HP = enemy.HP - damage;
	if (enemy.HP < 0) {
		enemy.HP = 0;
	}
	
	// Actual enemy name
	let name = enemy.name;
	
	return {name, damage, statusText, statusLength};
}

// Switches Turn
function switchTurn(battle) {
	
	// Switches turn
	if (battle.turn === "front") {
		battle.turn = "back";
	}
	else {
		battle.turn = "front";
	}
	
	battle.moves = [];
	
	battle[battle.turn].characterList.forEach(function(player) {
		statusEffect.preTurnStatus(player);
		if (player.HP > 0) {
			battle.moves.push(1);
		}
		else {
			battle.moves.push(0);
		}
	});
}

module.exports = {
	useMove: useMove,
	switchTurn: switchTurn
}