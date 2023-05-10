
import { Prefix } from './config.js';
import { Database } from './database.js';
import { channel } from './main.js';

import { live } from "../components/twitch.js";

export let actions = []; export const programmables = [];

export const log = (component, text) => console.log(
	`[${(new Date()).toLocaleTimeString('en-GB', {
		timeZone: 'UTC', hour12: false, hour: 'numeric', minute: 'numeric'
	})} UTC] ${component}: ${text}`
);

const hearts = { '🧡': "orange", '💚': "green", '💙': "blue", '💜': "purple" };

const handler = message => {
	if (message === undefined) return;
	for (const heart in hearts) if (message.startsWith(heart)) {
		channel.commands.announce(message.substring(1).trim(), hearts[heart]);
		return;
	}
	channel.send(message);
};

// l: live switch, enables or disables the task based on the streamer's status
export const task = (f, t, l = true) => {
	setInterval(async () => {
		if (l && !(await live(Streamer))) return;
		if (f.constructor.name === 'AsyncFunction')
			f(channel).then(handler);
		else handler(f(channel));
	}, t);
};

// ==== Twitch Actions =========================================================

const RRSLV = new RegExp(`${Prefix}[A-Za-z0-9_\\.]+`, 'i');

function allowed(tags, permissions) {
	if (tags.broadcaster || tags.mod) return true;
	switch (permissions) {
		case 'mod': return false;
		case 'sub': return tags.sub;
		case 'vip': return tags.vip;
		case 'all': default: return true;
	}
}

export function resolve(data, channel) {
	if (!data.message.includes(Prefix)) return;
	let command = RRSLV.exec(data.message);
	if (command === null) return;
	if (/\b(command|use|type)\b/i.test(data.message)) return;
	command = command[0].trim().replace(Prefix, '').toLowerCase();
	for (const action of actions) {
		if (!action.commands.includes(command)) continue;
		if (!allowed(data.tags, action.permissions)) return;
		if (action.reply !== undefined) handler(action.reply);
		return;
	}
	for (const action of programmables) {
		if (!action.commands.includes(command)) continue;
		if (!allowed(data.tags, action.permissions)) return;
		if (action.execute.constructor.name === 'AsyncFunction')
			action.execute(data, channel).then(handler);
		else handler(action.execute(data, channel));
		return;
	}
}

export async function reloadActions() {
	const A = await Database.get('actions');
	if (A === undefined || A === null) return [];
	return A;
}

export function programmable(command) {
	if (typeof command.execute !== 'function') return;
	if (command.commands === undefined) return;
	if (typeof command.commands === 'string')
		command.commands = command.commands.split(/\s+/g);
	if (command.permissions === undefined) command.permissions = 'all';
	programmables.push(command);
}

export async function refresh() { actions = await reloadActions(); }
