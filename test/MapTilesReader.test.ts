import { readFileSync } from 'fs';

import { decode64, MapTilesReader, TILE } from '../src';

import * as match from './data/test-match.json';

it('renders the same map output as reference PHP', () => {
	const tileData = decode64(match.map.tiles);

	let output = '';

	const write = (data: string) => (output += data);

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

	const tileReader = new MapTilesReader(tileData, match.map.width, match.map.marsballs);

	tileReader.on('height', () => {
		write('\n');
	});

	tileReader.on('tile', (_x, _y, tile) => {
		write(tileToAscii(tile));
	});

	tileReader.read();

	const reference = readFileSync('test/reference/reference-map.txt', 'utf8');

	expect(output).toBe(reference);
});
