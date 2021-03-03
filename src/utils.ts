export function decode64(data: string): string {
	return Buffer.from(data, 'base64').toString('ascii');
}

export function formatTime(time: number): string {
	const min = Math.floor(time / 3600);
	const sec = Math.floor((time % 3600) / 60);
	const msec = Math.round(time % 60) / 0.6;

	return `${min}:${('00' + sec).slice(-2)}.${('00' + msec).slice(-2)}`;
}
