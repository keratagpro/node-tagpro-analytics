export function decode64(data: string): Buffer {
	return Buffer.from(data, 'base64');
}

export function formatTime(time: number): string {
	const min = Math.floor(time / 3600);
	const sec = Math.floor((time % 3600) / 60);
	const msec = Math.round((time % 60) / 0.6);

	return `${min}:${String(sec).padStart(2, '0')}.${String(msec).padStart(2, '0')}`;
}
