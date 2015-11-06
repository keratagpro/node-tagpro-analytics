import EventEmitter from 'events';
import LogReader from '../log_reader';
import { teams, flags, powers } from '../constants';

class TeamSplatsReader extends EventEmitter {
	constructor(data, width, height) {
		super();

		this.log = new LogReader(data);

		this.width = width;
		this.height = height;
	}

	read() {
		let x = this.coord(this.width);
		let y = this.coord(this.height);

		for (var time = 0; !this.log.eof(); time++) {
			let i = this.log.readTally();

			if (i) {
				var splats = [];
				do {
					splats.push(this.log.readFixed(x[0]) - x[1], this.log.readFixed(y[0]) - y[1]);
				}
				while (i--);

				this.emit('splats', splats, time);
			}
		}
	}

	coord(length) {
		length *= 40;
		var result = this.log2(length);

		return [result, (((1 << result) - length) >> 1) + 20];
	}

	log2(number) {
		if (number--) {
			let result = 32;

			if (!(number & 0xFFFF0000)) {
				result -= 16;
				number <<= 16;
			}

			if (!(number & 0xFF000000)) {
				result -= 8;
				number <<= 8;
			}

			if (!(number & 0xF0000000)) {
				result -= 4;
				number <<= 4;
			}

			if (!(number & 0xC0000000)) {
				result -= 2;
				number <<= 2;
			}

			if (!(number & 0x80000000)) {
				result--;
			}

			return result;
		}

		return 0;
	}
}

export default TeamSplatsReader;