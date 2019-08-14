// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- SQL AND JSON DATA --
const mathsql = new SQLite('./Mathfind/Data/mathfind.sqlite');
const questionText = JSON.parse(fs.readFileSync('./Mathfind/questions.json', 'utf8'));

// -- CONSTANTS --
const difficulty = {easy: 10000, normal: 50000, hard: 100000, expert: 250000, lunatic: 500000, insane: 1000000} // Difficulties
const moduleColor = "#2020AA"
const guessesPerQuestion = 3;
const questions = ["div", "divisible", "triangle", "digit", "square", "cube", "fibonacci", "fib", "binary", "bi", "trinary", "tri", "digitroot", "droot", "prime"];

// -- GAME FLOW --

// Grabs appropriate question
function questionList(client, msg, question, number, param) {
	answer = "";
	switch(question) {
		case "divisible":
		case "div":
			answer = divisible(client, msg, number, param)
			break;
		case "triangle":
			answer = triangle(client, msg, number);
			break;
		case "digit":
			answer = numberHasDigit(client, msg, number, param);
			break;
		case "square":
			answer = square(client, msg, number);
			break;
		case "cube":
			answer = cube(client, msg, number);
			break;
		case "fibonacci":
		case "fib":
			answer = fibonacci(client, msg, number);
			break;
		case "binary":
		case "bi":
			answer = binaryLength(client, msg, number, param);
			break;
		case "trinary":
		case "tri":
			answer = trinaryLength(client, msg, number, param);
			break;
		case "digitroot":
		case "droot":
			answer = digitalRoot(client, msg, number, param);
			break;
		case "prime":
			answer = prime(client, msg, number);
			break;
		default:
			client.basicEmbed("Question not found", "This is not a valid question!", msg.channel, moduleColor);	
			return "error";
	}
	return answer;
}

// Asks a question
function askQuestion(client, msg, question, param) {
	// Load file
	gameFile = loadGame(client, msg)
	// No file
	if (!gameFile) {
		noGameMessage(client, msg);
		return;
	}
	// Too many questions
	if (gameFile.numQuestions >= 20) {
		client.basicEmbed("No more questions!", `${msg.author.tag}, you have reached your limit of questions. You have to guess the number!`, msg.channel, moduleColor);
		return;
	}
	// Sanity check (can't answer -> game over)
	if (gameFile.numQuestions === 19 && gameFile.numGuesses === 0) {
		client.basicEmbed("No more questions!", `${msg.author.tag}, you cannot ask more questions without gaming over. You have to guess the number!`, msg.channel, moduleColor);
		return;
	}
	// No question asked.
	if (!question) {
		client.basicEmbed("No question asked", `${msg.author.tag}, you have **${20 - gameFile.numQuestions}** left to ask.`, msg.channel, moduleColor);
		return;
	}
	
	// Ask question
	answer = questionList(client, msg, question, gameFile.randNumber, param);
	
	// Return if error
	if (answer === "error") {
		return;
	}
	// Add question to list of answers
	if (!param || isNaN(parseInt(param))) {
		gameFile.questionList.push([question, "N/A", answer]);
	}
	else {
		gameFile.questionList.push([question, parseInt(param), answer]);
	}
	// Increment question and save
	gameFile.numQuestions = gameFile.numQuestions + 1;
	
	// Game Over (Shouldn't happen due to sanity check)
	if (gameFile.numGuesses === 0 && gameFile.numQuestions >= 20) {
		client.basicEmbed("Game Over!", `${msg.author.tag}, you ran out of guesses! The answer was ${gameFile.randNumber}.`, msg.channel, moduleColor);
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
		noGameMessage(client, msg);
		return;
	}
	// Guess invalid
	if (isNaN(parseInt(guess)) || parseInt(guess) != parseFloat(guess)) {
		client.basicEmbed("Guess invalid!", `${msg.author.tag}, you must guess an integer between 1 and ${difficulty[gameFile[difficulty]]}`, msg.channel, moduleColor);
		return;
	}
	else if (guess < 1 || guess > difficulty[gameFile]) {// Guess out of range
		client.basicEmbed("Guess invalid!", `${msg.author.tag}, you must guess an integer between 1 and ${difficulty[gameFile[difficulty]]}`, msg.channel, moduleColor);
		return;
	}
	
	// No more guesses
	if (gameFile.numGuesses <= 0) {
		// Can't get any more guesses
		if (gameFile.numQuestions >= 20) {
			client.basicEmbed("Game Over!", `${msg.author.tag}, you ran out of guesses! The answer was ${gameFile.randNumber}`, msg.channel, moduleColor);
			deleteGame(client, msg);
			return;
		}
		else { // Use a question to get three guesses
			client.basicEmbed("Question used", `${msg.author.tag}, you used a question to gain ${guessesPerQuestion} more guesses!`, msg.channel, moduleColor);
			gameFile.numQuestions++;
			gameFile.numGuesses = guessesPerQuestion;
			gameFile.questionList.push(["Guesses", "N/A", true]);
		}
	}
	// Guess correctly
	if (parseInt(guess) === gameFile.randNumber) {
		client.basicEmbed("Found Answer", `${msg.author.tag}, **you found the number!** You have won in **${gameFile.difficulty}** difficulty!`, msg.channel, moduleColor);
		viewInfo(client, msg, true);
		// Get or create data
		data = mathsql.prepare(`SELECT user, wins, ${gameFile.difficulty} FROM mathfind WHERE user = ${msg.author.id}`).get();
		if (!data) {
			data = createData(msg.author)
		}
		
		// Increment wins
		data.wins++;
		data[gameFile.difficulty]++;
		
		// Update the SQL
		mathsql.prepare(`UPDATE mathfind SET wins = ${data.wins}, ${gameFile.difficulty} = ${data[gameFile.difficulty]} WHERE user = ${data.user};`).run();
		
		// Delete game
		deleteGame(client, msg);
		return;
	}
	else {// Incorrectly
		client.basicEmbed("Wrong Guess", `${msg.author.tag}, the number was not ${guess}!`, msg.channel, moduleColor);
		gameFile.guessList.push(parseInt(guess));
	}
	
	// Decrement guesses
	gameFile.numGuesses--;
	
	// Check for game over
	if (gameFile.numGuesses === 0 && gameFile.numQuestions >= 20) {
		client.basicEmbed("Game Over!", `${msg.author.tag}, you ran out of guesses! The answer was ${gameFile.randNumber}.`, msg.channel, moduleColor);
		deleteGame(client, msg);
		return;
	}
	
	// Save data
	saveGame(client, msg, gameFile);
}

// -- QUESTIONS --

// Asks if the number is divisible by param.
function divisible(client, msg, number, param) {
	if (isNaN(parseInt(param)) || param <= 0 || Math.floor(param) != param) {
		client.basicEmbed("Divisible Error", "You can only ask this question of positive integers!", msg.channel, moduleColor);
		return "error";
	}
	else {
		if ((number % param) === 0) {
			client.basicEmbed("Question Result", `${msg.author.tag}, your number **is divisible by ${param}**.`, msg.channel, moduleColor);
			return true;
		}
		else {
			client.basicEmbed("Question Result", `${msg.author.tag}, your number is not divisible by ${param}.`, msg.channel, moduleColor);
			return false;
		}
	}
}

// Asks if the number is a triangle number
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
		client.basicEmbed("Question Result", `${msg.author.tag}, your number **is a triangle number**.`, msg.channel, moduleColor);
		return true;
	} // Otherwise, it isn't
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not a triangle number.`, msg.channel, moduleColor);
		return false;		
	}
}

// Asks if the number includes a digit
function numberHasDigit(client, msg, number, digit) {
	// Error
	if (isNaN(parseInt(digit)) || digit < -1 || Math.floor(digit) != digit || digit >= 10) {
		client.basicEmbed("Divisible Error", "You can only ask this question of digits (0-9)!", msg.channel, moduleColor);
		return "error";
	}
	if (number.toString(10).includes(digit)) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number **includes ${digit}** in it.`, msg.channel, moduleColor);
		return true;
	}
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number does not have ${digit} in it.`, msg.channel, moduleColor);
		return false;
	}
}

// Asks if the number is a square
function square(client, msg, number) {
	let x = Math.sqrt(number);
	if (x === Math.floor(x)) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number **is a square**.`, msg.channel, moduleColor);
		return true;
	}
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not a square.`, msg.channel, moduleColor);
		return false;
	}
}

// Asks if the number is a cube
function cube(client, msg, number) {
	let x = Math.cbrt(number);
	if (x === Math.floor(x)) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number **is a cube**.`, msg.channel, moduleColor);
		return true;
	}
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not a cube.`, msg.channel, moduleColor);
		return false;
	}
	
}

// Asks if the number is a fibonacci number
function fibonacci(client, msg, number) {
	numberA = 1;
	numberB = 1;
	while (numberB < number) {
		temp = numberA + numberB;
		numberA = numberB;
		numberB = temp;
	}
	if (numberB === number) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number **is a fibonacci number**.`, msg.channel, moduleColor);
		return true;
	} // Otherwise, it isn't
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not a fibonacci number.`, msg.channel, moduleColor);
		return false;		
	}
}

// Asks how many digits in binary this number has
function binaryLength(client, msg, number, param) {
	// Error check
	if (isNaN(parseInt(param)) || param <= 0 || Math.floor(param) != param) {
		client.basicEmbed("Binary Error", "You can only ask this question of positive integers!", msg.channel, moduleColor);
		return "error";
	}
	// If the length matches
	if (number.toString(2).length === parseInt(param)) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is of **length ${param} in binary**.`, msg.channel, moduleColor);
		return true;
	}
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not length ${param} in binary.`, msg.channel, moduleColor);
		return false;
	}
}

// Asks how many digits in trinary this number has
function trinaryLength(client, msg, number, param) {
	// Error check
	if (isNaN(parseInt(param)) || param <= 0 || Math.floor(param) != param) {
		client.basicEmbed("Trinary Error", "You can only ask this question of positive integers!", msg.channel, moduleColor);
		return "error";
	}
	// If the length matches
	if (number.toString(3).length === parseInt(param)) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is of **length ${param} in trinary**.`, msg.channel, moduleColor);
		return true;
	}
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not length ${param} in trinary.`, msg.channel, moduleColor);
		return false;
	}
}

// Asks if the digital root of a number is equal to parameter given
function digitalRoot(client, msg, number, param) {
	// Error check
	if (isNaN(parseInt(param)) || param <= 0 || Math.floor(param) != param) {
		client.basicEmbed("Trinary Error", "You can only ask this question of positive integers!", msg.channel, moduleColor);
		return "error";
	}	
	// Modular arithmetic means this works.
	if (parseInt(param) === (1 + ((number-1) % 9))) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number has a **digital root of ${param}**.`, msg.channel, moduleColor);
		return true;
	}
	else { // Not the right digital root
		client.basicEmbed("Question Result", `${msg.author.tag}, your number doesn't have a digital root of ${param}.`, msg.channel, moduleColor);
		return false;
	}
}

// Asks if a number is prime
function prime(client, msg, number) {
	let limit = Math.sqrt(number)
	
	// False
	let foundFactor = false;
	
	// In the rare case we get a square
	if (Math.floor(limit) === limit) {
		foundFactor = true;
	}
	// Handle 2 separately
	if (number % 2 === 0) {
		foundFactor = true;
	}
	
	// Check all odd numbers
	let i = 3;
	
	// While we have not found a factor
	while (i <= limit && !foundFactor) {
		// If this is a factor, hit true
		if (number % i === 0) {
			foundFactor = true;
		}
		// Go to next odd number
		i += 2;
	}
	
	// If no factor, return true
	if (!foundFactor) {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number **is prime**.`, msg.channel, moduleColor);
		return true;
	} // Return false
	else {
		client.basicEmbed("Question Result", `${msg.author.tag}, your number is not prime.`, msg.channel, moduleColor);
		return false;		
	}
}


// -- VIEW --
// Views questions and guesses
function viewInfo(client, msg, won) {
	// Load file
	gameFile = loadGame(client, msg)
	// No file
	if (!gameFile) {
		noGameMessage(client, msg);
		return;
	}
	
	let title = "Mathfind Game Info"
	let desc = `${msg.author.tag}'s current mathfind game.\r\nDifficulty is **${gameFile.difficulty}**, for a max number of **${difficulty[gameFile.difficulty]}**.`;
	if (won) {
		title = "Game History!"
		desc = `${msg.author.tag}'s question history for their won game in **${gameFile.difficulty}** difficulty.`;
	}
	
	// Create embed and post
	let mathfindEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle(title)
		.setAuthor('Wenyunibot')
		.setDescription(desc)
		.addField("Question Results", questionView(gameFile), true)
		.addBlankField(true)
		.addField("Guesses", guessesView(gameFile), true)
		.addField("Guesses Left", gameFile.numGuesses, true)
		.addField("Questions Left", 20-gameFile.numQuestions, true)
		.setFooter(client.footer());
		
	msg.channel.send(mathfindEmbed);
}

// Views all questions
function questionView(gameFile) {
	string = "";
	let list = gameFile.questionList;
	// For each question
	for (x = 0; x < list.length; x++) {
		// Bold true statements
		if (list[x][2] === true) {
			string += "**";
		}
		// Add question
		string += `Q${x+1}: ${list[x][0]} - `;
		
		// Parameter, if necessary
		if (list[x][1] != "N/A") {
			string += `Param: ${list[x][1]} - `;
		}
		
		// Add truth value
		string += `${list[x][2]}`;
		
		// Bold true statements
		if(list[x][2] === true) {
			string += "**";
		}
		
		// Endline
		string += "\r\n";
	}
	// No questions
	if (!string) {
		return "No questions!";
	}
	
	// Return questions
	return string;
}

// Views all guesses
function guessesView(gameFile) {
	string = "";
	let list = gameFile.guessList;
	// For each question
	for (x = 0; x < list.length; x++) {
		string += `${list[x]}\r\n`
	}
	if (!string) {
		return "No guesses!"
	}
	return string;
}

// No game error message
function noGameMessage(client, msg) {
	client.basicEmbed("Could not find game!", `${msg.author.tag}, you aren't playing mathfind!\r\n\r\nTry **wy!mathfind help** for information about mathfind.`, msg.channel, moduleColor);
}

// -- SQL DATA MANAGEMENT --

// Initiate table (Runs on start)
function initiateTable() {
	// Check if the table exists
    const table = mathsql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'mathfind';").get();
    if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		mathsql.prepare("CREATE TABLE mathfind (user TEXT PRIMARY KEY, tag TEXT, wins INTEGER, games INTEGER, "
		+ "easy INTEGER, normal INTEGER, hard INTEGER, expert INTEGER, "
		+ "lunatic INTEGER, insane INTEGER);").run();
		// Ensure that the "user" row is always unique and indexed.
		mathsql.prepare("CREATE UNIQUE INDEX idx_scores_id ON mathfind (user);").run();
		mathsql.pragma("synchronous = 1");
		mathsql.pragma("journal_mode = wal");
	}
}

// Create user data
function createUser(user) {
	data = {
		user: user.id,
		tag: user.tag,
		wins: 0,
		games: 0,
		easy: 0,
		normal: 0,
		hard: 0,
		expert: 0,
		lunatic: 0,
		insane: 0
	}
	
	// Save data
	mathsql.prepare("INSERT OR REPLACE INTO mathfind (user, tag, wins, games, easy, normal, hard, expert, lunatic, insane)"
		+ " VALUES (@user, @tag, @wins, @games, @easy, @normal, @hard, @expert, @lunatic, @insane);").run(data);
	
	// Return data
	return data;
}

// Views user data
function viewData(client, msg) {
	data = mathsql.prepare(`SELECT * FROM mathfind WHERE user = ${msg.author.id}`).get();
	if (!data) {
		data = createUser(msg.author);
	}
	
	// Embed
	let mathdataEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle(`Mathfind Data for ${msg.author.tag}`)
		.setAuthor('Wenyunibot')
		.setDescription("Mathfind Statistics. Wins in each difficulty.")
		.setFooter(client.footer());
	
	Object.entries(data).forEach(function([key, value]) {
		if (!["user", "tag"].includes(key)) {
			mathdataEmbed.addField(`${(key[0].toUpperCase()+key.slice(1))}`, `${value}`, true)
		}
	});
		
		
	msg.channel.send(mathdataEmbed);
}

// -- GAME DATA MANAGEMENT --

// Aborts game
function abortGame(client, msg) {
	if (deleteGame(client, msg)) {
		client.basicEmbed("Game Aborted", `${msg.author.tag} has aborted their game.`, msg.channel, moduleColor);
	}
	else {
		noGameMessage(client, msg);
	}
}

// Starts Game
function startGame(client, msg, difficult) {
	// Get or create data
	data = mathsql.prepare(`SELECT user, games FROM mathfind WHERE user = ${msg.author.id}`).get();
	if (!data) {
		data = createData(msg.author)
	}
	
	// Check if there is already a game.
	if (loadGame(client, msg)) {
		client.basicEmbed("Start Error", "You already have a game in progress!", msg.channel, moduleColor);
		return;
	}
	

	// Difficulty check
	if (!difficult) {
		client.basicEmbed("Start Error", "You need to select a difficulty!", msg.channel, moduleColor);
		return;
	}
	
	// Lowercase check
	let diffi = difficult.toLowerCase();
	
	// Difficulty check, part 2
	randMax = difficulty[diffi]
	if (!randMax) {
		client.basicEmbed("Start Error", "That is not a valid difficulty!", msg.channel, moduleColor);
		return;
	}
	
	// Create Game
	let gameData = {};
	gameData.difficulty = diffi;
	gameData.numQuestions = 0;
	gameData.numGuesses = 3;
	gameData.questionList = [];
	gameData.guessList = [];
	
	// SQL
	data.games += 1;
	
	// Choose a number
	gameData.randNumber = Math.floor(Math.random() * randMax) + 1;
	
	// Save the game
	saveGame(client, msg, gameData);
	
	// Update the SQL
	mathsql.prepare(`UPDATE mathfind SET games = ${data.games} WHERE user = ${data.user};`).run();
	
	// Success
	client.basicEmbed("Game Started", `${msg.author.tag} has started a game in **${diffi}** difficulty. The range of numbers is between **1 and ${randMax}**.`, msg.channel, moduleColor);
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
function helpCommand(client, msg) {
	let title = "Mathfind Help"
	let helpEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle(title)
		.setAuthor('Wenyunibot')
		.setDescription("Start a game, and you'll get a random number. You have 20 questions and 3 guesses to figure out which number it is!")
		.addField("Starting a Game", "Use `wy!mathfind start difficulty` to start a game, where difficulty is replaced by a difficulty below.")
		.addField("Difficulty", "Depending on your difficulty, you'll have a different range of numbers. Easy is as low as 1-10000, while Insane is 1-1000000.\r\nPossible difficulties: Easy, Normal, Hard, Expert, Lunatic, Insane")
		.addField("Questions", "You can ask various questions about the number. Some questions take parameters, but all are true/false questions.\r\nFor info on questions, use `wy!mathfind helpquestion`.")
		.addField("Guessing", "You have three guesses for the number. If you run out of guesses, but still have questions, you have to use a question to gain three more guesses.")
		.addField("Game Over", "If you run out of both guesses and questions, you lose. If you find the number, you win.")
		.setFooter(client.footer());
		
	msg.channel.send(helpEmbed);
}

// Questions
function questionHelp(client, msg, error) {
	// Create list of all commands
	const helpEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle('Mathfind Questions')
		.setAuthor('Wenyunibot')
		.setDescription("Here are all of the questions for mathfind. Some questions take a single parameter.")
		.setFooter(client.footer())
			for (x in questionText) {
				helpEmbed.addField(x, questionText[x])
			};
		msg.channel.send(helpEmbed);
}

// -- EXPORTS --

module.exports = {
    mathfindCommand: function(msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(/ +/);
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
				if (arguments[0] === "question" || arguments[0] === "q") {
					questionHelp(client, msg);
				}
                else {
					helpCommand(client, msg);
                }
				break;
				
			case 'abort':
				abortGame(client, msg);
				break;
				
			case 'view':
				viewInfo(client, msg, false);
				break;
			
			case 'profile':
				viewData(client, msg);
				break;
			
			case 'helpquestion':
			case 'helpq':
				questionHelp(client, msg);
				break;
				
			default:
				// Ask a question if legal
				if (questions.includes(mainCommand)) {
					askQuestion(client, msg, mainCommand, arguments[0]);
				}
				else { // Pull up help text
					client.basicEmbed("Command not found", "Try **wy!mathfind help** for more information about mathfind.", msg.channel, moduleColor);
				}
				break;
        }
	},
	onStart: initiateTable()
}