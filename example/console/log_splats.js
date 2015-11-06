// import { formatTime } from '../../src/utils';

export default function logSplats(splatReader) {
	splatReader.on('splats', (splats, time) => {
		splats.forEach(splat => {
			// console.log(`${splat[0]},${splat[1]}`);
		});
	});
}
