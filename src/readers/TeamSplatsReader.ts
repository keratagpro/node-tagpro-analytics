import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { LogReader } from '../LogReader';

interface SplatEvents {
	splats: (splats: Array<[number, number]>, time: number) => void;
}

export class TeamSplatsReader extends (EventEmitter as new () => TypedEmitter<SplatEvents>) {
	log: LogReader;

	constructor(data: string, public width: number, public height: number) {
		super();

		this.log = new LogReader(data);

		this.width = width;
		this.height = height;
	}

	read(): void {
		const x = this.coord(this.width);
		const y = this.coord(this.height);

		for (let time = 0; !this.log.eof(); time++) {
			let i = this.log.readTally();

			if (i) {
				const splats: Array<[number, number]> = [];
				do {
					splats.push([this.log.readFixed(x[0]) - x[1], this.log.readFixed(y[0]) - y[1]]);
				} while (i--);

				this.emit('splats', splats, time);
			}
		}
	}

	coord(length: number): [number, number] {
		length *= 40;
		const result = this.log2(length);

		return [result, (((1 << result) - length) >> 1) + 20];
	}

	log2(input: number): number {
		if (input--) {
			let result = 32;

			if (!(input & 0xffff0000)) {
				result -= 16;
				input <<= 16;
			}

			if (!(input & 0xff000000)) {
				result -= 8;
				input <<= 8;
			}

			if (!(input & 0xf0000000)) {
				result -= 4;
				input <<= 4;
			}

			if (!(input & 0xc0000000)) {
				result -= 2;
				input <<= 2;
			}

			if (!(input & 0x80000000)) {
				result--;
			}

			return result;
		}

		return 0;
	}
}
