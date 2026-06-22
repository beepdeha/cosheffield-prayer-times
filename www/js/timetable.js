/* ============================================================
   TIMETABLE VIEW — full month as a data table (replaces photos).
   Built from the same data as the Today view.
   ============================================================ */
import { MON, RAW } from "./data.js";

const $ = id => document.getElementById(id);
let activeMonth = new Date().getMonth()+1;

// Jamāʿah carried forward within a month for display.
function monthRows(m){
  const rows = RAW[m] || [];
  let fJ="", zJ="", aJ="", iJ="";
  // carry forward from the start of the year up to this month
  for(let mm=1; mm<m; mm++){
    for(const r of (RAW[mm]||[])){ if(r[6])fJ=r[6]; if(r[7])zJ=r[7]; if(r[8])aJ=r[8]; if(r[10])iJ=r[10]; }
  }
  return rows.map(r=>{
    const [d,sehri,sunrise,zuhrS,asrS,ishaS,f,z,a,maghrib,i]=r;
    if(f)fJ=f; if(z)zJ=z; if(a)aJ=a; if(i)iJ=i;
    return { d, fajr:sehri, sunrise, zuhr:zuhrS, zuhrJ:zJ, asr:asrS, asrJ:aJ, maghrib, isha:ishaS, ishaJ:iJ, fajrJ:fJ };
  });
}

function buildGrid(){
  const g=$("monthGrid");
  g.innerHTML = MON.map((name,i)=>
    `<button class="monthbtn" data-m="${i+1}">${name.slice(0,3)}</button>`).join("");
  g.querySelectorAll(".monthbtn").forEach(b=>{
    b.onclick=()=>showMonth(parseInt(b.dataset.m,10));
  });
}

function showMonth(m){
  activeMonth=m;
  document.querySelectorAll(".monthbtn").forEach(b=>{
    b.classList.toggle("active", parseInt(b.dataset.m,10)===m);
  });
  const today=new Date();
  const rows=monthRows(m);
  const body = rows.map(r=>{
    const date=new Date(today.getFullYear(), m-1, r.d);
    const isToday = date.toDateString()===today.toDateString();
    const isFri = date.getDay()===5;
    const cls=[isToday?"is-today":"", isFri?"is-fri":""].filter(Boolean).join(" ");
    return `<tr class="${cls}">
      <td class="d">${r.d}</td>
      <td>${r.fajr||"—"}<br><small>${r.fajrJ||""}</small></td>
      <td>${r.sunrise||"—"}</td>
      <td>${r.zuhr||"—"}<br><small>${r.zuhrJ||""}</small></td>
      <td>${r.asr||"—"}<br><small>${r.asrJ||""}</small></td>
      <td>${r.maghrib||"—"}</td>
      <td>${r.isha||"—"}<br><small>${r.ishaJ||""}</small></td>
    </tr>`;
  }).join("");

  const box=$("monthTable");
  box.hidden=false;
  box.innerHTML = `<div class="mt-cap">${MON[m-1]}</div>
    <div class="card" style="margin-top:0;overflow-x:auto">
      <table class="mt-table">
        <thead><tr>
          <th>Date</th><th>Fajr</th><th>Sun</th><th>Zuhr</th><th>Asr</th><th>Mgrb</th><th>Isha</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="note">Top = begins · <small>small</small> = Jamāʿah. Friday dates underlined.</p>`;
}

export function initTimetable(){
  buildGrid();
  showMonth(new Date().getMonth()+1);
}
