const TABS=[["plan","Tomorrow's plan"],["menu","Menu & products"],["records","Daily records"],["surplus","Surplus & impact"],["settings","Settings"]];
const SEED=[["2026-09-24",430,195.6,171.6],["2026-09-25",407,214.4,167.5],["2026-09-26",364,191.5,154.4],["2026-09-27",441,231.1,192.6],["2026-09-28",518,244.8,211],["2026-09-29",465,253.9,195.3],["2026-09-30",452,246.3,195.5],["2026-10-01",409,201.2,164.9],["2026-10-02",416,204.1,173],["2026-10-03",403,196.8,172.6],["2026-10-04",490,250.2,195.5],["2026-10-05",437,223.1,179.9],["2026-10-06",444,226,188.3],["2026-10-07",461,233.6,201.4]].map(r=>({date:r[0],people:r[1],prep:r[2],eaten:r[3]}));
const DEF={banner:"plan",name:"Shiva Kumar",org:"Amma Hotel",city:"Medchal",att:500,limit:12,alerts:true,buffer:4,cost:65,theme:"auto"};
const MENU=[["Steamed rice","Mains",250],["Sambar","Curries",120],["Dal","Curries",80],["Mixed veg curry","Curries",100],["Curd","Sides",60],["Papad","Sides",5]].map((m,i)=>({id:i+1,name:m[0],cat:m[1],g:m[2],on:true}));
const MENU_BASE=MENU.reduce((a,m)=>a+m.g,0);
const clone=o=>JSON.parse(JSON.stringify(o));
let S={records:clone(SEED),assign:{},menu:clone(MENU),set:{...DEF}},tab="plan",showAll=false,opts={menu:1,event:1,rain:1};
try{const x=JSON.parse(localStorage.getItem("zerobin")||"null");if(x&&x.records)S={...S,...x,set:{...DEF,...x.set}}}catch(e){}
const $=s=>document.querySelector(s);
const save=()=>{renderBanners();try{localStorage.setItem("zerobin",JSON.stringify(S))}catch(e){}};
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)};
const f1=n=>(Math.round(n*10)/10).toLocaleString("en-IN",{minimumFractionDigits:1,maximumFractionDigits:1});
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const nv=(id,d,min)=>{const v=parseFloat($("#"+id).value);return Number.isFinite(v)&&v>=min?v:d};
const rs=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const sorted=()=>[...S.records].sort((a,b)=>a.date<b.date?-1:1);
const waste=r=>r.prep-r.eaten, pct=r=>waste(r)/r.prep*100;

function bannersHTML(){
  const st=S.set,c=calc(),r=c.r;if(!st.alerts)return "";let h="";
  if(c.w3>st.limit)h+=`<div class="banner">Waste was ${f1(c.w3)}% over the last 3 days, above your ${st.limit}% limit. Cook the recommended amount tomorrow.</div>`;
  const un=r.slice(-7).filter(x=>!S.assign[x.date]),kg=un.reduce((a,x)=>a+waste(x),0);
  if(un.length)h+=`<div class="banner">${un.length} days of leftovers (${f1(kg)} kg) have no plan yet. <button class="link" data-go="surplus">Assign leftovers</button></div>`;
  return h}
function renderBanners(){const m=S.set.banner,el=$("#banners");if(!el)return;el.innerHTML=(m==="all"||(m==="plan"&&tab==="plan"))?bannersHTML():""}
function menuFactor(){const t=S.menu.filter(m=>m.on).reduce((a,m)=>a+m.g,0);return Math.max(0.3,Math.min(1.6,t/MENU_BASE))}
function calc(){
  const r=sorted(),st=S.set,pp=r.reduce((a,x)=>a+x.eaten,0)/r.reduce((a,x)=>a+x.people,0);
  const pa=parseFloat(planAtt),att=pa>0?pa:st.att;
  const base=att*pp*(1+st.buffer/100),rec=base*menuFactor()*opts.menu*opts.event*opts.rain;
  const usual=r.slice(-7).reduce((a,x)=>a+x.prep,0)/7*att/ (r.slice(-7).reduce((a,x)=>a+x.people,0)/7);
  const l3=r.slice(-3),w3=l3.reduce((a,x)=>a+waste(x),0)/l3.reduce((a,x)=>a+x.prep,0)*100;
  return{att,pp,rec,usual,w3,r};
}
function render(){
  $("#who").innerHTML=`${esc(S.set.name)}<br>${esc(S.set.org)} · ${esc(S.set.city)}`;
  $("#nav").innerHTML=TABS.map(t=>`<button role="tab" aria-selected="${t[0]==tab}" data-t="${t[0]}">${t[1]}</button>`).join("");
  $("#nav").querySelectorAll("button").forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
  ({plan,menu:menuPage,records,surplus,settings})[tab]();
  renderBanners();
}
let planAtt=null;
function barsHTML(c){const r=c.r,mx=Math.max(...r.map(x=>x.prep),c.rec)*1.05;
  return r.map(x=>`<div class="col" title="${x.date}"><i class="w" style="height:${waste(x)/mx*100}%"></i><i style="height:${x.eaten/mx*100}%"></i></div>`).join("")+`<div class="col t" title="Tomorrow"><i style="height:${c.rec/mx*100}%"></i></div>`}
function hintHTML(c){const st=S.set,saved=Math.max(0,c.usual-c.rec);
  return `About ${Math.round(c.pp*1000)} g eaten per person, plus a ${st.buffer}% safety buffer.<br>Versus your usual habit, you avoid roughly ${Math.round(saved)} kg (${rs(saved*st.cost)}) of waste.`}
function refreshPlan(){const c=calc();$("#rec").textContent=Math.round(c.rec);$("#hint").innerHTML=hintHTML(c);$("#chart").innerHTML=barsHTML(c)}
function plan(){
  const st=S.set,c=calc(),r=c.r;
  const saved=Math.max(0,c.usual-c.rec),over=c.w3>st.limit&&st.alerts;
  const un=r.slice(-7).filter(x=>!S.assign[x.date]),unKg=un.reduce((a,x)=>a+waste(x),0),redir=r.slice(-7).filter(x=>S.assign[x.date]).reduce((a,x)=>a+waste(x),0),mOn=S.menu.filter(m=>m.on),mTot=mOn.reduce((a,m)=>a+m.g,0);
  const wTot=r.reduce((a,x)=>a+waste(x),0),pTot=r.reduce((a,x)=>a+x.prep,0);
  $("#main").innerHTML=`
  <div class="card hero">
    <div class="muted">Cook tomorrow</div>
    <div class="big"><span id="rec">${Math.round(c.rec)}</span> <small>kg</small></div>
    <p id="hint" class="muted" style="margin:10px 0 18px">${hintHTML(c)}</p>
    <p class="muted" style="margin:-6px 0 18px">Menu: ${mOn.length} items on today's menu (${mTot} g per person). <button class="link" data-go="menu">Edit menu</button></p>
    <div style="max-width:260px;margin:0 auto;text-align:left"><label for="att">Expected attendance</label><input id="att" type="number" min="1" value="${esc(planAtt!==null?planAtt:st.att)}"></div>
    <details style="text-align:left;max-width:260px;margin:14px auto 0"><summary>More options</summary>
      <div style="display:grid;gap:10px;margin-top:10px">
        <div><label>Menu appeal</label><select id="menu"><option value="0.95">Low</option><option value="1">Usual menu</option><option value="1.07">High</option></select></div>
        <div><label>Event or holiday nearby</label><select id="event"><option value="1">No</option><option value="1.08">Yes</option></select></div>
        <div><label>Weather</label><select id="rain"><option value="1">Dry</option><option value="0.96">Rain</option></select></div>
      </div></details>
  </div>
  <div class="stats">
    <div class="card"><div class="stat">${f1(wTot/pTot*100)}%</div><div class="muted">Waste rate (14 days)</div></div>
    <div class="card"><div class="stat">${rs(wTot*st.cost)}</div><div class="muted">Cost of waste · ${f1(redir)} kg redirected</div></div>
  </div>
  <div class="card"><h2>Last 14 days</h2><div class="chart" id="chart">${barsHTML(c)}</div>
    <div class="legend"><span><b style="background:var(--good)"></b>Eaten</span><span><b style="background:var(--bad)"></b>Wasted</span><span><b style="background:var(--accent)"></b>Tomorrow's plan</span></div><button class="link" data-go="records">Add today's record</button></div>`;
  $("#menu").value=opts.menu;$("#event").value=opts.event;$("#rain").value=opts.rain;
  ["menu","event","rain"].forEach(i=>$("#"+i).onchange=()=>{opts={menu:+$("#menu").value,event:+$("#event").value,rain:+$("#rain").value};refreshPlan()});
  $("#att").oninput=()=>{planAtt=$("#att").value;refreshPlan()};
}
function records(){
  const r=sorted().reverse(),rows=(showAll?r:r.slice(0,7)).map(x=>`<tr><td>${x.date}</td><td>${f1(x.prep)}</td><td>${f1(x.eaten)}</td><td class="tag ${pct(x)>S.set.limit?"hi":""}">${f1(pct(x))}%</td></tr>`).join("");
  $("#main").innerHTML=`
  <div class="card"><h2>Add today's record</h2>
    <div class="grid">
      <div><label for="d">Date</label><input id="d" type="date" value="${today()}"></div>
      <div><label for="p">Attendance</label><input id="p" type="number" min="1"></div>
      <div><label for="pr">Prepared (kg)</label><input id="pr" type="number" step="0.1" min="0"></div>
      <div><label for="e">Actually eaten (kg)</label><input id="e" type="number" step="0.1" min="0"></div>
    </div>
    <div style="margin-top:16px"><button class="btn" id="add">Save record</button></div>
    <details><summary>Import many records from CSV</summary>
      <p class="muted" style="margin:8px 0 0">One row per day: date, attendance, prepared kg, eaten kg</p>
      <textarea id="csv" rows="3" placeholder="2026-10-08,440,205,188"></textarea>
      <button class="btn" id="imp">Import rows</button></details>
  </div>
  <div class="card"><h2>${showAll?"All records":"Last 7 days"}</h2>
    <table><thead><tr><th>Date</th><th>Prepared</th><th>Eaten</th><th>Waste</th></tr></thead><tbody>${rows}</tbody></table>
    <button class="link" id="all">${showAll?"Show last 7 days":"View all "+r.length+" records"}</button></div>`;
  $("#all").onclick=()=>{showAll=!showAll;records()};
  $("#add").onclick=()=>{
    const x={date:$("#d").value,people:+$("#p").value,prep:+$("#pr").value,eaten:+$("#e").value};
    if(!x.date||!x.people||!x.prep||x.eaten>x.prep||x.eaten<=0)return toast("Fill every field. Eaten can't exceed prepared.");
    S.records=S.records.filter(y=>y.date!==x.date).concat(x);save();toast("Record saved. Choose what happens to the leftovers.");tab="surplus";render();
  };
  $("#imp").onclick=()=>{
    let n=0;$("#csv").value.split("\n").forEach(l=>{const c=l.split(",").map(s=>s.trim());
      if(c.length>=4&&/^\d{4}-\d\d-\d\d$/.test(c[0])&&+c[1]&&+c[2]&&+c[3]<=+c[2]){S.records=S.records.filter(y=>y.date!==c[0]).concat({date:c[0],people:+c[1],prep:+c[2],eaten:+c[3]});n++}});
    save();toast(n?`${n} rows imported`:"No valid rows found");records();
  };
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function menuPage(){
  const M=S.menu,on=M.filter(m=>m.on),tot=on.reduce((a,m)=>a+m.g,0);
  $("#main").innerHTML=`
  <div class="card hero"><div class="muted">Serving per person on today's menu</div>
    <div class="big">${tot}<small> g</small></div>
    <p class="muted" style="margin:10px 0 0">${on.length} of ${M.length} items are on the menu. Switch items off when you don't cook them. This changes tomorrow's kg. <button class="link" data-go="plan">See tomorrow's plan</button></p></div>
  <div class="card"><h2>Menu items</h2>
    ${M.length?M.map(m=>`<div class="row"><div><b>${esc(m.name)}</b><div class="muted">${esc(m.cat)} · ${m.g} g per person</div></div>
      <div class="seg"><button data-tog="${m.id}" class="${m.on?"on":""}">${m.on?"On menu":"Off"}</button><button data-x="${m.id}" aria-label="Remove ${esc(m.name)}">Remove</button></div></div>`).join(""):`<p class="muted">No items yet. Add your first dish below.</p>`}
  </div>
  <div class="card"><h2>Add an item</h2><div class="grid">
    <div><label for="mn">Name</label><input id="mn" placeholder="Curd rice"></div>
    <div><label for="mc">Category</label><select id="mc"><option>Mains</option><option>Curries</option><option>Sides</option><option>Sweets</option><option>Drinks</option></select></div>
    <div><label for="mg">Serving per person (g)</label><input id="mg" type="number" min="1"></div></div>
    <div style="margin-top:16px"><button class="btn" id="ma">Add item</button></div></div>`;
  document.querySelectorAll("[data-tog]").forEach(b=>b.onclick=()=>{const m=M.find(x=>x.id==b.dataset.tog);m.on=!m.on;save();menuPage()});
  document.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{S.menu=M.filter(x=>x.id!=b.dataset.x);save();toast("Item removed");menuPage()});
  $("#ma").onclick=()=>{const n=$("#mn").value.trim(),g=+$("#mg").value;if(!n||!g)return toast("Add a name and a serving size.");
    S.menu=M.concat({id:Date.now(),name:n,cat:$("#mc").value,g,on:true});save();toast("Item added");menuPage()};
}
function surplus(){
  const st=S.set,r=sorted().slice(-7).reverse(),A=S.assign;
  const kg=k=>r.filter(x=>A[x.date]===k).reduce((a,x)=>a+waste(x),0);
  const saved=kg("donate")+kg("reuse")+kg("compost"),meals=kg("donate")/0.4;
  const opt=[["donate","Donate"],["compost","Compost"],["reuse","Reuse"]];
  $("#main").innerHTML=`
  <div class="stats">
    <div class="card"><div class="stat">${f1(saved)} kg</div><div class="muted">Food redirected · ${rs(saved*st.cost)} saved</div></div>
    <div class="card"><div class="stat">${Math.round(meals)}</div><div class="muted">Meals redistributed</div></div>
  </div>
  <div class="card"><h2>What happens to the leftovers?</h2>
    ${r.map(x=>`<div class="row"><div><b>${x.date}</b><div class="muted">${f1(waste(x))} kg surplus</div></div>
      <div class="seg" role="group" aria-label="Action for ${x.date}">${opt.map(o=>`<button data-d="${x.date}" data-a="${o[0]}" class="${A[x.date]===o[0]?"on":""}">${o[1]}</button>`).join("")}</div></div>`).join("")}
    <p class="muted" style="margin:12px 0 0">Estimates use ${rs(st.cost)} per kg and 0.4 kg per meal. Change the cost in Settings.</p>
    <button class="link" data-go="plan">See tomorrow's plan</button></div>`;
  document.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{const d=b.dataset.d;A[d]=A[d]===b.dataset.a?undefined:b.dataset.a;S.assign=A;save();surplus()});
}
function settings(){
  const s=S.set,I=(id,l,v,t="text")=>`<div><label for="${id}">${l}</label><input id="${id}" type="${t}" value="${esc(v)}"></div>`;
  $("#main").innerHTML=`
  <div class="card"><h2>Kitchen profile</h2><div class="grid">${I("n","Your name",s.name)}${I("o","Kitchen",s.org)}${I("c","City",s.city)}${I("a","Typical daily attendance",s.att,"number")}</div></div>
  <div class="card"><h2>Waste alerts</h2>
    <label class="switch"><input type="checkbox" id="al" ${s.alerts?"checked":""}> Warn me when waste is high</label>
    <div style="max-width:260px;margin-top:12px"><label for="bn">Show the warning banner</label><select id="bn"><option value="plan">On Tomorrow's plan only</option><option value="all">On every tab</option><option value="off">Never</option></select></div>
    <div style="max-width:260px;margin-top:12px">${I("l","Alert limit (% of food prepared, last 3 days)",s.limit,"number")}</div></div>
  <div class="card"><h2>Food and theme</h2><div class="grid">${I("b","Safety buffer (%)",s.buffer,"number")}${I("k","Cost of food (₹ per kg)",s.cost,"number")}
    <div><label for="th">Theme</label><select id="th"><option value="light">Light</option><option value="dark">Dark</option><option value="auto">Match my device</option></select></div></div></div>
  <button class="btn" id="sv">Save settings</button> <button class="link" id="rs">Reset settings</button> <button class="link" id="rd">Reset demo data</button>`;
  $("#th").value=s.theme;$("#bn").value=s.banner;
  $("#sv").onclick=()=>{planAtt=null;S.set={name:$("#n").value,org:$("#o").value,city:$("#c").value,att:nv("a",500,1),limit:nv("l",12,0),alerts:$("#al").checked,banner:$("#bn").value,buffer:nv("b",4,0),cost:nv("k",65,0),theme:$("#th").value};save();theme();toast("Settings saved");render()};
  $("#rd").onclick=()=>{if(!confirm("Replace all records, menu items and surplus choices with the demo data?"))return;S={records:clone(SEED),assign:{},menu:clone(MENU),set:{...DEF}};opts={menu:1,event:1,rain:1};planAtt=null;save();theme();toast("Demo data restored");render()};
  $("#rs").onclick=()=>{S.set={...DEF};save();theme();toast("Settings reset");render()};
}
function theme(){const t=S.set.theme;t==="auto"?document.documentElement.removeAttribute("data-theme"):document.documentElement.setAttribute("data-theme",t)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(!b)return;tab=b.dataset.go;showAll=false;render();window.scrollTo(0,0)});
theme();render();
