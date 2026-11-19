# leonida-platinum-desk

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/adriansyahsc07/leonida-platinum-desk/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/adriansyahsc07/leonida-platinum-desk/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Platinum Desk is a complete, offline trophy guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. It carries the whole official list — every trophy's exact name, description and grade — and adds what a hunter actually needs: a checklist whose progress is saved in the browser, with earned counts, percentage, PSN points and per-grade tallies; filters by kind, grade and search, plus an unearned-only view; a spoiler shield that hides story trophies until you earn them; export, import and reset for your progress; a nine-stage roadmap to the platinum built from the official descriptions; a missables page that flags the three trophies tied to one-time moments, with the reason stated; a Next Up panel that always shows the next trophies in roadmap order; and a guide pane for every trophy with a full guide in our own words.

Every guide cites its sources on the trophy itself: the official list on Exophase for the name, description and grade, PSNProfiles for PSN's progress target where one exists, and our own advice drawn from the official description for the guide text. Where a description does not pin a detail down — a location, a count, a condition — the guide says so plainly instead of inventing one. The app is plain static files with no build step and makes no network requests: open it, track your run, and take the platinum.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. (To hand the entry in instead: `MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to the output directory and writes its `dossier.json`.)

---

<sub>Entered on [make.fun](https://make.fun/?ref=kj9js265&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
