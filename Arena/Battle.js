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
			return;
		}
	}
	
	// MP Error (Only for player, enemy does not use MP)
	if (moveSelected.MP > moveUser.MP) {
		throw "Character does not have enough MP!";
	}
	
	// Do move if legal
	damageText = doMove(moveSelected, moveUser, currentTeam, enemyTeam, target);
	
	// Move successful, subtract 1 from allowed moves
	battle.moves[player]--;
	
	// Subtract FP
	moveUser.MP -= moveSelected.MP;
	
	// Move Turn
	if (Math.max(...battle.moves) === 0) {
		switchTurn(battle);
	}
	
	return damageText;
}

// Does move
// Throws error if unsuccessful
// Usable for both player and enemy
function doMove(moveSelected, moveUser, currentTeam, enemyTeam, target) {
	
	if (moveSelected.team === "ally" && target != -1 && currentTeam.characterList[target].HP <= 0) {
		throw "Target is dead!";
	}
	
	// Damage Array
	damageText = [];
	
	// Those seem to be the only errors
	if (moveSelected.team === "enemy") { // Enemy attack
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
			damageText.push([enemyTeam.characterList[targetFind].name, attack(moveSelected, moveUser, enemyTeam.characterList[targetFind])]);
			
		} // Attack anywhere
		else if (moveSelected.target === "any") {
			// Unless, of course, the target is dead.
			if (enemyTeam.characterList[target].HP <= 0) {
				throw "Target is dead!";
			}
			// Attack!
			damageText.push([enemyTeam.characterList[target].name, attack(moveSelected, moveUser, enemyTeam.characterList[target])]);
		}
		else { // All attack
			enemyTeam.characterList.forEach(enemy => damageText.push([enemy.name, attack(moveSelected, moveUser, enemy)]));
		}
	}
	else { // Ally status move
		// Self status
		if (moveSelected.target === "self") {
			checkStatus(move, moveUser, moveUser);
		} // Status to any
		else if (moveSelected.target === "any") {
			// The target is dead.
			if (currentTeam.characterList[target].HP <= 0) {
				throw "Target is dead!";
			}
			// Add Status!
			checkStatus(move, moveUser, currentTeam.characterList[target]);
		}
		else { // Add status to all!
			currentTeam.characterList.forEach(ally => damageText.push([ally.name, checkStatus(moveSelected, moveUser, ally)]));
		}
	}
	return damageText;
}

// Checks if status is good to go
function checkStatus(move, user, target) {
	
}

// Attacks enemy
function attack(move, user, enemy) {
	
	// Check for hitting
	let hitCheck = statusEffect.hitCheck(user, enemy);
	if (!hitCheck) {
		return "miss";
	}
	
	// Check for damage and defense statuses
	let damageBoost = statusEffect.power(user);
	let defenseBoost = statusEffect.defense(enemy);
	
	// Damage is power - defense
	let damage = (move.power + damageBoost) - (enemy.DEF + defenseBoost);
	// Deal no damage
	if (damage < 1) {
		return 0;
	}
	
	// Deal damage
	enemy.HP = enemy.HP - damage;
	if (enemy.HP < 0) {
		enemy.HP = 0;
	}
	
	// Add effect if possible
	if (move.effect != "None") {
		statusEffect.addStatus(move.effect, move.length, enemy);
	}
	return damage;
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