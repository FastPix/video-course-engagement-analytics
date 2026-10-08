# Changelog

All notable changes to FastPix Learner Signals are listed here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-08

First release.

### Added

- **Connector:** load a FastPix Video Data raw view export.
  - **Upload:** drop one or more CSV files. A load report shows the students, courses, lessons and views found, and checks every column.
  - **Columns:** camelCase (as in the FastPix export) and snake_case names both work. Rows without a course, lesson or student ID are skipped, and duplicate views are removed.
  - **Exports API tab:** a preview of loading exports through the FastPix Exports API. UI only for now.
- **Your data stays in your browser.** The file is parsed and scored in the browser and saved there (IndexedDB) so a refresh keeps it. **Clear data** removes it. The app starts empty and shows "No data yet" until you upload.
- **Learner model:** one learner per student per course, with health (Active, Cooling, Gone quiet, Finished) and a 0 to 100 readiness score from Completion, Consistency, Recency and Momentum.
- **Target dates:** set an exam or course end date per course to add Pace to the score and allow Tutor call suggestions. Dates are saved with the upload.
- **Suggested actions:** Plan reset, Nudge, Catch-up and Tutor call, each with a reason in plain English, shown on Learners and Learner detail.
- **Readiness:** a score chart against days idle or days left, a focus zone with sliders, band mix and week-on-week movers.
- **Learners:** a searchable, sortable table with dropdown filters for Readiness, Health and Action, removable filter chips, a Location column (city and region, country on hover) and CSV export.
- **Learner detail:**
  - score breakdown, unfinished lessons and a study-rhythm calendar
  - a plan line when a target date is set
  - viewing sessions with column headings, each expanding to its playback events and session facts
- **Course overview:** 8-week health chart, pile-up lesson, lessons that need attention, reach per lesson and weekly watch time.
- **Lessons:** a rewatch heatmap with a status per lesson (Healthy, Add example, Re-cut, Rewrite, Fix stream).
- **Lesson detail:** retention curve with rewatches and exits, device filter, learners stuck in the lesson and playback figures.
- **Playback:** buffering exits against clean exits per lesson and per device.
- **Video Data:** the uploaded CSV as a table, with every column, search and a numbered pager.
- **Built from:** a strip on every analysis screen listing the CSV columns its calculations use.
- **FastPix branding** and app-styled controls throughout.
- **MIT License.**

[1.0.0]: https://github.com/FastPix/video-course-engagement-analytics/releases/tag/v1.0.0
