/* ============================================================
   APP BOOTSTRAP — loads data, wires the bottom nav + "More"
   drawer, and lazily initialises each section the first time
   it is opened.
   ============================================================ */
import { initData } from "./data.js";
import { initSettings, getSettings, renderSettings } from "./settings.js";
import { reschedule } from "./notifications.js";
import { initPrayers, refreshPrayers } from "./prayers.js";
import { initTimetable } from "./timetable.js";
import { initAnnouncements } from "./announcements.js";
import { initDirectory } from "./directory.js";

const $ = id => document.getElementById(id);

const SECTIONS = {
  prayers:       { el:"todayView" },
  timetable:     { el:"timetableView" },
  announcements: { el:"announcementsView" },
  directory:     { el:"directoryView" },
  settings:      { el:"settingsView" },
  about:         { el:"aboutView" },
};
const inited = new Set();
let current = "prayers";

function lazyInit(name){
  if(inited.has(name)) {
    if(name==="prayers") refreshPrayers();
    if(name==="settings") renderSettings();
    return;
  }
  inited.add(name);
  switch(name){
    case "prayers":       initPrayers(); break;
    case "timetable":     initTimetable(); break;
    case "announcements": initAnnouncements(); break;
    case "directory":     initDirectory(); break;
    case "settings":      renderSettings(); break;
  }
}

function show(name){
  if(!SECTIONS[name]) return;
  current=name;
  Object.entries(SECTIONS).forEach(([k,v])=> $(v.el).hidden = (k!==name));
  // highlight bottom nav (settings/about live under "More")
  const navKey = (name==="settings"||name==="about") ? "more" : name;
  document.querySelectorAll(".navitem").forEach(b=>
    b.classList.toggle("active", b.dataset.nav===navKey));
  lazyInit(name);
  closeDrawer();
  window.scrollTo({ top:0 });
}

/* ---- More drawer ---- */
function openDrawer(){ $("drawer").hidden=false; $("drawerBackdrop").hidden=false; }
function closeDrawer(){ $("drawer").hidden=true; $("drawerBackdrop").hidden=true; }

function wireNav(){
  document.querySelectorAll(".navitem").forEach(b=>{
    b.onclick=()=>{ b.dataset.nav==="more" ? openDrawer() : show(b.dataset.nav); };
  });
  document.querySelectorAll(".draweritem").forEach(b=>{
    b.onclick=()=>show(b.dataset.go);
  });
  $("drawerBackdrop").onclick=closeDrawer;
}

async function main(){
  await initData();
  await initSettings(kind=>{
    if(kind==="notify") reschedule(getSettings());
    if(kind==="theme"||kind==="font") refreshPrayers();
  });
  wireNav();
  show("prayers");
  // schedule notifications on launch per saved prefs
  reschedule(getSettings());
}

main().catch(e=>{
  console.error(e);
  document.body.insertAdjacentHTML("beforeend",
    `<p class="empty">Something went wrong loading the app.</p>`);
});
