
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ROOT=document.body.dataset.root||'';
const st={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8);
const pct=(v,s)=>v==null||isNaN(v)?'–':(s&&v>0?'+':'')+(v<0?'−':'')+Math.abs(v).toFixed(1)+'%';
const track=n=>{try{if(window.goatcounter&&window.goatcounter.count)window.goatcounter.count({path:n,title:n,event:true})}catch(e){}};
let IDX=null;const loadIdx=()=>IDX||(IDX=fetch(ROOT+'index.json').then(r=>{if(!r.ok)throw 0;return r.json()}).catch(()=>({f:[],co:[],sec:{},err:1})));
const LOADFAIL='Could not load the filing data. Check your connection and reload the page.';
/* 테마 */
const root=document.documentElement,tb=$('#theme');
const isDark=()=>root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
const upd=()=>{if(!tb)return;const d=isDark();tb.textContent=d?'Light mode':'Dark mode';tb.setAttribute('aria-pressed',d)};
if(tb){upd();tb.onclick=()=>{root.dataset.theme=isDark()?'light':'dark';st.set('alr-theme',root.dataset.theme);upd()}}
/* 관심종목 */
let watch=new Set();try{watch=new Set(JSON.parse(st.get('alr-watch')||'[]'))}catch(e){}
const setStar=c=>$$('.star[data-code="'+c+'"]').forEach(x=>x.setAttribute('aria-pressed',watch.has(c)));
const today=()=>{const d=new Date();return ''+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')};
const toggleWatch=c=>{watch.has(c)?watch.delete(c):(watch.add(c),track('watch-add'));if(watch.size&&!st.get('alr-seen'))st.set('alr-seen',today());
 st.set('alr-watch',JSON.stringify([...watch]));setStar(c);apply();updBadge()};
const badge=$('#wl-badge');
async function updBadge(){if(!badge)return;if(!watch.size||$('#wl')){badge.hidden=true;return}
 const idx=await loadIdx(),seen=st.get('alr-seen')||'';const n=idx.f.filter(f=>watch.has(f.c)&&f.d>seen).length;
 badge.textContent=n;badge.hidden=!n;badge.setAttribute('aria-label',n+' new filing'+(n===1?'':'s')+' from your watchlist')}
$$('.star').forEach(b=>{b.setAttribute('aria-pressed',watch.has(b.dataset.code));
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleWatch(b.dataset.code)})});
/* 장부 필터·정렬 (주소에 상태 저장) */
const P=new URLSearchParams(location.search);
let topic=P.get('topic')||'all',q=(P.get('q')||'').toLowerCase(),only=P.get('watch')==='1',sort=P.get('sort')||'order',sec=P.get('sector')||'all';
const qi=$('#q'),so=$('#sort'),wo=$('#watchonly'),se=$('#sec');
if(se){se.value=sec;if(se.value!==sec){sec='all';se.value='all'}se.onchange=()=>{sec=se.value;apply()}}
if(qi)qi.value=q;if(so)so.value=sort;if(wo)wo.setAttribute('aria-pressed',only);
$$('.chip[data-topic]').forEach(c=>{c.setAttribute('aria-pressed',c.dataset.topic===topic);c.onclick=()=>{topic=c.dataset.topic;
 $$('.chip[data-topic]').forEach(x=>x.setAttribute('aria-pressed',x===c));apply()}});
if(qi)qi.oninput=()=>{q=qi.value.trim().toLowerCase();apply()};
if(wo)wo.onclick=()=>{only=!only;wo.setAttribute('aria-pressed',only);apply()};
if(so)so.onchange=()=>{sort=so.value;apply()};
const ok=r=>(topic==='all'||r.dataset.topic===topic)&&(sec==='all'||r.dataset.sector===sec)&&(!q||r.dataset.search.includes(q))&&(!only||watch.has(r.dataset.code));
function apply(){
 const L=$('#ledger');if(!L)return;
 const rows=$$('#ledger>.entry');
 const v=r=>{const x=parseFloat(r.dataset[sort]);return isNaN(x)?-Infinity:x};
 rows.sort((a,b)=>sort==='order'?(+a.dataset.order)-(+b.dataset.order):(v(b)-v(a))||((+a.dataset.order)-(+b.dataset.order)));
 let n=0;rows.forEach(r=>{const s=ok(r);r.hidden=!s;L.appendChild(r);if(s){n++;r.querySelector('.rank').textContent=n}});
 $$('#more tr[data-topic]').forEach(r=>r.hidden=!ok(r));
 const e=$('#empty');if(e)e.hidden=n>0;
 const u=new URLSearchParams();if(topic!=='all')u.set('topic',topic);if(sec!=='all')u.set('sector',sec);if(q)u.set('q',q);if(only)u.set('watch','1');if(sort!=='order')u.set('sort',sort);
 try{history.replaceState(null,'',(u.toString()?'?'+u:location.pathname)+location.hash)}catch(e){}
}
/* 목록 검색 (회사 목록 등) */
$$('input[data-filter]').forEach(i=>i.oninput=()=>{const v=i.value.trim().toLowerCase();$$(i.dataset.filter).forEach(r=>r.hidden=!!v&&!r.dataset.search.includes(v))});
/* 주가 차트 위에서 날짜별 가격 */
$$('svg.spark').forEach(svg=>{let p=[];try{p=JSON.parse(svg.dataset.pts||'[]')}catch(e){}
 const cap=svg.parentElement.querySelector('.cap'),dot=svg.querySelector('.hover');if(!p.length||!cap)return;
 const def=cap.textContent;
 const mv=ev=>{const r=svg.getBoundingClientRect();let i=Math.round((ev.clientX-r.left)/r.width*(p.length-1));
  i=Math.max(0,Math.min(p.length-1,i));const a=p[i];cap.textContent=a[0]+'  KRW '+Math.round(a[1]).toLocaleString('en-US');
  if(dot){dot.setAttribute('cx',a[2]);dot.setAttribute('cy',a[3]);dot.style.display='block'}};
 svg.addEventListener('pointermove',mv);svg.addEventListener('pointerdown',mv);
 svg.addEventListener('pointerleave',()=>{cap.textContent=def;if(dot)dot.style.display='none'})});
/* 공유: 휴대폰은 공유 창, 컴퓨터는 링크 복사 */
$$('.share').forEach(b=>b.onclick=async e=>{e.preventDefault();track('share');const url=location.origin+location.pathname+'#'+b.dataset.anchor;
 try{if(navigator.share){await navigator.share({title:b.dataset.text,url});return}await navigator.clipboard.writeText(url);b.textContent='Link copied'}
 catch(err){b.textContent='Copy failed'}setTimeout(()=>b.textContent='Share',2000)});
/* 주소의 #r… 로 들어오면 그 공시를 펼침 */
const openHash=()=>{const h=location.hash.slice(1);if(!h)return;const el=document.getElementById(h);if(el&&el.tagName==='DETAILS'){el.open=true;el.scrollIntoView({block:'start'})}};
window.addEventListener('hashchange',openHash);
/* 검색 창 (⌘K, Ctrl+K, /) */
const pal=$('#pal'),pq=$('#pal-q'),pr=$('#pal-r');let sel=0,res=[];
const PAGES=[['Latest brief','index.html'],['Screener','screener.html'],['After the filing','signals.html'],['Companies','companies.html'],['Watchlist','watchlist.html'],['Archive','archive.html'],['Pro','pro.html'],['How it works','about.html']];
function openPal(){if(!pal)return;track('search-open');pal.hidden=false;pq.value='';pq.focus();render('')}
function closePal(){if(pal&&!pal.hidden){pal.hidden=true;if(document.activeElement)document.activeElement.blur()}}
async function render(v){
 v=v.trim().toLowerCase();const idx=await loadIdx();
 const pages=PAGES.filter(p=>!v||p[0].toLowerCase().includes(v)).map(p=>({t:p[0],s:'Page',u:ROOT+p[1]}));
 const cos=v?idx.co.filter(c=>(c.n+' '+(c.ko||'')+' '+c.c).toLowerCase().includes(v)).slice(0,8).map(c=>({t:c.n,s:c.c+c.s+', '+c.k+' filing'+(c.k>1?'s':''),u:ROOT+'c/'+c.c+'.html'})):[];
 const fs=v?idx.f.filter(f=>(f.n+' '+(f.ko||'')+' '+f.c+' '+f.h+' '+f.tl).toLowerCase().includes(v)).slice(0,8).map(f=>({t:f.h,s:f.n+', '+iso(f.d),u:ROOT+'briefs/'+iso(f.d)+'.html#r'+f.id})):[];
 res=[...cos,...fs,...pages].slice(0,14);sel=0;
 pr.innerHTML=res.length?res.map((r,i)=>'<li role="option" aria-selected="'+(i===sel)+'"><a href="'+esc(r.u)+'">'+esc(r.t)+'<span class="sub">'+esc(r.s)+'</span></a></li>').join(''):'<li class="empty">No matches.</li>';
}
if(pal){pq.oninput=()=>render(pq.value);pal.onclick=e=>{if(e.target===pal)closePal()};
 pq.onkeydown=e=>{const li=$$('#pal-r li[role=option]');if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+li.length)%Math.max(li.length,1);
  li.forEach((x,i)=>x.setAttribute('aria-selected',i===sel));if(li[sel])li[sel].scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'&&res[sel]){location.href=res[sel].u;closePal()}else if(e.key==='Escape')closePal()}}
$$('.open-pal').forEach(b=>b.onclick=openPal);
/* 단축키: J·K 이동, O 펼치기, S 관심종목 */
let cur=-1;
document.addEventListener('keydown',e=>{
 const typing=/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
 if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!typing)){e.preventDefault();openPal();return}
 if(e.key==='Escape'){closePal();return}
 if(typing||e.metaKey||e.ctrlKey||e.altKey||(pal&&!pal.hidden))return;
 const rows=$$('#ledger>.entry').filter(r=>!r.hidden);if(!rows.length)return;
 if(e.key==='j'||e.key==='k'){e.preventDefault();cur=Math.max(0,Math.min(rows.length-1,cur+(e.key==='j'?1:-1)));
  rows.forEach(r=>r.classList.remove('kb'));const r=rows[cur];r.classList.add('kb');r.querySelector('summary').focus();r.scrollIntoView({block:'nearest'})}
 else if(e.key==='o'&&rows[cur]){rows[cur].open=!rows[cur].open}
 else if(e.key==='s'&&rows[cur]){toggleWatch(rows[cur].dataset.code)}
});
/* 검색기 */
const scr=$('#scr');
if(scr){const S=new URLSearchParams(location.search);const F={t:S.get('t')||'all',m:S.get('m')||'',sec:S.get('sec')||'',imp:S.get('imp')||'',rev:S.get('rev')||'',from:S.get('from')||'',to:S.get('to')||'',q:S.get('q')||'',k:S.get('k')||'d',dir:S.get('dir')||'desc'};
 const ids={m:'#scr-mkt',sec:'#scr-sec',imp:'#scr-imp',rev:'#scr-rev',from:'#scr-from',to:'#scr-to',q:'#scr-q'};
 Object.entries(ids).forEach(([k,s])=>{const el=$(s);if(!el)return;el.value=F[k];el.oninput=el.onchange=()=>{F[k]=el.value;draw()}});
 $$('#scr-topics .chip').forEach(c=>{c.setAttribute('aria-pressed',c.dataset.t===F.t);c.onclick=()=>{F.t=c.dataset.t;$$('#scr-topics .chip').forEach(x=>x.setAttribute('aria-pressed',x===c));draw()}});
 $$('#scr th button.sort').forEach(b=>b.onclick=()=>{if(F.k===b.dataset.k)F.dir=F.dir==='desc'?'asc':'desc';else{F.k=b.dataset.k;F.dir='desc'}draw()});
 let rows=[],IDX_SEC={};
 function filt(f){const d=iso(f.d);
  return (F.t==='all'||f.t===F.t)&&(!F.m||f.s===F.m)&&(!F.sec||f.sc===F.sec)&&(!F.imp||(f.imp!=null&&f.imp>=+F.imp))&&(!F.rev||(f.rev!=null&&f.rev>=+F.rev))
   &&(!F.from||d>=F.from)&&(!F.to||d<=F.to)&&(!F.q||(f.n+' '+(f.ko||'')+' '+f.c+' '+f.h+' '+f.ty).toLowerCase().includes(F.q.toLowerCase()))}
 async function draw(){const idx=await loadIdx();IDX_SEC=idx.sec||{};
  rows=idx.f.filter(filt);const k=F.k,s=F.dir==='desc'?-1:1;
  rows.sort((a,b)=>{const x=a[k],y=b[k];if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:x<y?-1:0)*s});
  $$('#scr th button.sort').forEach(b=>b.setAttribute('aria-sort',b.dataset.k===F.k?(F.dir==='desc'?'descending':'ascending'):'none'));
  $('#scr-count').textContent=idx.err?LOADFAIL:rows.length.toLocaleString('en-US')+' filing'+(rows.length===1?'':'s')+(rows.length>400?', showing the first 400':'');
  scr.tBodies[0].innerHTML=rows.slice(0,400).map(f=>'<tr><td class="num">'+iso(f.d)+'</td><td class="co"><a href="'+ROOT+'c/'+f.c+'.html">'+esc(f.n)+'</a><span class="sub">'+esc(f.c+f.s)+(f.sc&&idx.sec&&idx.sec[f.sc]?', '+esc(idx.sec[f.sc]):'')+'</span></td><td>'+esc(f.tl)+'</td><td class="what"><a href="'+ROOT+'briefs/'+iso(f.d)+'.html#r'+f.id+'">'+esc(f.h)+'</a></td><td class="num">'+pct(f.imp)+'</td><td class="num">'+pct(f.rev)+'</td><td class="num">'+pct(f.mv,1)+'</td><td class="num">'+pct(f.x5,1)+'</td></tr>').join('')||'<tr><td colspan="8" class="empty">'+(idx.err?LOADFAIL:'No filings match. Loosen a filter.')+'</td></tr>';
  const u=new URLSearchParams();Object.entries(F).forEach(([k,v])=>{if(v&&!(k==='t'&&v==='all')&&!(k==='k'&&v==='d')&&!(k==='dir'&&v==='desc'))u.set(k,v)});
  try{history.replaceState(null,'',u.toString()?'?'+u:location.pathname)}catch(e){}}
 const csv=$('#scr-csv');if(csv)csv.onclick=()=>{const head=['date','company','korean_name','ticker','sector','topic','filing_type','headline','amount_krw','market_cap_krw','size_vs_mcap_pct','share_of_revenue_pct','day_move_pct','r1','r5','r20','x1','x5','x20','filing_url'];
  const qq=v=>v==null?'':'"'+String(v).replace(/"/g,'""')+'"';
  const lines=[head.join(',')].concat(rows.map(f=>[iso(f.d),f.n,f.ko,f.c+f.s,(IDX_SEC[f.sc]||''),f.tl,f.ty,f.h,f.a,f.m,f.imp,f.rev,f.mv,f.r1,f.r5,f.r20,f.x1,f.x5,f.x20,'https://dart.fss.or.kr/dsaf001/main.do?rcpNo='+f.id].map(qq).join(',')));
  track('csv-download');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+lines.join('\n')],{type:'text/csv'}));a.download='korea-filings-screen.csv';a.click()};
 const cl=$('#scr-link');if(cl)cl.onclick=async()=>{track('screen-link');try{await navigator.clipboard.writeText(location.href);cl.textContent='Link copied'}catch(e){cl.textContent='Copy failed'}setTimeout(()=>cl.textContent='Copy link to this screen',2000)};
 draw()}
/* 공시 후 주가 반응 통계 */
const sig=$('#sig');
if(sig){const w=$('#sig-w'),m=$('#sig-m'),g=$('#sig-g');
 const B=x=>x==null?'No size measure':x<5?'Under 5% of market cap':x<20?'5 to 20%':x<50?'20 to 50%':'50% or more';
 const BO=['Under 5% of market cap','5 to 20%','20 to 50%','50% or more','No size measure'];
 const med=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):null};
 async function draw(){const idx=await loadIdx();const key=(m.value==='x'?'x':'r')+w.value;const by={};
  idx.f.forEach(f=>{const v=f[key];if(v==null)return;const k=g.value==='size'?B(f.imp):g.value==='sector'?((idx.sec||{})[f.sc]||'Sector not known'):f.tl;(by[k]=by[k]||[]).push(v)});
  let ks=Object.keys(by);ks.sort(g.value==='size'?(a,b)=>BO.indexOf(a)-BO.indexOf(b):(a,b)=>by[b].length-by[a].length);
  const stats=ks.map(k=>{const a=by[k];return{k,n:a.length,md:med(a),av:a.reduce((x,y)=>x+y,0)/a.length,up:a.filter(x=>x>0).length/a.length*100}});
  const solid=stats.filter(s=>s.n>=10),mx=Math.max(1,...(solid.length?solid:stats).map(s=>Math.abs(s.md)));
  const total=stats.reduce((x,s)=>x+s.n,0);$('#sig-count').textContent=idx.err?LOADFAIL:total.toLocaleString('en-US')+' filing'+(total===1?'':'s')+' with '+w.value+'-day price data';
  sig.tBodies[0].innerHTML=stats.map(s=>{const wd=Math.min(50,Math.abs(s.md)/mx*50);return'<tr class="'+(s.n<10?'thin':'')+'"><td>'+esc(s.k)+'</td><td class="num">'+s.n+'</td><td class="num">'+pct(s.md,1)+'</td><td class="num">'+pct(s.av,1)+'</td><td class="num">'+s.up.toFixed(0)+'%</td><td class="bar-cell"><div class="dv" aria-hidden="true"><i class="'+(s.md>=0?'up':'dn')+'" style="width:'+wd.toFixed(1)+'%"></i></div></td></tr>'}).join('')||'<tr><td colspan="6" class="empty">'+(idx.err?LOADFAIL:'Not enough price data yet. Each filing joins these numbers once '+w.value+' trading days have passed.')+'</td></tr>'}
 [w,m,g].forEach(x=>x.onchange=draw);draw()}
/* 관심종목 페이지: 이 브라우저에만 저장, 링크로 다른 기기에 옮기기, RSS 리더용 OPML */
const wl=$('#wl');
if(wl){
 async function wdraw(){const idx=await loadIdx();const co={};idx.co.forEach(c=>co[c.c]=c);const seen=st.get('alr-seen')||'';
  const codes=[...watch].filter(c=>co[c]);
  $('#wl-cos').innerHTML=codes.map(c=>'<li class="wl-co"><a href="'+ROOT+'c/'+esc(c)+'.html">'+esc(co[c].n)+'</a><span class="sub">'+esc(c+co[c].s)+'</span><button type="button" data-rm="'+esc(c)+'" aria-label="Remove '+esc(co[c].n)+'">×</button></li>').join('');
  $$('#wl-cos button[data-rm]').forEach(b=>b.onclick=()=>{toggleWatch(b.dataset.rm);wdraw()});
  const rows=idx.f.filter(f=>watch.has(f.c)).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0),nNew=seen?rows.filter(f=>f.d>seen).length:0;
  $('#wl-count').textContent=idx.err?LOADFAIL:codes.length?codes.length+' compan'+(codes.length===1?'y':'ies')+', '+rows.length+' filing'+(rows.length===1?'':'s')+(nNew?', '+nNew+' new since your last visit':''):'No companies yet';
  const tw=wl.closest('.tablewrap'),we=$('#wl-empty');if(tw)tw.hidden=!rows.length;if(we)we.hidden=!!rows.length;
  if(we&&!rows.length)we.innerHTML=idx.err?LOADFAIL:'Your watchlist is empty. Tap ★ next to a company on any <a href="'+ROOT+'index.html">daily brief</a> or <a href="'+ROOT+'companies.html">company page</a>, and its filings collect here.';
  wl.tBodies[0].innerHTML=rows.slice(0,300).map(f=>'<tr><td class="num">'+iso(f.d)+'</td><td class="co"><a href="'+ROOT+'c/'+esc(f.c)+'.html">'+esc(f.n)+'</a></td><td>'+esc(f.tl)+'</td><td class="what">'+(seen&&f.d>seen?'<span class="newtag">New</span>':'')+'<a href="'+ROOT+'briefs/'+iso(f.d)+'.html#r'+esc(f.id)+'">'+esc(f.h)+'</a></td><td class="num">'+pct(f.imp)+'</td><td class="num">'+pct(f.x5,1)+'</td></tr>').join('')
   ||'<tr><td colspan="6" class="empty">'+(idx.err?LOADFAIL:'Your watchlist is empty. Tap ★ next to a company on any <a href="'+ROOT+'index.html">daily brief</a> or <a href="'+ROOT+'companies.html">company page</a>, and its filings collect here.')+'</td></tr>';
  const mx=idx.f.reduce((m,f)=>f.d>m?f.d:m,'');if(mx&&codes.length)st.set('alr-seen',mx)}
 const W=P.get('w'),ib=$('#wl-import');
 if(W&&ib){const add=[...new Set(W.split(',').map(x=>x.trim().toUpperCase()))].filter(c=>/^[0-9A-Z]{6}$/.test(c)&&!watch.has(c));
  if(add.length){ib.hidden=false;ib.querySelector('span').textContent='This link adds '+add.length+' compan'+(add.length===1?'y':'ies')+' to your watchlist.';
   ib.querySelector('button').onclick=()=>{add.forEach(c=>watch.add(c));if(!st.get('alr-seen'))st.set('alr-seen',today());st.set('alr-watch',JSON.stringify([...watch]));track('watch-import');ib.hidden=true;wdraw()}}}
 const ob=$('#wl-opml'),obt=ob?ob.textContent:'';
 if(ob)ob.onclick=async()=>{const idx=await loadIdx();const co={};idx.co.forEach(c=>co[c.c]=c);const codes=[...watch].filter(c=>co[c]);
  if(!codes.length){ob.textContent='Star a company first';setTimeout(()=>ob.textContent=obt,2000);return}
  const u=p=>new URL(ROOT+p,location.href).href,t=c=>esc(co[c].n+' ('+c+co[c].s+')');
  const x='<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0"><head><title>Korea filings watchlist</title></head><body>'
   +'<outline text="Korea filings watchlist" title="Korea filings watchlist">\n'
   +codes.map(c=>'<outline type="rss" text="'+t(c)+'" title="'+t(c)+'" xmlUrl="'+esc(u('c/'+c+'.xml'))+'" htmlUrl="'+esc(u('c/'+c+'.html'))+'"/>').join('\n')
   +'\n</outline></body></opml>\n';
  track('opml-download');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([x],{type:'text/x-opml'}));a.download='korea-filings-watchlist.opml';a.click()};
 const lb=$('#wl-link'),lbt=lb?lb.textContent:'';
 if(lb)lb.onclick=async()=>{if(!watch.size){lb.textContent='Star a company first';setTimeout(()=>lb.textContent=lbt,2000);return}
  const url=new URL(ROOT+'watchlist.html',location.href);url.search='?w='+[...watch].join(',');track('watchlist-link');
  try{await navigator.clipboard.writeText(url.href);lb.textContent='Link copied'}catch(e){lb.textContent='Copy failed'}setTimeout(()=>lb.textContent=lbt,2000)};
 wdraw()}
/* Pro 수요 조사: 클릭 수만 셈 (이메일 등 개인정보는 받지 않음) */
$$('[data-want]').forEach(b=>b.onclick=()=>{track('want-'+b.dataset.want);$$('[data-want]').forEach(x=>x.setAttribute('aria-pressed',x===b));const t=$('#poll-thanks');if(t)t.hidden=false});
const pi=$('#pro-intent');if(pi)pi.onclick=()=>{track('pro-intent');pi.disabled=true;pi.setAttribute('aria-pressed','true');const t=$('#intent-thanks');if(t)t.hidden=false};
apply();openHash();updBadge();
})();
