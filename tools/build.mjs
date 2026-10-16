// MBA Lounge 홈페이지 생성기
// 실행: node tools/build.mjs   (assets/data/schools.json → 정적 HTML)
// 학교 정보가 바뀌면 schools.json 만 고치고 다시 실행하면 된다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/schools.json'), 'utf8'));
const S = DATA.schools;
const CHECKED = DATA.checked.replace(/-/g, '.');
const SITE = 'https://728haven-oss.github.io/mba-lounge/';
const CONTACT = '728haven@gmail.com';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https?:\/\//.test(u || '') ? u : null);
const write = (rel, html) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const TYPES = ['주간 풀타임', '야간·주말', 'Executive', '영어 과정', '특화 과정'];

/* ---------- 앱 기능 ---------- */
const FEATURES = [
  { id: 'board', name: 'BZ 게시판', icon: 'M4 5h16v11H8l-4 4z', shot: 'shot_2_board.png',
    lead: '사업제휴, 투자, 채용, 정보공유, 원우 인터뷰. 원우끼리 일 이야기를 나누는 게시판입니다.',
    points: [['분류별 게시판', '사업제휴·투자·채용·정보공유·원우 인터뷰로 나뉘어 필요한 글만 골라 봅니다.'],
      ['학교 게시판과 전국 게시판', '우리 학교 원우끼리, 또는 10개 학교 원우 전체와 소통합니다.'],
      ['댓글과 좋아요', '글마다 댓글로 대화를 이어가고 좋아요로 반응합니다.'],
      ['신고와 차단', '부적절한 글은 신고하고, 원치 않는 사용자는 차단해 보이지 않게 합니다.']] },
  { id: 'meets', name: '만남 · 미팅', icon: 'M7 3v3M17 3v3M4 8h16v12H4z', shot: 'shot_3_schedule.png',
    lead: '골프 라운딩, 신입 환영 디너, 업종별 조찬회. 원우 모임을 열고 참석을 신청합니다.',
    points: [['모임 개설', '날짜·장소·정원·소개를 적어 누구나 모임을 엽니다.'],
      ['참석 신청', '참석 버튼 하나로 신청하고, 현재 인원과 남은 자리를 바로 확인합니다.'],
      ['학교별 일정', '우리 학교 모임이 먼저 보이고, 다른 학교 모임도 함께 둘러봅니다.']] },
  { id: 'notices', name: '공지', icon: 'M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 0 1 0 6', shot: null,
    lead: '학교, 동아리, 전국 공지를 한곳에 모았습니다. 행정실 안내와 동아리 소식을 놓치지 않습니다.',
    points: [['출처별 정리', '학교·동아리·전국 공지가 출처와 함께 표시됩니다.'],
      ['임원·관리자 작성', '공지는 임원과 학교 관리자가 올리므로 공식 안내만 모입니다.']] },
  { id: 'jokbo', name: '족보', icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', shot: null,
    lead: '수업별로 원우들이 기록을 이어 씁니다. 과목 정보와 수업 만족도를 다음 기수에게 남깁니다.',
    points: [['수업별 기록', '과목과 교수별로 방이 만들어지고, 원우들이 꼬리에 꼬리를 물고 기록을 더합니다.'],
      ['별점', '수업 만족도를 별점으로 남겨 수강 신청 때 참고합니다.'],
      ['우리 학교 전용', '족보는 같은 학교 승인 회원에게만 보입니다.']] },
  { id: 'clubs', name: '동아리', icon: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6M2 20c0-3 3-5 6-5s6 2 6 5M14 15c3 0 6 2 6 5', shot: null,
    lead: '우리 학교 동아리와 10개 학교 연합 동아리. 가입하면 동아리방에서 소식과 회비를 관리합니다.',
    points: [['학교·연합 동아리', '골프, 축구, 와인, 재테크 스터디처럼 우리 학교 동아리와 전체 MBA 연합 동아리로 나뉩니다.'],
      ['가입 신청과 승인', '동아리장이 가입 신청을 승인하고, 새 동아리 개설은 임원이 승인합니다.'],
      ['동아리방', '동아리 공지·게시판과 회비 입출금 장부를 함께 씁니다.']] },
  { id: 'directory', name: '원우수첩', icon: 'M4 5h16v14H4zM9 10a2 2 0 1 0 0-.01M6 16c.5-2 5.5-2 6 0M14 9h4M14 13h4', shot: null,
    lead: '원우 프로필을 찾아보고 연락처를 교환합니다. 무엇이 보일지는 각자 정합니다.',
    points: [['원우 찾기', '회사·직함·한 줄 소개·경력·소속 동아리로 원우를 찾습니다.'],
      ['공개 범위', '전체 공개, 기본, 최소 중에서 내 정보가 어디까지 보일지 고릅니다.'],
      ['연락처 교환', '서로 교환한 원우에게만 연락처가 열립니다.']] },
  { id: 'officers', name: '임원방', icon: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z', shot: null,
    lead: '원우회 임원진이 소통하고 운영하는 공간입니다. 공지, 동아리 승인, 가입 승인이 여기서 이뤄집니다.',
    points: [['임원 전용', '회장·총무·학술부장 같은 임원과 학교 관리자만 들어옵니다.'],
      ['운영 업무', '공지 작성, 동아리 개설 승인, 임원 임명을 처리합니다.'],
      ['가입 승인', '학교 관리자가 새 원우의 학번과 기수를 확인하고 커뮤니티 가입을 승인합니다.']] },
];
const svg = (d, n = 20) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

/* ---------- 공통 레이아웃 ---------- */
function layout({ title, desc, body, page, root = '', active = '', school = null, path: p = '' }) {
  const nav = [['schools/index.html', '학교별 MBA', 'schools'], ['board.html', '공개 게시판', 'board'], ['app/index.html', '앱 기능', 'app'], ['stories.html', '원우 이야기', 'stories']];
  const sc = school ? ` style="--sc:${school.color};--sc-soft:${school.soft}"` : '';
  return `<!DOCTYPE html>
<html lang="ko" data-root="${root}"${sc}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="Dmxg0WO43QErrMX-Z0xx4QbJuQfgyax34Z1eTFJ0mV4">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${school ? school.color : '#6C5CE7'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MBA Lounge">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${p}">
<link rel="canonical" href="${SITE}${p}">
<link rel="icon" type="image/png" href="${root}icon.png">
<link rel="manifest" href="${root}manifest.json">
<link rel="stylesheet" href="${root}assets/site.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js" defer></script>
<script src="${root}assets/site.js" defer></script>
</head>
<body data-page="${page}"${school ? ` data-school="${school.id}"` : ''}>
<a class="sr" href="#main">본문으로 건너뛰기</a>
<header class="top"><div class="wrap">
  <a class="logo" href="${root}index.html"><img src="${root}icon-192.png" alt="">MBA Lounge</a>
  <button class="menu-btn" aria-expanded="false" aria-controls="nav">메뉴</button>
  <nav class="nav" id="nav" aria-label="주 메뉴">${nav.map(([h, t, k]) => `<a href="${root}${h}"${active === k ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <div class="who" id="who"></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot"><div class="wrap">
  <div><b style="color:var(--ink)">MBA Lounge</b><br>10개 학교 MBA 재학생·동문 커뮤니티</div>
  <div><a href="${root}privacy.html">개인정보처리방침</a><a href="${root}child-safety.html">커뮤니티 안전 정책</a><a href="${root}delete-account.html">계정 삭제</a><a href="mailto:${CONTACT}?subject=MBA%20Lounge%20문의">문의</a></div>
</div>
<div class="wrap biz"><p>상호 컨범파트너스 · 대표 김재성 · 사업자등록번호 762-67-00440 · 통신판매업신고 2026-서울구로-1720<br>서울특별시 구로구 구로중앙로 198, B동 13층 103호·203호 (구로동) · 이메일 ${CONTACT}<br>© 2026 MBA Lounge. All rights reserved.</p></div></footer>
</body>
</html>
`;
}

/* ---------- 조각 ---------- */
const dlRow = (s, d, root) => `<a class="dl" href="${root}schools/${s.id}.html#apply" data-start="${d.start}" data-end="${d.end}" style="--c:${s.color}">
  <span class="who-s"><span class="dot"></span>${esc(s.short)}</span>
  <span><span class="what">${esc(d.label)}</span><br><span class="when">${d.start === d.end ? esc(d.end.slice(5).replace('-', '.')) + ' 마감' : esc(d.start.slice(5).replace('-', '.')) + ' – ' + esc(d.end.slice(5).replace('-', '.'))}</span></span>
  <span class="state soon">예정</span></a>`;
const allDeadlines = () => S.flatMap(s => s.deadlines.map(d => [s, d])).sort((a, b) => a[1].end.localeCompare(b[1].end));
const typeCount = s => Object.fromEntries(TYPES.map(t => [t, s.programs.filter(p => p.type_ko === t).length]));

/* ---------- 홈 ---------- */
function home() {
  const body = `
<section class="hero"><div class="wrap">
  <h1 class="h-xl">열 개의 MBA,<br>하나의 라운지</h1>
  <p class="lead">연세·서울대·KAIST·고려·서강·한양·이화·중앙·건국·성균관. 열 개 학교 MBA의 과정과 입학 방법을 한곳에서 비교하고, 같은 학교 원우들과 라운지에서 만나세요.</p>
  <div class="hero-cta"><a class="btn" href="join.html">가입하고 학교 등록하기</a><a class="btn ghost" href="schools/index.html">학교별 MBA 비교</a></div>
  <nav class="spectrum" aria-label="학교별 MBA 페이지">
    ${S.map(s => `<a href="schools/${s.id}.html" style="--c:${s.color}"><span class="s-short">${esc(s.short)}</span><span class="s-meta">MBA 과정 ${s.programs.length}개</span></a>`).join('\n    ')}
  </nav>
</div></section>

<section class="blk"><div class="wrap">
  <div class="blk-head"><div><h2 class="h-l">2027년 입학, 원서 일정</h2><p>각 학교 공식 모집요강 기준입니다. 접수 중인 곳이 위에 옵니다. (${CHECKED} 확인)</p></div><a class="btn ghost sm" href="schools/index.html#calendar">전체 일정 보기</a></div>
  <div class="dl-list" id="dl-home">${allDeadlines().map(([s, d]) => dlRow(s, d, '')).join('')}</div>
</div></section>

<section class="blk alt"><div class="wrap grid g2" style="gap:48px">
  <div>
    <h2 class="h-l">라운지에 들어오는 방법</h2>
    <p class="muted" style="margin-top:8px">가입과 학교 등록은 바로 끝납니다. 학교 커뮤니티는 같은 학교 원우만 들어오도록 학교 관리자가 확인합니다.</p>
    <ol class="f-points">
      <li><b>1. 가입하고 학교를 고릅니다</b><span>학번, 이름, 기수, 비밀번호만 있으면 됩니다. 가입하자마자 공개 게시판에 글을 쓸 수 있습니다.</span></li>
      <li><b>2. 학교 관리자가 승인합니다</b><span>학번과 기수를 확인한 뒤 승인합니다. 진행 상황은 내 라운지에서 볼 수 있습니다.</span></li>
      <li><b>3. 학교 커뮤니티에 들어갑니다</b><span>BZ 게시판, 족보, 동아리, 원우수첩을 앱과 웹에서 씁니다.</span></li>
    </ol>
    <a class="btn" href="join.html" style="margin-top:22px">가입하기</a>
  </div>
  <div>
    <div class="blk-head" style="margin-bottom:8px"><h2 class="h-m">공개 게시판 최신 글</h2><a class="small" href="board.html">전체 보기</a></div>
    <p class="muted small">입학 상담, 학교 생활, 모임 소식을 누구나 읽을 수 있는 게시판입니다.</p>
    <div id="latest" style="margin-top:6px"><div class="empty">불러오는 중…</div></div>
  </div>
</div></section>

<section class="blk"><div class="wrap">
  <div class="blk-head"><div><h2 class="h-l">앱에서 하는 일</h2><p>승인된 원우는 앱과 웹에서 같은 계정으로 학교 커뮤니티를 이용합니다.</p></div><a class="btn ghost sm" href="app-web.html">웹에서 앱 열기</a></div>
  <div class="grid g3">${FEATURES.map(f => `<a class="feat" href="app/${f.id}.html"><span class="ic">${svg(f.icon)}</span><h3>${esc(f.name)}</h3><p>${esc(f.lead)}</p></a>`).join('')}</div>
</div></section>

<section class="blk alt"><div class="wrap">
  <a class="story" href="stories.html">
    <img src="hunter/01/p-01.jpg" alt="연세 헌터 No.01 표지" loading="lazy" width="220" height="311">
    <div><p class="muted small">원우 이야기 · 연세 헌터 No.01</p><h2 class="h-l" style="margin-top:6px">졸업, 그 후 10년</h2>
    <p class="muted" style="margin-top:10px;max-width:560px">MBA 96기 원우들이 졸업 후 걸어온 길을 한 사람씩 따라갑니다. 첫 번째 이야기는 건축학도에서 부동산 금융으로 길을 바꾼 김성집 원우입니다.</p>
    <span class="btn ghost sm" style="margin-top:16px">이야기 읽기</span></div>
  </a>
</div></section>`;
  write('index.html', layout({ title: 'MBA Lounge | 10개 학교 MBA 정보와 원우 커뮤니티', desc: '연세·서울대·KAIST·고려·서강·한양·이화·중앙·건국·성균관 MBA 과정과 입학 정보를 비교하고, 같은 학교 원우들과 커뮤니티에서 만나세요.', body, page: 'home', active: '' }));
}

/* ---------- 금액·비교 도우미 ---------- */
const won = n => (n == null ? '–' : n.toLocaleString('ko-KR') + '원');
const man = n => (n == null ? '–' : '약 ' + Math.round(n / 10000).toLocaleString('ko-KR') + '만원');
const costKind = name => /Executive|EMBA/i.test(name) ? 'exec' : /Full-time|Full-Time|KMBA|Global|S-MBA|Impact|(?<!디지털)금융MBA|MFE|G-MBA/i.test(name) ? 'day' : 'night';
const KIND_LABEL = { night: '야간·주말·특화 MBA', exec: 'Executive MBA', day: '주간·영어 MBA' };
const reqOf = (s, k) => (s.guide.req.find(r => r.k === k) || {}).v || '–';

/* 가로 막대: 단일 계열(브랜드 색), 값은 막대 옆에 직접 표기, title 로 호버 설명 */
function bars(rows, root) {
  const max = Math.max(...rows.map(r => r.value));
  return `<div class="bars" role="table">${rows.map(r => `<a class="bar-row" role="row" href="${root}schools/${r.s.id}.html#cost" title="${esc(r.s.short + ' ' + r.label + ': 졸업까지 ' + man(r.value) + ' (입학금 포함, ' + r.year + '년 기준)')}">
    <span class="bar-name" role="cell"><b>${esc(r.s.short)}</b> ${esc(r.label)}</span>
    <span class="bar-track" role="cell"><span class="bar-fill" style="width:${(r.value / max * 100).toFixed(1)}%"></span></span>
    <span class="bar-val" role="cell">${esc(man(r.value))}</span></a>`).join('')}</div>`;
}

/* ---------- 학교 목록·비교 ---------- */
function schoolsIndex() {
  const root = '../';
  const costRows = S.flatMap(s => s.guide.cost.filter(c => c.all_in).map(c => ({ s, label: c.program, value: c.all_in, year: c.year, kind: costKind(c.program) })));
  const costSection = ['night', 'exec', 'day'].map(k => {
    const rows = costRows.filter(r => r.kind === k).sort((a, b) => a.value - b.value);
    return rows.length ? `<h3 class="h-m" style="margin:34px 0 12px">${KIND_LABEL[k]}</h3>${bars(rows, root)}` : '';
  }).join('');
  const facMax = Math.max(...S.map(s => s.faculty.count));
  const body = `
<section class="blk tight"><div class="wrap">
  <h1 class="h-l">학교별 MBA 비교</h1>
  <p class="lead" style="margin-top:10px">입학 시기, 지원 방법, 졸업까지 드는 비용, 교수진을 열 개 학교 나란히 놓고 봅니다. 학교 이름을 누르면 상세 페이지로 갑니다.</p>
  <nav class="f-nav" style="margin-top:20px" aria-label="비교 항목"><a class="chip" href="#cmp-when" style="text-decoration:none">입학 시기·방법</a><a class="chip" href="#calendar" style="text-decoration:none">원서 일정</a><a class="chip" href="#cmp-cost" style="text-decoration:none">금액</a><a class="chip" href="#cmp-faculty" style="text-decoration:none">교수진</a><a class="chip" href="#cmp-programs" style="text-decoration:none">과정 구성</a></nav>
</div></section>

<section class="blk tight" id="cmp-when" style="padding-top:0"><div class="wrap">
  <h2 class="h-l" style="margin-bottom:6px">입학 시기와 방법</h2>
  <p class="muted" style="margin-bottom:18px">대표 과정 기준 요약입니다. 과정마다 다른 부분은 학교 페이지에 나눠 적었습니다.</p>
  <div class="tbl-scroll"><table class="prog-table cmp">
    <thead><tr><th>학교</th><th>입학 시기</th><th>2027년 입학 원서</th><th>경력 요건</th><th>영어</th><th>선발</th></tr></thead>
    <tbody>${S.map(s => `<tr style="--sc:${s.color}">
      <td><a href="${s.id}.html" class="sname"><span class="sq" style="background:${s.color}"></span>${esc(s.name)}</a><div class="small muted" style="font-weight:500;margin-top:4px">${esc(s.guide.tagline)}</div></td>
      <td data-k="입학 시기">${s.guide.intake.map(i => `<div><b>${esc(i.start)}</b> <span class="small muted">${esc(i.program)}</span></div>`).join('')}</td>
      <td data-k="2027년 입학 원서">${s.guide.intake.map(i => `<div class="small">${esc(i.apply)}</div>`).join('')}</td>
      <td data-k="경력 요건" class="small">${esc(reqOf(s, '경력'))}</td>
      <td data-k="영어" class="small">${esc(reqOf(s, '영어'))}</td>
      <td data-k="선발" class="small">${esc(reqOf(s, '선발'))}${s.guide.req.find(r => r.k === '전형료') ? `<div class="muted">전형료 ${esc(reqOf(s, '전형료'))}</div>` : ''}</td>
    </tr>`).join('')}</tbody>
  </table></div>
</div></section>

<section class="blk alt" id="calendar"><div class="wrap">
  <h2 class="h-l">2027년 입학 원서 일정</h2>
  <p class="muted" style="margin-top:6px">접수 중인 곳이 먼저, 그다음 마감이 가까운 순서입니다. 건국대는 2027학년도 전기 요강이 아직 게시되지 않았습니다. (${CHECKED} 확인)</p>
  <div class="dl-list" style="margin-top:20px">${allDeadlines().map(([s, d]) => dlRow(s, d, root)).join('')}</div>
</div></section>

<section class="blk" id="cmp-cost"><div class="wrap">
  <h2 class="h-l">졸업까지 드는 금액</h2>
  <p class="muted" style="margin-top:6px">학기당 등록금 × 학기 수 + 입학금입니다. 학교가 발표한 최신 등록금(대부분 2026학년도) 기준이고, 장학금·해외연수비·교재비는 빠져 있고, 입학금을 공개하지 않은 학교(KAIST·건국 등)는 등록금만 더했습니다. 막대를 누르면 학교별 금액표로 갑니다.</p>
  ${costSection}
  <details style="margin-top:28px"><summary class="small" style="cursor:pointer;font-weight:700">전체 금액 표로 보기</summary>
  <div class="tbl-scroll" style="margin-top:12px"><table class="prog-table"><thead><tr><th>학교 · 과정</th><th>학기당 등록금</th><th>학기 수</th><th>입학금</th><th>졸업까지 (입학금 포함)</th><th>기준</th></tr></thead><tbody>
  ${S.flatMap(s => s.guide.cost.map(c => `<tr><td>${esc(s.short)} ${esc(c.program)}</td><td data-k="학기당">${won(c.per_semester)}</td><td data-k="학기 수">${c.semesters ?? '–'}</td><td data-k="입학금">${won(c.admission)}</td><td data-k="졸업까지"><b>${man(c.all_in)}</b></td><td data-k="기준" class="small muted">${esc(c.year)}${c.note ? ' · ' + esc(c.note) : ''}</td></tr>`)).join('')}
  </tbody></table></div></details>
</div></section>

<section class="blk alt" id="cmp-faculty"><div class="wrap">
  <h2 class="h-l">교수진 규모와 강점</h2>
  <p class="muted" style="margin:6px 0 18px">각 학교 공식 교수 명단의 전임 교수 수입니다 (${CHECKED} 기준, 명예·겸임·초빙 제외). 학교마다 경영대학과 경영전문대학원 교수진 구성이 조금씩 다릅니다.</p>
  <div class="bars">${[...S].sort((a, b) => b.faculty.count - a.faculty.count).map(s => `<a class="bar-row" href="${s.id}.html#faculty" title="${esc(s.short + ' 전임 교수 ' + s.faculty.count + '명')}">
    <span class="bar-name"><b>${esc(s.short)}</b></span><span class="bar-track"><span class="bar-fill" style="width:${(s.faculty.count / facMax * 100).toFixed(1)}%"></span></span><span class="bar-val">${s.faculty.count}명</span></a>`).join('')}</div>
  <div class="grid g2" style="margin-top:30px">${S.map(s => `<a class="panel" href="${s.id}.html#faculty" style="text-decoration:none;border-top:4px solid ${s.color}"><h3 class="h-m">${esc(s.short)}</h3><p style="margin-top:6px;font-size:15px">${esc(s.faculty.strengths[0] || '')}</p></a>`).join('')}</div>
</div></section>

<section class="blk" id="cmp-programs"><div class="wrap">
  <h2 class="h-l" style="margin-bottom:12px">과정 구성</h2>
  <div class="tbl-scroll"><table class="matrix">
    <thead><tr><th scope="col">학교</th>${TYPES.map(t => `<th scope="col">${t}</th>`).join('')}<th scope="col">과정 수</th></tr></thead>
    <tbody>${S.map(s => { const c = typeCount(s); return `<tr style="--c:${s.color}"><td><a href="${s.id}.html"><span class="yes" aria-hidden="true"></span>${esc(s.name)}</a></td>${TYPES.map(t => `<td>${c[t] ? `<span class="yes" title="${t} ${c[t]}개"></span><span class="cnt">${c[t]}</span><span class="sr">${t} ${c[t]}개</span>` : '<span class="sr">없음</span>'}</td>`).join('')}<td>${s.programs.length}</td></tr>`; }).join('')}</tbody>
  </table></div>
  <p class="tiny" style="margin-top:10px">과정 분류는 각 학교 공식 안내를 바탕으로 라운지가 나눈 것입니다. 특화 과정: 금융·AI·ESG처럼 분야를 정한 과정이나 기업·기관 협약 과정.</p>
</div></section>`;
  write('schools/index.html', layout({ title: '학교별 MBA 비교: 입학·금액·교수진 | MBA Lounge', desc: '연세·서울대·KAIST·고려·서강·한양·이화·중앙·건국·성균관 MBA의 입학 시기와 방법, 졸업까지 등록금, 교수진 비교.', body, page: 'schools', root, active: 'schools', path: 'schools/' }));
}

/* ---------- 학교 상세 ---------- */
function schoolPage(s) {
  const root = '../';
  const g = s.guide, f = s.faculty;
  const progRows = s.programs.map(p => `<tr>
    <td>${esc(p.name)}${p.name_en && p.name_en !== p.name ? `<span class="en">${esc(p.name_en)}</span>` : ''}</td>
    <td data-k="구분"><span class="tag">${esc(p.type_ko)}</span>${p.focus ? `<div class="small muted" style="margin-top:6px">${esc(p.focus)}</div>` : ''}</td>
    <td data-k="수업">${esc(p.schedule || '공식 안내 확인 필요')}${p.language ? `<div class="small muted">${esc(p.language)}</div>` : ''}</td>
    <td data-k="기간·정원">${esc(p.duration || '-')}${p.intake ? `<div class="small muted">${esc(p.intake)}</div>` : ''}</td>
    <td data-k="대상">${esc(p.target || '-')}</td>
  </tr>`).join('');
  const adm = s.admissions.map(a => {
    const docs = Array.isArray(a.documents) ? a.documents : (a.documents ? [a.documents] : []);
    const stages = Array.isArray(a.stages) ? a.stages.join(' → ') : a.stages;
    const row = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : '';
    return `<div class="adm"><h3>${esc(a.program)}</h3><p class="cyc">${esc(a.cycle || '')}</p><dl class="kv">
      ${row('일정', esc(a.application_period))}${row('전형', esc(stages))}${row('지원 자격', esc(a.eligibility))}
      ${row('제출 서류', docs.length ? '<ul>' + docs.map(d => `<li>${esc(d)}</li>`).join('') + '</ul>' : '')}
      ${row('시험·영어', esc(a.tests))}${row('면접', esc(a.interview_format))}${row('특별 전형', esc(a.special_tracks))}
      ${safeUrl(a.source_url) ? `<dt>출처</dt><dd><a href="${esc(a.source_url)}" target="_blank" rel="noopener">공식 모집요강·안내 페이지</a></dd>` : ''}
    </dl></div>`;
  }).join('');
  const news = s.news.filter(n => safeUrl(n.url)).map(n => `<a class="news" href="${esc(n.url)}" target="_blank" rel="noopener">
    <div class="src">${esc(n.source_name)} · ${esc(n.date_precision === 'month' ? (n.date || '').slice(0, 7) : n.date)}</div><h3>${esc(n.title)}</h3><p>${esc(n.summary_ko)}</p></a>`).join('');
  const srcs = s.news_sources.filter(x => safeUrl(x.url)).map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join('');
  const dls = s.deadlines.length ? `<div class="dl-list">${s.deadlines.map(d => dlRow(s, d, root)).join('')}</div>` : '<div class="note" style="margin:0">2027학년도 전기 모집요강이 아직 게시되지 않았습니다. 게시되면 이곳에 일정이 추가됩니다.</div>';
  const process = g.process.map(p => `<div class="proc"><h3 class="h-m">${esc(p.title)}</h3><ol class="steps">${p.steps.map(st => `<li><span class="st-l">${esc(st.label)}</span><span class="st-w">${esc(st.when)}</span></li>`).join('')}</ol></div>`).join('');
  const areaMax = Math.max(1, ...f.areas.map(a => a.count));
  const prof = f.notable.map(n => `<article class="prof">
    <h3>${esc(n.name)}${n.name_en ? ` <span class="en">${esc(n.name_en)}</span>` : ''}</h3>
    <p class="prof-role">${esc([n.role, n.area].filter(Boolean).join(' · '))}</p>
    ${n.phd ? `<p class="small muted">박사: ${esc(n.phd)}</p>` : ''}
    <ul>${(n.highlights || []).map(h => `<li>${esc(h)}</li>`).join('')}</ul>
    ${safeUrl(n.source_url) ? `<a class="small" href="${esc(n.source_url)}" target="_blank" rel="noopener">공식 프로필</a>` : ''}
  </article>`).join('');
  const fnews = (f.news || []).filter(n => safeUrl(n.url)).map(n => `<a class="news" href="${esc(n.url)}" target="_blank" rel="noopener"><div class="src">${esc(n.date || '')}</div><h3>${esc(n.title)}</h3>${n.summary_ko ? `<p>${esc(n.summary_ko)}</p>` : ''}</a>`).join('');

  const body = `
<section class="s-hero"><div class="wrap">
  <p class="crumb"><a href="index.html">학교별 MBA</a> / ${esc(s.short)}</p>
  <h1 class="h-xl">${esc(s.name)} MBA</h1>
  <p class="off">${esc(s.official_name)}</p>
  <div class="acts"><a class="btn" href="${root}join.html?school=${s.id}">${esc(s.short)} 라운지 가입</a>${safeUrl(s.mba_site_url) ? `<a class="btn ghost" href="${esc(s.mba_site_url)}" target="_blank" rel="noopener">공식 홈페이지</a>` : ''}${safeUrl(s.admissions_url) ? `<a class="btn ghost" href="${esc(s.admissions_url)}" target="_blank" rel="noopener">입학 안내</a>` : ''}</div>
  <nav class="s-tabs" aria-label="페이지 내 이동"><a href="#feature">특징</a><a href="#when">입학 시기</a><a href="#how">입학 방법</a><a href="#cost">금액</a><a href="#faculty">교수진</a><a href="#programs">과정 상세</a><a href="#news">공식 소식</a><a href="#community">커뮤니티</a></nav>
</div></section>

<section class="blk" id="feature"><div class="wrap" style="max-width:900px">
  <h2 class="sr">특징</h2>
  <p class="tagline">${esc(g.tagline)}</p>
  <ul class="insight" style="margin-top:22px">${s.analysis.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
  <p class="tiny" style="margin-top:12px">공식 자료를 바탕으로 라운지가 정리했습니다.</p>
</div></section>

<section class="blk alt" id="when"><div class="wrap">
  <h2 class="h-l">입학 시기</h2>
  <div class="tbl-scroll" style="margin-top:18px"><table class="prog-table"><thead><tr><th>과정</th><th>입학</th><th>원서 접수</th></tr></thead><tbody>
    ${g.intake.map(i => `<tr><td>${esc(i.program)}</td><td data-k="입학"><b>${esc(i.start)}</b></td><td data-k="원서 접수">${esc(i.apply)}</td></tr>`).join('')}
  </tbody></table></div>
  <h3 class="h-m" style="margin:34px 0 8px">2027년 입학 원서 접수 현황</h3>
  ${dls}
</div></section>

<section class="blk" id="how"><div class="wrap">
  <h2 class="h-l">입학 방법</h2>
  <dl class="req">${g.req.map(r => `<div><dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd></div>`).join('')}</dl>
  <div class="grid g2" style="margin-top:34px;gap:28px">${process}</div>
  <details class="more-adm"><summary>과정별 모집요강 자세히 보기 (제출 서류·면접·특별 전형)</summary><div style="margin-top:22px">${adm}</div></details>
</div></section>

<section class="blk alt" id="cost"><div class="wrap">
  <h2 class="h-l">금액</h2>
  <p class="muted" style="margin:6px 0 18px">학교가 발표한 최신 등록금 기준입니다. 해마다 오르니 지원 전에 공식 안내를 다시 확인하세요. 장학금은 빼지 않은 금액입니다.</p>
  <div class="tbl-scroll"><table class="prog-table"><thead><tr><th>과정</th><th>학기당 등록금</th><th>학기 수</th><th>입학금</th><th>졸업까지 (입학금 포함)</th></tr></thead><tbody>
    ${g.cost.map(c => `<tr><td>${esc(c.program)}<span class="en">${esc(c.year)}학년도 기준${c.note ? ' · ' + esc(c.note) : ''}</span></td><td data-k="학기당 등록금">${won(c.per_semester)}</td><td data-k="학기 수">${c.semesters ?? '–'}</td><td data-k="입학금">${c.admission ? won(c.admission) : '공식 미공개'}</td><td data-k="졸업까지"><b>${c.all_in ? man(c.all_in) : '학기 수에 따라 다름'}</b></td></tr>`).join('')}
  </tbody></table></div>
  <p class="tiny" style="margin-top:10px"><a href="index.html#cmp-cost">다른 학교와 금액 비교하기</a></p>
</div></section>

<section class="blk" id="faculty"><div class="wrap">
  <h2 class="h-l">교수진</h2>
  <div class="fac-top">
    <div><p class="fac-num">${f.count}<span>명</span></p><p class="muted small">전임 교수 · ${esc(f.as_of)} 공식 명단 기준${safeUrl(f.url) ? ` · <a href="${esc(f.url)}" target="_blank" rel="noopener">교수 명단</a>` : ''}</p></div>
    <div class="bars compact">${f.areas.map(a => `<div class="bar-row" title="${esc(a.area + ' ' + a.count + '명')}"><span class="bar-name">${esc(a.area)}</span><span class="bar-track"><span class="bar-fill sc" style="width:${(a.count / areaMax * 100).toFixed(1)}%"></span></span><span class="bar-val">${a.count}</span></div>`).join('')}</div>
  </div>
  <ul class="insight" style="margin-top:28px;max-width:900px">${f.strengths.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  <h3 class="h-m" style="margin:40px 0 16px">주요 교수와 실적</h3>
  <div class="grid g2">${prof}</div>
  ${fnews ? `<h3 class="h-m" style="margin:40px 0 4px">교수진 최근 소식</h3>${fnews}` : ''}
  <p class="note">학장·프로그램 주임교수·석좌교수와 최근 수상·주요 공직 경력이 있는 교수를 중심으로 골랐습니다. 실적은 학교 공식 프로필과 공식 보도에 나온 내용을 라운지가 요약했으며, 전체 연구 실적은 각 교수의 공식 프로필에서 확인하세요.</p>
</div></section>

<section class="blk alt" id="programs"><div class="wrap">
  <h2 class="h-l">과정 상세 (${s.programs.length}개)</h2>
  <div class="tbl-scroll" style="margin-top:18px"><table class="prog-table"><thead><tr><th>과정</th><th>구분</th><th>수업</th><th>기간·정원</th><th>대상</th></tr></thead><tbody>${progRows}</tbody></table></div>
</div></section>

<section class="blk" id="news"><div class="wrap" style="max-width:860px">
  <h2 class="h-l">공식 소식</h2>
  <p class="muted" style="margin-top:6px">학교·경영대학원·동문회가 직접 발행한 기사만 모읍니다. 제목을 누르면 원문으로 이동합니다.</p>
  <div id="live-news" style="margin-top:18px"></div>
  <div style="margin-top:18px">${news || '<div class="empty">아직 모은 소식이 없습니다.</div>'}</div>
  ${srcs ? `<p class="small" style="margin-top:22px;font-weight:700">소식 출처</p><div class="src-list">${srcs}</div>` : ''}
  <p class="note">요약은 라운지가 직접 쓴 것이며, 기사 본문의 저작권은 각 발행처에 있습니다. ${esc(s.short)} 관리자는 관리자 화면에서 동문회보 등 공식 기사 링크를 추가할 수 있습니다. (${CHECKED} 확인)</p>
</div></section>

<section class="blk alt" id="community"><div class="wrap">
  <div class="join-box" style="background:#fff">
    <div><h2 class="h-l">${esc(s.short)} MBA 라운지</h2>
      <p class="muted" style="margin-top:8px">${esc(s.short)} MBA 재학생과 동문만 들어오는 학교 커뮤니티입니다. 가입은 바로 되고, 커뮤니티 입장은 ${esc(s.short)} 관리자가 승인합니다.</p>
      <ol style="margin-top:14px"><li>가입하면서 ${esc(s.short)}를 학교로 등록</li><li>${esc(s.short)} 관리자가 학번·기수 확인 후 승인</li><li>BZ 게시판·족보·동아리·원우수첩 이용</li></ol></div>
    <div style="display:flex;flex-direction:column;gap:10px"><a class="btn sc" href="${root}join.html?school=${s.id}">${esc(s.short)} 라운지 가입하기</a><a class="btn ghost" href="${root}board.html?school=${s.id}">${esc(s.short)} 공개 게시판 글 보기</a>${s.id === 'yonsei' ? `<a class="btn ghost" href="${root}stories.html">연세 헌터: 원우 이야기</a>` : ''}</div>
  </div>
</div></section>`;
  write(`schools/${s.id}.html`, layout({ title: `${s.name} MBA 입학 시기·방법·등록금·교수진 | MBA Lounge`, desc: `${s.name} MBA의 특징, 2027년 입학 시기와 지원 방법, 졸업까지 등록금, 교수진과 실적.`, body, page: 'school', root, active: 'schools', school: s, path: `schools/${s.id}.html` }));
}

/* ---------- 공개 게시판 ---------- */
function board() {
  const body = `
<section class="blk tight"><div class="wrap">
  <h1 class="h-l">공개 게시판</h1>
  <p class="lead" style="margin-top:8px">열 개 학교 원우와 MBA 지원자가 함께 쓰는 게시판입니다. 누구나 읽을 수 있고, 가입하면 바로 글을 쓸 수 있습니다.</p>
</div></section>
<section class="blk tight" style="padding-top:0"><div class="wrap grid" style="grid-template-columns:minmax(0,1fr) 360px;gap:40px;align-items:start" id="board-grid">
  <div><div class="filters" id="f-school" aria-label="학교"></div><div class="filters" id="f-cat" aria-label="분류"></div><div id="posts"></div></div>
  <aside id="write"></aside>
</div></section>
<style>@media(max-width:900px){#board-grid{grid-template-columns:1fr!important}#write{order:-1}}</style>`;
  write('board.html', layout({ title: '공개 게시판 | MBA Lounge', desc: 'MBA 원우와 지원자가 입학, 진학, 모임, 커리어 이야기를 나누는 공개 게시판.', body, page: 'board', active: 'board', path: 'board.html' }));
}

/* ---------- 가입·로그인 ---------- */
function join() {
  const body = `
<section class="blk tight"><div class="wrap auth-card">
  <h1 class="h-l">MBA Lounge 가입</h1>
  <p class="muted" style="margin-top:6px">가입과 학교 등록은 바로 끝납니다. 학교 커뮤니티는 학교 관리자가 승인하면 열립니다.</p>
  <div class="seg" role="tablist" style="margin:22px 0 18px"><button role="tab" data-m="signup" aria-selected="true">가입</button><button role="tab" data-m="login" aria-selected="false">로그인</button></div>
  <form class="form" id="f-signup" novalidate>
    <div class="field"><label id="pick-l">학교</label><div class="pick" id="pick" role="group" aria-labelledby="pick-l"></div></div>
    <div class="grid g2">
      <div class="field"><label for="su-sid">학번</label><input class="input" id="su-sid" autocomplete="username" required><div class="hint">로그인 아이디로 씁니다</div></div>
      <div class="field"><label for="su-name">이름</label><input class="input" id="su-name" autocomplete="name" required></div>
      <div class="field"><label for="su-gisu">기수</label><input class="input" id="su-gisu" inputmode="numeric" placeholder="예: 96" required></div>
      <div class="field"><label for="su-course">과정 (선택)</label><input class="input" id="su-course" placeholder="예: Executive MBA"></div>
    </div>
    <div class="field"><label for="su-pw">비밀번호</label><input class="input" id="su-pw" type="password" autocomplete="new-password" minlength="6" required><div class="hint">6자 이상</div></div>
    <details><summary class="small" style="cursor:pointer;font-weight:700">회사·연락처도 지금 입력하기 (선택)</summary>
      <div class="grid g2" style="margin-top:12px">
        <div class="field"><label for="su-company">회사</label><input class="input" id="su-company"></div>
        <div class="field"><label for="su-title">직함</label><input class="input" id="su-title"></div>
        <div class="field" style="grid-column:1/-1"><label for="su-email">이메일</label><input class="input" id="su-email" type="email" autocomplete="email"></div>
      </div><p class="hint">나중에 앱의 내 프로필에서 입력해도 됩니다. 원우수첩에 보일 범위도 그때 정합니다.</p></details>
    <label class="check"><input type="checkbox" id="su-agree"><span><a href="privacy.html" target="_blank">개인정보처리방침</a>과 <a href="child-safety.html" target="_blank">커뮤니티 안전 정책</a>에 동의합니다. 욕설, 혐오, 광고, 타인의 개인정보 게시는 금지되며 위반 시 이용이 제한됩니다.</span></label>
    <button class="btn" id="su-go" style="width:100%;padding:14px">가입하기</button>
  </form>
  <form class="form" id="f-login" hidden novalidate>
    <div class="field"><label for="lg-sid">학번</label><input class="input" id="lg-sid" autocomplete="username"></div>
    <div class="field"><label for="lg-pw">비밀번호</label><input class="input" id="lg-pw" type="password" autocomplete="current-password"></div>
    <button class="btn" id="lg-go" style="width:100%;padding:14px">로그인</button>
    <p class="tiny">앱과 같은 학번·비밀번호를 씁니다. 비밀번호를 잊었다면 <a href="mailto:${CONTACT}?subject=MBA%20Lounge%20비밀번호%20재설정">운영팀에 문의</a>하세요.</p>
  </form>
</div></section>`;
  write('join.html', layout({ title: '가입 · 로그인 | MBA Lounge', desc: 'MBA Lounge 가입과 학교 등록. 학교 커뮤니티는 학교 관리자 승인 후 이용합니다.', body, page: 'join', path: 'join.html' }));
}

function me() {
  const body = `<section class="blk tight"><div class="wrap" style="max-width:760px"><h1 class="h-l" style="margin-bottom:20px">내 라운지</h1><div id="me"><div class="empty">불러오는 중…</div></div></div></section>`;
  write('me.html', layout({ title: '내 라운지 | MBA Lounge', desc: '가입 상태와 학교 커뮤니티 승인 진행 상황.', body, page: 'me', path: 'me.html' }));
}

function admin() {
  const body = `<section class="blk tight"><div class="wrap" style="max-width:900px"><p class="muted small">학교 관리자</p><h1 class="h-l" style="margin-bottom:20px"><span id="admin-school">학교</span> 라운지 관리</h1><div id="admin"><div class="empty">불러오는 중…</div></div></div></section>`;
  write('admin.html', layout({ title: '학교 관리자 | MBA Lounge', desc: '학교 커뮤니티 가입 승인과 학교 소식 관리.', body, page: 'admin', path: 'admin.html' }).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"'));
}

/* ---------- 앱 기능 ---------- */
function appPages() {
  const root = '../';
  const navRow = cur => `<div class="f-nav">${FEATURES.map(f => `<a class="chip" href="${f.id}.html"${f.id === cur ? ' aria-pressed="true"' : ''} style="text-decoration:none">${esc(f.name)}</a>`).join('')}</div>`;
  const idx = `
<section class="blk tight"><div class="wrap">
  <h1 class="h-l">앱 기능</h1>
  <p class="lead" style="margin-top:8px">MBA Lounge 앱은 학교별 커뮤니티입니다. 승인된 원우는 아이폰 앱과 웹에서 같은 계정으로 이용합니다.</p>
  <div class="hero-cta"><a class="btn" href="${root}app-web.html">웹에서 앱 열기</a><a class="btn ghost" href="${root}join.html">가입하기</a></div>
</div></section>
<section class="blk tight" style="padding-top:0"><div class="wrap grid g3">${FEATURES.map(f => `<a class="feat" href="${f.id}.html"><span class="ic">${svg(f.icon)}</span><h3>${esc(f.name)}</h3><p>${esc(f.lead)}</p></a>`).join('')}</div></section>
<section class="blk alt"><div class="wrap grid g2" style="gap:40px">
  <div><h2 class="h-m">홈페이지와 앱은 어떻게 연결되나요?</h2><p class="muted" style="margin-top:8px">하나의 계정을 씁니다. 홈페이지에서 가입하면 앱에서도 같은 학번으로 로그인하고, 학교 관리자가 앱에서 승인하든 홈페이지에서 승인하든 결과는 같습니다.</p></div>
  <div><h2 class="h-m">승인 전에는 무엇을 할 수 있나요?</h2><p class="muted" style="margin-top:8px">홈페이지의 학교별 MBA 정보와 공개 게시판을 이용할 수 있습니다. 학교 게시판, 족보, 동아리, 원우수첩처럼 원우 정보가 오가는 곳은 승인 후에 열립니다.</p></div>
</div></section>`;
  write('app/index.html', layout({ title: '앱 기능 | MBA Lounge', desc: 'BZ 게시판, 만남·미팅, 공지, 족보, 동아리, 원우수첩, 임원방. MBA Lounge 앱 기능 안내.', body: idx, page: 'app', root, active: 'app', path: 'app/' }));
  for (const f of FEATURES) {
    const body = `
<section class="wrap"><div class="f-hero">
  <div><p class="muted small"><a href="index.html">앱 기능</a> / ${esc(f.name)}</p>
    <h1 class="h-xl" style="margin-top:8px">${esc(f.name)}</h1>
    <p class="lead" style="margin-top:14px">${esc(f.lead)}</p>
    <ul class="f-points">${f.points.map(([b, t]) => `<li><b>${esc(b)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
    <div class="hero-cta"><a class="btn" href="${root}app-web.html">웹에서 ${esc(f.name)} 열기</a><a class="btn ghost" href="${root}join.html">가입하기</a></div>
    <p class="tiny" style="margin-top:12px">학교 관리자 승인을 받은 원우가 이용할 수 있습니다.</p>
  </div>
  ${f.shot ? `<div class="phone"><img src="${root}${f.shot}" alt="${esc(f.name)} 화면" loading="lazy" width="1080" height="1920"></div>` : `<div class="panel flat" style="justify-self:stretch;display:grid;place-items:center;min-height:260px;color:var(--brand-ink)">${svg(f.icon, 96)}</div>`}
</div></section>
<section class="blk tight alt"><div class="wrap"><p class="small" style="font-weight:700;margin-bottom:10px">다른 기능</p>${navRow(f.id)}</div></section>`;
    write(`app/${f.id}.html`, layout({ title: `${f.name} | MBA Lounge 앱`, desc: f.lead, body, page: 'feature', root, active: 'app', path: `app/${f.id}.html` }));
  }
}

/* ---------- 원우 이야기 ---------- */
function stories() {
  const pages = Array.from({ length: 10 }, (_, i) => `hunter/01/p-${String(i + 1).padStart(2, '0')}.jpg`);
  const body = `
<section class="blk tight"><div class="wrap">
  <h1 class="h-l">원우 이야기</h1>
  <p class="lead" style="margin-top:8px">라운지가 직접 만나 기록하는 MBA 원우들의 이야기입니다. 본인 확인을 거친 원고만 싣습니다.</p>
</div></section>
<section class="blk tight" style="padding-top:0"><div class="wrap">
  <div class="story" style="cursor:default">
    <img src="${pages[0]}" alt="연세 헌터 No.01 표지" width="220" height="311">
    <div><p class="muted small">연세 헌터 No.01 · 연세대학교 MBA 96기 · 2026</p>
      <h2 class="h-l" style="margin-top:6px">졸업, 그 후 10년: 김성집 원우</h2>
      <p class="muted" style="margin-top:10px;max-width:600px">대학 3학년, 오십만 원짜리 렌터카 사고에서 시작해 건축 설계에서 부동산 금융으로 길을 바꾸기까지. 시장이 무너졌던 해와 다음 10년의 목표를 이야기합니다.</p>
      <div class="hero-cta"><a class="btn" href="hunter/01/yonsei-hunter-01.pdf" target="_blank" rel="noopener">PDF로 읽기</a><a class="btn ghost" href="schools/yonsei.html">연세대 MBA 페이지</a></div></div>
  </div>
  <h2 class="h-m" style="margin:48px 0 16px">지면 미리보기</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${pages.map((p, i) => `<a href="${p}" target="_blank" rel="noopener"><img src="${p}" alt="연세 헌터 No.01 ${i + 1}쪽" loading="lazy" width="911" height="1288" style="border:1px solid var(--line);border-radius:4px"></a>`).join('')}</div>
  <p class="note">다른 학교 원우 이야기도 준비하고 있습니다. 인터뷰를 추천하고 싶은 원우가 있다면 <a href="mailto:${CONTACT}?subject=원우%20이야기%20추천">알려주세요</a>.</p>
</div></section>`;
  write('stories.html', layout({ title: '원우 이야기 | MBA Lounge', desc: 'MBA 원우 인터뷰 시리즈. 연세 헌터 No.01 「졸업, 그 후 10년」.', body, page: 'stories', active: 'stories', path: 'stories.html' }));
}

home(); schoolsIndex(); S.forEach(schoolPage); board(); join(); me(); admin(); appPages(); stories();
console.log('built', 6 + S.length + FEATURES.length + 1, 'pages');
