export class LogReader {
	pos = 0;

	constructor(public data: Buffer) {}

	eof(): boolean {
		return this.pos >> 3 >= this.data.length;
	}

	readBit(): number {
		const result = this.eof() ? 0 : (this.data.readUInt8(this.pos >> 3) >> (7 - (this.pos & 7))) & 1;
		this.pos++;
		return result;
	}

	readFixed(bits: number): number {
		let result = 0;

		while (bits--) {
			result = (result << 1) | this.readBit();
		}

		return result;
	}

	readTally(): number {
		let result = 0;

		while (this.readBit()) {
			result++;
		}

		return result;
	}

	readFooter(): number {
		let bits = this.readFixed(2) << 3;
		let free = (8 - (this.pos & 7)) & 7;
		bits |= free;

		let minimum = 0;
		while (free < bits) {
			minimum += 1 << free;
			free += 8;
		}

		return this.readFixed(bits) + minimum;
	}
}
