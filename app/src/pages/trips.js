import { uid, tripStatus } from '../store.js'

// ระดับ 1 · ทริปของฉัน (J1) — เข้าแอปเจอจอนี้เสมอ การ์ดมีแค่ป้ายสถานะ ไม่มีแถบขั้นบนการ์ด ไม่มีการกรอกบนการ์ด
export function renderTrips(el, ctx) {
  const { trips } = ctx
  const isDone = (t) => t.closed || t.status === 'สรุปแล้ว'
  const active = trips.filter((t) => !isDone(t))
  const done = trips.filter(isDone)
  const card = (t) => {
    const n = (t.candidates || []).length
    return `
      <div class="card tap" data-trip="${t.id}">
        <b>${esc(t.name) || '(ทริปใหม่)'}</b> <span class="tag">${esc(tripStatus(t))}</span>
        <div>${esc(t.dateRange) || 'ยังไม่ใส่วันที่'} • ผู้ใหญ่ ${esc(t.adults) || '—'} เด็ก ${esc(t.kids) || '—'}</div>
        <div class="small">${n ? `${n} ตัวเลือก` : 'ยังไม่มีตัวเลือก'}</div>
        <div class="btn-row"><button class="btn" data-go="${t.id}">▶ ทำต่อ</button><button class="btn btn2" data-edit="${t.id}">✏️ แก้</button></div>
      </div>`
  }
  el.innerHTML = `
    <div class="screen"><h2>ทริปของฉัน</h2>
    <p class="hint">เข้าแอปมาเจอจอนี้เสมอ • ป้ายบอกว่าทริปไหนค้างขั้นไหน • แตะ ▶ ทำต่อ วิ่งไปถูกขั้นทันที</p>
    ${active.map(card).join('') || (done.length ? '<p class="hint">ไม่มีทริปที่กำลังทำ ทริปที่จบแล้วอยู่ด้านล่าง</p>' : '<p class="hint">ยังไม่มีทริป กดปุ่มข้างล่างเพิ่มได้เลย</p>')}
    <button class="btn btn2" id="addTrip">+ เพิ่มทริป</button>
    ${done.length ? `<details class="donebox"><summary>📦 ทริปที่จบแล้ว (${done.length}) — แตะเพื่อดู</summary>${done.map(card).join('')}</details>` : ''}
    </div>`

  el.querySelector('#addTrip').onclick = () => {
    const t = { id: uid(), name: '', dateRange: '', adults: '', kids: '', status: 'ร่าง', candidates: [], approvedId: '', locked: false, approvedTotal: '', departed: false, closed: false, lesson: '' }
    trips.push(t)
    ctx.persist()
    ctx.go({ name: 'tripEdit', tripId: t.id, isNew: true })
  }
  el.querySelectorAll('[data-go]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); ctx.openTrip(b.dataset.go) })
  el.querySelectorAll('[data-trip]').forEach((card) => card.onclick = (e) => {
    if (e.target.closest('button')) return
    ctx.openTrip(card.dataset.trip)
  })
  el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => ctx.go({ name: 'tripEdit', tripId: b.dataset.edit }))
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
