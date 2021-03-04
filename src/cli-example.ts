import * as fs from 'fs';

import { decode64, formatTime, MapTilesReader, PlayerEventsReader, TeamSplatsReader, TILE } from '.';

// Run with "npx ts-node src/cli-example.ts <matchfile.json>"
const file = fs.readFileSync(process.argv[2], 'utf8');
const match = JSON.parse(file);

const tileData = decode64(match.map.tiles);

const { stdout } = process;

//
// Map tiles
//

function tileToAscii(tile: number): string {
	switch (tile) {
		case TILE.WALL_SQUARE:
			return '■';
		case TILE.WALL_DIAGONAL_BOTTOM_LEFT:
			return '◣';
		case TILE.WALL_DIAGONAL_TOP_LEFT:
			return '◤';
		case TILE.WALL_DIAGONAL_TOP_RIGHT:
			return '◥';
		case TILE.WALL_DIAGONAL_BOTTOM_RIGHT:
			return '◢';
		case TILE.FLAG_RED:
		case TILE.FLAG_BLUE:
		case TILE.FLAG_NEUTRAL:
			return '⚑';
		case TILE.SPEEDPAD_NEUTRAL:
		case TILE.SPEEDPAD_RED:
		case TILE.SPEEDPAD_BLUE:
			return '⤧';
		case TILE.POWERUP:
			return '◎';
		case TILE.SPIKE:
			return '☼';
		case TILE.BUTTON:
			return '•';
		case TILE.GATE_OPEN:
		case TILE.GATE_CLOSED:
		case TILE.GATE_RED:
		case TILE.GATE_BLUE:
			return '▦';
		case TILE.BOMB:
			return '☢';
		default:
			return ' ';
	}
}

stdout.write('\nMAP\n');

const tileReader = new MapTilesReader(tileData, match.map.width, match.map.marsballs);

let mapHeight = 1;

tileReader.on('height', (height) => {
	mapHeight = height + 1;
	stdout.write('\n');
});

tileReader.on('tile', (_x, _y, tile) => {
	stdout.write(tileToAscii(tile));
});

tileReader.read();

stdout.write('\n');

//
// Player events
//

const events = new Map<number, string[]>();
const pops: { [key: number]: Map<number, boolean> } = { 1: new Map() };

function addEvent(time: number, event: string) {
	if (!events.has(time)) {
		events.set(time, []);
	}

	events.get(time)?.push(event);
}

function addPop(team: number, time: number) {
	if (!pops[team]) {
		pops[team] = new Map();
	}
	pops[team].set(time, true);
}

for (const player of match.players) {
	const { name, team } = player;

	if (team) {
		addEvent(0, `${name} starts in team ${team}`);
	}

	const reader = new PlayerEventsReader(decode64(player.events), team, match.duration);

	reader.on('join', (time, newTeam) => {
		addEvent(time, `${name} joins team ${newTeam}`);
	});
	reader.on('quit', (time, _oldFlag, _oldPowers, oldTeam) => {
		addEvent(time, `${name} quits team ${oldTeam}`);
	});
	reader.on('switch', (time, _oldFlag, _powers, newTeam) => {
		addEvent(time, `${name} switches to team ${newTeam}`);
	});
	reader.on('grab', (time, newFlag) => {
		addEvent(time, `${name} grabs flag ${newFlag}`);
	});
	reader.on('capture', (time, oldFlag) => {
		addEvent(time, `${name} captures flag ${oldFlag}`);
	});
	reader.on('flaglessCapture', (time) => {
		addEvent(time, `${name} captures marsball`);
	});
	reader.on('powerup', (time, _flag, powerUp) => {
		addEvent(time, `${name} powers up ${powerUp}`);
	});
	reader.on('duplicatePowerup', (time) => {
		addEvent(time, `${name} extends power`);
	});
	reader.on('powerdown', (time, _flag, powerDown) => {
		addEvent(time, `${name} powers down ${powerDown}`);
	});
	reader.on('return', (time) => {
		addEvent(time, `${name} returns`);
	});
	reader.on('tag', (time) => {
		addEvent(time, `${name} tags`);
	});
	reader.on('drop', (time, oldFlag) => {
		addEvent(time, `${name} drops flag ${oldFlag}`);
		addPop(team, time);
	});
	reader.on('pop', (time) => {
		addEvent(time, `${name} pops`);
		addPop(team, time);
	});
	reader.on('startPrevent', (time) => {
		addEvent(time, `${name} starts preventing`);
	});
	reader.on('stopPrevent', (time) => {
		addEvent(time, `${name} stops preventing`);
	});
	reader.on('startButton', (time) => {
		addEvent(time, `${name} starts buttoning`);
	});
	reader.on('stopButton', (time) => {
		addEvent(time, `${name} stops buttoning`);
	});
	reader.on('startBlock', (time) => {
		addEvent(time, `${name} starts blocking`);
	});
	reader.on('stopBlock', (time) => {
		addEvent(time, `${name} stops blocking`);
	});

	reader.read();
}

const sortedPlayerEvents = new Map([...events].sort((a, b) => a[0] - b[0]));

stdout.write('\nTIMELINE\n');
for (const [time, events] of sortedPlayerEvents) {
	for (const event of events) {
		stdout.write(`${formatTime(time)} ${event}\n`);
	}
}

//
// Splats
//

for (let i = 0; i < match.teams.length; i++) {
	const team = match.teams[i];
	stdout.write(`\nTEAM ${i + 1} SPLATS\n`);

	const splats = decode64(team.splats);
	const splatReader = new TeamSplatsReader(splats, match.map.width, mapHeight);

	splatReader.on('splats', (splats, time) => {
		for (const splat of splats) {
			console.log(formatTime(time), `${splat[0]},${splat[1]}`);
		}
	});

	splatReader.read();
}
