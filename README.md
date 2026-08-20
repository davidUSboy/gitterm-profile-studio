# GitTerm Profile Studio

A browser-based GitHub REST API integration that turns public developer data into a terminal-style profile report and an exportable SVG identity card.

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-00c878?style=for-the-badge&logo=github&logoColor=001a10)](https://davidusboy.github.io/gitterm-profile-studio/)
[![GitHub REST API](https://img.shields.io/badge/GitHub_REST_API-0d1117?style=for-the-badge&logo=github)](https://docs.github.com/en/rest)
[![JavaScript](https://img.shields.io/badge/JavaScript-0d1117?style=for-the-badge&logo=javascript)](./app.js)

## Overview

GitTerm Profile Studio accepts a GitHub username, retrieves public account and repository data through the GitHub REST API, and presents the result through a dark CRT-inspired interface.

The application also generates a reusable SVG identity card that can be downloaded or embedded in documentation and profile READMEs.

## Features

- Public GitHub profile lookup
- Repository, follower, star, and fork signals
- Common repository language summary
- Recently updated owned repositories
- Exportable SVG developer card
- Responsive terminal-style interface
- Browser-only architecture with no backend database
- No password, access token, or private repository access

## Live demo

**https://davidusboy.github.io/gitterm-profile-studio/**

The demo loads `davidUSboy` by default and can inspect any valid public GitHub username.

## GitHub API integration

The application uses public GitHub REST API endpoints, including:

```http
GET /users/{username}
GET /users/{username}/repos
```

Requests run directly in the visitor's browser. Unauthenticated GitHub API rate limits apply, and the interface displays the remaining request budget when the response headers expose it.

## Run locally

No package installation or build process is required.

```bash
python -m http.server 8080
```

Open `http://localhost:8080` in a browser.

## Project structure

```text
.
├── assets/
│   └── favicon.svg
├── .nojekyll
├── app.js
├── index.html
├── LICENSE.md
├── PRIVACY.md
├── README.md
├── SUPPORT.md
└── styles.css
```

## Privacy and support

The application processes public GitHub data in the browser and does not intentionally retain profile information or credentials.

- [Privacy notice](./PRIVACY.md)
- [Support policy](./SUPPORT.md)

## License

The original source code, written content, and visual design are distributed under the proprietary terms in [LICENSE.md](./LICENSE.md).

## Disclaimer

GitTerm Profile Studio is an independent project and is not affiliated with or endorsed by GitHub, Inc. GitHub and the GitHub logo are trademarks of GitHub, Inc.
