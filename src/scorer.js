// Cheap pre-filter so we don't send junk to Claude. Ranks by engagement
// and recency so the LLM only has to reason over the strongest signals.

function scorePost(post) {
  const ageHours = (Date.now() / 1000 - post.createdUtc) / 3600;
  const recencyBoost = Math.max(0, 1 - ageHours / (24 * 7)); // decays over a week
  const engagement = (post.score || 0) + (post.numComments || 0) * 2;
  return engagement * (0.5 + recencyBoost);
}

function rankAndTrim(posts, topN = 40) {
  return posts
    .map(p => ({ ...p, rank: scorePost(p) }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, topN);
}

module.exports = { rankAndTrim };
