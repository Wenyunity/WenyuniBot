// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- CONSTANTS
const boardStyle = JSON.parse(fs.readFileSync('./Chess/boardStyle.json', 'utf8'));
const boardPosition = JSON.parse(fs.readFileSync('./Chess/boardPosition.json', 'utf8'));
let lastMoveTime = 0;
const hour = 1000 * 60 * 60;
const timeOut = 1000 * 60 * 60 * 2; // 2 hours
const moduleColor = "#FFFFFF"
const whitePiece = ["P", "R", "N", "B", "Q", "K"]
const blackPiece = ["p", "r", "n", "b", "q", "k"]
const boardStyleSet = ["highlight", "diagonal", "versus", "compact"]
const columnName = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
			
// -- VIEW BOARD --

// View the board with a given style
// This function assumes the given style exists
function viewBoard(style, order, board, boardInfo) {
	
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
				if (boardInfo.playerToMove === "w" && whitePiece.includes(board[j][i])) { // White on-turn
					message += boardStyle[style]["piece"]["whiteOnTurn"][0] + board[j][i] + boardStyle[style]["piece"]["whiteOnTurn"][1]
				}
				else if (boardInfo.playerToMove === "b" && whitePiece.includes(board[j][i])) { // White off-turn
					message += boardStyle[style]["piece"]["whiteOffTurn"][0] + board[j][i] + boardStyle[style]["piece"]["whiteOffTurn"][1]
				}
				else if (boardInfo.playerToMove === "b" && blackPiece.includes(board[j][i])) { // Black on-turn
					message += boardStyle[style]["piece"]["blackOnTurn"][0] + board[j][i] + boardStyle[style]["piece"]["blackOnTurn"][1]
				}
				else if (boardInfo.playerToMove === "w" && blackPiece.includes(board[j][i])) { // Black off-turn
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
function printBoard(msg, addFEN, style, view, board, boardInfo) {
	let message = ""
	
	// See if board was flipped
	let check = view || boardInfo.playerToMove;
	// Which way to flip the board
	order = 1;
	if (check === "b") {
		order = -1;
	}
	
	// If style given
	if (boardStyleSet.includes(style)) {
		message += viewBoard(style, order, board, boardInfo)
	}
	else { // Default
		if (boardInfo.playerToMove === "w") {
			message += viewBoard(boardInfo.whiteStyle, order, board, boardInfo)
		}
		else {
			message += viewBoard(boardInfo.blackStyle, order, board, boardInfo)
		}
	}
	
	// Border color matches player to move
	let borderColor = "#FFFFFF";
	let player = "White";
	if (boardInfo.playerToMove == "b") {
		borderColor = "#000000";
		player = "Black";
	}
	
	let castleText = ""
	if (boardInfo.castle[0] || boardInfo.castle[1]) {
		castleText += "White: " + boardInfo.castle[0] + " " + boardInfo.castle[1] + "\r\n";
	}
	if (boardInfo.castle[2] || boardInfo.castle[3]) {
		castleText += "Black: " + boardInfo.castle[2] + " " + boardInfo.castle[3] + "\r\n";
	}
	if (!castleText) {
		castleText = "None";
	}
	
	enPassantText = boardInfo.enPassant || "None";
		
	// Create text
	let chessboardEmbed = new Discord.RichEmbed()
		.setColor(borderColor)
		.setTitle("Chessboard")
		.setAuthor('Wenyunibot')
		.setDescription(message)
		.addField("Move", player, true)
		.addField("Castling", castleText, true)
		.addField("En Passant", enPassantText, true)
		.addField("50-Move Rule Count", boardInfo.fiftyMoveRule, true)
		.addField("Turn Count", boardInfo.turnCount, true)
		
	if (addFEN) {
		chessboardEmbed.setFooter("FEN: "+getFEN(board, boardInfo));
	}

	msg.channel.send(chessboardEmbed);
}

// Get FEN for board
function getFEN(board, boardInfo) {
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
	base += " " + boardInfo.playerToMove + " ";
	// Castling
	base += ((boardInfo.castle[0]+boardInfo.castle[1]+boardInfo.castle[2]+boardInfo.castle[3]) || "-") + " ";
	// enPassant
	base += (boardInfo.enPassant || "-");
	// boardInfo.fiftyMoveRule + boardInfo.turnCount
	base += " " + boardInfo.fiftyMoveRule + " " + boardInfo.turnCount;
	
	return base;
}

// -- PIECE MOVEMENT --

// Moves piece if legal
function movePiece(msg, args, client, board, boardInfo) {
	
	if (args.length < 1) {
		client.basicEmbed("Input Error", "Please put coordinates in the form a1, where a-h, 1-8 are allowed. Castling: O-O for kingside, O-O-O for queenside.", msg.channel);
		return;
	}
	
	// Castling
	if (["0", "O"].includes(args[0].substring(0, 1))) {
		castling(msg, args[0], client, board, boardInfo);
		return;
	}
	// Turn into arrays
	if (args.length < 2) {
		client.basicEmbed("Input Error", "Two coordinates necessary; the position of the piece to be moved, and the destination.", msg.channel);
		return;
	}
	
	let from = determinePlace(args[0]);
	let to = determinePlace(args[1]);
	
	// Make sure these are valid coordinates
	if (from === "Error" || to === "Error") {
		client.basicEmbed("Input Error", "One of your coordinates was not set correctly! Please put them in the form a1, where a-h, 1-8 are allowed.", msg.channel);
		return;
	}
	// Don't stay still
	if (args[0] === args[1]) {
		client.basicEmbed("Move Error", "You cannot stay still!", msg.channel);
		return;
	}
	
	// Get the piece
	let piece = board[from[1]][from[0]];
	let endPiece = board[to[1]][to[0]];
	
	// Check if it's the right player's piece
	if (boardInfo.playerToMove === "w") {
		pieceFound = false;
		for (x in whitePiece) {
			if (whitePiece[x] === piece) { // Found a piece to move
				pieceFound = true;
			}
			if (whitePiece[x] === endPiece) { // Destination is blocked
				client.basicEmbed("Move Error", "There is a white piece at " + args[1] + " so your piece can't go there.", msg.channel);
				return;
			}
		}
		if (!pieceFound) { // No piece
			client.basicEmbed("Move Error", "There is no white piece at " + args[0] + " to move.", msg.channel);
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
				client.basicEmbed("Move Error", "There is a black piece at " + args[1] + " so your piece can't go there.", msg.channel);
				return;
			}
		}
		if (!pieceFound) { // No piece
			client.basicEmbed("Move Error", "There is no black piece at " + args[0] + " to move.", msg.channel);
			return;
		}
	}
	
	// Piece to move
	if (piece === "k" || piece ===  "K") {
		moveLegal = kingMove(from, to, board, boardInfo)
		if (moveLegal) {
			client.basicEmbed("Illegal Move", moveLegal, msg.channel);
			return;
		}
	}
	else if (piece === "Q" || piece ===  "q") {
		moveLegal = queenMove(from, to, [false, false], false, board, boardInfo)
		if (moveLegal) {
			client.basicEmbed("Illegal Move", moveLegal, msg.channel);
			return;
		}
	}
	else if (piece === "N" || piece ===  "n") {
		moveLegal = knightMove(from, to, board, boardInfo)
		if (moveLegal) {
			client.basicEmbed("Illegal Move", moveLegal, msg.channel);
			return;
		}
	}
	else if (piece === "B" || piece ===  "b") {
		moveLegal = bishopMove(from, to, [false, false], false, board, boardInfo)
		if (moveLegal) {
			client.basicEmbed("Illegal Move", moveLegal, msg.channel);
			return;
		}
	}
	else if (piece === "R" || piece ===  "r") {
		moveLegal = rookMove(from, to, [false, false], false, board, boardInfo)
		if (moveLegal) {
			client.basicEmbed("Illegal Move", moveLegal, msg.channel);
			return;
		}
	}
	else if (piece === "P" || piece ===  "p") {
		moveLegal = pawnMove(from, to, args[1], board, boardInfo)
		if (moveLegal) {
			client.basicEmbed("Illegal Move", moveLegal, msg.channel);
			return;
		}
	}
	else { // We really shouldn't end up here
		client.basicEmbed("Illegal Move", "What?", msg.channel, board, boardInfo);
		return;
	}
	
	// Check for check
	if (piece === "k" || piece === "K") {
		let full = fullCheck(to, boardInfo.playerToMove, from, [false, false], board, boardInfo);
		if (full) {
			client.basicEmbed("Illegal Move", "This move puts you into check!", msg.channel);
			return;
		}
	}
	else if (!boardInfo.inCheck) { // Not in check
		let king = [-1, -1];
		if (boardInfo.playerToMove === "b") {
			king = boardInfo.blackKingPos;
		}
		else {
			king = boardInfo.whiteKingPos;
		}
		let full = fullCheck(king, boardInfo.playerToMove, from, to, board, boardInfo);
		if (full) {
			client.basicEmbed("Illegal Move", "This move puts you into check!", msg.channel);
			return;
		}
	}
	else { // In check
		let king = [-1, -1];
		if (boardInfo.playerToMove = "b") {
			king = boardInfo.blackKingPos;
		}
		else {
			king = boardInfo.whiteKingPos;
		}
		let full = fullCheck(king, boardInfo.playerToMove, from, to, board, boardInfo);
		if (full) {
			client.basicEmbed("Illegal Move", "This move does not get you out of check!", msg.channel);
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
				client.basicEmbed("Input Error", "Please indicate your promotion piece, using [Q, B, R, N].\r\nEx: wy!chess move a7 a8 Q", msg.channel);
				return;
			}
		}
		else {
			client.basicEmbed("Input Error", "Please indicate your promotion piece, using [Q, B, R, N].\r\nEx: wy!chess move a7 a8 Q", msg.channel);
			return;
		}
	}

	// Move piece
	board[to[1]][to[0]] = piece;
	board[from[1]][from[0]] = "";
	
	// If we did an enPassant capture
	if (args[1] === boardInfo.enPassant && ["p", "P"].includes(piece)) {
		if (boardInfo.playerToMove === "w") { // We captured a black on row 5
			board[4][to[0]] = "";
		}
		else { // We captured a white on row 4
			board[3][to[0]] = "";
		}
	}
	
	// En Passant Check
	if (Math.abs(from[1] - to[1]) === 2 && ["p", "P"].includes(piece)) {
		if (boardInfo.playerToMove === "w") {
			boardInfo.enPassant = `${columnName[to[0]]}3`;
		}
		else {
			boardInfo.enPassant = `${columnName[to[0]]}6`;
		}
	}
	else {
		boardInfo.enPassant = "";
	}
	
	// Castling disabling
	if (piece === 'K') {
		boardInfo.castle[0] = "";
		boardInfo.castle[1] = "";
	}
	if (piece === 'k') {
		boardInfo.castle[2] = "";
		boardInfo.castle[3] = "";
	}
	
	// Queenside Rook (W)
	if ((from[0] === 0 && from[1] === 0) || (to[0] === 0 && to[1] === 0)) {
		boardInfo.castle[1] = "";
	} // Kingside Rook (W)
	if ((from[0] === 7 && from[1] === 0) || (to[0] === 7 && to[1] === 0)) {
		boardInfo.castle[0] = "";
	} // Queenside Rook (B)
	if ((from[0] === 0 && from[1] === 7) || (to[0] === 0 && to[1] === 7)) {
		boardInfo.castle[3] = "";
	} // Kingside Rook (B)
	if ((from[0] === 7 && from[1] === 7) || (to[0] === 7 && to[1] === 7)) {
		boardInfo.castle[2] = "";
	}
	
	// Reset 50 move rule
	if (piece === "P" || piece === "p" || endPiece) {
		boardInfo.fiftyMoveRule = 0
	}
	else { // Increment 50 move rule
		boardInfo.fiftyMoveRule = boardInfo.fiftyMoveRule + 1;
	}
	
	// King place update
	if (piece === "k") {
		boardInfo.blackKingPos = to;
	}
	if (piece === "K") {
		boardInfo.whiteKingPos = to;
	}
	
	setupNext(msg, client, board, boardInfo);
}

// Castling
function castling(msg, arguments, client, board, boardInfo) {
	let sideCount = arguments.split('-')
	
	// If in check, no castle
	if (boardInfo.inCheck) {
		client.basicEmbed("Castling Fail", "You are in check and cannot castle!", msg.channel);
		return;
	}
	
	let row = 0;
	let castleCheck = 0;
	if (boardInfo.playerToMove === "w") { // White
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
			client.basicEmbed("Castling Fail", "There is a piece in the way!", msg.channel);
			return;
		}
	}

	// Check if castling available
	if (!boardInfo.castle[castleCheck]) {
		client.basicEmbed("Castling Fail", "You lost your ability to castle in that direction!", msg.channel);
		return;
	}
	
	// Check squares
	for (i = 0; i < castleMoves.length; i++) {
		// Check if piece in the way
		if (board[castleMoves[i][1]][castleMoves[i][0]]) {
			client.basicEmbed("Castling Fail", "There is a piece in the way!", msg.channel);
			return;
		}
		if (fullCheck(castleMoves[i], boardInfo.playerToMove, [4, row], [false, false], board, boardInfo)) {
			client.basicEmbed("Castling Fail", "You cannot move through or into check!", msg.channel);
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
	if (boardInfo.playerToMove === "w") {
		boardInfo.castle[0] = "";
		boardInfo.castle[1] = "";
	}
	else { // Black castling removal
		boardInfo.castle[2] = "";
		boardInfo.castle[3] = "";
	}
	
	// Fifty move rule increment
	boardInfo.fiftyMoveRule++;
	// En Passant update
	boardInfo.enPassant = "";
	
	setupNext(msg, client, board, boardInfo);
}

// Sets up next move
function setupNext(msg, client, board, boardInfo) {
	// Turn and player swap
	if (boardInfo.playerToMove === 'w') {
		boardInfo.playerToMove = 'b';
	}
	else {
		boardInfo.playerToMove = 'w';
		boardInfo.turnCount = boardInfo.turnCount + 1;
	}
	
	// Check for check
	if (boardInfo.playerToMove === "w") {
		boardInfo.inCheck = fullCheck(boardInfo.whiteKingPos, boardInfo.playerToMove, [false, false], [false, false], board, boardInfo);
	}
	else {
		boardInfo.inCheck = fullCheck(boardInfo.blackKingPos, boardInfo.playerToMove, [false, false], [false, false], board, boardInfo);
	}
	
	// Check message
	if (boardInfo.inCheck) {
		msg.channel.send("Check!");
	}
	
	// Print board
	if (boardInfo.playerToMove === "w") {
		printBoard(msg, true, boardInfo.whiteStyle, boardInfo.playerToMove, board, boardInfo);		
	}
	else {
		printBoard(msg, true, boardInfo.blackStyle, boardInfo.playerToMove, board, boardInfo);
	}
	
	// Timeout
	lastMoveTime = Date.now();
	// Save board
	saveBoard(msg, client, true, board, boardInfo);
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
function rookMove(from, to, ignore, block, board, boardInfo) {
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
function bishopMove(from, to, ignore, block, board, boardInfo) {
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
function queenMove (from, to, ignore, block, board, boardInfo) {
	let rookResult = rookMove(from, to, ignore, block, board, boardInfo);
	let bishopResult = bishopMove(from, to, ignore, block, board, boardInfo);
	
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
function knightMove (from, to, board, boardInfo) {
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
function kingMove (from, to, board, boardInfo) {
	// Illegal move
	if (Math.abs(from[0] - to[0]) > 1 || Math.abs(from[1] - to[1]) > 1) {
		return "The king cannot move to that square!";
	}
	return "";
}

// We need to check if capturing is legal
// Or if moving, that there is no piece at the destination
function pawnMove (from, to, toa1Form, board, boardInfo) {
	// This is the start
	if (from[0] === to[0]) {
		// Same row moves
		// Double move check
		if (Math.abs(from[1] - to[1]) === 2) {
			if (boardInfo.playerToMove === "w" && from[1] === 1) { // White double move check
				if (!board[2][from[0]] && !board[3][from[0]]) { // Check if spaces clear
					return "";
				}
				else {
					return "There is a piece in the way!";
				}
			}
			else if (boardInfo.playerToMove === "b" && from[1] === 6) {
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
		if ((from[1] - to[1] === 1 && boardInfo.playerToMove === "b") || (from[1] - to[1] === -1 && boardInfo.playerToMove === "w")) {
			// En passant bypass
			if (boardInfo.enPassant === toa1Form) {
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

// -- CHECK --

// Checks if pawn puts king in check
function pawnCheck (pawn, king, player, board, boardInfo) {
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

// Checks for check
function fullCheck (kingPos, player, from, to, board, boardInfo) {
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
			if (danger.includes(board[j][i]) && !(to[0] === i && to[1] === j)) {
				let piece = board[j][i];
				// Determine piece
				if (piece === "k" || piece ===  "K") {
					// If legal then we are in check
					if (!(kingMove([i, j], kingPos, board, boardInfo))) {					
						return true;
					}
				}
				else if (piece === "Q" || piece === "q") {
					moveLegal = queenMove([i, j], kingPos, from, to, board, boardInfo)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "N" || piece ===  "n") {
					moveLegal = knightMove([i, j], kingPos, board, boardInfo)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "B" || piece ===  "b") {
					moveLegal = bishopMove([i, j], kingPos, from, to, board, boardInfo)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "R" || piece ===  "r") {
					moveLegal = rookMove([i, j], kingPos, from, to, board, boardInfo)
					if (!moveLegal) {
						return true;
					}
				}
				else if (piece === "P" || piece ===  "p") {
					moveLegal = pawnCheck([i, j], kingPos, player, board, boardInfo)
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

// -- STYLE --

// Find board style
function setStyle(msg, args, client, board, boardInfo) {
	// White or black
	if (args[0] === "w" || args[0] === "b") { 
		if (boardStyleSet.includes(args[1])) { // If style exists
			if (args[0] === "w") { // Set style
				boardInfo.whiteStyle = args[1];
				client.basicEmbed("Style Changed", "Set white's style!", msg.channel, moduleColor);
			}
			else { // Black
				boardInfo.blackStyle = args[1];
				client.basicEmbed("Style Changed", "Set black's style!", msg.channel, moduleColor);
			}
			saveBoard(msg, client, true, board, boardInfo);
		}
		else {
			client.basicEmbed("Style Error", "Could not find style!", msg.channel);
		}
	}
	else if (args[0] === "help") {
		client.basicEmbed("Style Help", "Current styles: " + boardStyleSet + "\r\nExample: `wy!chess set w compact`", msg.channel);
	}
	else {
		client.basicEmbed("Style Error", "Set the first argument to w or b!", msg.channel);
	}
}

// -- LOAD, SAVE, AND RESET --

// Timeout is not there yet
function noTimeOut(msg) {
	msg.channel.send(`You need to wait at least ${(Math.floor(((timeOut + lastMoveTime - Date.now())/hour)*100)/100)} hours to reset/load.`)
}

// Loads board from storage
// To prevent spam, loads from usertag.json
function loadBoard(msg, client, auto) {
	x = {}
	if (auto) {
		try {
			x = JSON.parse(fs.readFileSync(`./Chess/Data/Auto${msg.guild.id}-${msg.channel.id}.json`, 'utf8'));
		}
		catch (err) {
			x = newBoard(msg, client);
		}
	}
	else {
		try {
			x = JSON.parse(fs.readFileSync(`./Chess/Data/SV${msg.author.id}.json`, 'utf8'));
		}
		catch (err) {
			client.basicEmbed("Load Error", "Could not find your save file", msg.channel);
			return;
		}
	}
	board = x.board;
	lastMove = Date.now();
	
	if (!auto) {
		client.basicEmbed("Load Complete", "Done loading file!", msg.channel, moduleColor);
		printBoard(msg, true, x.style, x.view, board, x);
		saveBoard(msg, client, true, x.board, x);
	}
	
	return [board, x];
}

// Saves board state
// To prevent spam, saves to usertag.json
function saveBoard(msg, client, auto, board, boardInfo) {
	
	let x = boardInfo;
	x.board = board;
	
	if (auto) {
		fs.writeFile(`./Chess/Data/Auto${msg.guild.id}-${msg.channel.id}.json`, JSON.stringify(x, null, 4), function(err) {
			if (err) throw err;
		})
	}
	else {
		fs.writeFile(`./Chess/Data/${msg.author.id}.json`, JSON.stringify(x, null, 4), function(err) {
			if (err) throw err;
			console.log('completed writing to chess json');
		})
		client.basicEmbed("Save Complete", `Saved file to ${msg.author.tag}'s file.`, msg.channel, moduleColor);
	}
}

// Resets board to default
function newBoard(msg, client) {
	let boardInfo = {};
	boardInfo.board = [["R", "N", "B", "Q", "K", "B", "N", "R"], ["P", "P", "P", "P", "P", "P", "P", "P"], 
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
			["p", "p", "p", "p", "p", "p", "p", "p"], ["r", "n", "b", "q", "k", "b", "n", "r"]];
	boardInfo.playerToMove = "w";
	boardInfo.castle = ["K", "Q", "k", "q"];
	boardInfo.enPassant = "";
	boardInfo.fiftyMoveRule = 0;
	boardInfo.turnCount = 1;
	boardInfo.blackKingPos = [4, 7];
	boardInfo.whiteKingPos = [4, 0];
	boardInfo.inCheck = false;
	boardInfo.whiteStyle = "compact";
	boardInfo.blackStyle = "compact";
	
	saveBoard(msg, client, true, boardInfo.board, boardInfo);
	return boardInfo;
}

function helpText(msg, client) {
	client.basicEmbed("Lol", "Whoops", msg.channel);
}

module.exports = {
    chessCommand: function(msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!chess mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
		if (!mainCommand) {
			helpText(msg, client);
			return;
		}
		
		let [board, boardInfo] = loadBoard(msg, client, true);
        switch(mainCommand) {
            case 'help':
                msg.channel.send("Unfinished! Ask Wenyunity.")
                break;

            case 'view':
                printBoard(msg, true, arguments[0], arguments[1], board, boardInfo);
                break;
				
			case 'move':
				movePiece(msg, arguments, client, board, boardInfo);
				break;
			
			case 'clear':
			case 'reset':
				if (Date.now() > lastMoveTime + timeOut) {
					msg.channel.send("Board reset!");
					newBoard(msg, client);
				}
				else {
					noTimeOut(msg);
				}
				break;
				
			case 'set':
			case 'style':
				setStyle(msg, arguments, client, board, boardInfo);
				break;
				
			case 'save':
				saveBoard(msg, client, false, board, boardInfo);
				lastMoveTime = 0;
				break;
				
			case 'load':
				if (Date.now() > lastMoveTime + timeOut) {
					if (arguments[0]) {
						if (arguments[0].toLowerCase() === "auto") {
							loadBoard(msg, client, true);
						}
						else {
							loadBoard(msg, client, false);
						}
					}
					else {
						loadBoard(msg, client, false);
					}
				}
				else {
					noTimeOut(msg, client);
				}
				break;
			
			// A little joke
			case 'flip':
				client.basicEmbed("Chess Flip", "*flips table* GAME OVER!!\r\n┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻", msg.channel, moduleColor);
				break;
				
			default:
				if (!(determinePlace(mainCommand) === "Error")) {
					let newArgs = args.slice(1);
					movePiece(msg, newArgs, client, board, boardInfo);
				}
				else if (["O-O", "0-0", "O-O-O", "0-0-0"].includes(mainCommand)) {
					let newArgs = args.slice(1);
					movePiece(msg, newArgs, client, board, boardInfo);
				}
				else {
					msg.channel.send("Still not finished yet");
				}
				break;
        }
	}
}