
import { Prefix } from './config.js';
import { reloadActions, actions, programmables } from './parser.js';

const URL_FETCH = /(?:https?:\/\/)?(?:[A-Za-z0-9_\-]+\.)+(?:com?|it|uk|gov|org|tv|gg|be|gle)(?:[^!,. ]+)*/g;

const urlify = text => text.replace(
	URL_FETCH, '<a href="https://$&" target="_blank">$&</a>'
).replace(/@\w+/g, '<span class="text-gray-300">$&</span>');

export function help(mod = false) {
	reloadActions();
	const emojis = p => ({ mod: '🛂', sub: '💟', vip: '✴️', all: '✅' }[p]);
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>en-passant 🇺🇳 BOT Twitch Actions</title>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.2/tailwind.min.css">
	<meta name="theme-color" content="#101827">
	<meta name="author" content="Zachary Saine">
	<style>
		a { color: #6cbdff !important; }
		.bot {
			background: #5765F2;
			border-radius: 2px;
			padding: 2px 4px;
			font-size: 10px;
			color: #fff;
		}
	</style>
</head>
<body class="bg-gray-900">
	<div class="flex flex-col items-center justify-center w-screen min-h-screen bg-gray-900 py-10">
		<h1 class="text-lg text-gray-200 font-medium">en-passant 🇺🇳 <span class="bot">BOT</span> Twitch Actions</h1>
		<div class="flex flex-col mt-6">
			<div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
				<div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
					<div class="shadow overflow-hidden sm:rounded-lg">
						<table class="min-w-full text-sm text-gray-400">
							<thead class="bg-gray-800 text-xs uppercase font-medium">
								<tr>
									<th scope="col" class="px-6 py-3 text-left tracking-wider">Command</th>
									<th scope="col" class="px-6 py-3 text-left tracking-wider">Allowed</th>
									<th scope="col" class="px-6 py-3 text-left tracking-wider">Description</th>
								</tr>
							</thead>
							<tbody class="bg-gray-800">${ actions.filter(a => mod || a.permissions != 'mod').sort(
									(a, b) => a.commands[0] > b.commands[0] ? 1 : -1
								).map(a => `<tr class="bg-black bg-opacity-20">
									<td class="px-6 py-4 whitespace-nowrap font-mono">${a.commands.map(c => Prefix + c).join(' ')}</td>
									<td class="px-6 py-4 whitespace-nowrap">${emojis(a.permissions)} <strong class="uppercase font-mono">${a.permissions}</strong></td>
									<td class="px-6 py-4" style="max-width:700px">${urlify(a.reply).replace(/->/g, '→')}</td>
								</tr>`).join('\n') }
								<tr><td colspan="3" class="divider"><hr style="border-color:#1F2838"></td></tr>
								${ programmables.filter(p => mod || p.permissions != 'mod').sort(
									(a, b) => a.commands[0] > b.commands[0] ? 1 : -1
								).map(p => `<tr class="bg-black bg-opacity-20">
									<td class="px-6 py-4 whitespace-nowrap font-mono">${p.commands.map(c => Prefix + c).join(' ')}</td>
									<td class="px-6 py-4 whitespace-nowrap">${emojis(p.permissions)} <strong class="uppercase font-mono">${p.permissions}</strong></td>
									<td class="px-6 py-4" style="max-width:700px">${urlify(p.description).replace(/->/g, '→')}</td>
								</tr>`).join('\n') }
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>
</body>
</html>`;
}
