# Idea Scraper

Scrapes Reddit + Hacker News for pain-point/idea signals, ranks by engagement, and sends the top posts to Claude to cluster into a ranked business-idea report.

## Setup (5 min)

```bash
npm install
cp .env.example .env
# paste your Anthropic API key into .env
npm start
```

Report saves to `reports/idea-report-YYYY-MM-DD.md` and prints to console.

## What it covers now

- Reddit: r/Entrepreneur, r/SaaS, r/smallbusiness, r/sidehustle, r/startups, r/freelance (edit list in `src/reddit.js`)
- Hacker News: Ask HN + Show HN threads
- Filters Reddit posts for pain-signal phrases ("wish there was", "is there a tool", etc.)
- Claude clusters posts into ranked ideas with evidence strength + who'd pay

## Making it run 24/7

It's just a script — nothing runs it automatically until you schedule it. Two easy options:

**Option A: GitHub Actions (free, recommended to start)**
Push this repo to GitHub, add `ANTHROPIC_API_KEY` as a repo secret, then add `.github/workflows/daily.yml`:

```yaml
name: Daily Idea Report
on:
  schedule:
    - cron: '0 7 * * *'  # 7am UTC daily
  workflow_dispatch: {}
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
      - run: npm start
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: idea-report
          path: reports/*.md
```
This runs daily for free, no server needed. Add a step at the end to push the report to Slack/email (see below) instead of just uploading it as an artifact.

**Option B: Small always-on box**
Railway/Render free-to-cheap tier + a cron trigger inside the app if you want it closer to real-time or want to add more sources later (Twitter/X, more forums).

## Getting it reported to you (Make.com)

`src/index.js` now posts `{ date, report }` as JSON to `process.env.MAKE_WEBHOOK_URL` after every run, if it's set.

1. In Make.com, create a scenario starting with a **Custom Webhook** trigger — copy the URL it gives you.
2. Add that URL as a GitHub repo secret named `MAKE_WEBHOOK_URL` (Settings → Secrets and variables → Actions).
3. Locally, add it to `.env` too if you want to test with `npm start`.
4. From there, route it in Make however you want — Slack message, email, Notion page, whatever.

## Shared dashboard for you + Amit

`docs/index.html` is a lightweight dashboard: teal/purple themed, sidebar of report dates, click one to read it. It reads from `docs/reports/manifest.json`, which the script now updates automatically every run.

**To go live (GitHub Pages, free):**
1. Push this repo to GitHub.
2. Repo → Settings → Pages → Source: "Deploy from a branch" → branch `main`, folder `/docs`.
3. GitHub gives you a URL like `https://yourname.github.io/idea-scraper/` — send that to Amit, no login needed.
4. The daily GitHub Action already commits new reports into `docs/`, so the dashboard updates itself each morning.

If you'd rather host it on Netlify (since you already use it for Rentoor), same idea — just point Netlify at the `docs` folder instead of GitHub Pages, and change the workflow's commit step to a Netlify deploy hook instead. Say the word if you want that version instead.
