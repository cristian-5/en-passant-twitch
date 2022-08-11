
import { Chess } from 'https://deno.land/x/beta_chess@v1.0.1/chess.js';

import { Position, Positions }
	from 'https://deno.land/x/beta_chess_diagrams@v2.1.2/mod.ts';

const THEMES = [
	{ light: '#A9DBFF', dark: '#399AEF', highlight: 'rgba(100, 255, 99, 0.5)' }, // blue
	{ light: '#E7D1FF', dark: '#8C60BB', highlight: 'rgba(32, 150, 244, 0.5)' }, // purple
	{ light: '#F1EEBC', dark: '#F07782', highlight: 'rgba(255, 209, 0,  0.4)' }, // pink
	{ light: '#ECDAB9', dark: '#AE8A69', highlight: 'rgba(60, 210, 160, 0.4)' }, // brown
	{ light: '#9ED8CC', dark: '#008C76', highlight: 'rgba(255, 209, 0, 0.45)' }, // green
];

export function gif(pgn, perspective = 'w') {
	const game = new Chess();
	game.pgn(pgn);
	const p = new Positions(perspective, true, THEMES.random());
	const boards = [], highlights = []; let move = null;
	boards.push(game.board);
	while ((move = game.takeback()) != null) {
		boards.push(game.board);
		highlights.push([ move.from, move.to ]);
	}
	for (let i = boards.length - 1; i >= 0; i--) p.add(boards[i], highlights[i]);
	return p.gif();
}

export async function diagram(fen, perspective) {
	const game = new Chess(fen);
	perspective = perspective || game.turn;
	const p = new Position(game.board);
	return await p.picture(perspective);
}
