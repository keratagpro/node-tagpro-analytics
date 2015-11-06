import fs from 'fs';

import MapTilesReader from '../src/readers/map_tiles_reader';
import PlayerEventsReader from '../src/readers/player_events_reader';
import TeamSplatsReader from '../src/readers/team_splats_reader';

import logTilesToConsole from './console/log_tiles';
import logSplatsToConsole from './console/log_splats';

function decode64(data) {
	return new Buffer(data, 'base64').toString('ascii');
}

function formatTime(time) {
	let min = Math.floor(time / 3600);
	let sec = Math.floor(time % 3600 / 60);
	let msec = Math.round(time % 60) / 0.6;

	return `${min}:${pad}`;
	return floor(time/3600).':'.str_pad(floor(time%3600/60),2,'0',STR_PAD_LEFT).'.'.str_pad(round(time%60/0.6),2,'0',STR_PAD_LEFT);
}

let file = fs.readFileSync(process.argv[2], 'utf8');
let match = JSON.parse(file);

let tileData = decode64(match.map.tiles);
let tileReader = new MapTilesReader(tileData, match.map.width, match.map.marsballs);

let mapHeight = 1;
tileReader.on('height', height => mapHeight = height);

logTilesToConsole(tileReader);

tileReader.read();

match.teams.forEach(function(team, index) {
	let splats = decode64(team.splats);
	let splatReader = new TeamSplatsReader(splats, match.map.width, mapHeight);
	logSplatsToConsole(splatReader);
	splatReader.read();
});
