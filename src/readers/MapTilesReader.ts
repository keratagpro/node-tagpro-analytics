import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { LogReader } from '../LogReader';
import { TILE, BUTTON } from '../constants';

interface MapData {
	width: number;
	marsballs: number;
	height: number;
	hasFlagsNeutral: [number, number];
	hasFlagsPotato: [number, number];
	hasButtons: number;
	hasPowerups: boolean;
	hasEndZones: [boolean, boolean];
	maxReturns: [number, number];
}

type MapEvents = {
	height: (newY: number) => void;
	tile: (newX: number, y: number, tile: number) => void;
};

export class MapTilesReader extends (EventEmitter as new () => TypedEmitter<MapEvents>) {
	log: LogReader;
	data: MapData;

	constructor(data: Buffer, width: number, marsballs: number) {
		super();

		this.log = new LogReader(data);

		this.data = {
			width,
			marsballs,
			height: 0,
			hasFlagsNeutral: [0, 0],
			hasFlagsPotato: [0, 0],
			hasButtons: BUTTON.NONE,
			hasPowerups: false,
			hasEndZones: [false, false],
			maxReturns: [0, 0],
		};
	}

	read(): void {
		const data = this.data;

		let buttons = false;
		let gates = false;

		if (data.width) {
			let x = 0;
			let y = 0;

			while (!this.log.eof() || x) {
				let tile = this.log.readFixed(6);

				if (tile) {
					if (tile < 6) {
						tile += 9;
					} else if (tile < 13) {
						tile = (tile - 4) * 10;
					} else if (tile < 17) {
						tile += 77;
					} else if (tile < 20) {
						tile = (tile - 7) * 10;
					} else if (tile < 22) {
						tile += 110;
					} else {
						tile = (tile - 8) * 10;
					}
				}

				let i = this.log.readFooter();
				do {
					if (!x) {
						this.emit('height', y);
					}

					this.emit('tile', x, y, tile);

					x += 1;
					if (x === data.width) {
						x = 0;
						y += 1;
						data.height = y;
					}

					switch (tile) {
						case TILE.FLAG_RED: {
							data.hasFlagsPotato[1] |= 1;
							break;
						}
						case TILE.FLAG_BLUE: {
							data.hasFlagsPotato[0] |= 1;
							break;
						}
						case TILE.FLAG_NEUTRAL: {
							data.hasFlagsPotato[1] |= 1;
							data.hasFlagsPotato[0] |= 1;
							break;
						}
						case TILE.FLAG_POTATO_RED: {
							data.hasFlagsPotato[1] |= 2;
							break;
						}
						case TILE.FLAG_POTATO_BLUE: {
							data.hasFlagsPotato[0] |= 2;
							break;
						}
						case TILE.FLAG_POTATO_NEUTRAL: {
							data.hasFlagsPotato[1] |= 2;
							data.hasFlagsPotato[0] |= 2;
							break;
						}
						case TILE.ENDZONE_RED: {
							data.hasEndZones[0] = true;
							break;
						}
						case TILE.ENDZONE_BLUE: {
							data.hasEndZones[1] = true;
							break;
						}
						case TILE.POWERUP: {
							data.hasPowerups = true;
							break;
						}
					}

					switch (tile) {
						case TILE.FLAG_RED:
						case TILE.FLAG_POTATO_RED: {
							data.hasFlagsNeutral[1] |= 1;
							data.maxReturns[1] += 1;
							break;
						}
						case TILE.FLAG_BLUE:
						case TILE.FLAG_POTATO_BLUE: {
							data.hasFlagsNeutral[0] |= 1;
							data.maxReturns[0] += 1;
							break;
						}
						case TILE.FLAG_NEUTRAL:
						case TILE.FLAG_POTATO_NEUTRAL: {
							data.hasFlagsNeutral[1] |= 2;
							data.hasFlagsNeutral[0] |= 2;
							data.maxReturns[0] += 1;
							data.maxReturns[1] += 1;
							break;
						}
						case TILE.BUTTON: {
							buttons = true;
							break;
						}
						case TILE.GATE_OPEN:
						case TILE.GATE_CLOSED:
						case TILE.GATE_RED:
						case TILE.GATE_BLUE: {
							gates = true;
						}
					}
				} while (i--);
			}
		}

		if (data.hasEndZones[1] || data.maxReturns[0]) {
			data.maxReturns[0] += 3 * data.marsballs;
		}

		if (data.hasEndZones[0] || data.maxReturns[1]) {
			data.maxReturns[1] += 3 * data.marsballs;
		}

		if (buttons) {
			data.hasButtons = gates ? BUTTON.BUTTONS_AND_GATES : BUTTON.BUTTONS_ONLY;
		}

		// this.emit('properties', data);
	}
}
