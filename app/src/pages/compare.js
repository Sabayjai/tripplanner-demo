import { uid, fmt, planTotals, hasDetail, winnerOf } from '../store.js'

// ระดับ 2 · เทียบ+เคาะ+ขออนุมัติ (J2/J4/J6-ก่อนไป) — ศูนย์กลาง ใบละการ์ด แตะทั้งใบเปิดได้
export function renderCompare(el, ctx) {
  const t = ctx.activeTrip()
  if (!t) { el.innerHTML = `<div class="screen"><p class="hint">ไม่เจอทริปนี้แล้ว</p></div>`; return }
  const list = t.candidates || []
  const w = winnerOf(t)
  const wTotal = w ? planTotals(w) : null

  el.innerHTML = `
    <div class="screen"><h2>เทียบตัวเลือก</h2>
    <p class="hint">คุย เทียบ เคาะ ขออนุมัติ — จบในจอนี้จอเดียว • แตะการ์ดเพื่อเข้าไปกรอกได้ทุกใบ</p>
    ${list.length ? list.map((c) => {
      const d = planTotals(c)
      const st = c.winner ? '🏆 แผนที่เลือก · ล็อกแล้ว' : hasDetail(c) ? '' : 'ยังไม่กรอก — แตะการ์ดเพื่อกรอก'
      return `<div class="card tap ${c.winner ? 'pick' : ''}" data-go="${c.id}">
        <span class="goleaf">${esc(c.dest) || '(ใบใหม่)'} ›</span>
        <div class="small">${esc(c.nights) || 'ยังไม่ใส่คืน'}${c.pros ? ` • ${esc(c.pros)}` : ''}</div>
        <div class="row"><span>คร่าวๆ</span><b>${esc(c.estimate) || '—'}</b></div>
        <div class="row"><span>ละเอียด</span><b>${hasDetail(c) ? fmt(d.total) : '—'}</b></div>
        ${st ? `<div class="small">${esc(st)}</div>` : ''}
        <button class="btn btn2 btn-sm" data-edit="${c.id}" title="แก้ข้อมูลใบ">✏️ แก้ข้อมูลใบนี้</button>
        ${!c.winner && hasDetail(c) ? `<button class="btn btn-sm" data-knock="${c.id}">${w ? 'เปลี่ยนเป็นใบนี้ 🏆' : 'เคาะใบนี้ 🏆'}</button>` : ''}
      </div>`
    }).join('') + '<p class="hint">ยอดละเอียดขึ้นเฉพาะใบที่กรอกแล้ว • ปุ่มเคาะมีเฉพาะใบที่กรอกแล้ว</p>' : '<p class="hint">ยังไม่มีตัวเลือก กดปุ่มข้างล่างเพิ่มใบแรกได้เลย</p>'}
    <hr>
    ${w && wTotal ? `
    <div class="card pick"><b>🏆 แผนที่เลือก: ${esc(w.dest) || '(ใบใหม่)'}</b>
      <div class="big">ขอเบิก ${fmt(wTotal.total)} บาท</div>
      <div class="small">เดินทาง ${fmt(wTotal.travel)} + ที่พัก ${fmt(wTotal.stay)} + กิจกรรม ${fmt(wTotal.activity)}${wTotal.food ? ` + กิน ${fmt(wTotal.food)}` : ' • กินยังไม่ตั้ง'}</div>
      <div class="small">${t.locked ? '🔒 ล็อกแล้ว แก้ต้องปลดล็อกก่อน' : '🔓 ยังไม่ล็อก'} • ยื่นมือถือให้ภรรยาดูจอนี้ได้เลย</div>
      ${!t.departed
        ? `<button class="btn" data-depart>ออกเดินทาง → จดเงินจริง</button>
           <div class="btn-row"><button class="btn btn2 btn-sm" data-unlock>🔓 ปลดล็อกแก้</button><button class="btn btn2 btn-sm" data-unwin>ถอดแผนที่เลือก</button></div>`
        : `<button class="btn" data-toactual>ไปจดเงินจริง →</button>
           <div class="btn-row">${t.locked ? `<button class="btn btn2 btn-sm" data-unlock>🔓 ปลดล็อกแก้</button>` : `<button class="btn btn2 btn-sm" data-lock>🔒 ล็อก</button>`}<button class="btn btn2 btn-sm" data-unwin>ถอดแผนที่เลือก</button></div>`}
    </div>` : ''}
    <button class="btn btn2" id="addC">+ เพิ่มตัวเลือก</button>
    </div>`

  el.querySelector('#addC').onclick = () => {
    const c = { id: uid(), dest: '', nights: '', estimate: '', pros: '', picked: true, winner: false, vehicle: 'รถยนต์ส่วนตัว', stops: [], plan: { travel: [], stay: [], food: [], activity: [] }, actual: { travel: [], stay: [], food: [], activity: [] } }
    t.candidates.push(c)
    ctx.persist()
    ctx.go({ name: 'candEdit', tripId: t.id, candId: c.id, isNew: true })
  }
  el.querySelectorAll('[data-go]').forEach((card) => card.onclick = (e) => {
    if (e.target.closest('button')) return
    ctx.go({ name: 'detail', tripId: t.id, candId: card.dataset.go })
  })
  el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = (e) => {
    e.stopPropagation()
    ctx.go({ name: 'candEdit', tripId: t.id, candId: b.dataset.edit })
  })
  el.querySelectorAll('[data-knock]').forEach((b) => b.onclick = (e) => {
    e.stopPropagation()
    const c = list.find((x) => x.id === b.dataset.knock)
    if (!c) return
    const cur = winnerOf(t)
    const switching = cur && cur.id !== c.id
    if (!confirm(switching ? `เปลี่ยนแผนที่เลือกเป็น “${c.dest || 'ใบนี้'}”? (ยอดจดจริงที่จดไว้ยังค้างที่ใบเดิม)` : `เคาะ “${c.dest || 'ใบนี้'}” เป็นแผนที่เลือก?`)) return
    for (const x of list) x.winner = false
    c.winner = true; c.picked = true
    t.approvedId = c.id; t.locked = true; t.approvedTotal = String(planTotals(c).total); t.departed = true
    if (t.status !== 'สรุปแล้ว' && t.status === 'ร่าง') t.status = 'กำลังวางแผน'
    ctx.refresh()
  })
  const dep = el.querySelector('[data-depart]')
  if (dep) dep.onclick = () => { t.departed = true; t.locked = true; ctx.refresh(); ctx.go({ name: 'actual', tripId: t.id }) }
  const toa = el.querySelector('[data-toactual]')
  if (toa) toa.onclick = () => ctx.go({ name: 'actual', tripId: t.id })
  el.querySelectorAll('[data-unlock]').forEach((unl) => unl.onclick = () => {
    if (!confirm('ปลดล็อกเพื่อกลับไปแก้แผนที่เลือก?')) return
    t.locked = false
    ctx.refresh()
    if (w) ctx.go({ name: 'detail', tripId: t.id, candId: w.id })
  })
  const lck = el.querySelector('[data-lock]')
  if (lck) lck.onclick = () => { t.locked = true; ctx.refresh() }
  const unw = el.querySelector('[data-unwin]')
  if (unw) unw.onclick = () => {
    if (!confirm(`ถอด “${w?.dest || 'ใบนี้'}” จากแผนที่เลือก? (ยอดที่กรอกไว้ยังอยู่)`)) return
    if (w) { w.winner = false }
    t.approvedId = ''; t.locked = false; t.approvedTotal = ''; t.departed = false
    ctx.refresh()
  }
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
