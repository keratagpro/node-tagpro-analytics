import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { LogReader } from '../LogReader';
import { TEAM, FLAG, POWERS } from '../constants';

interface PlayerStatus {
	currentBlock: boolean;
	currentButton: boolean;
	currentFlag: number;
	currentPowers: number;
	currentPrevent: boolean;
	currentTeam: number;
	time: number;

	newTeam: number;
	isDropPop: boolean;
	returns: number;
	tags: number;
	isGrab: boolean;
	captures: number;
	isKeep: boolean;
	newFlag: number;
	powerups: number;
	powersDown: number;
	powersUp: number;
	togglePrevent: boolean;
	toggleButton: boolean;
	toggleBlock: boolean;
}

type PlayerEvents = {
	join: (time: number, team: number) => void;
	return: (time: number, flag: number, powers: number, team: number) => void;
	tag: (time: number, flag: number, powers: number, team: number) => void;
	grab: (time: number, flag: number, powers: number, team: number) => void;
	flaglessCapture: (time: number, flag: number, powers: number, team: number) => void;
	capture: (time: number, oldFlag: number, powers: number, team: number) => void;
	powerdown: (time: number, flag: number, powerDown: number, newPowers: number, team: number) => void;
	powerup: (time: number, flag: number, powerUp: number, newPowers: number, team: number) => void;
	duplicatePowerup: (time: number, flag: number, powers: number, team: number) => void;
	startPrevent: (time: number, flag: number, powers: number, team: number) => void;
	stopPrevent: (time: number, flag: number, powers: number, team: number) => void;
	startButton: (time: number, flag: number, powers: number, team: number) => void;
	stopButton: (time: number, flag: number, powers: number, team: number) => void;
	startBlock: (time: number, flag: number, powers: number, team: number) => void;
	stopBlock: (time: number, flag: number, powers: number, team: number) => void;
	drop: (time: number, oldFlag: number, powers: number, team: number) => void;
	pop: (time: number, powers: number, team: number) => void;
	switch: (time: number, oldFlag: number, powers: number, newTeam: number) => void;
	quit: (time: number, oldFlag: number, oldPowers: number, oldTeam: number) => void;
	end: (duration: number, flag: number, powers: number, team: number) => void;
};

export class PlayerEventsReader extends (EventEmitter as new () => TypedEmitter<PlayerEvents>) {
	log: LogReader;
	status: PlayerStatus;
	duration: number;

	constructor(data: Buffer, initialTeam: number, duration: number) {
		super();

		this.log = new LogReader(data);

		this.status = {
			time: 0,
			currentFlag: FLAG.NONE,
			currentPowers: POWERS.NONE,
			currentPrevent: false,
			currentButton: false,
			currentBlock: false,
			currentTeam: initialTeam,

			newTeam: TEAM.NONE,
			isDropPop: false,
			returns: 0,
			tags: 0,
			isGrab: false,
			captures: 0,
			isKeep: false,
			newFlag: FLAG.NONE,
			powerups: POWERS.NONE,
			powersDown: POWERS.NONE,
			powersUp: POWERS.NONE,
			togglePrevent: false,
			toggleButton: false,
			toggleBlock: false,
		};

		this.duration = duration;
	}

	read(): void {
		while (!this.log.eof()) {
			this.parseStatus();
			this.publishStatus();
		}

		this.emit('end', this.duration, this.status.currentFlag, this.status.currentPowers, this.status.currentTeam);
	}

	parseStatus(): void {
		const status = this.status;

		status.newTeam = this.getNewTeam();

		status.isDropPop = !!this.log.readBit();
		status.returns = this.log.readTally();
		status.tags = this.log.readTally();
		status.isGrab = status.currentFlag === FLAG.NONE && !!this.log.readBit();

		status.captures = this.log.readTally();

		status.isKeep = this.getIsKeep();

		status.newFlag = this.getNewFlag();

		this.getPowers();

		status.togglePrevent = !!this.log.readBit();
		status.toggleButton = !!this.log.readBit();
		status.toggleBlock = !!this.log.readBit();

		status.time += 1 + this.log.readFooter();
	}

	publishStatus(): void {
		const status = this.status;

		if (status.currentTeam === TEAM.NONE && status.newTeam !== TEAM.NONE) {
			status.currentTeam = status.newTeam;
			this.emit('join', status.time, status.newTeam);
		}

		for (let i = 0; i < status.returns; i++) {
			this.emit('return', status.time, status.currentFlag, status.currentPowers, status.currentTeam);
		}

		for (let i = 0; i < status.tags; i++) {
			this.emit('tag', status.time, status.currentFlag, status.currentPowers, status.currentTeam);
		}

		if (status.isGrab) {
			status.currentFlag = status.newFlag;

			this.emit('grab', status.time, status.currentFlag, status.currentPowers, status.currentTeam);
		}

		if (status.captures--) {
			do {
				if (status.isKeep || status.currentFlag === FLAG.NONE) {
					this.emit(
						'flaglessCapture',
						status.time,
						status.currentFlag,
						status.currentPowers,
						status.currentTeam
					);
				} else {
					this.emit('capture', status.time, status.currentFlag, status.currentPowers, status.currentTeam);

					status.currentFlag = FLAG.NONE;
					status.isKeep = true;
				}
			} while (status.captures--);
		}

		for (let i = 1; i < 16; i <<= 1) {
			if (status.powersDown & i) {
				status.currentPowers ^= i;

				this.emit('powerdown', status.time, status.currentFlag, i, status.currentPowers, status.currentTeam);
			} else if (status.powersUp & i) {
				status.currentPowers |= i;

				this.emit('powerup', status.time, status.currentFlag, i, status.currentPowers, status.currentTeam);
			}
		}

		for (let i = 0; i < status.powerups; i++) {
			this.emit('duplicatePowerup', status.time, status.currentFlag, status.currentPowers, status.currentTeam);
		}

		if (status.togglePrevent) {
			this.emit(
				status.currentPrevent ? 'stopPrevent' : 'startPrevent',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam
			);
			status.currentPrevent = !status.currentPrevent;
		}

		if (status.toggleButton) {
			this.emit(
				status.currentButton ? 'stopButton' : 'startButton',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam
			);
			status.currentButton = !status.currentButton;
		}

		if (status.toggleBlock) {
			this.emit(
				status.currentBlock ? 'stopBlock' : 'startBlock',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam
			);
			status.currentBlock = !status.currentBlock;
		}

		if (status.isDropPop) {
			if (status.currentFlag !== FLAG.NONE) {
				this.emit('drop', status.time, status.currentFlag, status.currentPowers, status.currentTeam);
				status.currentFlag = FLAG.NONE;
			} else {
				this.emit('pop', status.time, status.currentPowers, status.currentTeam);
			}
		}

		if (status.newTeam !== status.currentTeam) {
			if (status.newTeam) {
				this.emit('switch', status.time, status.currentFlag, status.currentPowers, status.newTeam);
			} else {
				this.emit('quit', status.time, status.currentFlag, status.currentPowers, status.currentTeam);

				status.currentPowers = POWERS.NONE;
			}

			status.currentFlag = FLAG.NONE;
			status.currentTeam = status.newTeam;
		}
	}

	getNewTeam(): number {
		const team = this.status.currentTeam;

		if (!!this.log.readBit()) {
			if (team) {
				if (!!this.log.readBit()) {
					return TEAM.NONE; // quit
				} else {
					return 3 - team; // switch
				}
			} else {
				return 1 + this.log.readBit(); // join
			}
		} else {
			return team; // stay
		}
	}

	getIsKeep(): boolean {
		const { isDropPop, newTeam, currentTeam, captures, newFlag, isGrab } = this.status;

		if (isDropPop) {
			return false;
		}

		if (!newTeam) {
			return false;
		}

		if (newTeam !== currentTeam && currentTeam) {
			return false;
		}

		if (!captures) {
			return true;
		}

		if (!newFlag && !isGrab) {
			return true;
		}

		return !!this.log.readBit();
	}

	getNewFlag(): number {
		const status = this.status;

		if (status.isGrab) {
			if (status.isKeep) {
				return 1 + this.log.readFixed(2);
			} else {
				return FLAG.TEMPORARY;
			}
		} else {
			return status.currentFlag;
		}
	}

	getPowers(): void {
		const status = this.status;

		status.powerups = this.log.readTally();
		status.powersDown = POWERS.NONE;
		status.powersUp = POWERS.NONE;

		for (let i = 1; i < 16; i <<= 1) {
			if (status.currentPowers & i) {
				if (!!this.log.readBit()) {
					status.powersDown |= i;
				}
			} else if (status.powerups && !!this.log.readBit()) {
				status.powersUp |= i;
				status.powerups--;
			}
		}
	}
}
