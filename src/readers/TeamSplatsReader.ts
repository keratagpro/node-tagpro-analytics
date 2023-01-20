import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { LogReader } from '../LogReader';

type SplatEvents = {
	splats: (splats: Array<[number, number]>, time: number) => void;
};

export class TeamSplatsReader extends (EventEmitter as new () => TypedEmitter<SplatEvents>) {
	log: LogReader;

	constructor(data: Buffer, public width: number, public height: number) {
		super();

		this.log = new LogReader(data);

		this.width = width;
		this.height = height;
	}

	read(): void {
		const x = this.bits(this.width);
		const y = this.bits(this.height);

		for (let time = 0; !this.log.eof(); time++) {
			let i = this.log.readTally();

			if (i) {
				const splats: Array<[number, number]> = [];

				while (i--) {
					splats.push([this.log.readFixed(x[0]) - x[1], this.log.readFixed(y[0]) - y[1]]);
				}

				this.emit('splats', splats, time);
			}
		}
	}

	bits(size: number): [number, number] {
		size *= 40;

		let grid = size - 1;
		let result = 32;

		if (!(grid & 0xffff0000)) {
			result -= 16;
			grid <<= 16;
		}

		if (!(grid & 0xff000000)) {
			result -= 8;
			grid <<= 8;
		}

		if (!(grid & 0xf0000000)) {
			result -= 4;
			grid <<= 4;
		}

		if (!(grid & 0xc0000000)) {
			result -= 2;
			grid <<= 2;
		}

		if (!(grid & 0x80000000)) {
			result--;
		}

		return [result, (((1 << result) - size) >> 1) + 20];
	}
}
