/* ============================================================
   ADMIN CONSOLE LOGIC
   Firebase Auth (email/password) + Firestore + Storage.
   Manages: announcements, mosques (edit), businesses.
   ============================================================ */
import { firebaseConfig, isConfigured } from "./config.js";
import { SEED_MOSQUES, SEED_BUSINESSES } from "./seed.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const $ = id => document.getElementById(id);
let fb = null;            // firestore + storage helpers
let auth = null;

function msg(el, text, kind="ok"){ el.innerHTML = text ? `<div class="msg ${kind}">${text}</div>` : ""; }
function esc(s=""){ return String(s).replace(/[&<>"]/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

async function boot(){
  if(!isConfigured()){
    $("login").classList.add("hide");
    $("console").classList.remove("hide");
    $("notConfigured").classList.remove("hide");
    document.querySelector(".tabs").classList.add("hide");
    return;
  }
  const { initializeApp } = await import(`${SDK}/firebase-app.js`);
  const A = await import(`${SDK}/firebase-auth.js`);
  const F = await import(`${SDK}/firebase-firestore.js`);
  const S = await import(`${SDK}/firebase-storage.js`);
  const app = initializeApp(firebaseConfig);
  auth = { ...A, inst:A.getAuth(app) };
  const db = F.getFirestore(app);
  const storage = S.getStorage(app);
  fb = { db, storage, ...F, ...S };

  A.onAuthStateChanged(auth.inst, user=>{
    const inApp = !!user;
    $("login").classList.toggle("hide", inApp);
    $("console").classList.toggle("hide", !inApp);
    $("logoutBtn").classList.toggle("hide", !inApp);
    if(inApp) refreshAll();
  });

  $("loginBtn").onclick = async ()=>{
    msg($("loginMsg"),"");
    try{ await A.signInWithEmailAndPassword(auth.inst, $("email").value.trim(), $("password").value); }
    catch(e){ msg($("loginMsg"), e.message, "err"); }
  };
  $("logoutBtn").onclick = ()=> A.signOut(auth.inst);
}

/* ---- tab switching ---- */
document.querySelectorAll(".tabs button").forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x===b));
    document.querySelectorAll("section[data-pane]").forEach(s=>
      s.classList.toggle("hide", s.dataset.pane!==b.dataset.tab));
  };
});

async function uploadImage(file, folder){
  if(!file) return "";
  const path = `${folder}/${Date.now()}_${file.name}`;
  const ref = fb.ref(fb.storage, path);
  await fb.uploadBytes(ref, file);
  return await fb.getDownloadURL(ref);
}

/* ---- Announcements ---- */
async function refreshAnnouncements(){
  const snap = await fb.getDocs(fb.query(fb.collection(fb.db,"announcements"), fb.orderBy("date","desc")));
  $("annList").innerHTML = snap.empty ? "<p>None yet.</p>" : snap.docs.map(d=>{
    const a=d.data();
    return `<div class="row"><div class="info"><b>${esc(a.title||"")}</b><span>${esc(a.type||"")} · ${esc(a.date||"")}</span></div>
      <button class="btn danger" data-del="${d.id}">Delete</button></div>`;
  }).join("");
  $("annList").querySelectorAll("[data-del]").forEach(btn=>btn.onclick=async()=>{
    await fb.deleteDoc(fb.doc(fb.db,"announcements",btn.dataset.del)); refreshAnnouncements();
  });
}
$("annSave").onclick = async ()=>{
  try{
    const image = await uploadImage($("annImage").files[0], "announcements");
    await fb.addDoc(fb.collection(fb.db,"announcements"), {
      type:$("annType").value, title:$("annTitle").value.trim(),
      date:$("annDate").value || new Date().toISOString().slice(0,10),
      body:$("annBody").value.trim(), image, createdAt:Date.now()
    });
    ["annTitle","annBody"].forEach(id=>$(id).value=""); $("annImage").value="";
    msg($("globalMsg"),"Announcement posted.","ok"); refreshAnnouncements();
  }catch(e){ msg($("globalMsg"), e.message, "err"); }
};

/* ---- Events ---- */
let editingEvent=null;
function resetEvForm(){
  editingEvent=null;
  ["evTitle","evStart","evDuration","evLocation","evDescription"].forEach(id=>$(id).value="");
  $("evDate").value=new Date().toISOString().slice(0,10);
  $("evSave").textContent="Add"; $("evFormTitle").textContent="Add event";
}
async function refreshEvents(){
  const snap = await fb.getDocs(fb.query(fb.collection(fb.db,"events"), fb.orderBy("date","asc")));
  $("evList").innerHTML = snap.empty ? "<p>None yet.</p>" : snap.docs.map(d=>{
    const e=d.data();
    return `<div class="row"><div class="info"><b>${esc(e.title||"")}</b><span>${esc(e.date||"")} ${esc(e.startTime||"")}${e.location?" · "+esc(e.location):""}</span></div>
      <span style="display:flex;gap:8px">
        <button class="btn danger" style="background:#14532d" data-edit="${d.id}">Edit</button>
        <button class="btn danger" data-del="${d.id}">Delete</button>
      </span></div>`;
  }).join("");
  $("evList").querySelectorAll("[data-del]").forEach(btn=>btn.onclick=async()=>{
    await fb.deleteDoc(fb.doc(fb.db,"events",btn.dataset.del));
    if(editingEvent===btn.dataset.del) resetEvForm();
    refreshEvents();
  });
  $("evList").querySelectorAll("[data-edit]").forEach(btn=>btn.onclick=async()=>{
    const e=(await fb.getDoc(fb.doc(fb.db,"events",btn.dataset.edit))).data()||{};
    editingEvent=btn.dataset.edit;
    $("evTitle").value=e.title||""; $("evDate").value=e.date||""; $("evStart").value=e.startTime||"";
    $("evDuration").value=e.durationHours||""; $("evLocation").value=e.location||""; $("evDescription").value=e.description||"";
    $("evSave").textContent="Save changes"; $("evFormTitle").textContent="Edit event";
    $("evFormTitle").scrollIntoView({behavior:"smooth"});
  });
}
$("evNew").onclick = resetEvForm;
$("evSave").onclick = async ()=>{
  try{
    const data={
      title:$("evTitle").value.trim(), date:$("evDate").value, startTime:$("evStart").value,
      durationHours:Number($("evDuration").value)||0, location:$("evLocation").value.trim(),
      description:$("evDescription").value.trim(), createdAt:Date.now()
    };
    if(!data.title || !data.date){ msg($("globalMsg"),"Event needs at least a title and date.","err"); return; }
    if(editingEvent) await fb.updateDoc(fb.doc(fb.db,"events",editingEvent), data);
    else await fb.addDoc(fb.collection(fb.db,"events"), data);
    msg($("globalMsg"), editingEvent?"Event saved.":"Event added.","ok");
    resetEvForm(); refreshEvents();
  }catch(e){ msg($("globalMsg"), e.message, "err"); }
};

/* ---- Mosques (edit existing) ---- */
let editingMosque=null;
async function refreshMosques(){
  const snap = await fb.getDocs(fb.query(fb.collection(fb.db,"mosques"), fb.orderBy("name","asc")));
  $("mosqueList").innerHTML = snap.docs.map(d=>{
    const m=d.data();
    return `<div class="row"><div class="info"><b>${esc(m.name||"")}</b><span>${esc(m.area||"")}</span></div>
      <button class="btn danger" style="background:#0e3d2e" data-edit="${d.id}">Edit</button></div>`;
  }).join("") || "<p>No mosques.</p>";
  $("mosqueList").querySelectorAll("[data-edit]").forEach(btn=>btn.onclick=async()=>{
    const ref=fb.doc(fb.db,"mosques",btn.dataset.edit);
    const snap=await fb.getDoc(ref); const m=snap.data()||{};
    editingMosque=btn.dataset.edit;
    $("mosqueEditor").classList.remove("hide");
    $("mName").value=m.name||""; $("mArea").value=m.area||""; $("mPhone").value=m.phone||"";
    $("mAddress").value=m.address||""; $("mJummah").value=m.jummah||""; $("mEmail").value=m.email||"";
    $("mWebsite").value=m.website||""; $("mLocation").value=m.location||""; $("mNotes").value=m.notes||"";
    $("mosqueEditor").scrollIntoView({behavior:"smooth"});
  });
}
$("mSave").onclick = async ()=>{
  if(!editingMosque) return;
  try{
    await fb.updateDoc(fb.doc(fb.db,"mosques",editingMosque), {
      name:$("mName").value.trim(), area:$("mArea").value.trim(), phone:$("mPhone").value.trim(),
      address:$("mAddress").value.trim(), jummah:$("mJummah").value.trim(), email:$("mEmail").value.trim(),
      website:$("mWebsite").value.trim(), location:$("mLocation").value.trim(), notes:$("mNotes").value.trim()
    });
    msg($("globalMsg"),"Mosque saved.","ok"); refreshMosques();
  }catch(e){ msg($("globalMsg"), e.message, "err"); }
};

/* ---- Businesses (add new or edit existing) ---- */
let editingBiz=null;       // null = adding a new business
let editingBizImage="";    // existing image url when editing

function resetBizForm(){
  editingBiz=null; editingBizImage="";
  ["bName","bCategory","bDescription","bPhone","bWebsite"].forEach(id=>$(id).value="");
  $("bImage").value="";
  $("bImagePreview").classList.add("hide"); $("bImagePreview").src="";
  $("bSave").textContent="Add"; $("bizFormTitle").textContent="Add business";
  $("bizOffers").classList.add("hide"); $("offTitle").value=""; $("offBody").value=""; $("offList").innerHTML="";
}

/* offers for the business currently being edited */
async function refreshOffers(bizId){
  const snap = await fb.getDocs(fb.query(fb.collection(fb.db,"offers"), fb.where("businessId","==",bizId)));
  const rows = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  $("offList").innerHTML = rows.length ? rows.map(o=>
    `<div class="row"><div class="info"><b>${esc(o.title||"")}</b><span>${o.createdAt?new Date(o.createdAt).toLocaleDateString():""}</span></div>
      <button class="btn danger" data-deloffer="${o.id}">Delete</button></div>`).join("") : "<p class='note'>No offers yet.</p>";
  $("offList").querySelectorAll("[data-deloffer]").forEach(btn=>btn.onclick=async()=>{
    await fb.deleteDoc(fb.doc(fb.db,"offers",btn.dataset.deloffer)); refreshOffers(bizId);
  });
}
$("offAdd").onclick = async ()=>{
  if(!editingBiz) return;
  const title=$("offTitle").value.trim(); if(!title){ msg($("globalMsg"),"Offer needs a title.","err"); return; }
  try{
    await fb.addDoc(fb.collection(fb.db,"offers"), { businessId:editingBiz, title, body:$("offBody").value.trim(), createdAt:Date.now() });
    $("offTitle").value=""; $("offBody").value="";
    msg($("globalMsg"),"Offer added.","ok"); refreshOffers(editingBiz);
  }catch(e){ msg($("globalMsg"), e.message, "err"); }
};

async function refreshBusinesses(){
  const snap = await fb.getDocs(fb.collection(fb.db,"businesses"));
  $("bizList").innerHTML = snap.docs.map(d=>{
    const b=d.data();
    return `<div class="row"><div class="info"><b>${esc(b.name||"")}</b><span>${esc(b.category||"")}</span></div>
      <span style="display:flex;gap:8px">
        <button class="btn danger" style="background:#0e3d2e" data-edit="${d.id}">Edit</button>
        <button class="btn danger" data-del="${d.id}">Delete</button>
      </span></div>`;
  }).join("") || "<p>None yet.</p>";
  $("bizList").querySelectorAll("[data-del]").forEach(btn=>btn.onclick=async()=>{
    await fb.deleteDoc(fb.doc(fb.db,"businesses",btn.dataset.del));
    if(editingBiz===btn.dataset.del) resetBizForm();
    refreshBusinesses();
  });
  $("bizList").querySelectorAll("[data-edit]").forEach(btn=>btn.onclick=async()=>{
    const snap=await fb.getDoc(fb.doc(fb.db,"businesses",btn.dataset.edit));
    const b=snap.data()||{};
    editingBiz=btn.dataset.edit; editingBizImage=b.image||"";
    $("bName").value=b.name||""; $("bCategory").value=b.category||"";
    $("bDescription").value=b.description||""; $("bPhone").value=b.phone||""; $("bWebsite").value=b.website||"";
    $("bImage").value="";
    if(editingBizImage){ $("bImagePreview").src=editingBizImage; $("bImagePreview").classList.remove("hide"); }
    else $("bImagePreview").classList.add("hide");
    $("bSave").textContent="Save changes"; $("bizFormTitle").textContent="Edit business";
    $("bizOffers").classList.remove("hide"); refreshOffers(editingBiz);
    $("bizFormTitle").scrollIntoView({behavior:"smooth"});
  });
}
$("bNew").onclick = resetBizForm;
$("bSave").onclick = async ()=>{
  try{
    const file=$("bImage").files[0];
    const image = file ? await uploadImage(file, "businesses") : editingBizImage;
    const data={
      name:$("bName").value.trim(), category:$("bCategory").value.trim(),
      description:$("bDescription").value.trim(), phone:$("bPhone").value.trim(),
      website:$("bWebsite").value.trim(), image
    };
    if(editingBiz) await fb.updateDoc(fb.doc(fb.db,"businesses",editingBiz), data);
    else await fb.addDoc(fb.collection(fb.db,"businesses"), data);
    msg($("globalMsg"), editingBiz?"Business saved.":"Business added.","ok");
    resetBizForm(); refreshBusinesses();
  }catch(e){ msg($("globalMsg"), e.message, "err"); }
};

/* ---- Import starter templates (idempotent: skips if collection not empty) ---- */
async function importSeed(name, seedArray){
  const existing = await fb.getDocs(fb.collection(fb.db,name));
  if(!existing.empty){
    msg($("globalMsg"), `${name} already has ${existing.size} entr${existing.size===1?"y":"ies"} — import skipped.`, "err");
    return;
  }
  for(const item of seedArray){
    const { id, ...rest } = item;
    await fb.setDoc(fb.doc(fb.db, name, id), rest);
  }
  msg($("globalMsg"), `Imported ${seedArray.length} starter ${name}.`, "ok");
}
$("importMosques").onclick   = async ()=>{ await importSeed("mosques", SEED_MOSQUES); refreshMosques(); };
$("importBusinesses").onclick= async ()=>{ await importSeed("businesses", SEED_BUSINESSES); refreshBusinesses(); };

// preview a newly chosen business image before saving
$("bImage").onchange = ()=>{
  const f=$("bImage").files[0];
  if(f){ $("bImagePreview").src=URL.createObjectURL(f); $("bImagePreview").classList.remove("hide"); }
};

function refreshAll(){ refreshEvents(); refreshAnnouncements(); refreshMosques(); refreshBusinesses(); }

// default dates = today
$("annDate").value = new Date().toISOString().slice(0,10);
$("evDate").value = new Date().toISOString().slice(0,10);
boot();
