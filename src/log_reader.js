export default class LogReader {
	constructor(data) {
		this.data = data;
		this.pos = 0;
	}

	eof() {
		return this.pos >> 3 >= this.data.length;
	}

	readBool() {
		var result = this.eof() ? 0 : this.data[this.pos >> 3].charCodeAt(0) >> 7 - (this.pos & 7) & 1;
		this.pos++;
		return result;
	}

	readFixed(bits) {
		var result = 0;

		while (bits--) {
			result = (result << 1) | this.readBool();
		}

		return result;
	}

	readTally() {
		var result = 0;

		while(this.readBool()) {
			result++;
		}

		return result;
	}

	readFooter() {
		var bits = this.readFixed(2) << 3;
		var free = (8 - (this.pos & 7)) & 7;
		bits |= free;

		var minimum = 0;
		while (free < bits) {
			minimum += 1 << free;
			free += 8;
		}

		return this.readFixed(bits) + minimum;
	}
}