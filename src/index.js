require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getRedditIdeaPosts } = require('./reddit');
const { getHNIdeaPosts } = require('./hn');
const { rankAndTrim } = require('./scorer');
const { generateReport } = require('./report');

async function main() {
  console.log('Fetching Reddit...');
  const redditPosts = await getRedditIdeaPosts();
  console.log(`  -> ${redditPosts.length} pain-signal posts`);

  console.log('Fetching Hacker News...');
  const hnPosts = await getHNIdeaPosts();
  console.log(`  -> ${hnPosts.length} posts`);

  const allPosts = [...redditPosts, ...hnPosts];
  const topPosts = rankAndTrim(allPosts, 40);

  if (topPosts.length === 0) {
    console.log('No posts found. Exiting.');
    return;
  }

  console.log(`Sending ${topPosts.length} top posts to Claude for clustering...`);
  const report = await generateReport(topPosts);

  const date = new Date().toISOString().slice(0, 10);

  // Save locally
  const outDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, `idea-report-${date}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`\nReport saved to ${outPath}\n`);

  // Save into docs/ for the shared dashboard (GitHub Pages serves this folder)
  const docsReportsDir = path.join(__dirname, '..', 'docs', 'reports');
  if (!fs.existsSync(docsReportsDir)) fs.mkdirSync(docsReportsDir, { recursive: true });
  const docsReportPath = path.join(docsReportsDir, `${date}.md`);
  fs.writeFileSync(docsReportPath, report);

  const manifestPath = path.join(docsReportsDir, 'manifest.json');
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : [];
  if (!manifest.find(m => m.date === date)) {
    manifest.unshift({ date, file: `${date}.md` });
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Push to Make.com webhook if configured
  if (process.env.MAKE_WEBHOOK_URL) {
    try {
      await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, report })
      });
      console.log('Posted report to Make.com webhook.');
    } catch (err) {
      console.error('Make.com webhook failed:', err.message);
    }
  }

  console.log(report);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
