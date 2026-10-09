# GitHub Repository Tracker

A dependency-free browser app for the Asynchronous JavaScript assignment. It
uses the GitHub REST API to show a user's public profile and all public
repositories, then refreshes the data every 60 seconds.

## Run locally

Open `index.html` in a browser, enter a GitHub username, and select **Find
repositories**. No build step or API token is required for public data.

## Assignment requirements

- Fetches public repositories, including pagination beyond the first 100.
- Fetches owner profile details asynchronously alongside the repository list.
- Uses `async`/`await`, `Promise.all`, `fetch`, and `try...catch`.
- Refreshes the selected user's profile and repositories every 60 seconds.
- Handles unknown usernames, network/API errors, and users with no public repos.
- Renders API-provided text with DOM text nodes rather than injecting HTML.

GitHub's unauthenticated API has rate limits. If the limit is reached, the app
displays a message and can retry on the next refresh.

## Submission

The included `screen recording.mov` demonstrates the application. Push this
local repository to GitHub to create a pull request, then include the PR URL
and recording in the assignment submission/status email.
