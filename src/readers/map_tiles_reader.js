import EventEmitter from 'events';
import LogReader from '../log_reader';
import { tiles, buttons } from '../constants';

class MapTilesReader extends EventEmitter {
	constructor(data, width, marsballs) {
		super();

		this.log = new LogReader(data);

		this.data = {
			width,
			marsballs,
			height: 0,
			hasFlagsNeutral: [0, 0],
			hasFlagsPotato: [0, 0],
			hasButtons: buttons.NONE,
			hasPowerups: false,
			hasEndZones: [false, false],
			maxReturns: [0, 0]
		};
	}

	read() {
		let data = this.data;

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
					}
					else if (tile < 13) {
						tile = (tile - 4) * 10;
					}
					else if (tile < 17) {
						tile += 77;
					}
					else if (tile < 20) {
						tile = (tile - 7) * 10;
					}
					else if (tile < 22) {
						tile += 110;
					}
					else {
						tile = (tile - 8) * 10;
					}
				}

				var i = this.log.readFooter();
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
						case tiles.FLAG_RED: {
							data.hasFlagsPotato[1] |= 1;
							break;
						}
						case tiles.FLAG_BLUE: {
							data.hasFlagsPotato[0] |= 1;
							break;
						}
						case tiles.FLAG_NEUTRAL: {
							data.hasFlagsPotato[1] |= 1;
							data.hasFlagsPotato[0] |= 1;
							break;
						}
						case tiles.FLAG_POTATO_RED: {
							data.hasFlagsPotato[1] |= 2;
							break;
						}
						case tiles.FLAG_POTATO_BLUE: {
							data.hasFlagsPotato[0] |= 2;
							break;
						}
						case tiles.FLAG_POTATO_NEUTRAL: {
							data.hasFlagsPotato[1] |= 2;
							data.hasFlagsPotato[0] |= 2;
							break;
						}
						case tiles.ENDZONE_RED: {
							data.hasEndZones[0] = true;
							break;
						}
						case tiles.ENDZONE_BLUE: {
							data.hasEndZones[1] = true;
							break;
						}
						case tiles.POWERUP: {
							data.hasPowerups = true;
							break;
						}
					}

					switch (tile) {
						case tiles.FLAG_RED:
						case tiles.FLAG_POTATO_RED: {
							data.hasFlagsNeutral[1] |= 1;
							data.maxReturns[1] += 1;
							break;
						}
						case tiles.FLAG_BLUE:
						case tiles.FLAG_POTATO_BLUE: {
							data.hasFlagsNeutral[0] |= 1;
							data.maxReturns[0] += 1;
							break;
						}
						case tiles.FLAG_NEUTRAL:
						case tiles.FLAG_POTATO_NEUTRAL: {
							data.hasFlagsNeutral[1] |= 2;
							data.hasFlagsNeutral[0] |= 2;
							data.maxReturns[0] += 1;
							data.maxReturns[1] += 1;
							break;
						}
						case tiles.BUTTON: {
							buttons = true;
							break;
						}
						case tiles.GATE_OPEN:
						case tiles.GATE_CLOSED:
						case tiles.GATE_RED:
						case tiles.GATE_BLUE: {
							gates = true;
						}
					}
				}
				while (i--);
			}
		}

		if (data.hasEndZones[1] || data.maxReturns[0]) {
			data.maxReturns[0] += 3 * data.marsballs;
		}

		if (data.hasEndZones[0] || data.maxReturns[1]) {
			data.maxReturns[1] += 3 * data.marsballs;
		}

		if (buttons) {
			data.hasButtons = gates ? buttons.BUTTONS_AND_GATES : buttons.BUTTONS_ONLY;
		}

		this.emit('properties', data);
	}
}

export default MapTilesReader;