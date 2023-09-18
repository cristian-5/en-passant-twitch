
import { Database } from '../database.js';
import { Time } from '../config.js';

const TWITCH_CLIENT_ID = await Database.get("twitch_client_id");
const TWITCH_OAUTH_BOT = await Database.get("twitch_oauth_bot");

export const BASE_URL = "https://api.twitch.tv/helix/";
export const QUERIES = {
	search: { channel: "search/channels?query=" },
	streams: "streams?user_id=",
	schedule: "schedule?broadcaster_id="
};
const HEADERS = { 
	headers: { 
		"Authorization": "Bearer " + TWITCH_OAUTH_BOT,
		"Client-Id": TWITCH_CLIENT_ID
	} 
};

export const buildUrl = uri => BASE_URL + uri;

export async function channel(streamer) {
	if (streamer === '') return undefined;
	try {
		const queryUrl = buildUrl(QUERIES.search.channel);
		const req = await fetch(queryUrl + streamer + "&first=10", HEADERS);
		if (req.status != 200) return null;
		const data = (await req.json()).data;
		for (const channel of data)
			if (channel.display_name.toLowerCase() === streamer.toLowerCase())
				return channel;
	} catch { return undefined; }
	return undefined;
}

export async function streams(user_ids) {
	if (user_ids.length === 0) return null;
	let data = null;
	try {
		let queryUrl = buildUrl(QUERIES.streams);
		for (let i = 0; i < user_ids.length; i++)
			if (i === user_ids.length - 1) queryUrl += user_ids[i];
			else queryUrl += `${user_ids[i]}&user_id=`;
		const req = await fetch(queryUrl, HEADERS);
		if (req.status != 200) return null;
		data = (await req.json()).data;
	} catch { return undefined; }
	return data;
}

export async function live(streamer) {
	const c = await channel(streamer);
	if (c == undefined || c == null) return c;
	return c.is_live;
}

export async function schedule(id, date) {
	date = date || new Date().toISOString();
	const url = `${BASE_URL}schedule?broadcaster_id=${id}&start_time=${date}&first=7`;
	try {
		const req = await fetch(url, HEADERS);
		if (req.status != 200) return null;
		const data = (await req.json()).data;
		return data;
	} catch { return null; }
}

export async function uptime(streamer) {
	const c = await channel(streamer);
	if (c == undefined || c == null || !c.is_live ||
		c.started_at == undefined || c.started_at == '') return null;
	const s = new Date(c.started_at);
	const e = new Date();
	const d = e.getTime() - s.getTime();
	const h = Math.floor((d % Time.day) / Time.hour);
	const m = Math.floor((d % Time.hour) / Time.minute);
	return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export async function follow_count(streamer) {
	const url = `https://twitchtracker.com/api/channels/summary/${streamer}`;
	try {
		const req = await fetch(url);
		if (req.status != 200) return null;
		const data = await req.json();
		return 'followers_total' in data ? data.followers_total : null;
	} catch { return null; }
}

// To validate a token, send an HTTP GET request to https://id.twitch.tv/oauth2/validate.
// The following cURL example shows the request.
// curl -X GET 'https://id.twitch.tv/oauth2/validate' \
// -H 'Authorization: OAuth <token>'
// if the token is not valid, the request returns HTTP status code 401
// docs: https://dev.twitch.tv/docs/authentication/validate-tokens/
export async function validate(token) {
	const url = "https://id.twitch.tv/oauth2/validate";
	try {
		const req = await fetch(url, { headers: {
			"Authorization": "OAuth " + token
		} });
		return req.status != 401;
	} catch { return true; } // assumes token is valid
}
