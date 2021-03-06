import { readFileSync } from 'fs';

import { decode64, formatTime, PlayerEventsReader } from '../src';

import * as match from './data/test-match.json';

it('matches the reference PHP output for a single player', () => {
	let output = '';

	const write = (data: string) => (output += data);

	function addEvent(time: number, event: string) {
		write(`${formatTime(time)} ${event}\n`);
	}

	const { name, team, events } = match.players[0];

	if (team) {
		addEvent(0, `${name} starts in team ${team}`);
	}

	const reader = new PlayerEventsReader(decode64(events), team, match.duration);

	reader.on('join', (time, newTeam) => {
		addEvent(time, `${name} joins team ${newTeam}`);
	});
	reader.on('quit', (time, _oldFlag, _oldPowers, oldTeam) => {
		addEvent(time, `${name} quits team ${oldTeam}`);
	});
	reader.on('switch', (time, _oldFlag, _powers, newTeam) => {
		addEvent(time, `${name} switches to team ${newTeam}`);
	});
	reader.on('grab', (time, newFlag) => {
		addEvent(time, `${name} grabs flag ${newFlag}`);
	});
	reader.on('capture', (time, oldFlag) => {
		addEvent(time, `${name} captures flag ${oldFlag}`);
	});
	reader.on('flaglessCapture', (time) => {
		addEvent(time, `${name} captures marsball`);
	});
	reader.on('powerup', (time, _flag, powerUp) => {
		addEvent(time, `${name} powers up ${powerUp}`);
	});
	reader.on('duplicatePowerup', (time) => {
		addEvent(time, `${name} extends power`);
	});
	reader.on('powerdown', (time, _flag, powerDown) => {
		addEvent(time, `${name} powers down ${powerDown}`);
	});
	reader.on('return', (time) => {
		addEvent(time, `${name} returns`);
	});
	reader.on('tag', (time) => {
		addEvent(time, `${name} tags`);
	});
	reader.on('drop', (time, oldFlag) => {
		addEvent(time, `${name} drops flag ${oldFlag}`);
	});
	reader.on('pop', (time) => {
		addEvent(time, `${name} pops`);
	});
	reader.on('startPrevent', (time) => {
		addEvent(time, `${name} starts preventing`);
	});
	reader.on('stopPrevent', (time) => {
		addEvent(time, `${name} stops preventing`);
	});
	reader.on('startButton', (time) => {
		addEvent(time, `${name} starts buttoning`);
	});
	reader.on('stopButton', (time) => {
		addEvent(time, `${name} stops buttoning`);
	});
	reader.on('startBlock', (time) => {
		addEvent(time, `${name} starts blocking`);
	});
	reader.on('stopBlock', (time) => {
		addEvent(time, `${name} stops blocking`);
	});
	reader.on('end', (time, flag, powers, team) => {
		if (team) {
			addEvent(time, `${name} ends in team ${team}`);
		}
	});

	reader.read();

	const reference = readFileSync('test/reference/reference-player.txt', 'utf8');

	expect(output).toBe(reference);
});

it('matches the reference PHP output for multiple players', () => {
	let output = '';

	const write = (data: string) => (output += data);

	const events = new Map<number, string[]>();

	function addEvent(time: number, event: string) {
		if (!events.has(time)) {
			events.set(time, []);
		}

		events.get(time)?.push(event);
	}

	for (const player of match.players) {
		const { name, team } = player;

		if (team) {
			addEvent(0, `${name} starts in team ${team}`);
		}

		const reader = new PlayerEventsReader(decode64(player.events), team, match.duration);

		reader.on('join', (time, newTeam) => {
			addEvent(time, `${name} joins team ${newTeam}`);
		});
		reader.on('quit', (time, _oldFlag, _oldPowers, oldTeam) => {
			addEvent(time, `${name} quits team ${oldTeam}`);
		});
		reader.on('switch', (time, _oldFlag, _powers, newTeam) => {
			addEvent(time, `${name} switches to team ${newTeam}`);
		});
		reader.on('grab', (time, newFlag) => {
			addEvent(time, `${name} grabs flag ${newFlag}`);
		});
		reader.on('capture', (time, oldFlag) => {
			addEvent(time, `${name} captures flag ${oldFlag}`);
		});
		reader.on('flaglessCapture', (time) => {
			addEvent(time, `${name} captures marsball`);
		});
		reader.on('powerup', (time, _flag, powerUp) => {
			addEvent(time, `${name} powers up ${powerUp}`);
		});
		reader.on('duplicatePowerup', (time) => {
			addEvent(time, `${name} extends power`);
		});
		reader.on('powerdown', (time, _flag, powerDown) => {
			addEvent(time, `${name} powers down ${powerDown}`);
		});
		reader.on('return', (time) => {
			addEvent(time, `${name} returns`);
		});
		reader.on('tag', (time) => {
			addEvent(time, `${name} tags`);
		});
		reader.on('drop', (time, oldFlag) => {
			addEvent(time, `${name} drops flag ${oldFlag}`);
		});
		reader.on('pop', (time) => {
			addEvent(time, `${name} pops`);
		});
		reader.on('startPrevent', (time) => {
			addEvent(time, `${name} starts preventing`);
		});
		reader.on('stopPrevent', (time) => {
			addEvent(time, `${name} stops preventing`);
		});
		reader.on('startButton', (time) => {
			addEvent(time, `${name} starts buttoning`);
		});
		reader.on('stopButton', (time) => {
			addEvent(time, `${name} stops buttoning`);
		});
		reader.on('startBlock', (time) => {
			addEvent(time, `${name} starts blocking`);
		});
		reader.on('stopBlock', (time) => {
			addEvent(time, `${name} stops blocking`);
		});
		reader.on('end', (time, flag, powers, team) => {
			if (team) {
				addEvent(time, `${name} ends in team ${team}`);
			}
		});

		reader.read();
	}

	const sortedPlayerEvents = new Map([...events].sort((a, b) => a[0] - b[0]));

	for (const [time, events] of sortedPlayerEvents) {
		for (const event of events) {
			write(`${formatTime(time)} ${event}\n`);
		}
	}

	const reference = readFileSync('test/reference/reference-players.txt', 'utf8');

	expect(output).toBe(reference);
});
