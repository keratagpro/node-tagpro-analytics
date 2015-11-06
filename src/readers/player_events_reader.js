import EventEmitter from 'events';
import LogReader from '../log_reader';
import { teams, flags, powers } from '../constants';

class PlayerEventsReader extends EventEmitter {
	constructor(data, initialTeam, duration) {
		super();

		this.log = new LogReader(data);

		this.status = {
			currentBlock: false,
			currentButton: false,
			currentFlag: flags.NONE,
			currentPowers: powers.NONE,
			currentPrevent: false,
			currentTeam: initialTeam,
			time: 0
		};

		this.duration = duration;
	}

	read() {
		while(!this.eof()) {
			this.parseStatus();
			this.publishStatus();
		}

		this.emit('end',
			this.duration,
			this.status.currentFlag,
			this.status.currentPowers,
			this.status.currentTeam);
	}

	parseStatus() {
		let status = this.status;

		status.newTeam = this.getNewTeam();

		status.isDropPop = this.log.readBool();
		status.returns = this.log.readTally();
		status.tags = this.log.readTally();
		status.isGrab = !status.currentFlag && this.log.readBool();

		status.captures = this.log.readTally();

		status.isKeep = this.getIsKeep();

		status.newFlag = this.getNewFlag();

		this.getPowers();

		status.togglePrevent = this.log.readBool();
		status.toggleButton = this.log.readBool();
		status.toggleBlock = this.log.readBool();
		status.time += 1 + this.log.readFooter();
	}

	publishStatus() {
		let status = this.status;

		this.emit('update', status);

		if (!status.currentTeam && status.newTeam) {
			status.currentTeam = status.newTeam;
			this.emit('join', status.time, status.newTeam);
		}

		while (status.returns--) {
			this.emit('return',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
		}

		while (status.tags--) {
			this.emit('tag',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
		}

		if (status.isGrab) {
			status.currentFlag = status.newFlag;

			this.emit('grab',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
		}

		if (status.captures--) {
			do {
				if (status.isKeep) {
					this.emit('flaglessCapture',
						status.time,
						status.currentFlag,
						status.currentPowers,
						status.currentTeam);
				}
				else {
					this.emit('capture',
						status.time,
						status.currentFlag,
						status.currentPowers,
						status.currentTeam);

					status.currentFlag = flags.NONE;
					status.isKeep = true;
				}
			}
			while(status.captures--);
		}

		for (var i = 1; i < 16; i <<= 1) {
			if (status.powersDown & i) {
				status.currentPowers ^= i;

				this.emit('powerdown',
					status.time,
					status.currentFlag,
					i,
					status.currentPowers,
					status.currentTeam);
			}
			else if (status.powersUp & i) {
				status.currentPowers |= i;

				this.emit('powerup',
					status.time,
					status.currentFlag,
					i,
					status.currentPowers,
					status.currentTeam);
			}
		}

		while (status.powerups--) {
			this.emit('duplicatePowerup',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
		}

		if (status.togglePrevent) {
			this.emit(status.currentPrevent ? 'stopPrevent' : 'startPrevent',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
			status.currentPrevent = !status.currentPrevent;
		}

		if (status.toggleButton) {
			this.emit(status.currentButton ? 'stopButton' : 'startButton',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
			status.currentButton = !status.currentButton;
		}

		if (status.toggleBlock) {
			this.emit(status.currentBlock ? 'stopBlock' : 'startBlock',
				status.time,
				status.currentFlag,
				status.currentPowers,
				status.currentTeam);
			status.currentBlock = !status.currentBlock;
		}

		if (status.isDropPop) {
			if (status.currentFlag) {
				this.emit('drop',
					status.time,
					status.currentFlag,
					status.currentPowers,
					status.currentTeam);
				status.currentFlag = flags.NONE;
			}
			else {
				this.emit('pop',
					status.time,
					status.currentPowers,
					status.currentTeam);
			}
		}

		if (status.newTeam !== status.currentTeam) {
			if (status.newTeam) {
				this.emit('switch',
					status.time,
					status.currentFlag,
					status.currentPowers,
					status.newTeam);
			}
			else {
				this.emit('quit',
					status.time,
					status.currentFlag,
					status.currentPowers,
					status.currentTeam);

				status.currentPowers = powers.NONE;
			}

			status.currentFlag = flags.NONE;
			status.currentTeam = status.newTeam;
		}
	}

	getNewTeam() {
		let team = this.status.currentTeam;

		if (this.log.readBool()) {
			if (team) {
				if (this.log.readBool()) {
					return teams.NONE; // quit
				}
				else {
					return 3 - team; // switch
				}
			}
			else {
				return 1 + this.log.readBool(); // join
			}
		}
		else {
			return team; // stay
		}
	}

	getIsKeep() {
		let status = this.status;

		return
			!status.isDropPop &&
			status.newTeam && 
			(status.newTeam === status.currentTeam || !status.currentTeam) && 
			(!status.captures || (!status.currentFlag && !status.isGrab) || this.log.readBool());
	}

	getNewFlag() {
		let status = this.status;

		if (status.isGrab) {
			if (status.isKeep) {
				return 1 + this.log.readFixed(2);
			}
			else {
				return flags.TEMPORARY;
			}
		}
		else {
			return status.currentFlag;
		}
	}

	getPowers() {
		let status = this.status;

		status.powerups = this.log.readTally();
		status.powersDown = powers.NONE;
		status.powersUp = powers.NONE;

		for (var i = 1; i < 16; i <<= 1) {
			if (status.currentPowers & i) {
				if (this.log.readBool()) {
					status.powersDown |= i;
				}
			}
			else if (status.powerups && this.log.readBool()) {
				status.powersUp |= i;
				status.powerups--;
			}
		}
	}
}

export default PlayerEventsReader;