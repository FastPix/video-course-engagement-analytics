<p align="center">
  <img src="public/brand/fastpix-logo.png" alt="FastPix" width="220">
</p>

# FastPix Learner Signals - learner analytics and video engagement dashboard for online courses

![Version](https://img.shields.io/badge/version-1.0.0-6D22CD)
![Next.js](https://img.shields.io/badge/Next.js-15-1C1A22)
![Node](https://img.shields.io/badge/Node-18.18%2B-12A46B)
![License: MIT](https://img.shields.io/badge/license-MIT-1C1A22)
![Data stays in your browser](https://img.shields.io/badge/data-stays%20in%20your%20browser-12A46B)
![Powered by FastPix Video Data](https://img.shields.io/badge/powered%20by-FastPix%20Video%20Data-34F5A3)

**FastPix Learner Signals is an open-source (MIT) learner analytics dashboard for online courses.** It turns a [FastPix Video Data raw view export](https://fastpix.com/docs/video-data/export-raw-view-data) (a daily CSV) into video engagement analytics for your course: which learners are on track, who has stopped watching, where people get stuck, and whether a drop-off is the lesson's fault or the video stream's.

It gives LMS and e-learning teams learner engagement and progress signals from video alone. You play course videos with the **FastPix Player** or any player monitored by a [FastPix Video Data SDK](https://fastpix.com/docs/video-data/overview), and tag each view with the course, lesson and student. FastPix records every playback event. This app reads the export and does the rest, in your browser - no LMS plugin, no database to join, and no data leaving your machine.

[Video Data overview](https://fastpix.com/docs/video-data/overview) · [Set up FastPix](#set-up-fastpix) · [Create an account](https://dashboard.fastpix.com/signup) · [Pricing](https://fastpix.com/pricing)

## Contents

- [Get started](#get-started)
- [Why FastPix Learner Signals?](#why-fastpix-learner-signals)
- [Who it's for](#who-its-for)
- [Features](#features)
- [How it works](#how-it-works)
- [The FastPix products it uses](#the-fastpix-products-it-uses)
- [Set up FastPix](#set-up-fastpix)
- [What your CSV needs](#what-your-csv-needs)
- [Using the app](#using-the-app)
- [Install from source](#install-from-source)
- [Project layout](#project-layout)
- [FAQ](#faq)
- [Related FastPix tools](#related-fastpix-tools)
- [Changelog](#changelog)
- [Documentation](#documentation)
- [License](#license)

## Get started

```bash
git clone https://github.com/FastPix/video-course-engagement-analytics.git
cd video-course-engagement-analytics
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Connector** and drop in a views export CSV.

No export yet? Use the sample in this repo: `public/sample/fastpix-views-export-lms-demo.csv` (100 students, 3 courses, 30 lessons, 1,127 views).

## Why FastPix Learner Signals?

- **It works from viewing data alone.** No quiz scores, no LMS database join, no plugin on your LMS. Three custom dimensions on your player are enough.
- **It tells you what to do next.** Every learner gets a readiness score, a health state and one suggested action, with the reason in plain English.
- **It separates content problems from stream problems.** FastPix records buffering and exits for every view, so the app can tell a lesson people quit because it is confusing from one they quit because the video stalled.
- **Your data stays with you.** The CSV is parsed and scored in the browser. Nothing is uploaded.

## Who it's for

Any team that teaches with video and wants learner analytics without wiring up a data pipeline:

- **Exam prep and coaching.** For competitive-exam and test-prep courses (the bundled sample is a crash course). Set the exam date and see who is on pace, who has gone quiet, and who needs a tutor call.
- **Online course creators and cohorts.** Find the exact lessons where students drop off, and tell a confusing lesson apart from a video stream that stalled, so you know whether to re-cut the content or fix delivery.
- **Corporate training and compliance.** Track course completion and learner progress for employee and partner training from video alone - no quizzes and no LMS plugin to install.
- **Universities and higher education.** Learner analytics across courses: readiness, engagement and per-lesson drop-off, for on-demand and flipped-classroom video.
- **Professional and skills training.** Monitor learner engagement in high-stakes training (medical, nursing, safety, microlearning) where finishing every lesson matters.

## Features

- **Readiness:** a 0 to 100 score for each learner, shown on a chart against days idle (or days left to a target date), with a focus zone for the learners who need help first and week-on-week changes.
- **Learners:** a searchable, sortable table with dropdown filters for readiness band, health and suggested action, each learner's location, and CSV export of any filtered group.
- **Learner detail:** score breakdown, unfinished lessons, a study-rhythm calendar, the 12 most recent viewing sessions with their real FastPix player events, and the suggested next step.
- **Course overview:** learner health over the last 8 weeks, where learners pile up, the lessons that need attention and weekly watch time.
- **Lessons:** a rewatch heatmap across every lesson, with a status for each one: Healthy, Add example, Re-cut, Rewrite or Fix stream.
- **Lesson detail:** an audience retention curve with rewatches and exits, filterable by device, plus the learners stuck in that lesson.
- **Playback:** exits that happened while buffering compared with exits on a clean stream, per lesson and per device.
- **Target dates:** set an exam or course end date and the score adds **Pace** (is this learner going to finish in time?) and can suggest a **Tutor call**.
- **Video Data:** your uploaded CSV shown as a table, exactly as you uploaded it, with search and paging.
- **Built from:** a strip at the bottom of each analysis screen (all but Connector and Video Data) lists the CSV columns its calculations use. Display-only columns, such as the location shown on Learners, are not listed.

## How it works

```
Your player                FastPix Video Data              FastPix export              This app (in your browser)
─────────────              ──────────────────              ──────────────              ─────────────────────────
FastPix Player   ──views──▶  records every view,  ──daily──▶  views_{date}.csv  ──drop──▶  learners, courses, lessons,
or a Data SDK               its events and your             (gzipped, one per            scores, actions and
+ custom_1/2/3              custom dimensions                UTC day)                     lesson fixes
```

1. **Your player tags each view.** You set three custom dimensions on every view: course ID, lesson ID and student ID.
2. **FastPix Video Data records it.** Every playback session is captured with its player events (play, pause, seeking, waiting and so on), quality metrics and your custom dimensions.
3. **You export the views.** FastPix produces one raw view CSV per UTC day.
4. **You drop the CSV into Connector.** The app checks the columns, skips rows without IDs and shows what it found.
5. **Every screen fills in.** Learners, courses and lessons are built from the rows. "Today" is the date of the latest view in the file, so an older export still makes sense.
6. **Your upload is remembered.** The file and any target dates you set are kept in your browser until you press **Clear data**.

## The FastPix products it uses

| FastPix product | What it does for this app | Docs |
|---|---|---|
| **Video Data** | Captures every playback session (50+ dimensions, playback events, QoE metrics) from your players. This is the source of every number in the app. | [Video Data overview](https://fastpix.com/docs/video-data/overview) |
| **FastPix Player** (`@fastpix/fp-player`) | The FastPix web player. Sends Video Data built in when you add a workspace key, and takes your custom dimensions as attributes. | [Monitor video data](https://fastpix.com/docs/web-player/monitor-video-data) |
| **Video Data SDKs** (`@fastpix/video-data-core` and others) | Add Video Data to a player you already use: HLS.js, Video.js, Shaka Player, DASH.js on the web, plus Android, iOS, React Native, Flutter and smart TV players. | [Video Data overview](https://fastpix.com/docs/video-data/overview) |
| **Custom dimensions** | The `custom_1` to `custom_10` fields. This app uses three of them for course, lesson and student. | [Use custom dimensions](https://fastpix.com/docs/video-data/use-custom-dimensions) |
| **Raw view exports** | A gzipped CSV for each UTC day with every field of every view. This is the file you drop into the app. | [Export raw view data](https://fastpix.com/docs/video-data/export-raw-view-data) |
| **Exports API** (`GET /v1/data/exports/rawViews`) | Lists the daily export files with a download URL for each. The app's "FastPix Exports API" tab is a preview of this flow and does not call it yet (see [FAQ](#faq)). | [List raw view exports](https://fastpix.com/docs/video-data-api/exports/list-raw-view-exports) |

## Set up FastPix

You need a FastPix account with Video Data. Raw view exports are not available on the free plan, and the free plan has two custom dimensions, so you need a paid plan (Growth or above, which has ten). See [pricing](https://fastpix.com/pricing).

### 1. Copy your workspace key

In the FastPix dashboard, open **Workspaces**, pick the workspace you want the views in, and copy its **workspace key**. See [Set up a workspace](https://fastpix.com/docs/getting-started/set-up-a-workspace) for where to find it.

### 2. Turn on three custom dimensions

In the dashboard's **Custom Dimensions** section, edit `custom_1`, `custom_2` and `custom_3`, set them to **Yes**, and give them display names such as "Course", "Lesson" and "Student". See [Use custom dimensions](https://fastpix.com/docs/video-data/use-custom-dimensions).

### 3. Tag every view in your player

Send the IDs only for logged-in students. Use your LMS's own student ID and do not hash it: you need to be able to look the student up.

**With the FastPix Player:**

```bash
npm install @fastpix/fp-player
```

```html
<fastpix-player
  playback-id="YOUR_PLAYBACK_ID"
  metadata-workspace-key="YOUR_WORKSPACE_KEY"
  metadata-video-title="Lesson 3: Motion in a Plane"
  metadata-video-series="TS EAMCET Physics Crash Course"
  metadata-custom-1="eamcet-phy"
  metadata-custom-2="eamcet-phy-L03"
  metadata-custom-3="24001"
></fastpix-player>
```

**With another web player (example: HLS.js):**

```bash
npm install @fastpix/video-data-core
```

```javascript
import Hls from "hls.js";
import fastpixMetrix from "@fastpix/video-data-core";

const video = document.getElementById("video-player");
const hls = new Hls();
hls.loadSource("https://stream.example.com/lesson-03.m3u8");
hls.attachMedia(video);

fastpixMetrix.tracker(video, {
  hlsjs: hls,
  Hls,
  data: {
    workspace_id: "YOUR_WORKSPACE_KEY",
    player_name: "Course player",
    video_title: "Lesson 3: Motion in a Plane",
    video_series: "TS EAMCET Physics Crash Course",
    custom_1: "eamcet-phy",      // course ID
    custom_2: "eamcet-phy-L03",  // lesson ID, order number at the end
    custom_3: "24001",           // student ID
  },
});
```

For Video.js, Shaka Player, DASH.js, mobile and smart TV players, follow the matching guide in the [Video Data docs](https://fastpix.com/docs/video-data/overview) and set the same three custom fields.

### 4. Turn on daily CSV exports

In the dashboard, open **Data Exports > CSV exports** and enable **Daily CSV exports**. For the fields each file contains, see [What Video Data do we capture](https://fastpix.com/docs/video-data/what-video-data-do-we-capture). Things to know:

- **Timing:** a file covers one whole UTC day and is generated by a daily run at 04:00 UTC.
- **Retention:** files are kept for 7 days, then deleted. Days before you enabled exports are never generated.

### 5. Download and unzip an export

Download a file from the dashboard, or list the files with the [Exports API](https://fastpix.com/docs/video-data-api/exports/list-raw-view-exports). The API uses your **Access Token ID** and **Secret Key** (different from the workspace key) - generate them in the dashboard under **Access Tokens**, as described in [Activate your account](https://fastpix.com/docs/getting-started/activate-your-account#generate-api-credentials).

```bash
curl "https://api.fastpix.com/v1/data/exports/rawViews?timespan[]=7:days" \
  -u "$FASTPIX_ACCESS_TOKEN_ID:$FASTPIX_SECRET_KEY"
```

Each entry has a time-limited `downloadUrl`. The files are gzipped, and this app reads plain `.csv`, so decompress while downloading:

```bash
curl --compressed -o views_2026-10-05.csv "<downloadUrl>"
```

Or unzip a downloaded file with `gunzip views_2026-10-05.csv.gz`. To cover more than one day, drop several daily files into Connector at once: rows are combined and duplicate views (same `viewId`) are removed.

## What your CSV needs

Column names can be camelCase (as in the [FastPix raw export](https://fastpix.com/docs/video-data/what-video-data-do-we-capture), for example `viewStart`) or snake_case (as in the sample, `view_start`). The app treats `viewStart`, `view_start` and `ViewStart` as the same column.

**Set in your player** (custom dimensions):

| Export column | Sample column | Holds | Example |
|---|---|---|---|
| `custom1` | `custom_1` | Course ID | `eamcet-phy` |
| `custom2` | `custom_2` | Lesson ID, with its order number at the end | `eamcet-phy-L03` |
| `custom3` | `custom_3` | Student ID from your LMS | `24001` |

**Already in every FastPix export:**

| Export column | Holds |
|---|---|
| `viewStart` | When the view started (UTC) |
| `videoDuration` | Lesson length, in ms |
| `viewMaxPlayheadPosition` | Furthest point reached, in ms |
| `events` | The player event list for the view (`viewBegin`, `play`, `playing`, `pause`, `seeking`, `seeked`, `waiting`, `buffering`, `variantChanged`, `viewCompleted` and more). See [Which events the app reads](#which-events-the-app-reads). |

**Optional, used when present:**

| Export column | Used for |
|---|---|
| `viewId` | Removing duplicate rows across files |
| `viewTotalContentPlaybackTime` | Real watch time |
| `videoTitle`, `videoSeries` | Lesson and course names |
| `deviceType`, `osName` | Device |
| `videoStartupTime` | Startup time, read as milliseconds |
| `city`, `region`, `country` | Learner location (display only) |

### Which events the app reads

The app reads these events from each view's `events` list:

| What the app works out | Events it looks for |
|---|---|
| Where watching started | the first `playing` |
| Watched to the end | an `ended` event, or the furthest point reached (`viewMaxPlayheadPosition`) at 97% or more |
| Rewatch | `seeking` followed by a `seeked` at least 1 second earlier in the video |
| Stall | a `waiting` after playback started (not straight after a seek) |
| Left while buffering | the view's last two events are `waiting` or `buffering`, then `viewDropped` or `viewEnd` (ignoring `variantChanged`, `requestFailed` and `requestCanceled`) |

The bundled sample uses these names. FastPix's [list of captured events](https://fastpix.com/docs/video-data/what-video-data-do-we-capture) does not show `ended`, `viewDropped` or `viewEnd`. If your export ends views with a different event (for example `viewCompleted`), "watched to the end" still works from the furthest point reached, but **Left while buffering** on Playback and the **Fix stream** lesson status will read 0%. The app also reads `videoStartupTime` as milliseconds, like the sample; if your export gives seconds, **Avg startup** will show close to 0 s. Check one of your own exports before you rely on these figures.

Rows without a course, lesson or student ID are skipped and counted in the load report. No calculation or analysis screen uses `viewerId`, `fpViewerId`, IP addresses, `latitude` or `longitude`. The **Video Data** page shows your file exactly as uploaded, so any column in the file, including those, appears there.

## Using the app

1. **Load your data.** Open **Connector** and drop one or more CSV files into **Upload CSV**. The load report shows how many students, courses, lessons and views were found, and which columns were missing.
2. **Pick a course.** Use the course picker at the top of the sidebar. Every screen shows one course at a time.
3. **Find who needs help.** Start on **Readiness**: the learners inside the purple focus zone need help first. Open **Learners** to filter and export a group.
4. **Fix the right lessons.** **Overview** and **Lessons** show which lessons lose people and why. **Playback** tells you when the stream is to blame.
5. **Add a deadline (optional).** In **Connector**, set a target date per course to turn on Pace and Tutor call suggestions.
6. **Check the raw rows.** **Video Data** shows the uploaded file as a table.
7. **Start over.** **Clear data** in Connector removes the file and its target dates from your browser.

## Install from source

**Requirements:** Node.js 18.18 or later and npm.

```bash
git clone https://github.com/FastPix/video-course-engagement-analytics.git
cd video-course-engagement-analytics
npm install
```

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app at http://localhost:3000 with live reload |
| `npm run build` | Builds the production version |
| `npm start` | Serves the production build (run `npm run build` first) |
| `npm run typecheck` | Checks the TypeScript types |
| `npm run lint` | Runs ESLint |

## Project layout

| Path | What it is |
|---|---|
| `app/` | The pages: Readiness, Learners, Learner detail, Overview, Lessons, Lesson detail, Playback, Connector (`app/data`) and Video Data (`app/view`) |
| `components/` | The sidebar, course picker, filters, drop zone, charts and shared UI |
| `lib/model/` | Every calculation: parsing views and events, learners, health, readiness score, suggested actions, lesson stats and history. Pure functions with no browser code |
| `lib/config.ts` | Every threshold and weight in one place (score weights, health days, lesson rules) |
| `lib/types.ts` | The data shapes |
| `lib/store.ts` | App state, and saving your upload in the browser |
| `lib/csv/` | CSV parsing (Papa Parse) and the background parser |
| `public/sample/` | A sample views export to try the app with |
| `public/brand/` | FastPix logo files |
| `app/api/exports/route.ts` | Placeholder for the Exports API (see FAQ) |

## FAQ

**What is learner analytics?**
Learner analytics means measuring how students actually engage with a course - what they watch, how far they get, who is falling behind - and turning it into signals you can act on. FastPix Learner Signals produces learner analytics from your video playback data, with no quizzes, no LMS plugin, and no data leaving your browser.

**What is FastPix Learner Signals?**
A free, open-source (MIT) learner analytics and video engagement dashboard for online courses that you run yourself. It reads a FastPix Video Data CSV export and shows which learners are on track, who has gone quiet, and which course lessons lose people.

**How do I measure video engagement in an online course?**
Tag each view in your player with a course, lesson and student ID (three FastPix custom dimensions), export the Video Data as a daily CSV, and drop it into this app. It turns the raw playback events into video engagement analytics per learner and per lesson - watch time, completion, rewatches and drop-off. See [Set up FastPix](#set-up-fastpix).

**How do I track learner progress and course completion?**
Each view is tagged with a course, lesson and student, so the app builds per-learner progress and course completion from how much of each lesson video is actually watched - for any course, including an LMS course in Moodle. No quizzes or graded work required.

**Does my data get uploaded anywhere?**
No. The CSV is read and scored in your browser. It is saved only in your browser's storage (IndexedDB) so a page refresh keeps it. **Clear data** removes it.

**Which FastPix plan do I need?**
One with Video Data raw view exports and at least three custom dimensions. Raw view exports are not on the free plan, and the free plan has two custom dimensions. Growth has ten. See [pricing](https://fastpix.com/pricing).

**My export file ends in `.gz` and the app will not take it.**
FastPix exports are gzipped. Decompress first (`gunzip views_2026-10-05.csv.gz`, or download with `curl --compressed`), then drop in the `.csv`.

**The load report says `custom_3 (student ID)` is missing.**
Your player is not sending the student ID, or the custom dimension is not turned on in the dashboard. See [Set up FastPix](#set-up-fastpix), steps 2 and 3.

**Why does a course show fewer learners than my file has rows?**
Each row is one viewing session, not one learner. A file with 1,127 rows can hold 100 students. The app also shows one course at a time, so switch courses in the sidebar to see the rest.

**What do the health states mean?**
**Active**: watched in the last 9 days. **Cooling**: last watched 10 to 20 days ago. **Gone quiet**: more than 20 days with no watching. **Finished**: every lesson watched to the end (97% or more).

**How is the readiness score worked out?**
Completion 40%, Consistency (study days in the last 2 weeks) 20%, Recency (how recently they watched) 20% and Momentum (watch time rising or falling) 20%. With a target date, Pace counts for 25% and the other four are scaled down. 70 and above is **Ready**, 50 to 69 is **Building**, under 50 is **At-risk**. You can change every number in `lib/config.ts`.

**Does the "FastPix Exports API" tab work?**
Not yet. It shows the planned flow (token ID, secret key, days, list exports, load) but makes no requests, and `app/api/exports/route.ts` returns "501 Not implemented". Calling the [Exports API](https://fastpix.com/docs/video-data-api/exports/list-raw-view-exports) needs your secret key, which must stay on a server, so that route is the place to add it. Until then, download the files as in [step 5](#5-download-and-unzip-an-export) and use **Upload CSV**.

**My course has lessons nobody has watched yet. Are they counted?**
The app only knows about lessons that appear in the export. A lesson with no views is not in the file, so it is not counted until someone watches it.

**Can I use my own thresholds?**
Yes. Change the values in `lib/config.ts` (for example the days before a learner counts as Cooling, or the score bands) and restart the app.

**Which browsers are supported?**
The app is tested in Chrome. It uses only standard browser features (IndexedDB, Web Workers), so current Edge, Firefox and Safari should work, but they have not been tested yet.

## Related FastPix tools

- [FastPix Web Player](https://github.com/FastPix/web-player-component): the player that sends Video Data, and where you set `metadata-custom-1` to `metadata-custom-3`.
- [FastPix Video Data Core SDK](https://github.com/FastPix/web-video-data-core-sdk): add Video Data to HLS.js and other HTML5 players.
- [FastPix Video Data for Video.js](https://github.com/FastPix/web-videojs-data-monitoring) and [for Shaka Player](https://github.com/FastPix/web-video-data-shakaplayer-sdk).
- [FastPix for Moodle](https://github.com/FastPix/moodle-mod_fastpix): FastPix video inside Moodle courses.
- [FastPix Video for WordPress](https://github.com/FastPix/wordpress): upload, embed and measure FastPix video from WordPress.
- [FastPix Node SDK](https://github.com/FastPix/node-sdk): call the FastPix API from your own server.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version.

## Documentation

- [Set up a workspace (find your workspace key)](https://fastpix.com/docs/getting-started/set-up-a-workspace)
- [Activate your account (generate API credentials)](https://fastpix.com/docs/getting-started/activate-your-account#generate-api-credentials)
- [FastPix Video Data overview](https://fastpix.com/docs/video-data/overview)
- [Monitor video data with the FastPix Player](https://fastpix.com/docs/web-player/monitor-video-data)
- [Use custom dimensions](https://fastpix.com/docs/video-data/use-custom-dimensions)
- [Export raw view data](https://fastpix.com/docs/video-data/export-raw-view-data)
- [What Video Data do we capture](https://fastpix.com/docs/video-data/what-video-data-do-we-capture)
- [List raw view exports (API reference)](https://fastpix.com/docs/video-data-api/exports/list-raw-view-exports)
- [FastPix documentation home](https://fastpix.com/docs) · [Create an account](https://dashboard.fastpix.com/signup) · [Pricing](https://fastpix.com/pricing)

## License

FastPix Learner Signals is released under the [MIT License](LICENSE).
