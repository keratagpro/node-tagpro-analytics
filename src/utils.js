export function decode64(data) {
	return new Buffer(data, 'base64').toString('ascii');
}

export function formatTime(time) {
	let min = Math.floor(time / 3600);
	let sec = Math.floor(time % 3600 / 60);
	let msec = Math.round(time % 60) / 0.6;

	return `${min}:${('00' + sec).slice(-2)}.${('00' + msec).slice(-2)}`;
}