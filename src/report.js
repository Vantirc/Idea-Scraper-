const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(posts) {
  const trimmed = posts.map(p => ({
    source: p.source,
    title: p.title,
    excerpt: (p.text || '').slice(0, 300),
    url: p.url,
    engagement: Math.round(p.score + p.numComments)
  }));

  return `You are analyzing raw posts scraped from Reddit and Hacker News to find validated business ideas — recurring pain points, unmet needs, or "wish there was a tool for X" signals.

Here is the raw data (JSON):
${JSON.stringify(trimmed, null, 2)}

Do the following:
1. Cluster posts that point to the same underlying problem or idea.
2. Drop anything that's not a real business opportunity (venting, off-topic, one-off noise).
3. For each surviving cluster, output:
   - Idea name (short)
   - The pain point in one sentence
   - Evidence strength (how many posts, total engagement, how specific the ask was)
   - A rough "who'd pay for this" guess
   - Source links

Rank clusters by evidence strength, strongest first. Output as clean markdown, ready to read on a phone. Max 8 clusters. If fewer than 3 have real evidence, say so honestly rather than padding it out.`;
}

async function generateReport(posts) {
  const prompt = buildPrompt(posts);
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

module.exports = { generateReport };
