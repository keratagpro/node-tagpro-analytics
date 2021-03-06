import { readFileSync } from 'fs';

import { decode64, formatTime, MapTilesReader, PlayerEventsReader, TeamSplatsReader } from '../src';

import * as match from './data/test-match.json';

it('renders the same player event output as reference PHP', () => {
	let output = '';

	const write = (data: string) => (output += data);

	const tileData = decode64(match.map.tiles);
	const tileReader = new MapTilesReader(tileData, match.map.width, match.map.marsballs);

	let mapHeight = 1;

	tileReader.on('height', (newY) => {
		mapHeight = newY + 1;
	});

	tileReader.read();

	const pops = new Map<number, Set<number>>();

	function addPop(time: number, team: number) {
		if (!pops.has(team)) {
			pops.set(team, new Set());
		}

		pops.get(team)?.add(time);
	}

	for (const player of match.players) {
		const playerReader = new PlayerEventsReader(decode64(player.events), player.team, match.duration);

		playerReader.on('drop', (time, oldFlag, powers, team) => {
			addPop(time, team);
		});

		playerReader.on('pop', (time, powers, team) => {
			addPop(time, team);
		});

		playerReader.read();
	}

	for (let i = 0; i < match.teams.length; i++) {
		const team = match.teams[i];

		const teamPops = [...(pops.get(i + 1)?.keys() || [])].sort((a, b) => a - b);
		write(`\nTEAM ${i + 1} SPLATS\n`);

		const splats = decode64(team.splats);
		const splatReader = new TeamSplatsReader(splats, match.map.width, mapHeight);

		splatReader.on('splats', (splats, time) => {
			for (const splat of splats) {
				write(`${formatTime(teamPops[time])} (${splat[0]},${splat[1]})\n`);
			}
		});

		splatReader.read();
	}

	const reference = readFileSync('test/reference/reference-splats.txt', 'utf8');

	expect(output).toBe(reference);
});
