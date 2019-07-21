const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');
const boardStyle = JSON.parse(fs.readFileSync('./Chess/boardStyle.json', 'utf8'));
const boardPosition = JSON.parse(fs.readFileSync('./Chess/boardPosition.json', 'utf8'));
let board = [["R", "N", "B", "Q", "K", "B", "N", "R"], ["P", "P", "P", "P", "P", "P", "P", "P"], 
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["p", "p", "p", "p", "p", "p", "p", "p"], ["r", "n", "b", "q", "k", "b", "n", "r"]];
let playerToMove = "w";
let castle = ["K", "Q", "k", "q"];
let enPassant = "";
let fiftyMoveRule = 0;
let turnCount = 1;
let whiteKingPos = [4, 0];
let blackKingPos = [4, 7];
let whiteStyle = "compact";
let blackStyle = "compact";
let inCheck = false;
let columnName = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const whitePiece = ["P", "R", "N", "B", "Q", "K"]
const blackPiece = ["p", "r", "n", "b", "q", "k"]
const boardStyleSet = ["highlight", "diagonal", "versus", "compact"]
			
function newBoard() {
	board = [["R", "N", "B", "Q", "K", "B", "N", "R"], ["P", "P", "P", "P", "P", "P", "P", "P"], 
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["p", "p", "p", "p", "p", "p", "p", "p"], ["r", "n", "b", "q", "k", "b", "n", "r"]];
	playerToMove = "w";
	castle = ["K", "Q", "k", "q"];
	enPassant = "";
	fiftyMoveRule = 0;
	turnCount = 1;
	blackKingPos = [4, 7];
	whiteKingPos = [4, 0];
	inCheck = false;
}

// View the board with a given style
// This function assumes the given style exists
function viewBoard(style, order) {
	
	// Color style
	message = '```' + boardStyle[style]["color"] + "\r\n"
	
	// Default for white
	let j = 7
	let jChange = -1;
	let iChange = 1;
	let iStart = 0;
	if (order === -1) { // Black flips the board
		j = 0;
		jChange = 1;
		iStart = 7;
		iChange = -1;
		message += boardStyle[style]["header"]["black"] + "\r\n" + boardStyle[style]["border"]["top"] + "\r\n"
	}
	else { // Add white header
		message += boardStyle[style]["header"]["white"] + "\r\n" + boardStyle[style]["border"]["top"] + "\r\n"
	}
	
	// Iterate through rows
	while (j > -1 && j < 8) {
		
		// Left side
		if (j % 2) { // Odd row, since offset by 1
			message += (j+1) + boardStyle[style]["border"]["leftOdd"]
		}
		else { // Even row
			message += (j+1) + boardStyle[style]["border"]["leftEven"]
		}
		
		// Iterate through squares
		i = iStart;
		while (i > -1 && i < 8) {
			// Found a piece
			if (board[j][i]) {
				// Find the right set of player turn and which team the piece is on
				if (playerToMove === "w" && whitePiece.includes(board[j][i])) { // White on-turn
					message += boardStyle[style]["piece"]["whiteOnTurn"][0] + board[j][i] + boardStyle[style]["piece"]["whiteOnTurn"][1]
				}
				else if (playerToMove === "b" && whitePiece.includes(board[j][i])) { // White off-turn
					message += boardStyle[style]["piece"]["whiteOffTurn"][0] + board[j][i] + boardStyle[style]["piece"]["whiteOffTurn"][1]
				}
				else if (playerToMove === "b" && blackPiece.includes(board[j][i])) { // Black on-turn
					message += boardStyle[style]["piece"]["blackOnTurn"][0] + board[j][i] + boardStyle[style]["piece"]["blackOnTurn"][1]
				}
				else if (playerToMove === "w" && blackPiece.includes(board[j][i])) { // Black off-turn
					message += boardStyle[style]["piece"]["blackOffTurn"][0] + board[j][i] + boardStyle[style]["piece"]["blackOffTurn"][1]
				}
			}
			else { // No piece
				message += boardStyle[style]["piece"]["noPiece"][0] + "." + boardStyle[style]["piece"]["noPiece"][1]
			}
			i += iChange;
		}
		// Right side
		if (j % 2) { // Odd row, since offset by 1
			message += boardStyle[style]["border"]["rightOdd"] + (j+1) + "\r\n"
		}
		else { // Even row
			message += boardStyle[style]["border"]["rightEven"] + (j+1) + "\r\n"
		}
		j += jChange;
	}
	
	// Footer
	if (order === -1) { // black footer
		message += boardStyle[style]["border"]["bottom"] + "\r\n" + boardStyle[style]["header"]["black"] + '```'
	}
	else { // white footer
		message += boardStyle[style]["border"]["bottom"] + "\r\n" + boardStyle[style]["header"]["white"] + '```'
	}
	return message;
}

// Prints current board state
function printBoard(msg, addFEN, style, view) {
	let message = ""
	
	// See if board was flipped
	let check = view || playerToMove;
	// Which way to flip the board
	order = 1;
	if (check === "b") {
		order = -1;
	}
	
	// If style given
	if (boardStyleSet.includes(style)) {
		message += viewBoard(style, order)
	}
	else { // Default
		if (playerToMove === "w") {
			message += viewBoard(whiteStyle, order)
		}
		else {
			message += viewBoard(blackStyle, order)
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
		castleText += "Black: " + castle[2] + " " + castle[3] + "\r\n";
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

// Get FEN for board
function getFEN() {
	base = ""
	
	// This gets the board state
	for (i = 7; i > -1; i--) {
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
		if (i > 0) {
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

// Castling
function castling(msg, arguments) {
	let sideCount = arguments.split('-')
	
	// If in check, no castle
	if (inCheck) {
		msg.channel.send("You are in check and cannot castle!");
		return;
	}
	
	let row = 0;
	let castleCheck = 0;
	if (playerToMove === "w") { // White
		row = 0;
	}
	else { // Black
		row = 7;
		castleCheck = 2;
	}

	// Get which squares to check
	let castleMoves = []
	
	// Kingside Castling
	if (sideCount.length === 2) {
		castleMoves = [[5, row], [6, row]]
		
	}
	else { // Queenside Castling
		castleMoves = [[3, row], [2, row]]
		castleCheck++;
		
		// Extra check for queenside
		if (board[row][1]) {
			msg.channel.send("There is a piece in the way!");
			return;
		}
	}

	// Check if castling available
	if (!castle[castleCheck]) {
		msg.channel.send("You lost your ability to castle in that direction!");
		return;
	}
	
	// Check squares
	for (i = 0; i < castleMoves.length; i++) {
		// Check if piece in the way
		if (board[castleMoves[i][1]][castleMoves[i][0]]) {
			msg.channel.send("There is a piece in the way!");
			return;
		}
		if (fullCheck(castleMoves[i], playerToMove, [4, row], [false, false])) {
			msg.channel.send("You cannot move through or into check!");
			return;
		}
	}
	console.log("Alive post-row4")
	// Legal move, move pieces
	if (sideCount.length === 2) {
		board[row][6] = board[row][4];
		board[row][5] = board[row][7];
		board[row][7] = "";
		board[row][4] = "";
	}
	else { // Queenside Castling
		board[row][2] = board[row][4];
		board[row][3] = board[row][0];
		board[row][0] = "";
		board[row][4] = "";
	}
	console.log("Alive post-row5")
	// White castling removal
	if (playerToMove === "w") {
		castle[0] = "";
		castle[1] = "";
	}
	else { // Black castling removal
		castle[2] = "";
		castle[3] = "";
	}
	
	// Fifty move rule increment
	fiftyMoveRule++;
	// En Passant update
	enPassant = "";
	
	// Turn and player swap
	if (playerToMove === 'w') {
		playerToMove = 'b';
	}
	else {
		playerToMove = 'w';
		turnCount = turnCount + 1;
	}
	
	// Check for check
	if (playerToMove === "w") {
		inCheck = fullCheck(whiteKingPos, playerToMove, [false, false], [false, false]);
	}
	else {
		inCheck = fullCheck(blackKingPos, playerToMove, [false, false], [false, false]);
	}
	
	// Print board
	if (playerToMove === "w") {
		printBoard(msg, true, whiteStyle, playerToMove);		
	}
	else {
		printBoard(msg, true, blackStyle, playerToMove);
	}
	
	return;
}

// Moves piece if legal
function movePiece(msg, args) {
	// Castling
	if (["0", "O"].includes(args[0].substring(0, 1))) {
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
	// Don't stay still
	if (args[0] === args[1]) {
		msg.channel.send("You cannot stay still!")
		return;
	}
	
	// Get the piece
	let piece = board[from[1]][from[0]];
	let endPiece = board[to[1]][to[0]];
	
	// Check if it's the right player's piece
	if (playerToMove === "w") {
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
			msg.channel.send("There is no black piece at " + args[0] + " to move.");
			return;
		}
	}
	
	// Piece to move
	if (piece === "k" || piece ===  "K") {
		moveLegal = kingMove(from, to)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "Q" || piece ===  "q") {
		moveLegal = queenMove(from, to, [false, false], false)
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
		moveLegal = bishopMove(from, to, [false, false], false)
		if (moveLegal) {
			msg.channel.send(moveLegal);
			return;
		}
	}
	else if (piece === "R" || piece ===  "r") {
		moveLegal = rookMove(from, to, [false, false], false)
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
	
	// Check for check
	if (piece === "k" || piece === "K") {
		let full = fullCheck(to, playerToMove, from, [false, false]);
		if (full) {
			msg.channel.send("This move puts you into check!");
			return;
		}
	}
	else if (!inCheck) { // Not in check
		let king = [-1, -1];
		if (playerToMove === "b") {
			king = blackKingPos;
		}
		else {
			king = whiteKingPos;
		}
		let full = fullCheck(king, playerToMove, from, to);
		if (full) {
			msg.channel.send("This move puts you into check!");
			return;
		}
	}
	else { // In check
		let king = [-1, -1];
		if (playerToMove = "b") {
			king = blackKingPos;
		}
		else {
			king = whiteKingPos;
		}
		let full = fullCheck(king, playerToMove, from, to);
		if (full) {
			msg.channel.send("This move does not get you out of check!");
			return;
		}
	}

	// Promotion 
	if (['p', 'P'].includes(piece) && [7, 0].includes(to[1])) {
		if (args[2]) {
			if (['q', 'Q', 'r', 'R', 'b', 'B', 'n', 'N'].includes(args[2])) {
				if (piece === "P") { // White piece
					piece = args[2].toUpperCase();
				}
				else { // Black piece
					piece = args[2].toLowerCase();
				}
			}
			else {
				msg.channel.send("Please indicate your promotion piece, using [Q, B, R, N].\r\nEx: wy!chess move a7 a8 Q" );
				return;
			}
		}
		else {
			msg.channel.send("Please indicate your promotion piece, using [Q, B, R, N].\r\nEx: wy!chess move a7 a8 Q");
			return;
		}
	}

	// Move piece
	board[to[1]][to[0]] = piece;
	board[from[1]][from[0]] = "";
	
	// If we did an enPassant capture
	if (args[1] === enPassant && ["p", "P"].includes(piece)) {
		if (playerToMove === "w") { // We captured a black on row 5
			board[4][to[0]] = "";
		}
		else { // We captured a white on row 4
			board[3][to[0]] = "";
		}
	}
	
	// En Passant Check
	if (Math.abs(from[1] - to[1]) === 2 && ["p", "P"].includes(piece)) {
		if (playerToMove === "w") {
			enPassant = `${columnName[to[0]]}3`;
		}
		else {
			enPassant = `${columnName[to[0]]}6`;
		}
	}
	else {
		enPassant = "";
	}
	
	// Turn and player swap
	if (playerToMove === 'w') {
		playerToMove = 'b';
	}
	else {
		playerToMove = 'w';
		turnCount = turnCount + 1;
	}
	
	// Castling disabling
	if (piece === 'K') {
		castle[0] = "";
		castle[1] = "";
	}
	if (piece === 'k') {
		castle[2] = "";
		castle[3] = "";
	}
	
	// Queenside Rook (W)
	if ((from[0] === 0 && from[1] === 0) || (to[0] === 0 && to[1] === 0)) {
		castle[1] = "";
	} // Kingside Rook (W)
	if ((from[0] === 7 && from[1] === 0) || (to[0] === 7 && to[1] === 0)) {
		castle[0] = "";
	} // Queenside Rook (B)
	if ((from[0] === 0 && from[1] === 7) || (to[0] === 0 && to[1] === 7)) {
		castle[3] = "";
	} // Kingside Rook (B)
	if ((from[0] === 7 && from[1] === 7) || (to[0] === 7 && to[1] === 7)) {
		castle[2] = "";
	}
	
	// Reset 50 move rule
	if (piece === "P" || piece === "p" || endPiece) {
		fiftyMoveRule = 0
	}
	else { // Increment 50 move rule
		fiftyMoveRule = fiftyMoveRule + 1;
	}
	
	// King place update
	if (piece === "k") {
		blackKingPos = to;
	}
	if (piece === "K") {
		whiteKingPos = to;
	}
	
	// Check for check
	if (playerToMove === "w") {
		inCheck = fullCheck(whiteKingPos, playerToMove, [false, false], [false, false]);
	}
	else {
		inCheck = fullCheck(blackKingPos, playerToMove, [false, false], [false, false]);
	}
	
	// Check message
	if (inCheck) {
		msg.channel.send("Check!");
	}
	
	// Print board
	if (playerToMove === "w") {
		printBoard(msg, true, whiteStyle, playerToMove);		
	}
	else {
		printBoard(msg, true, blackStyle, playerToMove);
	}
}

// Converts a1 to [x, y] format
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
function rookMove(from, to, ignore, block) {
	// Check if destination is legal for a rook to move to
	// Move vertically
	if (from[0] === to[0]) {
		let minVal = Math.min(from[1], to[1]) + 1;
		let maxVal = Math.max(from[1], to[1]);
		for (i = minVal; i < maxVal; i++) {
			if (board[i][from[0]]) { // Found a piece
				if (!(ignore[0] === from[0] && ignore[1] === i)) { // If we're not ignoring it
					return "There is a piece in the way!";
				}
			}
			if (block) {
				if (block[0] === from[0] && block[1] === j) { // Blocked, if using for check
					return "This piece blocks!";
				}
			}
		}
	}
	// Move horizontally
	else if (from[1] === to[1]) {
		let minVal = Math.min(from[0], to[0]) + 1;
		let maxVal = Math.max(from[0], to[0]);
		for (i = minVal; i < maxVal; i++) {
			if (board[from[1]][i]) { // Found a piece
				if (!(ignore[0] === i && ignore[1] === from[1])) { // If we're not ignoring it
					return "There is a piece in the way!";
				}
			}
			if (block) {
				if (block[0] === i && block[1] === from[1]) { // Blocked, if using for check
					return "This piece blocks!";
				}
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
function bishopMove(from, to, ignore, block) {
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
				if (!(board[yCheck][xCheck] === "")) { // Piece found
					if (!(ignore[0] === xCheck && ignore[1] === yCheck)) { // We don't want to ignore this square
						return "There is a piece in the way!"
					}
				}
				if (block) {
					if (block[0] === xCheck && block[1] === yCheck) { // Blocked, if using for check
						return "This piece blocks!";
					}
				}
			}
		}
	}
	else {
		return "The bishop cannot move to that square!";
	}
}

// Queen is the sum of bishop and rook
function queenMove (from, to, ignore, block) {
	let rookResult = rookMove(from, to, ignore, block);
	let bishopResult = bishopMove(from, to, ignore, block);
	
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
			if (playerToMove === "w" && from[1] === 1) { // White double move check
				if (!board[2][from[0]] && !board[3][from[0]]) { // Check if spaces clear
					return "";
				}
				else {
					return "There is a piece in the way!";
				}
			}
			else if (playerToMove === "b" && from[1] === 6) {
				if (!board[5][from[0]] && !board[4][from[0]]) { // Check if spaces clear
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
		if ((from[1] - to[1] === 1 && playerToMove === "b") || (from[1] - to[1] === -1 && playerToMove === "w")) {
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

// Checks if pawn puts king in check
function pawnCheck (pawn, king, player) {
	if (Math.abs(pawn[0] - king[0]) === 1) {
		if ((pawn[1] - king[1] === 1 && player === "b") || (pawn[1] - king[1] === -1 && player === "w")) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
}

// Find board style
function setStyle(msg, args) {
	// White or black
	if (args[0] === "w" || args[0] === "b") { 
		if (boardStyleSet.includes(args[1])) { // If style exists
			if (args[0] === "w") { // Set style
				whiteStyle = args[1];
				msg.channel.send("Set white's style!");
			}
			else { // Black
				blackStyle = args[1];
				msg.channel.send("Set black's style!");
			}
		}
		else {
			msg.channel.send("Could not find style!");
		}
	}
	else {
		msg.channel.send("Set the first argument to w or b!");
	}
}

// Checks for check
function fullCheck (kingPos, player, from, to) {
	let danger = [];
	
	if (player === "w") {
		danger = blackPiece
	}
	else {
		danger = whitePiece
	}
	
	// Iterate through the whole board
	for (i = 0; i < 8; i++) {
		for (j = 0; j < 8; j++) {
			// Found a dangerous piece
			if (danger.includes(board[j][i])) {
				let piece = board[j][i];
				// Determine piece
				if (piece === "k" || piece ===  "K") {
					// If legal then we are in check
					if (!(kingMove([i, j], kingPos))) {					
						return true;
					}
				}
				else if (piece === "Q" || piece === "q") {
					moveLegal = queenMove([i, j], kingPos, from, to)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "N" || piece ===  "n") {
					moveLegal = knightMove([i, j], kingPos)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "B" || piece ===  "b") {
					moveLegal = bishopMove([i, j], kingPos, from, to)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "R" || piece ===  "r") {
					moveLegal = rookMove([i, j], kingPos, from, to)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "P" || piece ===  "p") {
					moveLegal = pawnCheck([i, j], kingPos, player)
					if (moveLegal) {
						return true;
					}
				}
				else {
					msg.channel.send("How did you get here?");
					return;
				}
			}
		}
	}
	return false;
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
                printBoard(msg, true, arguments[0], arguments[1]);
                break;
				
			case 'move':
				movePiece(msg, arguments);
				break;
				
			case 'reset':
				msg.channel.send("Board reset!");
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