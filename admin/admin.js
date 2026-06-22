/* ============================================================
   ADMIN CONSOLE LOGIC
   Firebase Auth (email/password) + Firestore + Storage.
   Manages: announcements, mosques (edit), businesses.
   ============================================================ */
import { firebaseConfig, isConfigured } from "./config.js";

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

/* ---- Businesses ---- */
async function refreshBusinesses(){
  const snap = await fb.getDocs(fb.collection(fb.db,"businesses"));
  $("bizList").innerHTML = snap.docs.map(d=>{
    const b=d.data();
    return `<div class="row"><div class="info"><b>${esc(b.name||"")}</b><span>${esc(b.category||"")}</span></div>
      <button class="btn danger" data-del="${d.id}">Delete</button></div>`;
  }).join("") || "<p>None yet.</p>";
  $("bizList").querySelectorAll("[data-del]").forEach(btn=>btn.onclick=async()=>{
    await fb.deleteDoc(fb.doc(fb.db,"businesses",btn.dataset.del)); refreshBusinesses();
  });
}
$("bSave").onclick = async ()=>{
  try{
    const image = await uploadImage($("bImage").files[0], "businesses");
    await fb.addDoc(fb.collection(fb.db,"businesses"), {
      name:$("bName").value.trim(), category:$("bCategory").value.trim(),
      description:$("bDescription").value.trim(), phone:$("bPhone").value.trim(),
      website:$("bWebsite").value.trim(), image
    });
    ["bName","bCategory","bDescription","bPhone","bWebsite"].forEach(id=>$(id).value=""); $("bImage").value="";
    msg($("globalMsg"),"Business added.","ok"); refreshBusinesses();
  }catch(e){ msg($("globalMsg"), e.message, "err"); }
};

function refreshAll(){ refreshAnnouncements(); refreshMosques(); refreshBusinesses(); }

// default announcement date = today
$("annDate").value = new Date().toISOString().slice(0,10);
boot();
