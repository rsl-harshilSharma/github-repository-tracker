const API_BASE = "https://api.github.com";
const REFRESH_INTERVAL_MS = 60_000;

const form = document.querySelector("#search-form");
const usernameInput = document.querySelector("#username");
const submitButton = form.querySelector("button");
const statusMessage = document.querySelector("#status");
const results = document.querySelector("#results");

let refreshTimer;
let activeRequest = false;

function setStatus(message, state = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}

async function fetchJson(url) {
  let response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  if (response.status === 404) {
    throw new Error("That GitHub username was not found.");
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub API rate limit reached. Please try again later.");
  }
  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status}). Please try again.`);
  }

  return response.json();
}

async function fetchRepositories(username) {
  const repositories = [];
  let page = 1;

  while (true) {
    const pageRepositories = await fetchJson(
      `${API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}`,
    );
    repositories.push(...pageRepositories);

    if (pageRepositories.length < 100) {
      return repositories;
    }
    page += 1;
  }
}

async function fetchTrackerData(username) {
  const [owner, repositories] = await Promise.all([
    fetchJson(`${API_BASE}/users/${encodeURIComponent(username)}`),
    fetchRepositories(username),
  ]);

  return { owner, repositories };
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderOwner(owner) {
  const section = createElement("section", "owner");
  const avatar = createElement("img", "avatar");
  avatar.src = owner.avatar_url;
  avatar.alt = `${owner.login}'s avatar`;

  const details = createElement("div", "owner-details");
  details.append(
    createElement("h2", "", owner.name || owner.login),
    createElement("p", "", `@${owner.login}`),
  );

  if (owner.bio) details.append(createElement("p", "", owner.bio));

  const stats = [
    `${owner.public_repos} public repositories`,
    `${owner.followers} followers`,
    `${owner.following} following`,
  ];
  details.append(createElement("p", "", stats.join(" · ")));

  if (owner.location) details.append(createElement("p", "", owner.location));

  const profileLink = createElement("a", "", "View GitHub profile");
  profileLink.href = owner.html_url;
  profileLink.target = "_blank";
  profileLink.rel = "noopener noreferrer";
  details.append(profileLink);
  section.append(avatar, details);
  return section;
}

function renderRepository(repository) {
  const article = createElement("article", "repo");
  const link = createElement("a", "repo-name", repository.name);
  link.href = repository.html_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const description = createElement(
    "p",
    "repo-description",
    repository.description || "No description provided.",
  );
  const metadata = [
    repository.language || "Language not specified",
    `${repository.stargazers_count} stars`,
    `${repository.forks_count} forks`,
    `Updated ${new Date(repository.updated_at).toLocaleDateString()}`,
  ];
  article.append(link, description, createElement("div", "repo-meta", metadata.join(" · ")));
  return article;
}

function renderResults(owner, repositories) {
  const heading = createElement("div", "repo-heading");
  heading.append(
    createElement("h2", "", "Public repositories"),
    createElement("span", "", `${repositories.length} total`),
  );

  const list = createElement("div", "repositories");
  repositories.forEach((repository) => list.append(renderRepository(repository)));
  results.replaceChildren(renderOwner(owner), heading, list);
}

async function refresh(username) {
  if (activeRequest) return;

  activeRequest = true;
  submitButton.disabled = true;
  setStatus(`Fetching the latest data for @${username}…`);

  try {
    const { owner, repositories } = await fetchTrackerData(username);
    renderResults(owner, repositories);
    const refreshedAt = new Date().toLocaleTimeString();
    if (repositories.length === 0) {
      setStatus(`@${username} has no public repositories. Last checked at ${refreshedAt}.`);
    } else {
      setStatus(`Showing the latest data for @${username}. Last refreshed at ${refreshedAt}.`);
    }
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    activeRequest = false;
    submitButton.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) {
    setStatus("Enter a GitHub username to get started.", "error");
    return;
  }

  window.clearInterval(refreshTimer);
  await refresh(username);
  refreshTimer = window.setInterval(() => refresh(username), REFRESH_INTERVAL_MS);
});
