// 공식 RSS에서 학교 소식을 모아 assets/data/feed.json 에 저장한다.
// 제목·날짜·링크만 저장한다 (기사 본문은 저장하지 않음).
// 실행: node tools/news-sync.mjs   (GitHub Actions 가 매일 실행)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/data/feed.json');

// 새 공식 RSS 를 찾으면 여기에 한 줄 추가한다. match: 제목 필터 (없으면 전부)
const FEEDS = [
  { school_id: 'cau', source_name: '중앙대 경영전문대학원 총동문회', url: 'https://www.cau-mba.com/blog-feed.xml' },
  { school_id: 'konkuk', source_name: '건국대 소식', url: 'https://www.konkuk.ac.kr/bbs/konkuk/257/rssList.do?row=50', match: /경영전문대학원|MBA|경영대학|총동문회/ },
];

const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]) : ''; };

const items = [];
for (const f of FEEDS) {
  try {
    const res = await fetch(f.url, { headers: { 'user-agent': 'MBA-Lounge-news-sync (+https://728haven-oss.github.io/mba-lounge/)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = await res.text();
    const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
    let n = 0;
    for (const b of blocks) {
      const title = tag(b, 'title').replace(/<[^>]+>/g, '');
      let link = tag(b, 'link');
      if (link.startsWith('http://')) link = 'https://' + link.slice(7);
      const d = new Date(tag(b, 'pubDate') || tag(b, 'dc:date'));
      if (!title || !/^https:\/\//.test(link)) continue;
      if (f.match && !f.match.test(title)) continue;
      items.push({ school_id: f.school_id, source_name: f.source_name, title: title.slice(0, 160), url: link, date: isNaN(d) ? '' : d.toISOString().slice(0, 10) });
      if (++n >= 10) break;
    }
    console.log(f.school_id, n, 'items');
  } catch (e) {
    console.warn('skip', f.url, e.message);
  }
}
items.sort((a, b) => b.date.localeCompare(a.date));
let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
if (!items.length && prev) { console.log('no items fetched; keeping previous feed'); process.exit(0); }
if (prev && JSON.stringify(prev.items) === JSON.stringify(items)) { console.log('unchanged'); process.exit(0); }
fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), items }, null, 1));
console.log('wrote', items.length);
