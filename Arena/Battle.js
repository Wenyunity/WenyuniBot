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
	let charUpdate = currentTeam.characterList[player];

	// Already moved, dead, whatever
	if (battle.moves[player] <= 0) {
		throw "Character is unable to move!";
	}
	
	// Check move
	if (move < 0 || move > charUpdate.move.length) {
		throw "Move not found!";
	}
	
	// Correct move
	let moveSelected = charUpdate.move[move];
	
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
	
	// Do move if legal
	damageText = doMove(moveSelected, charUpdate, currentTeam, enemyTeam, target);
	
	// Move successful, subtract 1 from allowed moves
	battle.moves[player]--;
	
	// Move Turn
	console.log(Math.max(...battle.moves));
	if (Math.max(...battle.moves) === 0) {
		switchTurn(battle);
	}
	
	return damageText;
}

// Does move
// Throws error if unsuccessful
function doMove(moveSelected, moveUser, currentTeam, enemyTeam, target) {

	// MP Error
	if (moveSelected.MP > moveUser.MP) {
		throw "Character does not have enough MP!";
	}
	
	if (moveSelected.team === "ally" && target != -1 && currentTeam.characterList[target].HP <= 0) {
		throw "Target is dead!";
	}
	
	console.log(enemyTeam);
	
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
	else {

		return true;
	}
	return damageText;
}

// Attacks enemy
function attack(move, user, enemy) {
	// Damage is power - defense
	let damage = move.power - enemy.DEF;
	// Deal no damage
	if (damage < 1) {
		return 0;
	}
	
	// Deal damage
	enemy.HP = enemy.HP - damage;
	if (enemy.HP < 0) {
		enemy.HP = 0;
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