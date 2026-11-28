/* MBA Lounge 비즈니스 매칭
 * - 사업 프로필(내 라운지): 제가 가진 문제 / 제가 해줄 수 있는 것 / 분야 태그 / 연결 시 공개 연락처
 * - 비즈니스 매칭(biz.html): 문제 올리기 → 분야가 맞는 원우에게 먼저 노출 → 답변·사람 연결 → 프로젝트
 * 데이터: supabase/biz.sql 의 biz_* 테이블. 승인된 회원(10개 학교 전체)만 읽고 쓸 수 있다.
 */
(function(){
'use strict';
const M=window.MBA; if(!M)return;
const {esc,toast,byId,fmtDate,$,$$}=M;
const PROFILE_LINK=M.profileLink||'me.html#biz-profile';

const TAGS=['투자·자금조달','마케팅·브랜딩','영업·판로','해외진출','법률·세무·회계','인사·조직',
  'IT·AI·데이터','제조·공급망','부동산·건설','의료·헬스케어','금융·보험','유통·커머스',
  '콘텐츠·문화','창업·스타트업','공공·정부지원','ESG·에너지'];
const WANT={answer:'답변 원해요',connect:'사람 연결 원해요',both:'답변·연결 모두'};
const STAGE={chatting:'대화 중',met:'미팅 완료',collaborating:'협업 시작'};
const PSTATUS={recruiting:'모집 중',running:'진행 중',done:'완료'};
const CTYPE={member:'원우 소개',external:'외부 분 소개',self:'직접 도울게요'};

let me=null, prof=null, ready=false;
const schoolShort=id=>(byId(id)||{}).short||'';
function ago(iso){const m=Math.round((Date.now()-new Date(iso))/6e4);if(m<60)return Math.max(m,1)+'분 전';const h=Math.round(m/60);if(h<48)return h+'시간 전';return fmtDate(iso);}
function tagsHtml(ts,mine){return (ts||[]).map(t=>'<span class="btag'+(mine&&mine.includes(t)?' on':'')+'">'+esc(t)+'</span>').join('');}
function err(e,msg){console.warn(e);toast(msg||'처리하지 못했습니다. 잠시 후 다시 시도하세요');}
function myLabel(){return me?me.name:'원우';}

async function loadCtx(){
  if(ready)return;ready=true;
  me=await M.loadMe();
  if(me&&me.status==='approved'&&M.SB){
    const r=await M.SB.from('biz_profiles').select('*').eq('member_id',me.uid).maybeSingle();
    prof=r.error?null:r.data;
  }
}

/* 태그 고르기: max 개까지. 선택 목록을 돌려주는 함수를 반환 */
function tagPicker(el,selected,max,onChange){
  let sel=[...(selected||[])];
  function paint(){el.innerHTML=TAGS.map(t=>'<button type="button" class="btag pick'+(sel.includes(t)?' on':'')+'" aria-pressed="'+sel.includes(t)+'">'+esc(t)+'</button>').join('');}
  el.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;const t=b.textContent;
    if(sel.includes(t))sel=sel.filter(x=>x!==t);
    else{if(sel.length>=max){toast('분야는 '+max+'개까지 고를 수 있습니다');return;}sel.push(t);}
    paint();onChange&&onChange(sel);
  });
  paint();return()=>sel;
}

/* =====================================================================
 * 1) 내 라운지: 사업 프로필
 * ===================================================================*/
async function initProfile(target){
  await loadCtx();
  const box=(target&&target.nodeType)?target:$('#me');if(!box||!me)return;
  const sec=document.createElement('section');sec.className='panel';sec.id='biz-profile';sec.style.marginTop='20px';
  if(me.status!=='approved'){
    sec.innerHTML='<h2 class="h-m">사업 프로필</h2><p class="muted small" style="margin-top:6px">학교 관리자 승인 후 "제가 가진 문제"와 "제가 해줄 수 있는 것"을 적어 비즈니스 매칭에 참여할 수 있습니다.</p>';
    box.appendChild(sec);return;
  }
  let contact='';
  try{const c=await M.SB.from('biz_contacts').select('contact').eq('member_id',me.uid).maybeSingle();contact=(c.data&&c.data.contact)||'';}catch(e){}
  const p=prof||{headline:[me.company,me.title].filter(Boolean).join(' · '),needs:'',offers:'',tags:[]};
  sec.innerHTML='<div class="blk-head" style="margin-bottom:4px"><h2 class="h-m">사업 프로필</h2><a class="small" href="biz.html">비즈니스 매칭 열기</a></div>'+
    '<p class="muted small">10개 학교 원우에게 보입니다. 분야가 맞는 문제가 올라오면 비즈니스 매칭의 "나에게 맞는 문제"에 먼저 나타납니다.</p>'+
    '<form class="form" id="bp-form" style="margin-top:14px">'+
    '<div class="field"><label for="bp-head">회사 · 직함</label><input class="input" id="bp-head" maxlength="80" placeholder="예: ○○메디컬 대표 / ○○은행 PB팀장"></div>'+
    '<div class="field"><label for="bp-offers">제가 해줄 수 있는 것</label><textarea class="input" id="bp-offers" maxlength="500" style="min-height:100px" placeholder="예: 병원 개원 입지 분석과 인테리어 업체 소개, 중국 유통 바이어 연결"></textarea></div>'+
    '<div class="field"><label for="bp-needs">제가 가진 문제</label><textarea class="input" id="bp-needs" maxlength="500" style="min-height:100px" placeholder="예: 신규 브랜드의 온라인 판로를 찾고 있습니다. 시리즈A 투자자를 만나고 싶습니다."></textarea></div>'+
    '<div class="field"><label>분야 태그 (1~5개)</label><div class="btag-pick" id="bp-tags"></div></div>'+
    '<div class="field"><label for="bp-contact">연결이 성사됐을 때 보여 줄 연락처 (선택)</label><input class="input" id="bp-contact" maxlength="120" placeholder="휴대폰, 이메일, 카카오톡 ID 등"><div class="hint">평소에는 아무에게도 보이지 않고, 내가 수락했거나 나를 연결해 준 성사된 연결의 당사자에게만 보입니다.</div></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sc" id="bp-save">프로필 저장</button>'+(prof?'<button type="button" class="btn ghost" id="bp-del">프로필 내리기</button>':'')+'</div></form>';
  box.appendChild(sec);
  $('#bp-head').value=p.headline||'';$('#bp-offers').value=p.offers||'';$('#bp-needs').value=p.needs||'';$('#bp-contact').value=contact;
  const getTags=tagPicker($('#bp-tags'),p.tags,5);
  if(location.hash==='#biz-profile')sec.scrollIntoView({block:'start'});
  $('#bp-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const tags=getTags();
    if(!tags.length){toast('분야 태그를 1개 이상 고르세요');return;}
    const offers=$('#bp-offers').value.trim(),needs=$('#bp-needs').value.trim();
    if(!offers&&!needs){toast('해줄 수 있는 것이나 가진 문제 중 하나는 적어 주세요');return;}
    const b=$('#bp-save');b.disabled=true;
    try{
      const row={member_id:me.uid,name:me.name,school_id:me.school_id,headline:$('#bp-head').value.trim(),offers,needs,tags,updated_at:new Date().toISOString()};
      const r=await M.SB.from('biz_profiles').upsert(row);if(r.error)throw r.error;
      const c=await M.SB.from('biz_contacts').upsert({member_id:me.uid,contact:$('#bp-contact').value.trim()});if(c.error)throw c.error;
      prof=row;toast('사업 프로필을 저장했습니다');
    }catch(x){err(x,'저장하지 못했습니다. supabase/biz.sql 적용 여부를 확인하세요');}
    finally{b.disabled=false;}
  });
  const del=$('#bp-del');
  if(del)del.onclick=async()=>{if(!confirm('사업 프로필을 내릴까요? 올린 문제와 답변은 그대로 남습니다.'))return;
    const r=await M.SB.from('biz_profiles').delete().eq('member_id',me.uid);if(r.error)return err(r.error);toast('프로필을 내렸습니다');location.reload();};
}

/* =====================================================================
 * 2) 비즈니스 매칭 페이지
 * ===================================================================*/
const S={qs:[],ans:{},conn:{},profiles:[],projects:[],roles:[],tab:'match',tagFilter:null};

async function loadAll(){
  const [q,a,c,pf,pj,rl]=await Promise.all([
    M.SB.from('biz_questions').select('*').order('created_at',{ascending:false}).limit(300),
    M.SB.from('biz_answers').select('question_id,author'),
    M.SB.from('biz_connections').select('question_id,proposer,target_member,status'),
    M.SB.from('biz_profiles').select('*').order('updated_at',{ascending:false}).limit(500),
    M.SB.from('biz_projects').select('*').order('created_at',{ascending:false}).limit(100),
    M.SB.from('biz_project_roles').select('project_id,status,member_id'),
  ]);
  for(const r of [q,a,c,pf,pj,rl])if(r.error)throw r.error;
  S.qs=q.data;S.profiles=pf.data;S.projects=pj.data;S.roles=rl.data;
  S.ans={};a.data.forEach(x=>{(S.ans[x.question_id]=S.ans[x.question_id]||[]).push(x);});
  S.conn={};c.data.forEach(x=>{(S.conn[x.question_id]=S.conn[x.question_id]||[]).push(x);});
}
const nAns=id=>(S.ans[id]||[]).length, nConn=id=>(S.conn[id]||[]).length;
const overlap=(a,b)=>(a||[]).filter(t=>(b||[]).includes(t)).length;
function reach(tags,excludeId){return S.profiles.filter(p=>p.member_id!==excludeId&&overlap(p.tags,tags)>0).length;}

async function initBiz(){
  const root=$('#biz');if(!root)return;
  await loadCtx();
  if(!me){root.innerHTML='<div class="panel"><h2 class="h-m">원우 전용 공간입니다</h2><p class="muted" style="margin-top:6px">10개 학교 MBA 원우가 서로의 문제를 풀고 프로젝트를 만드는 곳입니다. 가입하고 학교 관리자 승인을 받으면 이용할 수 있습니다.</p><div class="hero-cta"><a class="btn" href="join.html">가입하기</a><a class="btn ghost" href="join.html?mode=login&next=biz.html">로그인</a></div></div>';return;}
  if(me.status!=='approved'){root.innerHTML='<div class="panel"><h2 class="h-m">학교 관리자 승인 후 이용할 수 있습니다</h2><p class="muted" style="margin-top:6px">'+(me.status==='rejected'?'가입이 거절된 계정입니다. 학교 관리자에게 문의하세요.':'승인되면 문제를 올리고, 원우의 문제에 답하거나 사람을 연결할 수 있습니다.')+'</p><div class="hero-cta"><a class="btn ghost" href="me.html">내 라운지에서 진행 상황 보기</a></div></div>';return;}
  root.innerHTML='<div class="empty">불러오는 중…</div>';
  try{await loadAll();}catch(e){console.warn(e);root.innerHTML='<div class="panel">비즈니스 매칭을 불러오지 못했습니다. 운영진에게 알려 주세요. <a href="feedback.html?kind=bug&from=/biz.html">오류 신고</a></div>';return;}
  if(!window.__bizHash){window.__bizHash=1;window.addEventListener('hashchange',route);}
  route();
}

function route(){
  if(!$('#biz'))return;
  const h=location.hash;
  const m=h.match(/^#q=([0-9a-f-]{36})/), p=h.match(/^#p=([0-9a-f-]{36})/);
  const flow=$('.biz-flow');if(flow)flow.hidden=!!(m||p||h==='#write'||h.startsWith('#newproject'));
  window.scrollTo(0,0);
  if(h==='#write')return viewWrite();
  if(h.startsWith('#newproject'))return viewNewProject((h.match(/from=([0-9a-f-]{36})/)||[])[1]);
  if(m)return viewQuestion(m[1]);
  if(p)return viewProject(p[1]);
  const t=(h.match(/^#tab=(\w+)/)||[])[1];if(t)S.tab=t;
  viewList();
}
async function refresh(){try{await loadAll();}catch(e){}route();}

/* ---------- 목록 ---------- */
const TABS=[['match','나에게 맞는 문제'],['all','전체 문제'],['mine','내 활동'],['people','원우 역량'],['projects','프로젝트']];
function viewList(){
  const root=$('#biz');
  const mineTags=(prof&&prof.tags)||[];
  let body='';
  if(S.tab==='match'){
    const list=S.qs.filter(q=>q.status==='open'&&q.author!==me.uid&&overlap(q.tags,mineTags)>0)
      .sort((a,b)=>overlap(b.tags,mineTags)-overlap(a.tags,mineTags)||(nAns(a.id)+nConn(a.id))-(nAns(b.id)+nConn(b.id))||b.created_at.localeCompare(a.created_at));
    body=(prof?'<div class="biz-sum"><div><b>회원님이 도울 수 있는 문제 '+list.length+'개</b><div class="small" style="margin-top:6px">'+tagsHtml(mineTags)+'</div></div><a class="small" href="'+PROFILE_LINK+'">분야 바꾸기</a></div>'
      :'<div class="biz-sum warn"><div><b>사업 프로필을 먼저 채워 주세요</b><div class="small muted">해줄 수 있는 것과 분야를 적으면 맞는 문제가 여기에 먼저 보입니다.</div></div><a class="btn sm sc" href="'+PROFILE_LINK+'">프로필 채우기</a></div>')+
      (list.length?list.map(qCard).join(''):(prof?'<div class="empty">지금은 맞는 문제가 없습니다. <a href="#tab=all">전체 문제 보기</a></div>':''));
  }else if(S.tab==='all'){
    const f=S.tagFilter;
    const list=S.qs.filter(q=>!f||q.tags.includes(f));
    body='<div class="filters" id="bz-tagf"><button class="chip" data-v="" aria-pressed="'+(!f)+'">전체 분야</button>'+TAGS.map(t=>'<button class="chip" data-v="'+esc(t)+'" aria-pressed="'+(f===t)+'">'+esc(t)+'</button>').join('')+'</div>'+
      (list.length?list.map(qCard).join(''):'<div class="empty">아직 올라온 문제가 없습니다. 첫 문제를 올려 보세요.</div>');
  }else if(S.tab==='mine'){
    const mine=S.qs.filter(q=>q.author===me.uid);
    const helped=S.qs.filter(q=>q.author!==me.uid&&((S.ans[q.id]||[]).some(a=>a.author===me.uid)||(S.conn[q.id]||[]).some(c=>c.proposer===me.uid||c.target_member===me.uid)));
    const nA=Object.values(S.ans).flat().filter(a=>a.author===me.uid).length;
    const nC=Object.values(S.conn).flat().filter(c=>c.proposer===me.uid).length;
    const nOk=Object.values(S.conn).flat().filter(c=>c.status==='accepted'&&(c.proposer===me.uid||c.target_member===me.uid)).length;
    body='<div class="biz-stats"><div><b>'+nA+'</b><span>내 답변</span></div><div><b>'+nC+'</b><span>내가 제안한 연결</span></div><div><b>'+nOk+'</b><span>성사된 연결</span></div></div>'+
      '<h3 class="h-m" style="margin:24px 0 4px">내가 올린 문제</h3>'+(mine.length?mine.map(qCard).join(''):'<div class="empty" style="padding:18px 0">아직 올린 문제가 없습니다.</div>')+
      '<h3 class="h-m" style="margin:24px 0 4px">내가 돕고 있는 문제</h3>'+(helped.length?helped.map(qCard).join(''):'<div class="empty" style="padding:18px 0">답변하거나 연결을 제안한 문제가 여기에 모입니다.</div>');
  }else if(S.tab==='people'){
    const f=S.tagFilter;
    const list=S.profiles.filter(p=>!f||p.tags.includes(f));
    body='<p class="muted small" style="margin-bottom:12px">원우들이 적은 "해줄 수 있는 것"과 "가진 문제"입니다. 서로의 문제가 곧 사업 기회입니다.</p>'+
      '<div class="filters" id="bz-tagf"><button class="chip" data-v="" aria-pressed="'+(!f)+'">전체 분야</button>'+TAGS.map(t=>'<button class="chip" data-v="'+esc(t)+'" aria-pressed="'+(f===t)+'">'+esc(t)+'</button>').join('')+'</div>'+
      (list.length?'<div class="grid g2">'+list.map(pCard).join('')+'</div>':'<div class="empty">아직 사업 프로필을 올린 원우가 없습니다. <a href="'+PROFILE_LINK+'">내 프로필 채우기</a></div>');
  }else{
    body='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px"><p class="muted small">문제에서 시작해 원우끼리 함께하는 프로젝트입니다. 필요한 역할에 참여를 신청하세요.</p><a class="btn sm sc" href="#newproject">프로젝트 만들기</a></div>'+
      (S.projects.length?S.projects.map(prjCard).join(''):'<div class="empty">아직 프로젝트가 없습니다.</div>');
  }
  root.innerHTML='<div class="biz-bar"><div class="seg biz-tabs" role="tablist">'+TABS.map(([k,t])=>'<button role="tab" data-t="'+k+'" aria-selected="'+(S.tab===k)+'">'+t+'</button>').join('')+'</div>'+
    '<a class="btn" href="#write">문제 올리기</a></div><div id="bz-body">'+body+'</div>';
  $$('.biz-tabs button',root).forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.tagFilter=null;history.replaceState(null,'','#tab='+S.tab);viewList();});
  const tf=$('#bz-tagf');if(tf)tf.onclick=e=>{const b=e.target.closest('button');if(!b)return;S.tagFilter=b.dataset.v||null;viewList();};
}
function qCard(q){
  const mineTags=(prof&&prof.tags)||[];
  return '<a class="biz-q" href="#q='+esc(q.id)+'"><div class="meta"><span class="bwant '+esc(q.want)+'">'+esc(WANT[q.want])+'</span>'+tagsHtml(q.tags,mineTags)+
    (q.status!=='open'?'<span class="bstat">'+(q.status==='resolved'?'해결됨':'마감')+'</span>':'')+'</div>'+
    '<h3>'+esc(q.body)+'</h3><div class="meta small"><span>'+esc(q.author_label)+(q.anonymous?'':' · '+esc(schoolShort(q.school_id)))+'</span><span>'+ago(q.created_at)+'</span><span>답변 '+nAns(q.id)+' · 연결 제안 '+nConn(q.id)+'</span></div></a>';
}
function pCard(p){
  return '<article class="panel biz-p"><div style="display:flex;justify-content:space-between;gap:8px"><div><b>'+esc(p.name)+'</b> <span class="muted small">'+esc(schoolShort(p.school_id))+'</span><div class="small muted">'+esc(p.headline||'')+'</div></div></div>'+
    '<div class="small" style="margin:8px 0">'+tagsHtml(p.tags,(prof&&prof.tags)||[])+'</div>'+
    (p.offers?'<p class="biz-lbl">해줄 수 있어요</p><p class="small">'+esc(p.offers)+'</p>':'')+
    (p.needs?'<p class="biz-lbl">이런 문제가 있어요</p><p class="small">'+esc(p.needs)+'</p>':'')+'</article>';
}
function prjCard(p){
  const roles=S.roles.filter(r=>r.project_id===p.id),filled=roles.filter(r=>r.status==='filled').length;
  return '<a class="biz-q" href="#p='+esc(p.id)+'"><div class="meta"><span class="bstat p-'+esc(p.status)+'">'+esc(PSTATUS[p.status])+(p.deadline&&p.status==='recruiting'?' · '+esc(p.deadline.slice(5).replace('-','.'))+' 마감':'')+'</span>'+tagsHtml(p.tags)+'</div>'+
    '<h3>'+esc(p.title)+'</h3><div class="meta small"><span>리더 '+esc(p.leader_label)+'</span><span>역할 '+filled+'/'+roles.length+' 채움</span>'+(p.origin_question?'<span>문제에서 시작</span>':'')+'</div></a>';
}

/* ---------- 문제 올리기 ---------- */
function viewWrite(){
  const root=$('#biz');
  root.innerHTML='<p class="small"><a href="#tab='+S.tab+'">목록으로</a></p><form class="panel form" id="bw" style="margin-top:10px;max-width:760px">'+
    '<h2 class="h-m">문제 올리기</h2>'+
    '<div class="field"><label for="bw-body">어떤 문제가 있나요?</label><textarea class="input" id="bw-body" maxlength="1000" placeholder="예: 강남에 피부과 2호점을 내려는데 입지와 상권 분석을 도와줄 분을 찾습니다."></textarea>'+
    '<div class="hint">지역·업종·단계를 적으면 맞는 원우를 찾기 쉽습니다. 환자·고객의 개인정보나 회사 기밀은 적지 마세요. <span id="bw-cnt">0</span>/1000</div></div>'+
    '<div class="field"><label>원하는 도움</label><div class="seg" id="bw-want">'+Object.keys(WANT).map(k=>'<button type="button" data-v="'+k+'" aria-selected="'+(k==='both')+'">'+esc(WANT[k])+'</button>').join('')+'</div></div>'+
    '<div class="field"><label>분야 (1~3개)</label><div class="btag-pick" id="bw-tags"></div><div class="biz-reach" id="bw-reach">분야를 고르면 먼저 보게 될 원우 수가 나옵니다.</div></div>'+
    '<label class="check"><input type="checkbox" id="bw-anon"><span>이름 대신 회사·직함으로 표시 '+(prof&&prof.headline?'("'+esc(prof.headline)+'")':'(사업 프로필의 회사·직함)')+'. 운영진에게는 실명이 보입니다.</span></label>'+
    '<button class="btn" id="bw-go" disabled style="width:100%;padding:14px">올리기</button></form>';
  let want='both';
  $$('#bw-want button').forEach(b=>b.onclick=()=>{want=b.dataset.v;$$('#bw-want button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));});
  const upd=()=>{const t=getTags(),n=reach(t,me.uid),body=$('#bw-body').value.trim();
    $('#bw-cnt').textContent=$('#bw-body').value.length;
    $('#bw-reach').innerHTML=t.length?(n?'이 분야를 도울 수 있는 원우 <b>'+n+'명</b>의 "나에게 맞는 문제"에 먼저 보입니다.':'아직 이 분야로 프로필을 적은 원우가 없습니다. 전체 문제 목록에 올라가고, 운영진이 맞는 원우를 찾아 연결합니다.'):'분야를 고르면 먼저 보게 될 원우 수가 나옵니다.';
    const ok=body.length>=10&&t.length>0;$('#bw-go').disabled=!ok;$('#bw-go').textContent=ok&&n?'올리고 '+n+'명에게 보이기':'올리기';};
  const getTags=tagPicker($('#bw-tags'),[],3,upd);
  $('#bw-body').addEventListener('input',upd);
  $('#bw').addEventListener('submit',async e=>{
    e.preventDefault();const b=$('#bw-go');b.disabled=true;
    const anon=$('#bw-anon').checked;
    const label=anon?((prof&&prof.headline)||'익명 원우'):myLabel();
    try{
      const r=await M.SB.from('biz_questions').insert({author:me.uid,author_label:label.slice(0,60),school_id:me.school_id,body:$('#bw-body').value.trim(),want,tags:getTags(),anonymous:anon}).select('id').single();
      if(r.error)throw r.error;
      toast('문제를 올렸습니다');await loadAll();location.hash='#q='+r.data.id;
    }catch(x){b.disabled=false;err(x,'올리지 못했습니다. 내용은 10자 이상, 분야는 1~3개인지 확인하세요');}
  });
}

/* ---------- 문제 상세 ---------- */
async function viewQuestion(id){
  const root=$('#biz');root.innerHTML='<div class="empty">불러오는 중…</div>';
  const [qr,ar,cr,hr]=await Promise.all([
    M.SB.from('biz_questions').select('*').eq('id',id).maybeSingle(),
    M.SB.from('biz_answers').select('*').eq('question_id',id).order('created_at'),
    M.SB.from('biz_connections').select('*').eq('question_id',id).order('created_at'),
    M.SB.from('biz_helpful').select('answer_id,member_id'),
  ]);
  const q=qr.data;
  if(!q){root.innerHTML='<div class="panel">문제를 찾을 수 없습니다. 삭제됐을 수 있습니다. <a href="#tab=all">목록으로</a></div>';return;}
  const answers=ar.data||[],conns=cr.data||[],helpful=hr.data||[];
  const isAuthor=q.author===me.uid,isAdmin=me.role==='admin';
  /* 성사된 연결의 연락처 (RLS 가 당사자에게만 돌려준다) */
  const people=[...new Set(conns.filter(c=>c.status==='accepted').flatMap(c=>[q.author,c.proposer,c.target_member]).filter(Boolean))];
  let contacts={};
  if(people.length){const r=await M.SB.from('biz_contacts').select('member_id,contact').in('member_id',people);(r.data||[]).forEach(x=>contacts[x.member_id]=x.contact);}
  const nameOf=uid=>uid===q.author?q.author_label:((S.profiles.find(p=>p.member_id===uid)||{}).name||'원우');
  const helpers=S.profiles.filter(p=>p.member_id!==q.author&&overlap(p.tags,q.tags)>0).sort((a,b)=>overlap(b.tags,q.tags)-overlap(a.tags,q.tags)).slice(0,6);
  const defTab=q.want==='answer'?'ans':'conn';

  const connHtml=conns.length?conns.map(c=>{
    const parties=[q.author,c.proposer,c.target_member].filter(Boolean);
    const iAmParty=parties.includes(me.uid);
    const target=c.type==='self'?'제안자가 직접':(c.type==='member'?nameOf(c.target_member)+' 원우':c.target_label+' (외부)');
    return '<article class="biz-c '+esc(c.status)+'"><div class="meta"><span class="bstat c-'+esc(c.status)+'">'+(c.status==='proposed'?'제안됨':c.status==='accepted'?'연결됨'+(c.stage?' · '+STAGE[c.stage]:''):'거절됨')+'</span><span>'+esc(CTYPE[c.type])+'</span><span>'+ago(c.created_at)+'</span></div>'+
      '<p><b>'+esc(c.proposer_label)+'</b> → '+esc(target)+'</p>'+(c.message?'<p class="small" style="white-space:pre-wrap">'+esc(c.message)+'</p>':'')+
      (isAuthor&&c.status==='proposed'?'<div class="acts"><button class="btn sm sc" data-acc="'+esc(c.id)+'">연결 받기</button><button class="btn sm ghost" data-dec="'+esc(c.id)+'">거절</button></div>':'')+
      (c.status==='accepted'&&iAmParty?'<div class="biz-contact"><b>연결된 분들의 연락처</b>'+parties.map(u=>'<div>'+esc(nameOf(u))+': '+(contacts[u]?esc(contacts[u]):'<span class="muted">연락처 미등록</span>')+'</div>').join('')+
        (c.type==='external'?'<div class="small muted">외부 분은 소개한 원우가 따로 연결해 드립니다.</div>':'')+
        '<div class="acts"><label class="small">진행 단계 <select class="input bz-stage" data-c="'+esc(c.id)+'" style="width:auto;padding:6px 8px">'+Object.keys(STAGE).map(k=>'<option value="'+k+'"'+(k===c.stage?' selected':'')+'>'+STAGE[k]+'</option>').join('')+'</select></label></div></div>':'')+
      (c.proposer===me.uid&&c.status==='proposed'?'<div class="acts"><button class="btn sm danger" data-cdel="'+esc(c.id)+'">제안 취소</button></div>':'')+'</article>';
  }).join(''):'<div class="empty" style="padding:18px 0">아직 연결 제안이 없습니다.'+(helpers.length?' 이 분야 원우 '+reach(q.tags,q.author)+'명에게 보이고 있습니다.':'')+'</div>';

  const ansHtml=answers.length?answers.map(a=>{
    const hs=helpful.filter(h=>h.answer_id===a.id),mine=hs.some(h=>h.member_id===me.uid);
    return '<article class="biz-a"><div class="meta"><b>'+esc(a.author_label)+'</b><span>'+ago(a.created_at)+'</span></div><p style="white-space:pre-wrap;margin-top:6px">'+esc(a.body)+'</p>'+
      '<div class="acts">'+(a.author!==me.uid?'<button class="btn sm '+(mine?'sc':'ghost')+'" data-help="'+esc(a.id)+'" data-on="'+mine+'">도움됐어요 '+hs.length+'</button>':'<span class="small muted">도움됐어요 '+hs.length+'</span>')+
      (a.author===me.uid||isAdmin?'<button class="btn sm danger" data-adel="'+esc(a.id)+'">삭제</button>':'')+'</div></article>';
  }).join(''):'<div class="empty" style="padding:18px 0">아직 답변이 없습니다.</div>';

  root.innerHTML='<p class="small"><a href="#tab='+S.tab+'">목록으로</a></p>'+
    '<article class="panel" style="margin-top:10px"><div class="meta"><span class="bwant '+esc(q.want)+'">'+esc(WANT[q.want])+'</span>'+tagsHtml(q.tags,(prof&&prof.tags)||[])+(q.status!=='open'?'<span class="bstat">'+(q.status==='resolved'?'해결됨':'마감')+'</span>':'')+'</div>'+
    '<p class="biz-body">'+esc(q.body)+'</p><div class="meta small"><span>'+esc(q.author_label)+(q.anonymous?'':' · '+esc(schoolShort(q.school_id)))+'</span><span>'+fmtDate(q.created_at)+'</span></div>'+
    (isAuthor||isAdmin?'<div class="biz-reach">분야가 맞는 원우 <b>'+reach(q.tags,q.author)+'명</b>의 "나에게 맞는 문제"에 보이고 있습니다.</div>':'')+
    (isAuthor||isAdmin?'<div class="acts">'+(q.status==='open'?'<button class="btn sm sc" data-qs="resolved">해결됐어요</button>':'<button class="btn sm ghost" data-qs="open">다시 열기</button>')+
      '<a class="btn sm ghost" href="#newproject?from='+esc(q.id)+'">프로젝트로 만들기</a><button class="btn sm danger" data-qdel="1">삭제</button></div>':'')+'</article>'+
    '<div class="seg biz-tabs" style="margin-top:20px" role="tablist"><button data-dt="conn" aria-selected="'+(defTab==='conn')+'">연결 제안 '+conns.length+'</button><button data-dt="ans" aria-selected="'+(defTab==='ans')+'">답변 '+answers.length+'</button></div>'+
    '<div id="bz-conn"'+(defTab==='conn'?'':' hidden')+'>'+connHtml+'</div><div id="bz-ans"'+(defTab==='ans'?'':' hidden')+'>'+ansHtml+'</div>'+
    (!isAuthor&&q.status==='open'?'<div class="biz-actbar"><button class="btn" id="bz-wa">답변하기</button><button class="btn sc" id="bz-wc">아는 사람 연결하기</button></div><div id="bz-form"></div>':'')+
    (helpers.length?'<h3 class="h-m" style="margin:28px 0 10px">이 분야를 도울 수 있는 원우</h3><div class="grid g2">'+helpers.map(pCard).join('')+'</div>':'');

  $$('[data-dt]',root).forEach(b=>b.onclick=()=>{$$('[data-dt]',root).forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));$('#bz-conn').hidden=b.dataset.dt!=='conn';$('#bz-ans').hidden=b.dataset.dt!=='ans';});
  root.onclick=async e=>{
    const t=e.target.closest('button');if(!t)return;
    try{
      if(t.dataset.acc||t.dataset.dec){const r=await M.SB.rpc('biz_respond',{p_conn:t.dataset.acc||t.dataset.dec,p_accept:!!t.dataset.acc});if(r.error)throw r.error;toast(t.dataset.acc?'연결을 받았습니다. 서로의 연락처가 보입니다':'제안을 거절했습니다');return refresh();}
      if(t.dataset.cdel){const r=await M.SB.from('biz_connections').delete().eq('id',t.dataset.cdel);if(r.error)throw r.error;return refresh();}
      if(t.dataset.help){const on=t.dataset.on==='true';const r=on?await M.SB.from('biz_helpful').delete().eq('answer_id',t.dataset.help).eq('member_id',me.uid):await M.SB.from('biz_helpful').insert({answer_id:t.dataset.help,member_id:me.uid});if(r.error)throw r.error;return viewQuestion(id);}
      if(t.dataset.adel){if(!confirm('이 답변을 삭제할까요?'))return;const r=await M.SB.from('biz_answers').delete().eq('id',t.dataset.adel);if(r.error)throw r.error;return refresh();}
      if(t.dataset.qs){const r=await M.SB.from('biz_questions').update({status:t.dataset.qs,resolved_at:t.dataset.qs==='resolved'?new Date().toISOString():null}).eq('id',id);if(r.error)throw r.error;toast(t.dataset.qs==='resolved'?'해결됨으로 표시했습니다':'다시 열었습니다');return refresh();}
      if(t.dataset.qdel){if(!confirm('이 문제와 답변·연결 제안이 모두 삭제됩니다. 계속할까요?'))return;const r=await M.SB.from('biz_questions').delete().eq('id',id);if(r.error)throw r.error;toast('삭제했습니다');await loadAll();location.hash='#tab=mine';return;}
    }catch(x){err(x);}
  };
  $$('.bz-stage',root).forEach(s=>s.onchange=async()=>{const r=await M.SB.rpc('biz_set_stage',{p_conn:s.dataset.c,p_stage:s.value});if(r.error)return err(r.error);toast('진행 단계를 '+STAGE[s.value]+'(으)로 바꿨습니다');});
  const wa=$('#bz-wa'),wc=$('#bz-wc');
  if(wa)wa.onclick=()=>answerForm(q);
  if(wc)wc.onclick=()=>connectForm(q);
}
function answerForm(q){
  const f=$('#bz-form');
  f.innerHTML='<form class="panel form" id="bza" style="margin-top:12px"><div class="field"><label for="bza-t">답변</label><textarea class="input" id="bza-t" maxlength="2000" placeholder="경험이나 방법, 참고할 곳을 적어 주세요."></textarea></div><div><button class="btn">답변 올리기</button></div></form>';
  $('#bza-t').focus();
  $('#bza').addEventListener('submit',async e=>{e.preventDefault();const v=$('#bza-t').value.trim();if(v.length<2)return toast('답변을 적어 주세요');
    const r=await M.SB.from('biz_answers').insert({question_id:q.id,author:me.uid,author_label:myLabel(),body:v});if(r.error)return err(r.error);toast('답변을 올렸습니다');refresh();});
}
function connectForm(q){
  const f=$('#bz-form');
  f.innerHTML='<form class="panel form" id="bzc" style="margin-top:12px"><h3 class="h-m">사람 연결 제안</h3>'+
    '<div class="field"><label>누구를 연결할까요?</label><div class="seg" id="bzc-type">'+Object.keys(CTYPE).map(k=>'<button type="button" data-v="'+k+'" aria-selected="'+(k==='member')+'">'+esc(CTYPE[k])+'</button>').join('')+'</div></div>'+
    '<div class="field" id="bzc-m"><label for="bzc-q">원우 찾기</label><input class="input" id="bzc-q" placeholder="이름, 회사, 분야로 찾기" autocomplete="off"><div id="bzc-list" class="bzc-list"></div><div class="hint">사업 프로필을 올린 원우만 찾을 수 있습니다.</div></div>'+
    '<div class="field" id="bzc-x" hidden><label for="bzc-name">소개할 분 (이름 · 직함)</label><input class="input" id="bzc-name" maxlength="80" placeholder="예: 홍길동 ○○세무법인 대표세무사"><div class="hint">외부 분의 연락처는 받지 않습니다. 작성자가 연결을 받으면 소개한 원우가 따로 이어 줍니다.</div></div>'+
    '<div class="field"><label for="bzc-msg">메시지</label><textarea class="input" id="bzc-msg" maxlength="500" style="min-height:90px" placeholder="왜 이분이 도움이 될지 한두 줄로 적어 주세요."></textarea></div>'+
    '<p class="tiny">소개 대가(수수료·포인트)는 주고받지 않습니다. 환자 소개 알선이나 사건 소개료는 법으로 금지되어 있습니다.</p>'+
    '<div><button class="btn sc">연결 제안하기</button></div></form>';
  let type='member',pick=null;
  $$('#bzc-type button').forEach(b=>b.onclick=()=>{type=b.dataset.v;$$('#bzc-type button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));$('#bzc-m').hidden=type!=='member';$('#bzc-x').hidden=type!=='external';});
  const list=$('#bzc-list');
  const paint=()=>{const k=$('#bzc-q').value.trim();
    const cands=S.profiles.filter(p=>p.member_id!==me.uid&&p.member_id!==q.author&&(!k||(p.name+p.headline+p.tags.join()+p.offers).includes(k)))
      .sort((a,b)=>overlap(b.tags,q.tags)-overlap(a.tags,q.tags)).slice(0,8);
    list.innerHTML=cands.map(p=>'<button type="button" data-m="'+esc(p.member_id)+'" aria-pressed="'+(pick===p.member_id)+'"><b>'+esc(p.name)+'</b> <span class="small muted">'+esc(schoolShort(p.school_id))+' · '+esc(p.headline||'')+'</span><span class="small">'+esc((p.offers||'').slice(0,60))+'</span></button>').join('')||'<div class="small muted">찾는 원우가 없습니다.</div>';};
  $('#bzc-q').addEventListener('input',paint);paint();
  list.onclick=e=>{const b=e.target.closest('button');if(!b)return;pick=b.dataset.m;paint();};
  $('#bzc').addEventListener('submit',async e=>{
    e.preventDefault();
    const row={question_id:q.id,proposer:me.uid,proposer_label:myLabel(),type,message:$('#bzc-msg').value.trim()};
    if(type==='member'){if(!pick)return toast('연결할 원우를 고르세요');const p=S.profiles.find(x=>x.member_id===pick);row.target_member=pick;row.target_label=(p.name+' '+(p.headline||'')).trim().slice(0,80);}
    if(type==='external'){const n=$('#bzc-name').value.trim();if(!n)return toast('소개할 분의 이름과 직함을 적어 주세요');row.target_label=n;}
    const r=await M.SB.from('biz_connections').insert(row);if(r.error)return err(r.error);toast('연결을 제안했습니다. 작성자가 받으면 서로의 연락처가 보입니다');refresh();
  });
}

/* ---------- 프로젝트 ---------- */
function viewNewProject(fromId){
  const root=$('#biz');const q=fromId&&S.qs.find(x=>x.id===fromId);
  root.innerHTML='<p class="small"><a href="'+(q?'#q='+esc(q.id):'#tab=projects')+'">돌아가기</a></p><form class="panel form" id="bnp" style="margin-top:10px;max-width:760px"><h2 class="h-m">프로젝트 만들기</h2>'+
    (q?'<p class="small muted">"'+esc(q.body.slice(0,60))+'…" 문제에서 시작합니다.</p>':'')+
    '<div class="field"><label for="bnp-t">프로젝트 이름</label><input class="input" id="bnp-t" maxlength="80"></div>'+
    '<div class="field"><label for="bnp-d">무엇을 함께 하나요?</label><textarea class="input" id="bnp-d" maxlength="2000" placeholder="목표, 진행 방식, 일정"></textarea></div>'+
    '<div class="field"><label for="bnp-r">필요한 역할 (쉼표로 구분)</label><input class="input" id="bnp-r" placeholder="예: 의료 자문, 마케팅, 재무 모델링"></div>'+
    '<div class="grid g2"><div class="field"><label>분야 (최대 3개)</label><div class="btag-pick" id="bnp-tags"></div></div><div class="field"><label for="bnp-dl">모집 마감일 (선택)</label><input class="input" type="date" id="bnp-dl"></div></div>'+
    '<p class="tiny">수익 배분은 참여자 합의와 법률 검토 후 정합니다. 소개 대가는 주고받지 않습니다.</p><button class="btn sc">프로젝트 만들기</button></form>';
  if(q)$('#bnp-d').value='원래 문제: '+q.body+'\n\n';
  const getTags=tagPicker($('#bnp-tags'),q?q.tags:[],3);
  $('#bnp').addEventListener('submit',async e=>{
    e.preventDefault();const title=$('#bnp-t').value.trim(),desc=$('#bnp-d').value.trim();
    if(title.length<2||desc.length<10)return toast('이름(2자 이상)과 설명(10자 이상)을 적어 주세요');
    try{
      const r=await M.SB.from('biz_projects').insert({title,description:desc,origin_question:q?q.id:null,tags:getTags(),leader:me.uid,leader_label:myLabel(),deadline:$('#bnp-dl').value||null}).select('id').single();
      if(r.error)throw r.error;
      const roles=$('#bnp-r').value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,12).map(n=>({project_id:r.data.id,name:n.slice(0,40)}));
      if(roles.length){const rr=await M.SB.from('biz_project_roles').insert(roles);if(rr.error)throw rr.error;}
      toast('프로젝트를 만들었습니다');await loadAll();location.hash='#p='+r.data.id;
    }catch(x){err(x);}
  });
}
async function viewProject(id){
  const root=$('#biz');root.innerHTML='<div class="empty">불러오는 중…</div>';
  const [pr,rr]=await Promise.all([M.SB.from('biz_projects').select('*').eq('id',id).maybeSingle(),M.SB.from('biz_project_roles').select('*').eq('project_id',id).order('created_at')]);
  const p=pr.data;if(!p){root.innerHTML='<div class="panel">프로젝트를 찾을 수 없습니다. <a href="#tab=projects">목록으로</a></div>';return;}
  const roles=rr.data||[],isLeader=p.leader===me.uid,isAdmin=me.role==='admin';
  root.innerHTML='<p class="small"><a href="#tab=projects">프로젝트 목록</a></p><article class="panel" style="margin-top:10px">'+
    '<div class="meta"><span class="bstat p-'+esc(p.status)+'">'+esc(PSTATUS[p.status])+'</span>'+tagsHtml(p.tags)+(p.deadline?'<span class="small muted">모집 마감 '+esc(p.deadline)+'</span>':'')+'</div>'+
    '<h2 class="h-l" style="margin-top:8px">'+esc(p.title)+'</h2><p class="muted small">리더 '+esc(p.leader_label)+' · '+fmtDate(p.created_at)+(p.origin_question?' · <a href="#q='+esc(p.origin_question)+'">시작된 문제 보기</a>':'')+'</p>'+
    '<p class="biz-body">'+esc(p.description)+'</p>'+
    (isLeader||isAdmin?'<div class="acts"><label class="small">상태 <select class="input" id="bp-st" style="width:auto;padding:6px 8px">'+Object.keys(PSTATUS).map(k=>'<option value="'+k+'"'+(k===p.status?' selected':'')+'>'+PSTATUS[k]+'</option>').join('')+'</select></label><button class="btn sm danger" id="bp-del">삭제</button></div>':'')+'</article>'+
    '<h3 class="h-m" style="margin:24px 0 8px">필요한 역할</h3>'+
    (roles.length?roles.map(r=>'<div class="biz-role"><div><b>'+esc(r.name)+'</b><div class="small muted">'+(r.status==='open'?'모집 중':r.status==='applied'?esc(r.member_label)+' 님 신청 · 리더 확인 중':esc(r.member_label)+' 님 참여')+'</div></div><div class="acts" style="margin:0">'+
      (r.status==='open'&&!isLeader&&p.status!=='done'?'<button class="btn sm sc" data-ap="'+esc(r.id)+'">참여 신청</button>':'')+
      (r.status==='applied'&&r.member_id===me.uid?'<button class="btn sm ghost" data-un="'+esc(r.id)+'">신청 취소</button>':'')+
      (r.status==='applied'&&isLeader?'<button class="btn sm sc" data-ok="'+esc(r.id)+'">승인</button><button class="btn sm ghost" data-no="'+esc(r.id)+'">반려</button>':'')+
      (isLeader&&r.status==='open'?'<button class="btn sm danger" data-rd="'+esc(r.id)+'">삭제</button>':'')+'</div></div>').join(''):'<div class="empty" style="padding:16px 0">아직 정한 역할이 없습니다.</div>')+
    (isLeader?'<form id="bp-add" style="display:flex;gap:8px;margin-top:12px"><input class="input" maxlength="40" placeholder="역할 추가 (예: 법률 검토)" aria-label="역할 이름"><button class="btn sm">추가</button></form>':'')+
    '<p class="note">참여가 확정되면 리더와 참여자가 연락처를 주고받아 진행하세요. 수익 배분은 합의와 법률 검토 후 정하고, 소개 대가는 주고받지 않습니다.</p>';
  root.onclick=async e=>{
    const t=e.target.closest('button');if(!t||t.id==='bp-del'&&!confirm('프로젝트를 삭제할까요?'))return;
    try{
      let r=null;
      if(t.id==='bp-del'){r=await M.SB.from('biz_projects').delete().eq('id',id);if(r.error)throw r.error;await loadAll();location.hash='#tab=projects';return;}
      if(t.dataset.ap)r=await M.SB.rpc('biz_apply_role',{p_role:t.dataset.ap,p_label:myLabel(),p_apply:true});
      if(t.dataset.un)r=await M.SB.rpc('biz_apply_role',{p_role:t.dataset.un,p_label:'',p_apply:false});
      if(t.dataset.ok||t.dataset.no)r=await M.SB.rpc('biz_decide_role',{p_role:t.dataset.ok||t.dataset.no,p_approve:!!t.dataset.ok});
      if(t.dataset.rd)r=await M.SB.from('biz_project_roles').delete().eq('id',t.dataset.rd);
      if(r&&r.error)throw r.error;
      if(r){toast(t.dataset.ap?'참여를 신청했습니다. 리더가 확인합니다':'반영했습니다');await loadAll();viewProject(id);}
    }catch(x){err(x);}
  };
  const st=$('#bp-st');if(st)st.onchange=async()=>{const r=await M.SB.from('biz_projects').update({status:st.value}).eq('id',id);if(r.error)return err(r.error);toast('상태를 '+PSTATUS[st.value]+'(으)로 바꿨습니다');await loadAll();};
  const add=$('#bp-add');if(add)add.addEventListener('submit',async e=>{e.preventDefault();const v=$('input',add).value.trim();if(!v)return;
    const r=await M.SB.from('biz_project_roles').insert({project_id:id,name:v});if(r.error)return err(r.error);await loadAll();viewProject(id);});
}

document.addEventListener('mba:me',()=>initProfile());
window.BIZ={mount:initBiz,profile:initProfile,reset:()=>{ready=false;me=null;prof=null;}};
document.addEventListener('DOMContentLoaded',()=>{if(document.body.dataset.page==='biz')initBiz();});
})();
