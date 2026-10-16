/* MBA Lounge 홈페이지 공통 스크립트
 * - 앱(app-web.html)과 같은 Supabase 프로젝트·같은 members 테이블을 사용한다.
 * - 가입은 누구나 바로(학교 선택 포함). 학교 커뮤니티(앱) 이용은 학교 관리자 승인(status='approved') 후.
 * - 승인 대기 중에도 홈페이지 공개 게시판은 이용할 수 있다.
 */
(function(){
'use strict';
const SB_URL='https://jvzkruingckrsdnvvekz.supabase.co';
const SB_KEY='sb_publishable_M2KZd5PeoHEwwpTFxVwsCg_8tjYRkfB';

/* 앱의 schools 배열과 동일한 id·이름·색 */
const SCHOOLS=[
  {id:'yonsei',name:'연세대학교',short:'연세',color:'#003876'},
  {id:'snu',name:'서울대학교',short:'서울',color:'#16348C'},
  {id:'kaist',name:'카이스트',short:'KAIST',color:'#004191'},
  {id:'korea',name:'고려대학교',short:'고려',color:'#8E0E1F'},
  {id:'sogang',name:'서강대학교',short:'서강',color:'#B3242F'},
  {id:'hanyang',name:'한양대학교',short:'한양',color:'#1A6FAF'},
  {id:'ewha',name:'이화여자대학교',short:'이화',color:'#00462A'},
  {id:'cau',name:'중앙대학교',short:'중앙',color:'#1240AB'},
  {id:'konkuk',name:'건국대학교',short:'건국',color:'#036B3F'},
  {id:'skku',name:'성균관대학교',short:'성균관',color:'#0F6B5C'}
];
const CATS={free:'자유',qna:'입학·진학 Q&A',event:'모임·행사',job:'커리어'};
const ROOT=document.documentElement.dataset.root||'';   /* 하위 폴더 페이지는 '../' */
const byId=id=>SCHOOLS.find(s=>s.id===id);

let SB=null;
try{
  if(window.supabase&&window.supabase.createClient){
    SB=window.supabase.createClient(SB_URL,SB_KEY,{
      /* 앱과 다른 저장 키: 홈페이지 로그아웃이 앱 로그인을 끊지 않게 한다 */
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'mba_site_auth'},
      global:{headers:{'x-client-info':'mba-lounge-site'}}
    });
  }
}catch(e){SB=null;}

/* ---------- 유틸 ---------- */
const $=(s,el)=>(el||document).querySelector(s);
const $$=(s,el)=>Array.from((el||document).querySelectorAll(s));
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2800);}
function mask(name){name=String(name||'').trim();if(name.length<=1)return name||'원우';if(name.length===2)return name[0]+'*';return name[0]+'*'.repeat(name.length-2)+name[name.length-1];}
function sbEmail(sid,schoolId){return String(sid).trim().toLowerCase().replace(/[^a-z0-9._-]/g,'_')+'@'+schoolId+'.mbalounge.app';}
function withTimeout(p,ms){return Promise.race([p,new Promise((_,rj)=>setTimeout(()=>rj(new Error('timeout')),ms||12000))]);}
function qs(k){return new URLSearchParams(location.search).get(k);}
function fmtDate(iso){const d=new Date(iso);if(isNaN(d))return '';return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');}
/* 한국 시간 기준 오늘 (YYYY-MM-DD) */
function todayKST(){const d=new Date(Date.now()+9*3600*1000);return d.toISOString().slice(0,10);}
function addDays(ymd,n){const d=new Date(ymd+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}

/* ---------- 세션·회원 ---------- */
let ME=null, ME_LOADED=false;
async function session(){if(!SB)return null;try{const r=await SB.auth.getSession();return (r.data&&r.data.session)||null;}catch(e){return null;}}
async function loadMe(){
  if(ME_LOADED)return ME;
  ME_LOADED=true;
  const s=await session();if(!s)return ME=null;
  try{
    const r=await withTimeout(SB.from('members').select('*').eq('id',s.user.id).maybeSingle());
    ME=r.data||null; if(ME)ME.uid=s.user.id;
  }catch(e){ME=null;}
  return ME;
}
async function signOut(){try{if(SB)await withTimeout(SB.auth.signOut(),4000);}catch(e){}
  try{localStorage.removeItem('mba_site_auth');}catch(e){} location.href=ROOT+'index.html';}

const STATUS_TXT={pending:'승인 대기',approved:'커뮤니티 회원',rejected:'승인 거절'};
function statusBadge(st){return '<span class="badge '+esc(st)+'">'+esc(STATUS_TXT[st]||st)+'</span>';}

/* ---------- 헤더 ---------- */
async function header(){
  const btn=$('.menu-btn'),nav=$('.nav');
  if(btn&&nav)btn.addEventListener('click',()=>{const o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false');});
  const who=$('#who');if(!who)return;
  const me=await loadMe();
  if(me){
    who.innerHTML=(me.role==='admin'&&me.status==='approved'?'<a class="btn sm ghost" href="'+ROOT+'admin.html">관리자</a>':'')+
      '<a class="btn sm ghost" href="'+ROOT+'me.html">'+esc(me.name)+' 님</a>';
  }else{
    who.innerHTML='<a class="btn sm ghost" href="'+ROOT+'join.html?mode=login">로그인</a><a class="btn sm" href="'+ROOT+'join.html">가입하기</a>';
  }
}

/* ---------- 원서 접수 상태 ---------- */
function deadlineState(start,end){
  const t=todayKST();
  if(t>end)return ['closed','마감'];
  if(t>=start){const left=Math.round((new Date(end)-new Date(t))/864e5);return ['open',left===0?'오늘 마감':'접수 중 · D-'+left];}
  if(addDays(t,21)>=start)return ['soon','곧 시작'];
  return ['soon','예정'];
}
function paintDeadlines(){
  $$('[data-start][data-end]').forEach(el=>{
    const [k,txt]=deadlineState(el.dataset.start,el.dataset.end);
    const b=el.querySelector('.state');if(b){b.className='state '+k;b.textContent=txt;}
    el.dataset.state=k;
  });
  /* 홈: 마감된 일정은 뒤로 */
  const order={open:0,soon:1,closed:2};
  $$('.dl-list').forEach(list=>{
    const items=$$('.dl',list);
    items.sort((a,b)=>(order[a.dataset.state]-order[b.dataset.state])||a.dataset.end.localeCompare(b.dataset.end)).forEach(x=>list.appendChild(x));
    if(list.id==='dl-home')items.forEach((x,i)=>{x.hidden=i>=8;});
  });
}

/* ---------- 공개 게시판 ---------- */
function postMeta(p){
  const s=byId(p.school_id);
  return (s?'<span class="chip" style="--c:'+s.color+';padding:2px 9px;font-size:12.5px;cursor:default"><span class="dot"></span>'+esc(s.short)+'</span>':'')+
    '<span>'+esc(CATS[p.cat]||'자유')+'</span><span>'+esc(p.author_label||'원우')+'</span><span>'+fmtDate(p.created_at)+'</span>';
}
async function latestPosts(el,limit){
  if(!SB){el.innerHTML='<div class="empty">게시판에 연결할 수 없습니다.</div>';return;}
  try{
    const r=await withTimeout(SB.from('site_posts').select('id,school_id,cat,title,author_label,created_at').order('created_at',{ascending:false}).limit(limit||5));
    if(r.error)throw r.error;
    if(!r.data.length){el.innerHTML='<div class="empty">아직 글이 없습니다. 첫 글을 남겨 보세요.</div>';return;}
    el.innerHTML=r.data.map(p=>'<a class="post" style="display:block;text-decoration:none" href="'+ROOT+'board.html#p-'+esc(p.id)+'"><div class="meta">'+postMeta(p)+'</div><h3>'+esc(p.title)+'</h3></a>').join('');
  }catch(e){el.innerHTML='<div class="empty">게시판을 불러오지 못했습니다.</div>';}
}

async function initBoard(){
  const listEl=$('#posts'),formWrap=$('#write');
  let fSchool=qs('school')||'all',fCat='all';
  /* 필터 */
  const fs=$('#f-school');
  fs.innerHTML='<button class="chip" data-v="all" aria-pressed="true">전체 학교</button>'+SCHOOLS.map(s=>'<button class="chip" style="--c:'+s.color+'" data-v="'+s.id+'" aria-pressed="false"><span class="dot"></span>'+esc(s.short)+'</button>').join('');
  const fc=$('#f-cat');
  fc.innerHTML='<button class="chip" data-v="all" aria-pressed="true">모든 글</button>'+Object.keys(CATS).map(k=>'<button class="chip" data-v="'+k+'" aria-pressed="false">'+esc(CATS[k])+'</button>').join('');
  function sync(){$$('button',fs).forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===fSchool?'true':'false'));$$('button',fc).forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===fCat?'true':'false'));}
  fs.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;fSchool=b.dataset.v;sync();load();});
  fc.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;fCat=b.dataset.v;sync();load();});
  sync();

  const me=await loadMe();
  /* 글쓰기 */
  if(!me){
    formWrap.innerHTML='<div class="panel flat"><b>글을 쓰려면 가입하세요.</b><p class="muted small" style="margin-top:4px">학번과 학교만 있으면 바로 가입되고, 승인 전에도 공개 게시판은 이용할 수 있습니다.</p><div style="display:flex;gap:8px;margin-top:12px"><a class="btn sm" href="join.html">가입하기</a><a class="btn sm ghost" href="join.html?mode=login&next=board.html">로그인</a></div></div>';
  }else if(me.status==='rejected'){
    formWrap.innerHTML='<div class="panel flat">가입이 거절된 계정은 글을 쓸 수 없습니다. 학교 관리자에게 문의하세요.</div>';
  }else{
    formWrap.innerHTML='<form class="panel form" id="wf"><div class="h-m">새 글 쓰기</div>'+
      '<div class="field"><label for="w-cat">분류</label><select class="input" id="w-cat">'+Object.keys(CATS).map(k=>'<option value="'+k+'">'+esc(CATS[k])+'</option>').join('')+'</select></div>'+
      '<div class="field"><label for="w-title">제목</label><input class="input" id="w-title" maxlength="120" required></div>'+
      '<div class="field"><label for="w-body">내용</label><textarea class="input" id="w-body" maxlength="5000" required></textarea>'+
      '<div class="hint">공개 게시판은 로그인하지 않은 방문자도 읽을 수 있습니다. 이름은 '+esc(mask(me.name))+'처럼 가려서 표시됩니다.</div></div>'+
      '<div><button class="btn" id="w-go">게시하기</button></div></form>';
    $('#wf').addEventListener('submit',async e=>{
      e.preventDefault();
      const title=$('#w-title').value.trim(),body=$('#w-body').value.trim();
      if(!title||!body){toast('제목과 내용을 입력하세요');return;}
      const b=$('#w-go');b.disabled=true;
      try{
        const r=await withTimeout(SB.from('site_posts').insert({author:me.uid,school_id:me.school_id,cat:$('#w-cat').value,title,body,author_label:mask(me.name)}));
        if(r.error)throw r.error;
        $('#w-title').value='';$('#w-body').value='';toast('게시했습니다');load();
      }catch(err){toast('게시하지 못했습니다. 잠시 후 다시 시도하세요');}
      finally{b.disabled=false;}
    });
  }

  async function load(){
    listEl.innerHTML='<div class="empty">불러오는 중…</div>';
    if(!SB){listEl.innerHTML='<div class="empty">게시판에 연결할 수 없습니다.</div>';return;}
    let q=SB.from('site_posts').select('*').order('created_at',{ascending:false}).limit(60);
    if(fSchool!=='all')q=q.eq('school_id',fSchool);
    if(fCat!=='all')q=q.eq('cat',fCat);
    try{
      const r=await withTimeout(q);if(r.error)throw r.error;
      if(!r.data.length){listEl.innerHTML='<div class="empty">조건에 맞는 글이 없습니다.</div>';return;}
      listEl.innerHTML=r.data.map(p=>'<article class="post" id="p-'+esc(p.id)+'" data-id="'+esc(p.id)+'"><div class="meta">'+postMeta(p)+'</div>'+
        '<h3 tabindex="0" role="button" aria-expanded="false">'+esc(p.title)+'</h3><div class="more" hidden><div class="body">'+esc(p.body)+'</div>'+
        '<div class="acts">'+((me&&(me.uid===p.author||(me.role==='admin'&&me.status==='approved'&&me.school_id===p.school_id)))?'<button class="btn sm danger" data-act="del">삭제</button>':'')+
        (me&&me.uid!==p.author?'<button class="btn sm ghost" data-act="report">신고</button>':'')+'</div>'+
        '<div class="cmts"></div></div></article>').join('');
      const h=location.hash.slice(1);if(h){const el=document.getElementById(h);if(el){open(el);el.scrollIntoView({block:'start'});}}
    }catch(e){listEl.innerHTML='<div class="empty">게시판을 불러오지 못했습니다.</div>';}
  }
  function open(art){const m=$('.more',art),h=$('h3',art);const on=m.hidden;m.hidden=!on;h.setAttribute('aria-expanded',on?'true':'false');if(on)loadComments(art);}
  listEl.addEventListener('click',async e=>{
    const art=e.target.closest('.post');if(!art)return;
    if(e.target.closest('h3')){open(art);return;}
    const act=e.target.closest('[data-act]');if(!act)return;
    const id=art.dataset.id;
    if(act.dataset.act==='del'){
      if(!confirm('이 글을 삭제할까요?'))return;
      const r=await SB.from('site_posts').delete().eq('id',id);
      if(r.error){toast('삭제하지 못했습니다');return;} art.remove();toast('삭제했습니다');
    }
    if(act.dataset.act==='report'){
      const reason=prompt('신고 사유를 적어주세요 (예: 욕설, 광고, 개인정보 노출)');if(!reason)return;
      const r=await SB.from('reports').insert({reporter:me.uid,kind:'site_post',target_who:id,target_txt:$('h3',art).textContent.slice(0,2000),reason:reason.slice(0,200),detail:''});
      toast(r.error?'신고를 접수하지 못했습니다':'신고를 접수했습니다. 관리자가 확인합니다');
    }
    if(act.dataset.act==='cdel'){
      const r=await SB.from('site_comments').delete().eq('id',act.dataset.c);
      if(r.error){toast('삭제하지 못했습니다');return;} loadComments(art);
    }
  });
  listEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('h3')){open(e.target.closest('.post'));}});
  async function loadComments(art){
    const box=$('.cmts',art),id=art.dataset.id;
    const r=await SB.from('site_comments').select('*').eq('post_id',id).order('created_at',{ascending:true});
    const rows=(r.data||[]);
    box.innerHTML=rows.map(c=>'<div class="cmt"><div class="meta">'+esc(c.author_label||'원우')+' · '+fmtDate(c.created_at)+
      (me&&me.uid===c.author?' · <button class="btn sm ghost" style="padding:1px 7px;font-size:12px" data-act="cdel" data-c="'+esc(c.id)+'">삭제</button>':'')+'</div>'+esc(c.body)+'</div>').join('')+
      (me&&me.status!=='rejected'?'<form class="cf" style="display:flex;gap:8px;margin-top:12px"><input class="input" maxlength="1000" placeholder="댓글 쓰기" aria-label="댓글"><button class="btn sm">등록</button></form>':'');
    const f=$('.cf',box);
    if(f)f.addEventListener('submit',async e=>{e.preventDefault();const v=$('input',f).value.trim();if(!v)return;
      const ins=await SB.from('site_comments').insert({post_id:id,author:me.uid,author_label:mask(me.name),body:v});
      if(ins.error){toast('댓글을 등록하지 못했습니다');return;} loadComments(art);});
  }
  load();
}

/* ---------- 가입·로그인 ---------- */
function initJoin(){
  let picked=qs('school');
  const pick=$('#pick');
  pick.innerHTML=SCHOOLS.map(s=>'<button type="button" style="--c:'+s.color+'" data-v="'+s.id+'" aria-pressed="'+(s.id===picked)+'"><span class="dot"></span>'+esc(s.short)+'</button>').join('');
  pick.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;picked=b.dataset.v;$$('button',pick).forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));});

  const tabs=$$('.seg button');
  function mode(m){tabs.forEach(t=>t.setAttribute('aria-selected',t.dataset.m===m?'true':'false'));$('#f-signup').hidden=m!=='signup';$('#f-login').hidden=m!=='login';}
  tabs.forEach(t=>t.addEventListener('click',()=>mode(t.dataset.m)));
  mode(qs('mode')==='login'?'login':'signup');
  const next=qs('next')||'me.html';
  const v=id=>$('#'+id).value.trim();

  $('#f-signup').addEventListener('submit',async e=>{
    e.preventDefault();
    if(!picked){toast('학교를 선택하세요');return;}
    const sid=v('su-sid'),name=v('su-name'),gisu=v('su-gisu'),pw=$('#su-pw').value;
    if(!sid||!name||!gisu){toast('학번, 이름, 기수를 입력하세요');return;}
    if(pw.length<6){toast('비밀번호는 6자 이상으로 입력하세요');return;}
    if(!$('#su-agree').checked){toast('이용약관과 커뮤니티 규정에 동의해 주세요');return;}
    if(!SB){toast('서버에 연결할 수 없습니다. 네트워크를 확인하세요');return;}
    const btn=$('#su-go');btn.disabled=true;btn.textContent='가입 중…';
    const s=byId(picked);
    try{
      const st=await withTimeout(SB.rpc('sid_status',{p_school:picked,p_sid:sid}));
      if(st.error)throw st.error;
      if(st.data){toast(st.data==='pending'?'이미 가입 신청된 학번입니다. 로그인하세요':'이미 가입된 학번입니다. 로그인하세요');mode('login');$('#lg-sid').value=sid;return;}
      const su=await withTimeout(SB.auth.signUp({email:sbEmail(sid,picked),password:pw}),15000);
      if(su.error){toast(/already/i.test(su.error.message||'')?'이미 가입된 학번입니다':'가입하지 못했습니다. 잠시 후 다시 시도하세요');return;}
      const uid=su.data&&su.data.user&&su.data.user.id;
      if(!uid){toast('가입하지 못했습니다. 잠시 후 다시 시도하세요');return;}
      /* 앱의 acctToRow 와 같은 모양으로 저장 (회사·직함 등은 앱 프로필에서 채움) */
      const row={id:uid,status:'pending',sid:sid,name:name,school:s.name,school_id:s.id,gisu:gisu,course:v('su-course')||'MBA',
        company:v('su-company'),title:v('su-title'),head:'',email:v('su-email'),phone:'',birth:'',photo:'',career:[],clubs:[],officer:'',role:'member',exposure:'basic'};
      const ins=await withTimeout(SB.from('members').insert(row));
      if(ins.error){toast(/duplicate|unique/i.test(ins.error.message||'')?'이미 가입된 학번입니다':'가입 정보를 저장하지 못했습니다');return;}
      location.href='me.html?welcome=1';
    }catch(err){toast('가입하지 못했습니다. 네트워크를 확인하고 다시 시도하세요');}
    finally{btn.disabled=false;btn.textContent='가입하기';}
  });

  $('#f-login').addEventListener('submit',async e=>{
    e.preventDefault();
    const sid=v('lg-sid'),pw=$('#lg-pw').value;
    if(!sid||!pw){toast('학번과 비밀번호를 입력하세요');return;}
    if(!SB){toast('서버에 연결할 수 없습니다');return;}
    const btn=$('#lg-go');btn.disabled=true;btn.textContent='확인 중…';
    try{
      const em=await withTimeout(SB.rpc('login_email',{p_sid:sid}));
      if(em.error)throw em.error;
      if(!em.data){toast('가입되지 않은 학번입니다');return;}
      const r=await withTimeout(SB.auth.signInWithPassword({email:em.data,password:pw}),15000);
      if(r.error){toast('비밀번호가 맞지 않습니다');return;}
      location.href=next;
    }catch(err){toast('로그인하지 못했습니다. 네트워크를 확인하세요');}
    finally{btn.disabled=false;btn.textContent='로그인';}
  });
}

/* ---------- 내 라운지 ---------- */
async function initMe(){
  const box=$('#me');
  const me=await loadMe();
  if(!me){
    const s=await session();
    box.innerHTML=s?'<div class="panel">회원 정보를 찾을 수 없습니다. 로그아웃 후 다시 가입해 주세요.<div style="margin-top:12px"><button class="btn sm ghost" id="out">로그아웃</button></div></div>'
      :'<div class="panel">로그인이 필요합니다.<div style="margin-top:12px"><a class="btn sm" href="join.html?mode=login">로그인</a></div></div>';
    const o=$('#out');if(o)o.onclick=signOut;return;
  }
  const s=byId(me.school_id)||{name:me.school,short:me.school,color:'#6C5CE7'};
  document.documentElement.style.setProperty('--sc',s.color);
  const welcome=qs('welcome')?'<div class="panel flat" style="margin-bottom:16px"><b>가입했습니다.</b> 공개 게시판은 지금 바로 쓸 수 있고, '+esc(s.short)+' 커뮤니티는 학교 관리자가 승인하면 열립니다.</div>':'';
  const step=(on,done,t,d)=>'<li style="opacity:'+(on||done?1:.55)+'"><b>'+(done?'✓ ':'')+t+'</b><br><span class="muted small">'+d+'</span></li>';
  const st=me.status;
  box.innerHTML=welcome+
   '<div class="panel"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">'+
     '<div><div class="h-m">'+esc(me.name)+' 님</div><div class="muted small">'+esc(s.name)+' · '+esc(me.gisu)+'기 · 학번 '+esc(me.sid)+'</div></div>'+statusBadge(st)+'</div>'+
   '<ol class="f-points" style="list-style:none">'+
     step(false,true,'가입·학교 등록','학번과 학교를 등록했습니다. 공개 게시판을 이용할 수 있습니다.')+
     step(st==='pending',st==='approved',esc(s.short)+' 관리자 승인',st==='rejected'?'승인이 거절되었습니다. 학번·기수가 맞는지 학교 관리자에게 문의하세요.':'학교 관리자가 학번과 기수를 확인합니다. 보통 1~3일 걸립니다.')+
     step(st==='approved',false,esc(s.short)+' 커뮤니티 입장','학교 게시판, 족보, 동아리, 원우수첩을 앱과 웹에서 이용합니다.')+
   '</ol>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">'+
     (st==='approved'?'<a class="btn sc" href="app-web.html">'+esc(s.short)+' 커뮤니티 열기</a>':'')+
     '<a class="btn ghost" href="board.html">공개 게시판</a><a class="btn ghost" href="schools/'+esc(me.school_id)+'.html">'+esc(s.short)+' MBA 페이지</a>'+
     (me.role==='admin'&&st==='approved'?'<a class="btn ghost" href="admin.html">가입 승인 관리</a>':'')+
   '</div>'+
   (st==='approved'?'<p class="tiny" style="margin-top:12px">커뮤니티는 앱과 같은 화면입니다. 처음 열 때 같은 학번과 비밀번호로 한 번 더 로그인하세요.</p>':'')+
   '</div>'+
   '<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap"><button class="btn sm ghost" id="out">로그아웃</button><button class="btn sm danger" id="del">'+(st==='approved'?'회원 탈퇴':'가입 취소')+'</button></div>';
  $('#out').onclick=signOut;
  $('#del').onclick=async()=>{
    if(!confirm('계정과 작성한 내용이 삭제되며 되돌릴 수 없습니다. 계속할까요?'))return;
    const r=await SB.rpc('delete_own_account');
    if(r.error){toast('처리하지 못했습니다. 잠시 후 다시 시도하세요');return;}
    toast('계정을 삭제했습니다');setTimeout(signOut,1200);
  };
}

/* ---------- 관리자: 가입 승인 · 학교 소식 ---------- */
async function initAdmin(){
  const box=$('#admin');
  const me=await loadMe();
  if(!me||me.role!=='admin'||me.status!=='approved'){
    box.innerHTML='<div class="panel">학교 관리자만 이용할 수 있습니다. '+(me?'':'<a href="join.html?mode=login&next=admin.html">관리자 계정으로 로그인</a>')+'</div>';return;
  }
  const s=byId(me.school_id);
  document.documentElement.style.setProperty('--sc',s.color);
  $('#admin-school').textContent=s.name;
  box.innerHTML=
   '<section class="panel" aria-labelledby="q-h"><div class="blk-head" style="margin-bottom:8px"><h2 class="h-m" id="q-h">가입 승인 대기</h2><button class="btn sm ghost" id="q-re">새로고침</button></div>'+
   '<p class="muted small">학번·이름·기수가 실제 '+esc(s.short)+' MBA 원우인지 확인한 뒤 승인하세요. 승인하면 앱과 웹의 '+esc(s.short)+' 커뮤니티에 바로 들어올 수 있습니다.</p><div id="queue" style="margin-top:10px"></div></section>'+
   '<section class="panel" style="margin-top:20px" aria-labelledby="n-h"><h2 class="h-m" id="n-h">학교 소식 등록</h2>'+
   '<p class="muted small">동문회보·학교 보도자료 등 공식 기사의 링크를 등록하면 '+esc(s.short)+' 페이지의 소식에 표시됩니다. 기사 본문은 붙여넣지 말고, 두세 줄 요약과 원문 링크만 등록하세요.</p>'+
   '<form id="nf" class="form" style="margin-top:14px"><div class="grid g2"><div class="field"><label for="n-title">기사 제목</label><input class="input" id="n-title" maxlength="160" required></div>'+
   '<div class="field"><label for="n-url">원문 주소</label><input class="input" id="n-url" type="url" placeholder="https://" required></div>'+
   '<div class="field"><label for="n-src">출처</label><input class="input" id="n-src" maxlength="60" placeholder="예: 연세동문회보" required></div>'+
   '<div class="field"><label for="n-date">게재일</label><input class="input" id="n-date" type="date" required></div></div>'+
   '<div class="field"><label for="n-sum">요약 (직접 쓴 두세 줄)</label><textarea class="input" id="n-sum" maxlength="300" style="min-height:90px"></textarea></div>'+
   '<div><button class="btn sc" id="n-go">소식 등록</button></div></form><div id="nlist" style="margin-top:18px"></div></section>';
  $('#q-re').onclick=queue;
  async function queue(){
    const w=$('#queue');w.innerHTML='<div class="muted small">불러오는 중…</div>';
    const r=await SB.from('members').select('id,sid,name,gisu,course,company,title,created_at,status').eq('school_id',me.school_id).eq('status','pending').order('created_at',{ascending:true});
    if(r.error){w.innerHTML='<div class="muted small">목록을 불러오지 못했습니다.</div>';return;}
    if(!r.data.length){w.innerHTML='<div class="empty" style="padding:20px 0">승인을 기다리는 신청이 없습니다.</div>';return;}
    w.innerHTML='<div class="small" style="font-weight:700;margin-bottom:6px">'+r.data.length+'명 대기 중</div>'+r.data.map(m=>
      '<div class="post" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>'+esc(m.name)+'</b> · 학번 '+esc(m.sid)+' · '+esc(m.gisu)+'기'+
      '<div class="muted small">'+esc([m.company,m.title].filter(Boolean).join(' / ')||'회사 정보 미입력')+' · 신청 '+fmtDate(m.created_at)+'</div></div>'+
      '<button class="btn sm sc" data-ok="'+esc(m.sid)+'">승인</button><button class="btn sm danger" data-no="'+esc(m.sid)+'">거절</button></div>').join('');
  }
  $('#queue').addEventListener('click',async e=>{
    const ok=e.target.closest('[data-ok]'),no=e.target.closest('[data-no]');if(!ok&&!no)return;
    const sid=(ok||no).dataset.ok||(ok||no).dataset.no;
    if(no&&!confirm('이 신청을 거절할까요?'))return;
    const r=await SB.from('members').update({status:ok?'approved':'rejected'}).eq('sid',sid).eq('school_id',me.school_id);
    if(r.error){toast('처리하지 못했습니다');return;}
    toast(ok?'승인했습니다':'거절했습니다');queue();
  });
  async function news(){
    const w=$('#nlist');
    const r=await SB.from('school_news').select('*').eq('school_id',me.school_id).order('published_on',{ascending:false}).limit(30);
    if(r.error){w.innerHTML='<div class="muted small">등록된 소식을 불러오지 못했습니다.</div>';return;}
    w.innerHTML=(r.data.length?'<div class="small" style="font-weight:700">등록한 소식</div>':'')+r.data.map(n=>
      '<div class="news" style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1"><div class="src">'+esc(n.source_name)+' · '+esc(n.published_on)+'</div><h3><a href="'+esc(n.url)+'" target="_blank" rel="noopener">'+esc(n.title)+'</a></h3></div>'+
      '<button class="btn sm danger" data-nd="'+esc(n.id)+'">삭제</button></div>').join('');
  }
  $('#nlist').addEventListener('click',async e=>{const b=e.target.closest('[data-nd]');if(!b||!confirm('이 소식을 삭제할까요?'))return;
    const r=await SB.from('school_news').delete().eq('id',b.dataset.nd);toast(r.error?'삭제하지 못했습니다':'삭제했습니다');news();});
  $('#nf').addEventListener('submit',async e=>{
    e.preventDefault();
    const url=$('#n-url').value.trim();
    if(!/^https:\/\//.test(url)){toast('https:// 로 시작하는 주소를 입력하세요');return;}
    const r=await SB.from('school_news').insert({school_id:me.school_id,title:$('#n-title').value.trim(),url,source_name:$('#n-src').value.trim(),
      published_on:$('#n-date').value,summary:$('#n-sum').value.trim(),added_by:me.uid});
    if(r.error){toast('등록하지 못했습니다');return;}
    e.target.reset();toast('소식을 등록했습니다');news();
  });
  queue();news();
}

/* ---------- 학교 페이지: 관리자 등록 소식 + 자동 수집 소식 ---------- */
async function initSchool(){
  const id=document.body.dataset.school;
  const box=$('#live-news');if(!box)return;
  const items=[];
  if(SB){
    try{const r=await withTimeout(SB.from('school_news').select('title,url,source_name,published_on,summary').eq('school_id',id).order('published_on',{ascending:false}).limit(8));
      (r.data||[]).forEach(n=>items.push({title:n.title,url:n.url,src:n.source_name,date:n.published_on,sum:n.summary}));}catch(e){}
  }
  try{const r=await fetch(ROOT+'assets/data/feed.json',{cache:'no-cache'});if(r.ok){const f=await r.json();
    (f.items||[]).filter(x=>x.school_id===id).slice(0,6).forEach(n=>items.push({title:n.title,url:n.url,src:n.source_name,date:n.date,sum:''}));}}catch(e){}
  const seen=new Set();
  const list=items.filter(n=>/^https:\/\//.test(n.url)&&!seen.has(n.url)&&seen.add(n.url)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  if(!list.length)return;
  box.innerHTML='<h3 class="h-m" style="margin-bottom:4px">새로 등록된 소식</h3>'+list.map(n=>'<a class="news" href="'+esc(n.url)+'" target="_blank" rel="noopener"><div class="src">'+esc(n.src)+' · '+esc(n.date)+'</div><h3>'+esc(n.title)+'</h3>'+(n.sum?'<p>'+esc(n.sum)+'</p>':'')+'</a>').join('');
}

/* ---------- 시작 ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  header();
  paintDeadlines();
  const p=document.body.dataset.page;
  if(p==='home'){const el=$('#latest');if(el)latestPosts(el,5);}
  if(p==='board')initBoard();
  if(p==='join')initJoin();
  if(p==='me')initMe();
  if(p==='admin')initAdmin();
  if(p==='school')initSchool();
});
})();
