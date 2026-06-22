/* ============================================================
   ANNOUNCEMENTS VIEW — Events / Deaths / Madrassa.
   Content comes from loadCollection("announcements"); each item
   has a `type` of event | death | madrassa.
   ============================================================ */
import { loadCollection } from "./firebase.js";

const $ = id => document.getElementById(id);
const TYPES = { event:"Events", death:"Death Notices", madrassa:"Madrassa" };
let activeType = "event";
let items = [];

function esc(s=""){ return String(s).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

function fmtDate(iso){
  if(!iso) return "";
  const d=new Date(iso); if(isNaN(d)) return esc(iso);
  return d.toLocaleDateString(undefined,{ day:"numeric", month:"long", year:"numeric" });
}

function renderList(){
  document.querySelectorAll("#announcementsView .subtab").forEach(b=>
    b.classList.toggle("active", b.dataset.type===activeType));

  const list=$("annList");
  const rows=items.filter(i=>(i.type||"event")===activeType);
  if(!rows.length){
    list.innerHTML=`<p class="empty">No ${TYPES[activeType].toLowerCase()} at the moment.<br>Check back soon.</p>`;
    return;
  }
  list.innerHTML=rows.map(i=>`
    <div class="item">
      <div class="meta">${fmtDate(i.date)}</div>
      <h3>${esc(i.title||"")}</h3>
      ${i.image?`<img src="${esc(i.image)}" alt="" loading="lazy">`:""}
      ${i.body?`<p>${esc(i.body).replace(/\n/g,"<br>")}</p>`:""}
    </div>`).join("");
}

export async function initAnnouncements(){
  $("annList").innerHTML=`<p class="empty">Loading…</p>`;
  document.querySelectorAll("#announcementsView .subtab").forEach(b=>{
    b.onclick=()=>{ activeType=b.dataset.type; renderList(); };
  });
  const { data } = await loadCollection("announcements", { orderField:"date", desc:true });
  items=data||[];
  renderList();
}
