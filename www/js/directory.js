/* ============================================================
   DIRECTORY VIEW — Mosques (list → detail) and Businesses.
   ============================================================ */
import { loadCollection } from "./firebase.js";

const $ = id => document.getElementById(id);
let activeTab = "mosques";
let mosques = [];
let businesses = [];

function esc(s=""){ return String(s).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

function showSection(){
  document.querySelectorAll("#directoryView .subtab").forEach(b=>
    b.classList.toggle("active", b.dataset.dir===activeTab));
  $("mosqueDetail").hidden=true;
  $("dirList").hidden=false;
  activeTab==="mosques" ? renderMosques() : renderBusinesses();
}

function renderMosques(){
  const list=$("dirList");
  if(!mosques.length){ list.innerHTML=`<p class="empty">No mosques listed yet.</p>`; return; }
  list.innerHTML=mosques.map(m=>`
    <div class="item tappable" data-id="${esc(m.id)}">
      <span class="chev">›</span>
      <h3>${esc(m.name||"Mosque")}</h3>
      <div class="meta">${esc(m.area||"")}</div>
    </div>`).join("");
  list.querySelectorAll(".item").forEach(el=>{
    el.onclick=()=>showMosque(el.dataset.id);
  });
}

function field(lbl, val, href){
  if(!val) return "";
  const inner = href ? `<a href="${esc(href)}">${esc(val)}</a>` : esc(val);
  return `<div class="field"><div class="lbl">${lbl}</div><div class="val">${inner}</div></div>`;
}

function showMosque(id){
  const m=mosques.find(x=>x.id===id); if(!m) return;
  $("dirList").hidden=true;
  const box=$("mosqueDetail");
  box.hidden=false;
  const jummah = Array.isArray(m.jummah)
    ? m.jummah.map(j=>`${esc(j.label||"Jummah")}: ${esc(j.time||"")}`).join("<br>")
    : esc(m.jummah||"");
  box.innerHTML=`
    <button class="backlink" id="mosqueBack">‹ All mosques</button>
    <h1 class="title" style="margin-top:6px">${esc(m.name||"Mosque")}</h1>
    ${m.area?`<p class="subtitle">${esc(m.area)}</p>`:""}
    <div class="detail">
      ${field("Address", m.address)}
      ${jummah?`<div class="field"><div class="lbl">Jummah</div><div class="val">${jummah}</div></div>`:""}
      ${field("Phone", m.phone, m.phone?`tel:${m.phone}`:null)}
      ${field("Email", m.email, m.email?`mailto:${m.email}`:null)}
      ${field("Website", m.website, m.website)}
      ${field("Location", m.location, m.location)}
      ${field("Notes", m.notes)}
      ${(!m.address&&!jummah&&!m.phone&&!m.location)?`<p class="empty">Details for this mosque will be added soon.</p>`:""}
    </div>`;
  $("mosqueBack").onclick=showSection;
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderBusinesses(){
  const list=$("dirList");
  if(!businesses.length){ list.innerHTML=`<p class="empty">No businesses listed yet.</p>`; return; }
  list.innerHTML=businesses.map(b=>`
    <div class="item">
      <h3>${esc(b.name||"")}</h3>
      ${b.category?`<div class="meta">${esc(b.category)}</div>`:""}
      ${b.image?`<img src="${esc(b.image)}" alt="" loading="lazy">`:""}
      ${b.description?`<p>${esc(b.description)}</p>`:""}
      ${b.phone?`<p><a href="tel:${esc(b.phone)}" style="color:var(--accent);font-weight:800;text-decoration:none">${esc(b.phone)}</a></p>`:""}
      ${b.website?`<p><a href="${esc(b.website)}" style="color:var(--accent);font-weight:800;text-decoration:none">${esc(b.website)}</a></p>`:""}
    </div>`).join("");
}

export async function initDirectory(){
  $("dirList").innerHTML=`<p class="empty">Loading…</p>`;
  document.querySelectorAll("#directoryView .subtab").forEach(b=>{
    b.onclick=()=>{ activeTab=b.dataset.dir; showSection(); };
  });
  const [m,b]=await Promise.all([
    loadCollection("mosques",{ orderField:"name", desc:false }),
    loadCollection("businesses",{ orderField:"name", desc:false })
  ]);
  mosques=m.data||[];
  businesses=b.data||[];
  showSection();
}
