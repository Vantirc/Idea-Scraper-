// Hacker News via the free, no-auth Algolia HN Search API.
// Good source for "Ask HN" pain-point threads and "Show HN" launches
// (launches show you what people are already building — useful for gap analysis).

async function fetchHN(query, tag, hitsPerPage = 30) {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=${tag}&hitsPerPage=${hitsPerPage}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`HN fetch failed for query "${query}": ${res.status}`);
    return [];
  }
  const json = await res.json();
  return (json.hits || []).map(h => ({
    source: 'hackernews',
    title: h.title || h.story_title || '',
    text: h.comment_text || '',
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    score: h.points || 0,
    numComments: h.num_comments || 0,
    createdUtc: new Date(h.created_at).getTime() / 1000
  }));
}

async function getHNIdeaPosts() {
  const askHN = await fetchHN('', 'ask_hn', 40);
  const showHN = await fetchHN('', 'show_hn', 40);
  return [...askHN, ...showHN];
}

module.exports = { getHNIdeaPosts };
