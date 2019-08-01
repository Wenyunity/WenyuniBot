// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- CONSTANTS --
const difficulty = {easy: 10000, normal: 50000, hard: 100000, expert: 250000, lunatic: 500000, insane: 1000000} // Difficulties
const moduleColor = "#222222"
const guessesPerQuestion = 3;

// -- GAME FLOW --
function askQuestion(client, msg, question, param) {
	// Load file
	gameFile = loadGame(client, msg)
	// No file
	if (!gameFile) {
		client.basicEmbed("Could not find game!", "Load failed. Use **wy!question start [difficulty]** to start a game.", msg.channel, moduleColor);
		return;
	}
	// Too many questions
	if (gameFile.numQuestions >= 20) {
		client.basicEmbed("No more questions!", "You have reached your limit of questions. You have to guess the number!", msg.channel, moduleColor);
		return;
	}
	// No question asked.
	if (!question) {
		client.basicEmbed("No question asked", `You have **${20 - gameFile.numQuestions}** left to ask.`, msg.channel, moduleColor);
		return;
	}
	
	// Ask question
	answer = "";
	switch(question) {
		case "divisible":
		case "div":
			answer = divisible(client, msg, gameFile.randNumber, param)
			break;
		case "triangle":
		case "tri":
			answer = triangle(client, msg, gameFile.randNumber);
			break;
		default:
			client.basicEmbed("Question not found", "This is not a valid question!", msg.channel, moduleColor);	
			return;
	}
	
	// Return if error
	if (answer === "error") {
		return;
	}
	
	// Increment question and save
	gameFile.numQuestions = gameFile.numQuestions + 1;
	
	// Game Over
	if (gameFile.numGuesses === 0 && gameFile.numQuestions >= 20) {
		client.basicEmbed("Game Over!", `You ran out of guesses! The answer was ${gameFile.randNumber}`, msg.channel, moduleColor);
		deleteGame(client, msg);
		return;
	}
	
	// Save
	saveGame(client, msg, gameFile);
}

// Guess answer
function guessAnswer(client, msg, guess) {
	// Load file
	gameFile = loadGame(client, msg)
	// No file
	if (!gameFile) {
		client.basicEmbed("Could not find game!", "Load failed. Use **wy!question start [difficulty]** to start a game.", msg.channel, moduleColor);
		return;
	}
	// Guess invalid
	if (isNaN(parseInt(guess)) || parseInt(guess) != parseFloat(guess)) {
		client.basicEmbed("Guess invalid!", `You must guess an integer between 1 and ${difficulty[gameFile[difficulty]]}`, msg.channel, moduleColor);
		return;
	}
	else if (guess < 1 || guess > difficulty[gameFile]) {// Guess out of range
		client.basicEmbed("Guess invalid!", `You must guess an integer between 1 and ${difficulty[gameFile[difficulty]]}`, msg.channel, moduleColor);
		return;
	}
	
	// No more guesses
	if (gameFile.numGuesses <= 0) {
		// Can't get any more guesses
		if (gameFile.numQuestions >= 20) {
			client.basicEmbed("Game Over!", `You ran out of guesses! The answer was ${gameFile.randNumber}`, msg.channel, moduleColor);
			deleteGame(client, msg);
			return;
		}
		else { // Use a question to get three guesses
			client.basicEmbed("Question used", `You used a question to gain ${guessesPerQuestion} more guesses!`, msg.channel, moduleColor);
			gameFile.numQuestions++;
			gameFile.numGuesses = guessesPerQuestion;
		}
	}
	// Guess correctly
	if (guess === gameFile.randNumber) {
		client.basicEmbed("Found Answer", `You found the number!`, msg.channel, moduleColor);
		deleteGame(client, msg);
		return;
	}
	else {// Incorrectly
		client.basicEmbed("Wrong Guess", `The number was not ${guess}!`, msg.channel, moduleColor);
	}
	
	// Decrement guesses
	gameFile.numGuesses--;
	
	// Check for game over
	if (gameFile.numGuesses === 0 && gameFile.numQuestions >= 20) {
		client.basicEmbed("Game Over!", `You ran out of guesses! The answer was ${gameFile.randNumber}`, msg.channel, moduleColor);
		deleteGame(client, msg);
		return;
	}
	
	// Save data
	saveGame(client, msg, gameFile);
}

// -- QUESTIONS --

function divisible(client, msg, number, param) {
	if (isNaN(parseInt(param)) || param <= 0 || Math.floor(param) != param) {
		client.basicEmbed("Divisible Error", "You can only ask this question of positive integers!", msg.channel, moduleColor);
		return "error";
	}
	else {
		if ((number % param) === 0) {
			client.basicEmbed("Question Result", `Your number is divisible by ${param}.`, msg.channel, moduleColor);
			return true;
		}
		else {
			client.basicEmbed("Question Result", `Your number is not divisible by ${param}.`, msg.channel, moduleColor);
			return false;
		}
	}
}

function triangle(client, msg, number) {
	add = 2;
	result = 1;
	// Keep adding to get the next triangle number until we are over number
	while (result < number) {
		result += add;
		add++;
	}
	// If result is equal, then our number is a triangle number
	if (result === number) {
		client.basicEmbed("Question Result", `Your number is a triangle number`, msg.channel, moduleColor);
		return true;
	} // Otherwise, it isn't
	else {
		client.basicEmbed("Question Result", `Your number is not a triangle number`, msg.channel, moduleColor);
		return false;		
	}
}
// -- SQL DATA MANAGEMENT --

// -- GAME DATA MANAGEMENT --

// Starts Game
function startGame(client, msg, diffi) {
	// Check if there is already a game.
	if (loadGame(client, msg)) {
		client.basicEmbed("Start Error", "You already have a game in progress!", msg.channel, moduleColor);
		return;
	}
	
	// Difficulty check
	if (!diffi) {
		client.basicEmbed("Start Error", "You need to select a difficulty!", msg.channel, moduleColor);
		return;
	}
	
	// Difficulty check, part 2
	randMax = difficulty[diffi]
	if (!randMax) {
		client.basicEmbed("Start Error", "You need to select a difficulty!", msg.channel, moduleColor);
		return;
	}
	
	// Create Game
	let gameData = {};
	gameData.difficulty = diffi;
	gameData.numQuestions = 0;
	gameData.numGuesses = 3;
	
	// Choose a number
	gameData.randNumber = Math.floor(Math.random() * randMax) + 1;
	
	// Save number
	saveGame(client, msg, gameData);
	
	// Success
	client.basicEmbed("Game Started", `Started a game in **${diffi}** difficulty. The range of numbers is between **1 and ${randMax}**.`, msg.channel, moduleColor);
}

// Deletes file
// Does not spit out text.
function deleteGame(client, msg) {
	try {
		fs.unlinkSync(`./Mathfind/Data/Q${msg.author.id}.json`);
		console.log("Question json successfully deleted");
		return true;
	}
	catch {
		return false;
	}
}

// Loads data from storage
function loadGame(client, msg) {
	try {
		x = JSON.parse(fs.readFileSync(`./Mathfind/Data/Q${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		return;
	}
	return x;
}

// Saves data
function saveGame(client, msg, game) {
	fs.writeFile(`./Mathfind/Data/Q${msg.author.id}.json`, JSON.stringify(game, null, 4), function(err) {
		if (err) {
			return;
			//um soemthing
		}
		console.log('completed writing to question json');
	})
}

// -- HELP --

function helpCommand(client, msg, error) {
	client.basicEmbed("No", "Not Done", msg.channel);
}

// -- EXPORTS --

module.exports = {
    mathfindCommand: function(msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!question mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
			
			case 'question':
			case 'q':
				askQuestion(client, msg, arguments[0], arguments[1]);
				break;
				
			case 'guess':
				guessAnswer(client, msg, arguments[0]);
				break;
				
			case 'start':
				startGame(client, msg, arguments[0]);
				break;
				
            case 'help':
                helpCommand(client, msg, false);
                break;
				
			default:
				helpCommand(client, msg, true);
				break;
        }
	}
}