import './style.css'
import { loadTrips, saveTrips, continueTarget, winnerOf, pickedOf, planTotals, actualTotals, fmt } from './store.js'
import { renderTrips } from './pages/trips.js'
import { renderTripEdit } from './pages/tripEdit.js'
import { renderCompare } from './pages/compare.js'
import { renderCandEdit } from './pages/candEdit.js'
import { renderDetail } from './pages/detail.js'
import { renderActual } from './pages/actual.js'
import { renderFinal } from './pages/final.js'

// เข้าแอปเจอทริปของฉันเสมอ (ไม่จำจอค้าง) — ทริปมี "ขั้น" ไม่ใช่แท็บ
let trips = loadTrips()
let view = { name: 'trips' }

const crumb = document.getElementById('crumb')
const app = document.getElementById('app')

const ctx = {
  trips,
  get view() { return view },
  go(v) { view = v; window.scrollTo({ top: 0 }); rerender() },
  persist() { saveTrips(trips) },
  refresh() { saveTrips(trips); rerender() },
  activeTrip() { return trips.find((t) => t.id === view.tripId) || null },
  openTrip(id) {
    const t = trips.find((x) => x.id === id)
    if (!t) return
    const to = continueTarget(t)
    view = to === 'trips' ? { name: 'trips' } : { name: to, tripId: id }
    window.scrollTo({ top: 0 })
    rerender()
  },
}

function dots(step) {
  return `<div class="phase">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= step ? 'done' : ''}"></span>`).join('')}</div>`
}

function renderCrumb() {
  const t = ctx.activeTrip()
  const backTo = (label) => `<button data-back>${label}</button>`
  let html = ''
  const bindBack = (v) => {
    const b = crumb.querySelector('[data-back]')
    if (b) b.onclick = () => ctx.go(v)
  }
  if (view.name === 'trips') {
    html = `📂 <b>ทริปของฉัน</b>${dots(1)}<div class="phase-label">เปิดแอป → เลือกทริปที่จะทำต่อ</div>`
    crumb.innerHTML = html
    return
  }
  if (!t) {
    crumb.innerHTML = `${backTo('‹ ทริป')} ไม่เจอทริปนี้แล้ว`
    bindBack({ name: 'trips' })
    return
  }
  const w = winnerOf(t)
  if (view.name === 'tripEdit') {
    html = `<div class="crow">${backBtn()}<span>📂 <b>${view.isNew ? 'ทริปใหม่' : 'แก้ทริป: ' + esc(t.name)}</b></span></div>${dots(1)}<div class="phase-label">ขั้นที่ 1/5 · แก้ข้อมูลทริป • ทุกช่องว่างได้</div>`
    crumb.innerHTML = html
    bindBack({ name: 'trips' })
  } else if (view.name === 'compare') {
    html = `<div class="crow">${backBtn()}<span>📂 <b>${esc(t.name) || '(ทริปใหม่)'}</b></span></div>${dots(2)}<div class="phase-label">ขั้นที่ 2/5 · เทียบ+เคาะ+ขออนุมัติ (จอเดียวจบ)</div>`
    crumb.innerHTML = html
    bindBack({ name: 'trips' })
  } else if (view.name === 'candEdit') {
    const c = (t.candidates || []).find((x) => x.id === view.candId)
    html = `<div class="crow">${backBtn()}<span>📂 ${esc(t.name)} › <b>${view.isNew ? 'ใบใหม่' : 'แก้ใบ: ' + esc(c?.dest)}</b></span></div>${dots(2)}<div class="phase-label">ขั้นที่ 2/5 · แก้ข้อมูลใบนี้ • ทุกช่องว่างได้</div>`
    crumb.innerHTML = html
    bindBack({ name: 'compare', tripId: t.id })
  } else if (view.name === 'detail') {
    const picked = pickedOf(t)
    const c = (t.candidates || []).find((x) => x.id === view.candId)
    const idx = picked.findIndex((x) => x.id === view.candId) + 1
    html = `<div class="crow">${backBtn()}<span>📂 ${esc(t.name)} › 📄 <b>${esc(c?.dest) || '(ใบใหม่)'}${picked.length > 1 && idx ? ` (ใบ ${idx}/${picked.length})` : ''}</b></span></div>${dots(3)}<div class="phase-label">ขั้นที่ 3/5 · กรอกทีละใบ</div>`
    crumb.innerHTML = html
    bindBack({ name: 'compare', tripId: t.id })
  } else if (view.name === 'actual') {
    const p = w ? planTotals(w).total : 0
    const a = actualTotals(t).total
    const d = a - p
    const tail = w ? `แผน ${fmt(p)} • ใช้ไป ${fmt(a)} • <b>${d > 0 ? 'เกิน ' + fmt(d) : d < 0 ? 'เหลือ ' + fmt(-d) : 'พอดีงบ'}</b>` : ''
    html = `<div class="crow">${backBtn()}<span>📂 ${esc(t.name)} › 🏆 ${esc(w?.dest)} › <b>จดเงินจริง</b></span></div>${dots(4)}<div class="phase-label">ขั้นที่ 4/5 · ตอนเที่ยว จิ้มเลขอย่างเดียว</div><div class="phase-label">${tail}</div>`
    crumb.innerHTML = html
    bindBack({ name: 'compare', tripId: t.id })
  } else if (view.name === 'final') {
    html = `<div class="crow">${backBtn()}<span>📂 ${esc(t.name)} › <b>สรุปจบทริป</b></span></div>${dots(5)}<div class="phase-label">ขั้นที่ 5/5 · อ่านอย่างเดียว เก็บเป็นบทเรียน</div>`
    crumb.innerHTML = html
    bindBack({ name: 'trips' })
  }
  function backBtn() { return `<button data-back>‹ ${view.name === 'final' || view.name === 'tripEdit' ? 'ทริป' : view.name === 'compare' || view.name === 'actual' ? 'ทริป' : 'เทียบ'}</button>` }
}

function rerender() {
  saveTrips(trips)
  renderCrumb()
  if (view.name === 'trips') renderTrips(app, ctx)
  else if (view.name === 'tripEdit') renderTripEdit(app, ctx)
  else if (view.name === 'compare') renderCompare(app, ctx)
  else if (view.name === 'candEdit') renderCandEdit(app, ctx)
  else if (view.name === 'detail') renderDetail(app, ctx)
  else if (view.name === 'actual') renderActual(app, ctx)
  else if (view.name === 'final') renderFinal(app, ctx)
  else renderTrips(app, ctx)
}

function esc(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }

rerender()
