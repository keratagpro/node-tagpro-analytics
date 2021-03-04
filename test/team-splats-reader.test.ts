import { readFileSync } from 'fs';

import { decode64, formatTime, MapTilesReader, TeamSplatsReader } from '../src';

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

	for (let i = 0; i < match.teams.length; i++) {
		const team = match.teams[i];
		write(`\nTEAM ${i + 1} SPLATS\n`);

		const splats = decode64(team.splats);
		const splatReader = new TeamSplatsReader(splats, match.map.width, mapHeight);

		splatReader.on('splats', (splats, time) => {
			for (const splat of splats) {
				write(`${formatTime(time)} (${splat[0]},${splat[1]})\n`);
			}
		});

		splatReader.read();
	}

	const reference = readFileSync('test/reference/output-splats.txt', 'utf8');

	expect(output).toBe(reference);
});
