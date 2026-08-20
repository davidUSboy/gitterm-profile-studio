'use strict';

const API_VERSION = '2026-03-10';
const API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': API_VERSION,
};

const form = document.querySelector('#profile-form');
const usernameInput = document.querySelector('#username');
const resultSection = document.querySelector('#result');
const statusPanel = document.querySelector('#status');
const statusText = document.querySelector('#status-text');
const rateLimitText = document.querySelector('#rate-limit');
const submitButton = form.querySelector('button[type="submit"]');
const repositoryTemplate = document.querySelector('#repository-template');
const repositoriesContainer = document.querySelector('#repositories');
const languagesContainer = document.querySelector('#languages');
const cardPreview = document.querySelector('#card-preview');
const downloadButton = document.querySelector('#download-svg');
const copyButton = document.querySelector('#copy-svg');

let currentSvg = '';
let currentUsername = '';

const elements = {
  avatar: document.querySelector('#avatar'),
  login: document.querySelector('#login'),
  name: document.querySelector('#name'),
  bio: document.querySelector('#bio'),
  profileLink: document.querySelector('#profile-link'),
  location: document.querySelector('#location'),
  joined: document.querySelector('#joined'),
  company: document.querySelector('#company'),
  website: document.querySelector('#website'),
  repoCount: document.querySelector('#repo-count'),
  followers: document.querySelector('#followers'),
  stars: document.querySelector('#stars'),
  forks: document.querySelector('#forks'),
};

function setStatus(message, state = 'ready') {
  statusPanel.classList.toggle('error', state === 'error');
  statusText.textContent = message;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en', { notation: value > 9999 ? 'compact' : 'standard' }).format(value || 0);
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value));
}

function normalizeWebsite(value) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function truncate(value, maxLength) {
  const normalized = String(value ?? '').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

async function requestJson(url) {
  const response = await fetch(url, { headers: API_HEADERS });
  const remaining = response.headers.get('x-ratelimit-remaining');
  const limit = response.headers.get('x-ratelimit-limit');

  if (remaining !== null && limit !== null) {
    rateLimitText.textContent = `API ${remaining}/${limit}`;
  }

  if (!response.ok) {
    let message = `GitHub API returned ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // Keep the fallback message when the body is not JSON.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function fetchAllPublicRepos(username) {
  const firstPage = await requestJson(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=1`
  );

  if (firstPage.length < 100) return firstPage;

  const pages = [2, 3].map((page) =>
    requestJson(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`
    )
  );

  return firstPage.concat(...(await Promise.all(pages)));
}

function calculateSignals(repositories) {
  const languages = new Map();
  let stars = 0;
  let forks = 0;

  for (const repository of repositories) {
    stars += repository.stargazers_count || 0;
    forks += repository.forks_count || 0;
    if (repository.language) {
      languages.set(repository.language, (languages.get(repository.language) || 0) + 1);
    }
  }

  const sortedLanguages = [...languages.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6);

  return { stars, forks, languages: sortedLanguages };
}

function renderLanguages(languages) {
  languagesContainer.replaceChildren();

  if (languages.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'language-chip';
    empty.textContent = 'NO LANGUAGE DATA';
    languagesContainer.append(empty);
    return;
  }

  for (const [language, count] of languages) {
    const chip = document.createElement('span');
    chip.className = 'language-chip';
    chip.textContent = `${language.toUpperCase()} // ${count}`;
    languagesContainer.append(chip);
  }
}

function renderRepositories(repositories) {
  repositoriesContainer.replaceChildren();

  const visibleRepos = repositories
    .filter((repo) => !repo.fork)
    .slice(0, 5);

  if (visibleRepos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'bio';
    empty.textContent = 'No owned public repositories were found.';
    repositoriesContainer.append(empty);
    return;
  }

  for (const repository of visibleRepos) {
    const fragment = repositoryTemplate.content.cloneNode(true);
    const link = fragment.querySelector('.repository');
    link.href = repository.html_url;
    fragment.querySelector('h3').textContent = repository.name;
    fragment.querySelector('p').textContent = repository.description || 'No description provided.';
    fragment.querySelector('.repo-language').textContent = repository.language || '—';
    fragment.querySelector('.repo-stars').textContent = formatNumber(repository.stargazers_count);
    fragment.querySelector('.repo-updated').textContent = formatDate(repository.updated_at);
    repositoriesContainer.append(fragment);
  }
}

function buildSvg(profile, signals) {
  const displayName = truncate(profile.name || profile.login, 34);
  const login = truncate(profile.login, 34);
  const bio = truncate(profile.bio || 'PUBLIC GITHUB DEVELOPER PROFILE', 76);
  const location = truncate(profile.location || 'LOCATION UNDISCLOSED', 38);
  const languages = signals.languages.slice(0, 4).map(([language]) => language.toUpperCase()).join(' / ') || 'NO LANGUAGE SIGNAL';
  const generatedAt = new Date().toISOString().slice(0, 10);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="340" viewBox="0 0 920 340" role="img" aria-label="Terminal profile card for ${escapeXml(profile.login)}">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#03130d"/>
      <stop offset="1" stop-color="#010604"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 3.5H4" stroke="#000" stroke-opacity=".34"/>
    </pattern>
  </defs>
  <rect width="920" height="340" rx="12" fill="#010604"/>
  <rect x="1" y="1" width="918" height="338" rx="11" fill="url(#panel)" stroke="#007f4c" stroke-opacity=".7"/>
  <rect width="920" height="340" rx="12" fill="url(#scan)" opacity=".42"/>
  <path d="M0 48H920" stroke="#005d38" stroke-opacity=".7"/>
  <circle cx="24" cy="24" r="4" fill="#00e78b" opacity=".8"/>
  <circle cx="40" cy="24" r="4" fill="#00a963" opacity=".55"/>
  <circle cx="56" cy="24" r="4" fill="#007e4b" opacity=".4"/>
  <text x="78" y="29" fill="#65c99b" font-family="monospace" font-size="12" letter-spacing="2">GITTERM // PUBLIC_IDENTITY</text>
  <text x="874" y="29" text-anchor="end" fill="#478b6b" font-family="monospace" font-size="11">${generatedAt}</text>

  <text x="36" y="91" fill="#00e78b" font-family="monospace" font-size="13" letter-spacing="2">USER</text>
  <text x="36" y="129" fill="#93f3c5" font-family="monospace" font-size="29" font-weight="700" filter="url(#glow)">${escapeXml(displayName)}</text>
  <text x="36" y="155" fill="#00ad68" font-family="monospace" font-size="14">@${escapeXml(login)}</text>
  <text x="36" y="194" fill="#6ead8d" font-family="monospace" font-size="13">${escapeXml(bio)}</text>
  <text x="36" y="226" fill="#4f9674" font-family="monospace" font-size="12">${escapeXml(location)}</text>

  <path d="M36 253H884" stroke="#005d38" stroke-opacity=".62"/>
  <text x="36" y="282" fill="#53ffb5" font-family="monospace" font-size="22" font-weight="700">${formatNumber(profile.public_repos)}</text>
  <text x="36" y="306" fill="#589777" font-family="monospace" font-size="11" letter-spacing="1.5">REPOSITORIES</text>

  <text x="205" y="282" fill="#53ffb5" font-family="monospace" font-size="22" font-weight="700">${formatNumber(profile.followers)}</text>
  <text x="205" y="306" fill="#589777" font-family="monospace" font-size="11" letter-spacing="1.5">FOLLOWERS</text>

  <text x="350" y="282" fill="#53ffb5" font-family="monospace" font-size="22" font-weight="700">${formatNumber(signals.stars)}</text>
  <text x="350" y="306" fill="#589777" font-family="monospace" font-size="11" letter-spacing="1.5">TOTAL STARS</text>

  <text x="490" y="282" fill="#53ffb5" font-family="monospace" font-size="22" font-weight="700">${formatNumber(signals.forks)}</text>
  <text x="490" y="306" fill="#589777" font-family="monospace" font-size="11" letter-spacing="1.5">TOTAL FORKS</text>

  <text x="884" y="282" text-anchor="end" fill="#00c878" font-family="monospace" font-size="14">${escapeXml(languages)}</text>
  <text x="884" y="306" text-anchor="end" fill="#589777" font-family="monospace" font-size="11" letter-spacing="1.5">LANGUAGE SIGNAL</text>

  <rect x="877" y="78" width="7" height="7" fill="#00e78b" filter="url(#glow)">
    <animate attributeName="opacity" values="1;.15;1" dur="1.4s" repeatCount="indefinite"/>
  </rect>
</svg>`;
}

function renderProfile(profile, repositories, signals) {
  elements.avatar.src = profile.avatar_url;
  elements.avatar.alt = `${profile.login} avatar`;
  elements.login.textContent = `@${profile.login}`;
  elements.name.textContent = profile.name || profile.login;
  elements.bio.textContent = profile.bio || 'No public biography provided.';
  elements.profileLink.href = profile.html_url;
  elements.location.textContent = profile.location || '—';
  elements.joined.textContent = formatDate(profile.created_at);
  elements.company.textContent = profile.company || '—';

  const website = normalizeWebsite(profile.blog);
  if (website) {
    elements.website.replaceChildren();
    const link = document.createElement('a');
    link.href = website;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = truncate(profile.blog, 34);
    elements.website.append(link);
  } else {
    elements.website.textContent = '—';
  }

  elements.repoCount.textContent = formatNumber(profile.public_repos);
  elements.followers.textContent = formatNumber(profile.followers);
  elements.stars.textContent = formatNumber(signals.stars);
  elements.forks.textContent = formatNumber(signals.forks);

  renderLanguages(signals.languages);
  renderRepositories(repositories);

  currentSvg = buildSvg(profile, signals);
  currentUsername = profile.login;
  cardPreview.innerHTML = currentSvg;
  resultSection.hidden = false;
}

async function analyze(username) {
  const normalized = username.trim();
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(normalized)) {
    throw new Error('Enter a valid GitHub username.');
  }

  submitButton.disabled = true;
  setStatus(`CONNECTING // ${normalized.toUpperCase()}`);

  try {
    const [profile, repositories] = await Promise.all([
      requestJson(`https://api.github.com/users/${encodeURIComponent(normalized)}`),
      fetchAllPublicRepos(normalized),
    ]);

    const signals = calculateSignals(repositories);
    renderProfile(profile, repositories, signals);
    setStatus(`COMPLETE // ${profile.login.toUpperCase()} // ${repositories.length} REPOSITORIES INDEXED`);
  } catch (error) {
    console.error(error);
    resultSection.hidden = true;
    const message = error.status === 404
      ? 'PROFILE NOT FOUND'
      : error.status === 403 || error.status === 429
        ? 'API RATE LIMIT REACHED // TRY AGAIN LATER'
        : `ERROR // ${String(error.message || 'UNKNOWN FAILURE').toUpperCase()}`;
    setStatus(message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  analyze(usernameInput.value);
});

downloadButton.addEventListener('click', () => {
  if (!currentSvg) return;
  const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentUsername || 'github'}-terminal-card.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`EXPORTED // ${currentUsername.toUpperCase()}-TERMINAL-CARD.SVG`);
});

copyButton.addEventListener('click', async () => {
  if (!currentSvg) return;
  try {
    await navigator.clipboard.writeText(currentSvg);
    setStatus('SVG SOURCE COPIED TO CLIPBOARD');
  } catch {
    setStatus('CLIPBOARD ACCESS DENIED', 'error');
  }
});

analyze(usernameInput.value);
