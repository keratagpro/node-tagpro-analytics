# `@keratagpro/tagpro-analytics`

A TypeScript port of Ronding's [TagPro Analytics readers](https://tagpro.eu/?science).

## Install

```bash
npm install @keratagpro/tagpro-analytics
```

## Usage

See [test](/test) directory for some usage examples.


<details>
<summary>Source code example: test/TeamSplatsReader.test.ts</summary>

```ts
import { decode64, formatTime, MapTilesReader, PlayerEventsReader, TeamSplatsReader } from '@keratagpro/tagpro-analytics';

let output = '';

const write = (data: string) => (output += data);

const tileData = decode64(match.map.tiles);
const tileReader = new MapTilesReader(tileData, match.map.width, match.map.marsballs);

let mapHeight = 1;

tileReader.on('height', (newY) => {
	mapHeight = newY + 1;
});

tileReader.read();

const pops = new Map<number, Set<number>>();

function addPop(time: number, team: number) {
	if (!pops.has(team)) {
		pops.set(team, new Set());
	}

	pops.get(team)?.add(time);
}

for (const player of match.players) {
	const playerReader = new PlayerEventsReader(decode64(player.events), player.team, match.duration);

	playerReader.on('drop', (time, oldFlag, powers, team) => {
		addPop(time, team);
	});

	playerReader.on('pop', (time, powers, team) => {
		addPop(time, team);
	});

	playerReader.read();
}

for (let i = 0; i < match.teams.length; i++) {
	const team = match.teams[i];

	const teamPops = [...(pops.get(i + 1)?.keys() || [])].sort((a, b) => a - b);
	write(`\nTEAM ${i + 1} SPLATS\n`);

	const splats = decode64(team.splats);
	const splatReader = new TeamSplatsReader(splats, match.map.width, mapHeight);

	splatReader.on('splats', (splats, time) => {
		for (const splat of splats) {
			write(`${formatTime(teamPops[time])} (${splat[0]},${splat[1]})\n`);
		}
	});

	splatReader.read();
}
```
</details>

To see some basic output, run the included `dist/cli-example.js` with a path to a match JSON file:

```bash
node dist/cli-example.js path/to/match.json
```

<details>
<summary>Output: node dist/cli-example.js path/to/match.json</summary>

	MAP

	■■■■
	■☼☼■■■■■
	■☼☢    ◥■
	■■      ◥■■■■
	■          ■■■■
	■            ☼■
	■           ◎ ■         ■■■■■■■■■■■■■
	■◣            ■■       ■◤           ◥■
	■◣    ⚑       ■■■■■■■■◤             ◥■
	■◣           ▦▦▦▦▦                  ■■■
	■■           ▦▦▦▦▦                   ☢■
	■■           ▦▦▦▦▦                    ■
	■◤           ◥■■■◤                    ■
	■           •          ⤧              ■
	■                                     ■■■■
	■  ⤧                ☼    ☼               ■
	■■  ⤧                ◎                ⤧  ■■
		■               ☼    ☼                ⤧  ■
		■■■■                                     ■
		■              ⤧          •           ■
		■                    ◢■■■◣           ◢■
		■                    ▦▦▦▦▦           ■■
		■☢                   ▦▦▦▦▦           ■■
		■■■                  ▦▦▦▦▦           ◥■
			■◣             ◢■■■■■■■■       ⚑    ◥■
			■◣           ◢■       ■■            ◥■
			■■■■■■■■■■■■■         ■ ◎           ■
									■☼            ■
									■■■■          ■
										■■■■◣      ■■
											■◣    ☢☼■
											■■■■■☼☼■
												■■■■

	TIMELINE
	0:00.00 Kerfuffle! starts in team 2
	0:00.00 ALEXJONES starts in team 1
	0:00.00 spills starts in team 1
	0:00.00 OuchMyBalls starts in team 1
	0:00.00 moon. starts in team 2
	0:00.00 ToukoBlush starts in team 2
	0:02.15 ALEXJONES starts blocking
	0:06.20 Kerfuffle! starts preventing
	0:06.20 OuchMyBalls starts preventing
	0:06.20 moon. starts preventing
	0:06.35 spills grabs flag 1
	0:07.15 ALEXJONES stops blocking
	0:07.20 Kerfuffle! stops preventing
	0:07.20 moon. stops preventing
	0:07.88 Not trying joins team 2
	0:07.90 Grifalicious joins team 1
	0:10.25 OuchMyBalls starts blocking
	0:10.50 Grifalicious starts blocking
	0:11.20 OuchMyBalls stops preventing
	0:12.20 OuchMyBalls starts preventing
	0:14.20 Grifalicious starts preventing
	0:15.25 OuchMyBalls stops blocking
	0:15.50 Grifalicious stops blocking
	0:18.20 Grifalicious stops preventing
	0:19.78 OuchMyBalls starts blocking
	0:20.20 Grifalicious starts preventing
	0:20.75 spills starts blocking
	0:24.78 OuchMyBalls stops blocking
	0:25.75 spills stops blocking
	0:25.75 spills drops flag 1
	0:25.75 Not trying returns
	0:26.00 ALEXJONES grabs flag 1
	0:26.27 Not trying pops
	0:31.90 ALEXJONES quits team 1
	0:33.20 spills starts preventing
	0:33.77 Yo YoYo joins team 1
	0:34.17 ToukoBlush pops
	0:34.83 moon. starts blocking
	0:35.20 OuchMyBalls stops preventing
	0:36.20 spills stops preventing
	0:36.20 Grifalicious stops preventing
	0:36.52 spills starts preventing
	0:36.52 Grifalicious starts preventing
	0:37.52 spills stops preventing
	0:37.52 OuchMyBalls starts preventing
	0:39.22 Yo YoYo starts blocking
	0:39.82 Not trying grabs flag 1
	0:39.83 moon. stops blocking
	0:40.52 OuchMyBalls stops preventing
	0:40.52 Grifalicious stops preventing
	0:40.83 spills starts blocking
	0:41.52 Kerfuffle! starts preventing
	0:42.27 OuchMyBalls returns
	0:42.27 Not trying drops flag 1
	0:42.52 moon. grabs flag 1
	0:42.52 ToukoBlush starts preventing
	0:42.95 moon. drops flag 1
	0:42.95 Grifalicious returns
	0:43.27 Grifalicious starts buttoning
	0:44.18 Yo YoYo grabs flag 1
	0:44.22 Yo YoYo stops blocking
	0:44.52 Kerfuffle! stops preventing
	0:44.52 ToukoBlush stops preventing
	0:45.83 spills stops blocking
	0:47.45 Kerfuffle! returns
	0:47.45 Yo YoYo drops flag 1
	0:47.52 ToukoBlush starts preventing
	0:48.27 Grifalicious stops buttoning
	0:48.52 ToukoBlush stops preventing
	0:49.52 Kerfuffle! starts preventing
	0:49.52 moon. starts preventing
	0:50.52 Kerfuffle! stops preventing
	0:50.52 moon. stops preventing
	0:52.52 OuchMyBalls starts preventing
	0:52.52 Grifalicious starts preventing
	0:53.52 OuchMyBalls stops preventing
	0:53.52 Grifalicious stops preventing
	0:53.53 OuchMyBalls tags
	0:53.53 ToukoBlush pops
	0:54.52 Grifalicious starts preventing
	0:56.38 Not trying starts blocking
	0:57.52 OuchMyBalls starts preventing
	0:58.98 Not trying grabs flag 1
	0:59.52 OuchMyBalls stops preventing
	0:59.52 moon. starts preventing
	0:59.52 Grifalicious stops preventing
	1:00.17 ToukoBlush powers up 1
	1:00.52 ToukoBlush starts preventing
	1:01.38 OuchMyBalls returns
	1:01.38 Not trying stops blocking
	1:01.38 Not trying drops flag 1
	1:01.40 Grifalicious powers up 1
	1:01.67 spills powers up 4
	1:03.52 ToukoBlush stops preventing
	1:05.27 spills tags
	1:05.27 Not trying pops
	1:06.52 Kerfuffle! starts preventing
	1:07.95 Yo YoYo starts blocking
	1:08.82 Kerfuffle! pops
	1:08.82 spills tags
	1:09.17 Grifalicious starts blocking
	1:09.52 Kerfuffle! stops preventing
	1:10.03 Grifalicious grabs flag 1
	1:10.52 moon. stops preventing
	1:11.52 OuchMyBalls starts preventing
	1:12.83 Kerfuffle! pops
	1:12.83 spills tags
	1:12.92 ToukoBlush grabs flag 1
	1:12.95 Yo YoYo stops blocking
	1:13.52 OuchMyBalls stops preventing
	1:14.17 Not trying returns
	1:14.17 Grifalicious stops blocking
	1:14.17 Grifalicious drops flag 1
	1:14.52 moon. starts preventing
	1:14.52 Not trying starts preventing
	1:15.52 moon. stops preventing
	1:16.33 Kerfuffle! pops
	1:16.33 spills tags
	1:16.52 Not trying stops preventing
	1:17.75 Yo YoYo grabs flag 1
	1:18.58 spills tags
	1:18.58 moon. pops
	1:20.17 ToukoBlush powers down 1
	1:21.40 Grifalicious powers down 1
	1:21.67 spills powers down 4
	1:22.58 spills starts blocking
	1:23.45 moon. starts blocking
	1:27.58 spills stops blocking
	1:28.45 moon. stops blocking
	1:29.60 ToukoBlush drops flag 1
	1:29.60 Grifalicious returns
	1:29.88 Not trying grabs flag 1
	1:31.23 Kerfuffle! returns
	1:31.23 Yo YoYo drops flag 1
	1:33.17 OuchMyBalls grabs flag 1
	1:33.28 moon. starts buttoning
	1:34.20 ToukoBlush starts blocking
	1:34.23 Kerfuffle! starts blocking
	1:35.30 Not trying starts blocking
	1:35.82 Kerfuffle! returns
	1:35.82 OuchMyBalls drops flag 1
	1:36.53 Kerfuffle! starts preventing
	1:36.53 ToukoBlush starts preventing
	1:36.72 Yo YoYo starts blocking
	1:36.83 spills starts blocking
	1:38.28 moon. stops buttoning
	1:39.20 ToukoBlush stops blocking
	1:39.23 Kerfuffle! stops blocking
	1:40.30 Not trying stops blocking
	1:40.30 Not trying drops flag 1
	1:40.30 Grifalicious returns
	1:40.45 Grifalicious starts blocking
	1:41.22 Grifalicious grabs flag 1
	1:41.53 Kerfuffle! stops preventing
	1:41.53 ToukoBlush stops preventing
	1:41.72 Yo YoYo stops blocking
	1:42.63 spills stops blocking
	1:44.78 spills starts blocking
	1:45.45 ToukoBlush returns
	1:45.45 Grifalicious stops blocking
	1:45.45 Grifalicious drops flag 1
	1:45.53 OuchMyBalls starts preventing
	1:45.70 Yo YoYo grabs flag 1
	1:49.78 spills stops blocking
	1:51.53 Grifalicious starts preventing
	1:51.92 moon. grabs flag 1
	1:52.22 moon. starts blocking
	1:52.53 OuchMyBalls stops preventing
	1:52.53 Grifalicious stops preventing
	1:53.27 Grifalicious starts buttoning
	1:53.28 spills starts buttoning
	1:54.70 Kerfuffle! starts blocking
	1:55.12 Kerfuffle! returns
	1:55.12 Yo YoYo drops flag 1
	1:55.37 spills grabs flag 1
	1:57.22 OuchMyBalls returns
	1:57.22 moon. stops blocking
	1:57.22 moon. drops flag 1
	1:57.47 Not trying grabs flag 1
	1:58.27 Grifalicious stops buttoning
	1:58.28 spills stops buttoning
	1:59.70 Kerfuffle! stops blocking
	2:00.62 Not trying drops flag 1
	2:00.62 Grifalicious returns
	2:01.07 OuchMyBalls powers up 2
	2:01.27 OuchMyBalls powers down 2
	2:01.55 Yo YoYo starts preventing
	2:01.93 Yo YoYo powers up 1
	2:02.52 ToukoBlush powers up 4
	2:02.55 Grifalicious starts preventing
	2:02.60 Kerfuffle! grabs flag 1
	2:03.55 Grifalicious stops preventing
	2:03.55 Yo YoYo stops preventing
	2:05.05 Kerfuffle! drops flag 1
	2:05.05 Yo YoYo returns
	2:05.30 spills captures flag 1
	2:05.55 spills starts preventing
	2:05.55 Yo YoYo starts preventing
	2:06.55 Grifalicious starts preventing
	2:06.60 ToukoBlush tags
	2:06.60 Yo YoYo pops
	2:07.48 spills pops
	2:07.48 ToukoBlush tags
	2:07.55 spills stops preventing
	2:07.55 Grifalicious stops preventing
	2:07.55 Yo YoYo stops preventing
	2:07.98 OuchMyBalls grabs flag 1
	2:08.28 Kerfuffle! starts buttoning
	2:09.55 Grifalicious starts preventing
	2:10.80 Kerfuffle! returns
	2:10.80 OuchMyBalls drops flag 1
	2:10.87 Not trying starts blocking
	2:13.28 Kerfuffle! stops buttoning
	2:13.37 Not trying grabs flag 1
	2:13.55 Grifalicious stops preventing
	2:14.55 Kerfuffle! starts preventing
	2:14.55 moon. starts preventing
	2:15.87 OuchMyBalls returns
	2:15.87 Not trying stops blocking
	2:15.87 Not trying drops flag 1
	2:17.55 Grifalicious starts preventing
	2:18.42 ToukoBlush tags
	2:18.42 Grifalicious pops
	2:18.55 Grifalicious stops preventing
	2:18.68 Yo YoYo starts blocking
	2:19.23 ToukoBlush grabs flag 1
	2:19.55 Kerfuffle! stops preventing
	2:19.55 moon. stops preventing
	2:20.55 moon. starts preventing
	2:21.43 ToukoBlush tags
	2:21.43 ToukoBlush drops flag 1
	2:21.43 Grifalicious returns
	2:21.43 Grifalicious pops
	2:21.55 Kerfuffle! starts preventing
	2:21.93 Yo YoYo powers down 1
	2:22.52 ToukoBlush powers down 4
	2:23.45 Yo YoYo grabs flag 1
	2:23.55 Kerfuffle! stops preventing
	2:23.55 moon. stops preventing
	2:23.68 Yo YoYo stops blocking
	2:23.70 moon. returns
	2:23.70 Yo YoYo drops flag 1
	2:24.55 Kerfuffle! starts preventing
	2:24.55 moon. starts preventing
	2:26.85 Not trying starts blocking
	2:27.55 Kerfuffle! stops preventing
	2:27.55 moon. stops preventing
	2:27.55 Grifalicious starts preventing
	2:29.55 Kerfuffle! starts preventing
	2:29.55 moon. starts preventing
	2:30.55 Yo YoYo starts preventing
	2:31.55 Kerfuffle! stops preventing
	2:31.55 Not trying grabs flag 1
	2:31.55 Grifalicious stops preventing
	2:31.55 Yo YoYo stops preventing
	2:31.85 Not trying stops blocking
	2:31.85 Not trying drops flag 1
	2:31.85 Yo YoYo returns
	2:32.55 Kerfuffle! starts preventing
	2:32.55 Grifalicious starts preventing
	2:32.55 Yo YoYo starts preventing
	2:34.63 OuchMyBalls pops
	2:40.55 Kerfuffle! stops preventing
	2:40.55 moon. stops preventing
	2:40.75 ToukoBlush grabs flag 1
	2:41.55 moon. starts preventing
	2:41.55 Grifalicious stops preventing
	2:41.55 Yo YoYo stops preventing
	2:42.08 ToukoBlush drops flag 1
	2:42.08 Grifalicious returns
	2:43.27 Grifalicious starts buttoning
	2:43.55 Grifalicious starts preventing
	2:43.55 Yo YoYo starts preventing
	2:44.55 Grifalicious stops preventing
	2:44.55 Yo YoYo stops preventing
	2:45.98 Yo YoYo starts blocking
	2:47.90 ToukoBlush pops
	2:47.90 Yo YoYo tags
	2:48.27 Grifalicious stops buttoning
	2:48.28 ToukoBlush starts buttoning
	2:48.55 Kerfuffle! starts preventing
	2:49.47 spills starts blocking
	2:49.55 OuchMyBalls starts preventing
	2:50.55 Grifalicious starts preventing
	2:50.70 spills grabs flag 1
	2:50.98 Yo YoYo stops blocking
	2:51.27 Not trying grabs flag 1
	2:51.55 Kerfuffle! stops preventing
	2:51.55 OuchMyBalls stops preventing
	2:51.55 moon. stops preventing
	2:51.55 Grifalicious stops preventing
	2:52.92 Yo YoYo starts blocking
	2:53.28 ToukoBlush stops buttoning
	2:54.47 spills stops blocking
	2:54.47 spills drops flag 1
	2:54.47 moon. returns
	2:54.72 Yo YoYo grabs flag 1
	2:56.15 Not trying drops flag 1
	2:57.92 ToukoBlush returns
	2:57.92 Yo YoYo stops blocking
	2:57.92 Yo YoYo drops flag 1
	2:58.58 Kerfuffle! starts blocking
	3:01.55 spills starts preventing
	3:01.55 Grifalicious starts preventing
	3:01.83 ToukoBlush grabs flag 1
	3:02.55 spills stops preventing
	3:02.55 Grifalicious stops preventing
	3:02.62 Grifalicious powers up 4
	3:02.80 moon. starts blocking
	3:03.05 Not trying starts blocking
	3:03.28 Not trying powers up 1
	3:03.58 Kerfuffle! stops blocking
	3:03.87 Not trying pops
	3:04.95 spills starts blocking
	3:05.30 moon. powers up 1
	3:06.47 OuchMyBalls starts blocking
	3:06.55 moon. starts preventing
	3:07.80 moon. stops blocking
	3:08.05 Not trying stops blocking
	3:08.17 OuchMyBalls returns
	3:08.17 ToukoBlush drops flag 1
	3:08.42 Kerfuffle! grabs flag 1
	3:08.93 Yo YoYo grabs flag 1
	3:09.55 moon. stops preventing
	3:11.47 OuchMyBalls stops blocking
	3:12.70 spills stops blocking
	3:15.85 Yo YoYo drops flag 1
	3:16.40 spills grabs flag 1
	3:18.58 Grifalicious starts blocking
	3:20.52 Kerfuffle! returns
	3:20.52 Kerfuffle! drops flag 1
	3:20.52 spills returns
	3:20.52 spills drops flag 1
	3:20.77 Not trying grabs flag 1
	3:20.80 Yo YoYo starts blocking
	3:21.58 OuchMyBalls grabs flag 1
	3:22.62 Grifalicious powers down 4
	3:23.28 Not trying powers down 1
	3:25.30 moon. powers down 1
	3:25.48 Grifalicious stops blocking
	3:25.80 Yo YoYo stops blocking
	3:28.25 OuchMyBalls drops flag 1
	3:28.25 moon. returns
	3:28.28 ToukoBlush starts buttoning
	3:28.28 Yo YoYo starts buttoning
	3:28.83 Grifalicious grabs flag 1
	3:31.50 Kerfuffle! returns
	3:31.50 Grifalicious drops flag 1
	3:31.55 Kerfuffle! starts preventing
	3:33.28 ToukoBlush stops buttoning
	3:33.28 Yo YoYo stops buttoning
	3:34.55 moon. starts preventing
	3:38.28 Grifalicious starts buttoning
	3:38.55 OuchMyBalls returns
	3:38.55 Not trying drops flag 1
	3:39.58 ToukoBlush starts blocking
	3:40.12 ToukoBlush grabs flag 1
	3:40.57 Kerfuffle! stops preventing
	3:40.57 moon. stops preventing
	3:42.57 Kerfuffle! starts preventing
	3:42.57 moon. starts preventing
	3:43.28 Grifalicious stops buttoning
	3:44.58 OuchMyBalls returns
	3:44.58 ToukoBlush stops blocking
	3:44.58 ToukoBlush drops flag 1
	3:47.03 Not trying starts blocking
	3:49.57 OuchMyBalls starts preventing
	3:49.57 Grifalicious starts preventing
	3:49.80 Not trying grabs flag 1
	3:50.57 OuchMyBalls stops preventing
	3:50.57 Grifalicious stops preventing
	3:52.03 OuchMyBalls returns
	3:52.03 Not trying stops blocking
	3:52.03 Not trying drops flag 1
	3:53.28 OuchMyBalls starts buttoning
	3:53.57 Kerfuffle! stops preventing
	3:53.82 spills grabs flag 1
	3:53.92 Kerfuffle! starts blocking
	3:54.57 moon. stops preventing
	3:54.57 Grifalicious starts preventing
	3:55.00 ToukoBlush grabs flag 1
	3:55.57 Grifalicious stops preventing
	3:55.83 spills drops flag 1
	3:55.83 moon. returns
	3:56.57 moon. starts preventing
	3:57.70 Not trying starts blocking
	3:58.28 OuchMyBalls stops buttoning
	3:59.57 Kerfuffle! stops blocking
	3:59.57 moon. stops preventing
	4:00.22 moon. starts blocking
	4:02.35 OuchMyBalls pops
	4:02.57 moon. starts preventing
	4:02.70 Not trying stops blocking
	4:03.52 spills pops
	4:03.57 Kerfuffle! powers up 2
	4:04.57 Yo YoYo starts blocking
	4:05.22 moon. stops blocking
	4:05.75 Not trying powers up 4
	4:05.80 ToukoBlush captures flag 1
	4:06.25 Kerfuffle! grabs flag 1
	4:06.57 ToukoBlush starts preventing
	4:08.07 moon. powers up 4
	4:08.28 spills starts buttoning
	4:08.28 ToukoBlush starts buttoning
	4:08.57 moon. stops preventing
	4:09.42 Yo YoYo grabs flag 1
	4:09.57 ToukoBlush stops preventing
	4:09.57 Yo YoYo stops blocking
	4:09.82 ToukoBlush returns
	4:09.82 Yo YoYo drops flag 1
	4:10.15 Kerfuffle! starts blocking
	4:11.88 ToukoBlush starts blocking
	4:13.28 spills stops buttoning
	4:13.28 spills starts blocking
	4:13.28 ToukoBlush stops buttoning
	4:13.30 Grifalicious starts blocking
	4:15.15 Kerfuffle! powers down 2
	4:15.15 Kerfuffle! stops blocking
	4:15.37 Not trying tags
	4:15.37 Yo YoYo pops
	4:15.92 OuchMyBalls grabs flag 1
	4:16.88 ToukoBlush stops blocking
	4:18.28 spills stops blocking
	4:18.30 Grifalicious stops blocking
	4:19.12 Kerfuffle! drops flag 1
	4:19.12 spills returns
	4:20.97 Not trying grabs flag 1
	4:21.77 OuchMyBalls drops flag 1
	4:21.77 moon. returns
	4:22.57 moon. starts preventing
	4:22.57 ToukoBlush starts preventing
	4:23.28 spills starts buttoning
	4:23.57 ToukoBlush stops preventing
	4:23.63 ToukoBlush starts blocking
	4:25.57 Kerfuffle! starts preventing
	4:25.75 Not trying powers down 4
	4:28.05 moon. powers down 4
	4:28.28 spills stops buttoning
	4:29.23 ToukoBlush stops blocking
	4:29.73 OuchMyBalls returns
	4:29.73 Not trying drops flag 1
	4:31.48 ToukoBlush grabs flag 1
	4:32.57 Kerfuffle! stops preventing
	4:33.28 Kerfuffle! starts buttoning
	4:33.57 moon. stops preventing
	4:35.00 OuchMyBalls returns
	4:35.00 ToukoBlush drops flag 1
	4:37.57 moon. starts preventing
	4:38.28 Kerfuffle! stops buttoning
	4:38.28 Grifalicious starts buttoning
	4:39.57 Kerfuffle! starts preventing
	4:43.28 Grifalicious stops buttoning
	4:46.57 OuchMyBalls starts preventing
	4:47.32 Not trying grabs flag 1
	4:47.57 OuchMyBalls stops preventing
	4:48.28 spills starts buttoning
	4:49.47 OuchMyBalls returns
	4:49.47 Not trying drops flag 1
	4:49.57 OuchMyBalls starts preventing
	4:49.57 Grifalicious starts preventing
	4:50.57 Kerfuffle! stops preventing
	4:50.57 moon. stops preventing
	4:51.57 Kerfuffle! starts preventing
	4:51.57 moon. starts preventing
	4:53.28 spills stops buttoning
	4:53.57 OuchMyBalls stops preventing
	4:54.65 ToukoBlush grabs flag 1
	4:55.57 Grifalicious stops preventing
	4:56.57 Kerfuffle! stops preventing
	5:01.67 ToukoBlush drops flag 1
	5:01.67 Yo YoYo returns
	5:01.92 Not trying grabs flag 1
	5:03.57 Kerfuffle! starts preventing
	5:03.85 Yo YoYo grabs flag 1
	5:03.95 Not trying powers up 1
	5:04.27 Kerfuffle! returns
	5:04.27 Yo YoYo drops flag 1
	5:04.63 spills starts blocking
	5:05.82 OuchMyBalls powers up 1
	5:06.58 Kerfuffle! stops preventing
	5:08.58 ToukoBlush starts preventing
	5:08.73 moon. powers up 2
	5:09.47 spills grabs flag 1
	5:09.58 moon. stops preventing
	5:09.58 ToukoBlush stops preventing
	5:09.63 spills stops blocking
	5:11.67 Yo YoYo starts blocking
	5:14.20 spills drops flag 1
	5:14.20 ToukoBlush returns
	5:14.67 OuchMyBalls returns
	5:14.67 Not trying drops flag 1
	5:15.68 Grifalicious grabs flag 1
	5:18.77 moon. grabs flag 1
	5:18.92 Yo YoYo stops blocking
	5:19.22 ToukoBlush returns
	5:19.22 Grifalicious drops flag 1
	5:19.47 OuchMyBalls grabs flag 1
	5:22.20 moon. starts blocking
	5:22.57 ToukoBlush starts blocking
	5:23.95 Not trying powers down 1
	5:24.80 spills starts blocking
	5:25.73 OuchMyBalls drops flag 1
	5:25.73 ToukoBlush returns
	5:25.82 OuchMyBalls powers down 1
	5:26.58 Kerfuffle! starts preventing
	5:26.58 ToukoBlush starts preventing
	5:26.58 Not trying starts preventing
	5:27.20 moon. powers down 2
	5:27.20 moon. stops blocking
	5:27.57 ToukoBlush stops blocking
	5:27.58 Kerfuffle! stops preventing
	5:28.20 moon. captures flag 1
	5:28.58 moon. starts preventing
	5:29.27 Kerfuffle! quits team 2
	5:29.48 spills grabs flag 1
	5:29.58 moon. stops preventing
	5:29.58 ToukoBlush stops preventing
	5:29.58 Not trying stops preventing
	5:29.80 spills stops blocking
	5:29.80 spills drops flag 1
	5:29.80 ToukoBlush returns
	5:30.43 Grifalicious starts blocking
	5:30.58 moon. starts preventing
	5:30.58 ToukoBlush starts preventing
	5:30.58 Sum Brawl joins team 2
	5:32.58 Not trying starts preventing
	5:33.28 ToukoBlush starts buttoning
	5:33.58 moon. stops preventing
	5:33.58 ToukoBlush stops preventing
	5:33.58 Not trying stops preventing
	5:33.77 moon. starts preventing
	5:34.37 spills starts blocking
	5:34.47 OuchMyBalls starts blocking
	5:34.53 Yo YoYo grabs flag 1
	5:34.77 moon. stops preventing
	5:38.28 ToukoBlush stops buttoning
	5:39.20 Grifalicious stops blocking
	5:39.47 OuchMyBalls stops blocking
	5:39.50 Not trying grabs flag 1
	5:39.53 spills stops blocking
	5:41.83 OuchMyBalls starts blocking
	5:41.83 ToukoBlush starts blocking
	5:42.70 ToukoBlush returns
	5:42.70 Yo YoYo drops flag 1
	5:43.35 spills grabs flag 1
	5:43.70 Not trying starts blocking
	5:46.83 OuchMyBalls stops blocking
	5:46.83 ToukoBlush stops blocking
	5:47.47 moon. starts blocking
	5:48.70 OuchMyBalls returns
	5:48.70 Not trying stops blocking
	5:48.70 Not trying drops flag 1
	5:48.77 Yo YoYo starts preventing
	5:48.95 Sum Brawl grabs flag 1
	5:49.77 Yo YoYo stops preventing
	5:49.88 Yo YoYo returns
	5:49.88 Sum Brawl drops flag 1
	5:50.37 spills captures flag 1
	5:50.77 spills starts preventing
	5:50.77 Yo YoYo starts preventing
	5:50.88 moon. grabs flag 1
	5:51.77 spills stops preventing
	5:51.77 Yo YoYo stops preventing
	5:52.47 moon. stops blocking
	5:52.47 moon. drops flag 1
	5:52.47 Yo YoYo returns
	5:52.78 spills starts preventing
	5:52.78 Yo YoYo starts preventing
	5:53.78 OuchMyBalls starts preventing
	5:53.78 Grifalicious starts preventing
	5:53.78 Yo YoYo stops preventing
	5:54.78 spills stops preventing
	5:55.00 ToukoBlush starts blocking
	5:58.28 OuchMyBalls starts buttoning
	5:58.78 OuchMyBalls stops preventing
	5:59.10 Not trying grabs flag 1
	5:59.78 moon. starts preventing
	5:59.78 Grifalicious stops preventing
	5:59.78 Sum Brawl starts preventing
	6:00.00 ToukoBlush stops blocking
	6:03.28 OuchMyBalls stops buttoning
	6:04.38 ToukoBlush powers up 4
	6:05.07 spills starts blocking
	6:06.42 spills powers up 1
	6:08.78 Sum Brawl stops preventing
	6:09.22 moon. powers up 4
	6:09.65 OuchMyBalls pops
	6:09.65 ToukoBlush tags
	6:09.78 Sum Brawl starts preventing
	6:09.98 spills grabs flag 1
	6:10.07 spills stops blocking
	6:10.78 moon. stops preventing
	6:10.78 Sum Brawl stops preventing
	6:19.02 OuchMyBalls returns
	6:19.02 Not trying drops flag 1
	6:19.77 spills captures flag 1

	TEAM 1 SPLATS
	0:00.00 380,543
	0:00.02 1447,762
	0:00.03 1539,900
	0:00.05 1168,725
	0:00.07 1617,1124
	0:00.08 1348,713
	0:00.10 395,399
	0:00.12 230,397
	0:00.13 207,598
	0:00.15 1464,822
	0:00.17 367,349
	0:00.18 480,440
	0:00.20 1582,976
	0:00.22 1125,568
	0:00.23 1399,534
	0:00.25 1350,729
	0:00.27 1145,580
	0:00.28 1581,927
	0:00.30 1213,441
	0:00.32 1559,927
	0:00.33 1363,1003
	0:00.35 772,698
	0:00.37 891,586
	0:00.38 1601,939
	0:00.40 645,513
	0:00.42 1667,1197
	0:00.43 1611,912
	0:00.45 1322,286
	0:00.47 1456,735
	0:00.48 1682,961
	0:00.50 1599,1023
	0:00.52 1190,282
	0:00.53 619,732

	TEAM 2 SPLATS
	0:00.00 538,224
	0:00.02 527,199
	0:00.03 249,92
	0:00.05 352,342
	0:00.07 614,418
	0:00.08 362,646
	0:00.10 1430,797
	0:00.12 1566,962
	0:00.13 1630,865
	0:00.15 1409,863
	0:00.17 1259,909
	0:00.18 922,892
	0:00.20 1508,1069
	0:00.22 943,848
	0:00.23 571,457
	0:00.25 193,92
	0:00.27 506,449
	0:00.28 466,436
	0:00.30 325,308
	0:00.32 256,176
	0:00.33 1162,880
	0:00.35 72,73
	0:00.37 919,633
	0:00.38 1433,947
	0:00.40 1579,961
	0:00.42 1012,605
	0:00.43 147,163
	0:00.45 87,136
	0:00.47 1755,946
	0:00.48 530,533
	0:00.50 697,429
	0:00.52 247,87
	0:00.53 1538,949
	0:00.55 1487,736
	0:00.57 862,775
	0:00.58 298,300
	0:00.60 245,336
	0:00.62 1421,892
</details>

## Contributing

PR-s welcome.
