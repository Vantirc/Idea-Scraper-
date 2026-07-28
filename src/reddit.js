// Pulls posts from target subreddits using Reddit's public JSON endpoints.
// No auth needed for read-only public listings, but Reddit rate-limits by
// User-Agent, so keep it descriptive and unique to you.

const SUBREDDITS = [
  'Entrepreneur',
  'SaaS',
  'smallbusiness',
  'sidehustle',
  'startups',
  'freelance'
];

const PAIN_SIGNALS = [
  'wish there was',
  'is there a tool',
  'is there an app',
  'does anyone know a way to',
  'i hate that',
  'so annoying that',
  'anyone else struggle with',
  'looking for a tool',
  'i built a',
  'i made a',
  'need a better way to'
];

async function fetchSubreddit(sub, limit = 50) {
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'idea-scraper/1.0 (by u/your-username)' }
  });
  if (!res.ok) {
    console.error(`Reddit fetch failed for r/${sub}: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return (json.data?.children || []).map(c => ({
    source: 'reddit',
    subreddit: sub,
    title: c.data.title,
    text: c.data.selftext || '',
    url: `https://reddit.com${c.data.permalink}`,
    score: c.data.score,
    numComments: c.data.num_comments,
    createdUtc: c.data.created_utc
  }));
}

function hasPainSignal(post) {
  const haystack = `${post.title} ${post.text}`.toLowerCase();
  return PAIN_SIGNALS.some(sig => haystack.includes(sig));
}

async function getRedditIdeaPosts() {
  const all = [];
  for (const sub of SUBREDDITS) {
    const posts = await fetchSubreddit(sub);
    all.push(...posts);
    // gentle delay to stay well under rate limits
    await new Promise(r => setTimeout(r, 800));
  }
  return all.filter(hasPainSignal);
}

module.exports = { getRedditIdeaPosts, SUBREDDITS, PAIN_SIGNALS };
