import { tiles } from '../../src/constants';

export default function logTiles(tileReader) {
	let write = process.stdout.write.bind(process.stdout);

	tileReader.on('height', () => write('\n'));

	tileReader.on('tile', (x, y, tile) => {
		switch(tile) {
			case tiles.WALL_SQUARE:
				write('■');
				break;
			case tiles.WALL_DIAGONAL_BOTTOM_LEFT:
				write('◣');
				break;
			case tiles.WALL_DIAGONAL_TOP_LEFT:
				write('◤');
				break;
			case tiles.WALL_DIAGONAL_TOP_RIGHT:
				write('◥');
				break;
			case tiles.WALL_DIAGONAL_BOTTOM_RIGHT:
				write('◢');
				break;
			case tiles.FLAG_RED:
			case tiles.FLAG_BLUE:
			case tiles.FLAG_NEUTRAL:
				write('⚑');
				break;
			case tiles.SPEEDPAD_NEUTRAL:
			case tiles.SPEEDPAD_RED:
			case tiles.SPEEDPAD_BLUE:
				write('⤧');
				break;
			case tiles.POWERUP:
				write('◎');
				break;
			case tiles.SPIKE:
				write('☼');
				break;
			case tiles.BUTTON:
				write('•');
				break;
			case tiles.GATE_OPEN:
			case tiles.GATE_CLOSED:
			case tiles.GATE_RED:
			case tiles.GATE_BLUE:
				write('▦');
				break;
			case tiles.BOMB:
				write('☢');
				break;
			default:
				write(' ');
		}
	});
}