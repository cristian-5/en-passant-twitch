
import { readAll } from 'https://deno.land/std@0.150.0/streams/conversion.ts';
import { TwitchChat } from 'https://deno.land/x/tmi_beta@v0.1.4/mod.ts';

import { randomBoard, randomThread, posts } from './components/4chan.js';
import { diagram, gif } from './components/diagram.js';

import { log, resolve, actions, programmables, refresh } from './parser.js';
import { Streamer, SETUP, StreamerID, Prefix } from './config.js';
import { Server, ROOT, NOT_FOUND } from './server.js';

import { queue } from './actions/queue.js';
import { challenge } from './actions/info.js';
import { Database } from './database.js';

// ==== Actions ============================

import './actions/info.js';
import './actions/queue.js';
import './actions/ratings.js';
import './actions/video.js';

// ==== Tasks ==============================

import './tasks/discord.js';
// import './tasks/drop.js';

// =========================================

// twitch bot:
export let chat = null, channel = null;
// current scopes generated by https://twitchapps.com/tokengen/:
// https://dev.twitch.tv/docs/authentication/scopes#twitch-access-token-scopes
// channel:moderate moderation:read moderator:read:chat_settings
// moderator:manage:chat_settings moderator:manage:chat_messages
// moderator:manage:announcements moderator:manage:banned_users
// chat:edit chat:read whispers:read whispers:edit
// user:manage:whispers user:manage:chat_color

export async function connect() {
	try {
		if (channel !== null) {
			channel.part();
			chat.disconnect();
			log('status', 'twitch chat disconnected');
		}
		chat = new TwitchChat(Deno.env.get('TWITCH_OAUTH_BOT'));
		await chat.connect();
		channel = chat.join(Streamer, StreamerID);
		channel.listener('privmsg', data => resolve(data, channel));
	} catch (e) {
		console.error(e);
		Deno.exit(1);
	}
	log('status', 'twitch chat connected');
}

await connect();

// =========================================

const server = new Server();

/// test: curl -o image.png -X POST
/// https://en-passant-twitch.cristian-98.repl.co/fen/
/// -H 'Content-Type: application/json'
/// -d '{ "fen": "4r2r/pp2n3/3kP2p/2pP2p1/2P5/6Q1/P5PP/6K1 b - - 1 26" }'
server.listen([ 'fen', 'diagram' ], async request => {
	const data = await readAll(request.body);
	try {
		const json = JSON.parse(new TextDecoder().decode(data));
		const fen = json.fen || SETUP;
		const image = await diagram(fen, json.perspective);
		if (image != null) return { status: 200, body: image };
		else return { status: 404, body: 'Not found' };
	} catch { return { status: 404, body: 'Not found' }; }
});

/// test: curl -o image.gif -X POST
/// https://en-passant-twitch.cristian-98.repl.co/pgn/
/// -H 'Content-Type: application/json'
/// -d '{ "pgn": "1. d4 d5 2. c4 c6 3. Nf3 e6 4. Nbd2 Nf6" }'
server.listen('pgn', async request => {
	const data = await readAll(request.body);
	try {
		const json = JSON.parse(new TextDecoder().decode(data));
		const pgn = json.pgn || '';
		const image = gif(pgn, json.perspective);
		if (image != null) return { status: 200, body: image };
		else return { status: 404, body: 'Not found' };
	} catch { return { status: 404, body: 'Not found' }; }
});

server.listen(NOT_FOUND, () => ({ status: 404, body: 'Not found' }));

server.listen([ ROOT, 'help', 'mod' ], async request => {
	await refresh();
	const mod = request.url.includes('mod');
	const join = programmables.find(p => p.commands.includes('join'));
	return {
		headers: new Headers({ 'Content-Type': 'text/html' }),
		status: 200, body: new TextDecoder().decode(
			Deno.readFileSync('./help.html')
		).replace('`%ACTIONS%`', JSON.stringify(actions))
		.replace('`%PROGRAMMABLES%`', JSON.stringify(programmables))
		.replace('`%PREFIX%`', `'${Prefix}'`)
		.replace('`%MOD%`', JSON.stringify(mod))
		.replace('`%QUEUE%`', queue.enabled ? "'on'" : "'off'")
		.replace('`%CHALLENGE%`', challenge ? "'on'" : "'off'")
		.replace('`%SUBONLY%`', join.permissions === 'sub' ? "'on'" : "'off'")
	};
});

server.listen('audit', async () => ({
	headers: new Headers({ 'Content-Type': 'text/html' }),
	status: 200, body: new TextDecoder().decode(
		Deno.readFileSync('./audit.html')
	).replace('`%AUDIT%`', JSON.stringify((await Database.get('audit')) || []))
}));

server.listen('time', () => ({
	headers: new Headers({ 'Content-Type': 'text/html' }),
	status: 200, body: new TextDecoder().decode(
		Deno.readFileSync('./time.html')
	)
}));

server.listen('queue', () => {
	const join = programmables.find(p => p.commands.includes('join'));
	return {
		headers: new Headers({ 'Content-Type': 'text/html' }),
		status: 200, body: new TextDecoder().decode(
			Deno.readFileSync('./queue.html')
		).replace('`%LIST%`', JSON.stringify(queue.list))
		.replace('`%QUEUE%`', queue.enabled ? "'on'" : "'off'")
		.replace('`%CHALLENGE%`', challenge ? "'on'" : "'off'")
		.replace('`%SUBONLY%`', join.permissions === 'sub' ? "'on'" : "'off'")
	};
});

server.listen('map', () => ({
	headers: new Headers({ 'Content-Type': 'text/html' }),
	status: 200, body: Deno.readFileSync('./map.html')
}));

server.listen('training', async () => {
	const board = await randomBoard();
	const thread = await randomThread(board);
	let messages = await posts(board, thread);
	// get first 10 to 20 rand messages:
	messages = messages.slice(0, Math.floor(Math.random() * 10) + 10);
	return {
		headers: new Headers({ 'Content-Type': 'text/html' }),
		status: 200, body: new TextDecoder().decode(
			Deno.readFileSync('./training.html')
		).replace('`%MESSAGES%`', JSON.stringify(messages))
	};
});

server.start();
log('status', 'server connected');
