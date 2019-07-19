const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');
const boardPosition = JSON.parse(fs.readFileSync('./Chess/boardPosition.json', 'utf8'));
let board = [["r", "n", "b", "q", "k", "b", "n", "r"], ["p", "p", "p", "p", "p", "p", "p", "p"], 
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["P", "P", "P", "P", "P", "P", "P", "P"], ["R", "N", "B", "Q", "K", "B", "N", "R"]];
let playerToMove = "w";
let castle = ["K", "Q", "k", "q"];
let enPassant = "";
let fiftyMoveRule = 0;
let turnCount = 1;
let whiteKingPos = [7, 4];
let blackKingPos = [0, 4];
let whiteSet = "compact";
let blackSet = "compact";

const whitePiece = ["P", "R", "N", "B", "Q", "K"]
const blackPiece = ["p", "r", "n", "b", "q", "k"]
const boardStyle = ["highlight", "diagonal", "versus", "compact"]
			
function newBoard() {
	board = [["r", "n", "b", "q", "k", "b", "n", "r"], ["p", "p", "p", "p", "p", "p", "p", "p"], 
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["P", "P", "P", "P", "P", "P", "P", "P"], ["R", "N", "B", "Q", "K", "B", "N", "R"]];
	playerToMove = 0;
	castle = ["K", "Q", "k", "q"];
	enPassant = "";
	fiftyMoveRule = 0;
	turnCount = 1;
}

function compactBoard() {
	message = '```. | a b c d e f g h | .\r\n' + '--+-----------------+--'
	for (i = 0; i < board.length; i++) {
		message += '\r\n' + (i+1) + ' |'
		for (j = 0; j < board[i].length; j++) {
			if (board[i][j]) {
				message += " " + board[i][j]
			}
			else {
				message += " " + "."
			}
		}
		message += ' | ' + (i+1)
	}
	message += '\r\n--+-----------------+--\r\n. | a b c d e f g h | .```'
	return message;
}

function highlightBoard() {
	message = '```html\r\n. | a  b  c  d  e  f  g  h | .\r\n' + '--+------------------------+--'
	for (i = 0; i < board.length; i++) {
		message += '\r\n' + (i+1) + ' |'
		for (j = 0; j < board[i].length; j++) {
			if (board[i][j]) {
				if (playerToMove === "w" && whitePiece.includes(board[i][j])) {
					message += "<" + board[i][j] + ">"
				}
				else if (playerToMove === "b" && blackPiece.includes(board[i][j])) {
					message += "<" + board[i][j] + ">"
				}
				else {
					message += " " + board[i][j] + " "
				}
			}
			else {
				message += " . "
			}
		}
		message += '| ' + (i+1)
	}
	message += '\r\n--+------------------------+--\r\n. | a  b  c  d  e  f  g  h | .```'
	return message;
}

function versusBoard() {
	message = '```css\r\n. | a  b  c  d  e  f  g  h | .\r\n' + '--+------------------------+--'
	for (i = 0; i < board.length; i++) {
		message += '\r\n' + (i+1) + ' |'
		for (j = 0; j < board[i].length; j++) {
			if (board[i][j]) {
				if (whitePiece.includes(board[i][j])) {
					message += "[" + board[i][j] + "]"
				}
				else {
					message += "{" + board[i][j] + "}"
				}
			}
			else {
				message += " . "
			}
		}
		message += '| ' + (i+1)
	}
	message += '\r\n--+------------------------+--\r\n. | a  b  c  d  e  f  g  h | .```'
	return message;
}

function diagonalBoard() {
	message = '```md\r\n   | a  b  c  d  e  f  g  h |   \r\n' + '---+------------------------+---'
	for (i = 0; i < board.length; i++) {
		if (i % 2 == 1) {
			message += '\r\n' + (i+1) + ' []'
		}
		else {
			message += '\r\n' + (i+1) + ' ||'
		}
		for (j = 0; j < board[i].length; j++) {
			if (board[i][j]) {
				message += "[" + board[i][j] + "]"
			}
			else {
				message += "[.]"
			}
		}
		if (i % 2 == 1) {
			message += '[] ' + (i+1)
		}
		else {
			message += '|| ' + (i+1)
		}

	}
	message += '\r\n---+------------------------+---\r\n   | a  b  c  d  e  f  g  h |   ```'
	return message;
}

function printBoard(msg, addFEN, style) {
	let message = ""
	
	// If style given
	if (style === "highlight") {
		message = highlightBoard()
	}
	else if (style === "diagonal") {
		message = diagonalBoard()
	}
	else if (style === "versus") {
		message = versusBoard()
	}
	else if (style === "compact") {
		message = compactBoard()
	}
	else { // Style not given, use default
		let styleDef = "";
		// Find default
		if (playerToMove === "w") {
			styleDef = whiteSet;
		}
		else {
			styleDef = blackSet;
		}
		// Use default
		if (styleDef === "highlight") {
			message = highlightBoard()
		}
		else if (styleDef === "diagonal") {
			message = diagonalBoard()
		}
		else if (styleDef === "versus") {
			message = versusBoard()
		}
		else if (styleDef === "compact") {
			message = compactBoard()
		}
		else {
			message = "Um error"
		}
	}
	
	
	// Border color matches player to move
	let borderColor = "#FFFFFF";
	let player = "White";
	if (playerToMove == "b") {
		borderColor = "#000000";
		player = "Black";
	}
	
	let castleText = ""
	if (castle[0] || castle[1]) {
		castleText += "White: " + castle[0] + " " + castle[1] + "\r\n";
	}
	if (castle[2] || castle[3]) {
		castleText += "Black: " + castle[0] + " " + castle[1] + "\r\n";
	}
	if (!castleText) {
		castleText = "None";
	}
	
	enPassantText = enPassant || "None";
		
	// Create text
	let chessboardEmbed = new Discord.RichEmbed()
		.setColor(borderColor)
		.setTitle("Chessboard")
		.setAuthor('Wenyunibot')
		.setDescription(message)
		.addField("Move", player, true)
		.addField("Castling", castleText, true)
		.addField("En Passant", enPassantText, true)
		.addField("50-Move Rule Count", fiftyMoveRule, true)
		.addField("Turn Count", turnCount, true)
		
	if (addFEN) {
		chessboardEmbed.setFooter("FEN: "+getFEN());
	}

	msg.channel.send(chessboardEmbed);
}

function getFEN() {
	base = ""
	
	// This gets the board state
	for (i = 0; i < board.length; i++) {
		counter = 0;
		for (j = 0; j < board[i].length; j++) {
			if (board[i][j]) {
				if (counter) {
					base += counter;
				}
				base += board[i][j];
				counter = 0;
			}
			else {
				counter += 1;
			}
		}
		if (counter) {
			base += counter;
		}
		if (i < 7) {
			base += "/";
		}
	}
	
	// Player to move
	base += " " + playerToMove + " ";
	// Castling
	base += ((castle[0]+castle[1]+castle[2]+castle[3]) || "-") + " ";
	// enPassant
	base += (enPassant || "-");
	// fiftyMoveRule + turnCount
	base += " " + fiftyMoveRule + " " + turnCount;
	
	return base;
}

function movePiece(msg, args) {
	if (args[0].substring(0, 1) in ["0", "O"]) {
		castling(msg, args[0]);
		return;
	}
	// Turn into arrays
	if (args.length < 2) {
		msg.channel.send("I need two coordinates - one for the place, and the other for the destination.");
		return;
	}
	
	let from = determinePlace(args[0]);
	let to = determinePlace(args[1]);
	
	// Make sure these are valid coordinates
	if (from == "Error" || to == "Error") {
		msg.channel.send("One of your coordinates was not set correctly! Please put them in the form a1, where a-h, 1-8 are allowed. Castling: O-O for kingside, O-O-O for queenside.");
		return;
	}
	
	if (args[0] === args[1]) {
		msg.channel.send("You cannot stay still!")
		return;
	}
	
	// Get the piece
	let piece = board[from[1]][from[0]];
	let endPiece = board[to[1]][to[0]];
	
	// Check if it's the right player's piece
	if (playerToMove == "w") {
		pieceFound = false;
		for (x in whitePiece) {
			if (whitePiece[x] === piece) { // Found a piece to move
				pieceFound = true;
			}
			if (whitePiece[x] === endPiece) { // Destination is blocked
				msg.channel.send("There is a white piece at " + args[1] + " so your piece can't go there.");
				return;
			}
		}
		if (!pieceFound) { // No piece
			msg.channel.send("There is no white piece at " + args[0] + " to move.");
			return;
		}

	}
	else {
		pieceFound = false;
		for (x in blackPiece) {
			if (blackPiece[x] === piece) { // Found a piece to move
				pieceFound = true;
			}
			if (blackPiece[x] === endPiece) { // Destination is blocked
				msg.channel.send("There is a black piece at " + args[1] + " so your piece can't go there.");
				return;
			}
		}
		if (!pieceFound) { // No piece
			msg.channel.send("There is no black piece at " + args[0] + ".");
			return;
		}
	}
	
	if (piece === "k" || piece ===  "K") {
		moveLegal = kingMove(from, to)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "Q" || piece ===  "q") {
		moveLegal = queenMove(from, to)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "N" || piece ===  "n") {
		moveLegal = knightMove(from, to)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "B" || piece ===  "b") {
		moveLegal = bishopMove(from, to)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "R" || piece ===  "r") {
		moveLegal = rookMove(from, to)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "P" || piece ===  "p") {
		moveLegal = pawnMove(from, to, args[1])
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else {
		msg.channel.send("How did you get here?");
		return;
	}
	
	// Have to check for check
	if (piece === true) {
		
	}
	// And setup enPassant
	// And promotion
	// but for now
	// We'll say the move is legal
	
	// Move piece
	board[to[1]][to[0]] = piece;
	board[to[1]][to[0]] = piece;
	board[from[1]][from[0]] = "";
	
	// Turn and player swap
	if (playerToMove === 'w') {
		playerToMove = 'b'
	}
	else {
		playerToMove = 'w';
		turnCount = turnCount + 1;
	}
	
	// Reset 50 move rule
	if (piece === "P" || piece === "p" || endPiece) {
		fiftyMoveRule = 0
	}
	else { // Increment 50 move rule
		fiftyMoveRule = fiftyMoveRule + 1;
	}
	
	// Print board
	if (playerToMove === "w") {
		printBoard(msg, true, whiteSet);		
	}
	else {
		printBoard(msg, true, blackSet);
	}
}

function determinePlace(place) {
		let x = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7}
		let y = {"1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7}
		let pairCoordinates = []
		if (place.substring(0, 1) in x && place.substring(1, 2) in y) {
			pairCoordinates.push(x[place.substring(0, 1)]);
			pairCoordinates.push(y[place.substring(1, 2)]);
		}	
		else {
			pairCoordinates = "Error";
		}
		return pairCoordinates;
}

// Checks if the rook can move from X to Y.
// Does not check piece at X or Y.
// Can also be used for Queen.
function rookMove(from, to) {
	// Check if destination is legal for a rook to move to
	// Move vertically
	if (from[0] === to[0]) {
		let minVal = Math.min(from[1], to[1]) + 1;
		let maxVal = Math.max(from[1], to[1]);
		for (i = minVal; i < maxVal; i++) {
			if (board[i][from[0]]) {
				return "There is a piece in the way!";
			}
		}
	}
	// Move horizontally
	else if (from[1] === to[1]) {
		let minVal = Math.min(from[0], to[0]) + 1;
		let maxVal = Math.max(from[0], to[0]);
		for (i = minVal; i < maxVal; i++) {
			if (board[from[1]][i]) {
				return "There is a piece in the way!";
			}
		}
	}
	else { // Illegal move
		return "The rook cannot move to that square!";
	}
	
	// Move legal
	return "";
}

// Checks if the bishop can move from X to Y.
// Does not check piece at X or Y.
// Can also be used for Queen.
function bishopMove(from, to) {
	diffX = to[0] - from[0]
	diffY = to[1] - from[1]
	
	changeX = 1;
	changeY = 1;
	
	if (diffX < 0) {
		changeX = -1;
	}
	if (diffY < 0) {
		changeY = -1;
	}
	
	xCheck = from[0];
	yCheck = from[1];
	
	// Legal diagonal move check
	if (diffX === diffY || diffX === -1 * diffY) {
		while (true) {
			xCheck += changeX;
			yCheck += changeY;
			
			// If we've reached the destination, we're done
			if (xCheck == to[0]) {
				return "";
			}
			else { // We have to check
				if (!(board[yCheck][xCheck] === "")) {
					return "There is a piece in the way!";
				}
			}
		}
	}
	else {
		return "The bishop cannot move to that square!";
	}
}

// Queen is the sum of bishop and rook
function queenMove (from, to) {
	let rookResult = rookMove(from, to);
	let bishopResult = bishopMove(from, to);
	
	// If one of these is fine, queen can move
	if (!bishopResult || !rookResult) {
		return "";
	}
	else { // Neither is fine
		// For text display purposes, we prefer "piece in the way" over "Illegal move"
		if (!(bishopResult === "The bishop cannot move to that square!")) { 
			return bishopResult;
		}
		else if (!(rookResult === "The rook cannot move to that square!")) {
			return rookResult;
		}
		else {
			return "The queen cannot move to that square!";
		}
	}
}

// Knights just need to check if their destination is legal
// Since they jump over all pieces
function knightMove (from, to) {
	answer = Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1])
	if (answer === 3 && !(from[0] === to[0]) && !(from[1] === to[1])) {
		return "";
	}
	else {
		return "The knight cannot move to that square!";
	}
}

// Because we've previously checked the destination, the only thing we need to do is check that his move is legal
// Castling will have to be done separately
function kingMove (from, to) {
	// Illegal move
	if (Math.abs(from[0] - to[0]) > 1 || Math.abs(from[1] - to[1]) > 1) {
		return "The king cannot move to that square!";
	}
	return "";
}

// We need to check if capturing is legal
// Or if moving, that there is no piece at the destination
function pawnMove (from, to, toa1Form) {
	// This is the start
	if (from[0] === to[0]) {
		// Same row moves
		// Double move check
		if (Math.abs(from[1] - to[1]) === 2) {
			if (playerToMove === "w" && from[1] === 6) { // White double move check
				if (!board[5][from[0]] && !board[4][from[0]]) { // Check if spaces clear
					return "";
				}
				else {
					return "There is a piece in the way!";
				}
			}
			else if (playerToMove === "b" && from[1] === 1) {
				if (!board[2][from[0]] && !board[3][from[0]]) { // Check if spaces clear
					return "";
				}
				else {
					return "There is a piece in the way!";
				}
			}
			else {
				return "This pawn cannot move two spaces forward!"
			}
		}
		else if (Math.abs(from[1] - to[1]) === 1) {
			if (!(board[to[1]][to[0]])) {
				return "";
			}
			else {
				return "There is a piece in the way!";
			}
		}
		else {
			return "Pawn cannot move there.";
		}
	}
	// Capture check
	else if (Math.abs(from[0] - to[0]) === 1) {
		if ((from[1] - to[1] === -1 && playerToMove === "b") || (from[1] - to[1] === 1 && playerToMove === "w")) {
			// En passant bypass
			if (enPassant === toa1Form) {
				return "";
			} // If it's empty, cannot capture
			else if (!(board[to[1]][to[0]])) {
				return "Pawn cannot move diagonally without capturing!";
			}
			else {	// We know it's not the wrong color piece
				return "";
			}
		}
		else {
			return "Pawn cannot move there.";
		}
	}
	else {
		return "Pawn cannot move there.";
	}
}

// Find board style
function setStyle(msg, args) {
	// White or black
	if (args[0] === "w" || args[0] === "b") { 
		if (boardStyle.includes(args[1])) { // If style exists
			if (args[0] === "w") { // Set style
				whiteSet = args[1];
				msg.channel.send("Set white's style!");
			}
			else { // Black
				blackSet = args[1];
				msg.channel.send("Set black's style!");
			}
		}
		else {
			msg.channel.send("Could not find type!");
		}
	}
	else {
		msg.channel.send("Set the first argument to w or b!");
	}
}

module.exports = {
    chessCommand: function(msg) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!chess mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
            case 'help':
                // set found equal to true so your index.js file knows
                //   to not try executing 'other' commands
                // execute function associated with this command
                msg.channel.send("Unfinished! Ask Wenyunity.")
                break;

            // your second admin command (similar setup as above)
            case 'view':
                printBoard(msg, true, arguments[0]);
                break;
				
			case 'move':
				movePiece(msg, arguments);
				break;
				
			case 'reset':
				newBoard();
				break;
				
			case 'set':
				setStyle(msg, arguments);
				break;
			
			default:
				msg.channel.send("Args: view, move, reset, set")
				break;

            // ... more admin commands
        }
	}
}