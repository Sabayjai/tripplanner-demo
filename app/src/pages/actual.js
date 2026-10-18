import { fmt, num, mkItem, planTotals, actualTotals, winnerOf, CATS } from '../store.js'

// จดเงินจริง (J5) — สมุดบัญชีทีละรายการแยก 4 หมวด หัวข้อ+ยอดบังคับ โน้ตไม่บังคับ มือเดียวรีบๆ ก็จดได้
export function renderActual(el, ctx) {
  const t = ctx.activeTrip()
  const w = winnerOf(t)
  if (!t || !w) {
    el.innerHTML = `<div class="screen"><h2>จดเงินจริง</h2><p class="hint">ยังไม่มีแผนที่เลือก กลับไปเคาะที่ตารางเทียบก่อน</p>
    <button class="btn" id="bk">‹ กลับตารางเทียบ</button></div>`
    el.querySelector('#bk').onclick = () => ctx.go({ name: 'compare', tripId: t?.id })
    return
  }
  const p = planTotals(w)
  const a = actualTotals(t)
  const diffLine = (k) => {
    const dd = a[k] - p[k]
    if (!p[k] && !a[k]) return 'ยังไม่ตั้งแผน ยังไม่จด'
    if (!p[k]) return `แผน — (ยังไม่ตั้ง) • ใช้ไป ${fmt(a[k])}`
    if (dd === 0) return `แผน ${fmt(p[k])} • ใช้ไป ${fmt(a[k])} • <b class="even">พอดีงบ</b>`
    return `แผน ${fmt(p[k])} • ใช้ไป ${fmt(a[k])} • <b class="${dd > 0 ? 'over' : 'left'}">${dd > 0 ? 'เกิน ' + fmt(dd) : 'เหลือ ' + fmt(-dd)}</b>`
  }
  const total = a.total - p.total
  const ph = { travel: 'หัวข้อ เช่น เติมน้ำมันขากลับ', stay: 'หัวข้อ เช่น จ่ายค่าบ้านพัก', food: 'หัวข้อ เช่น หมูกระทะมื้อเย็น', activity: 'หัวข้อ เช่น ค่าเข้าฟาร์ม' }

  el.innerHTML = `
    <div class="screen"><h2>จดเงินจริง (แผนที่เลือกเท่านั้น)</h2>
    <p class="hint">🏆 ${esc(w.dest)} • จดทีละรายการเหมือนสมุดบัญชี • หัวข้อ+ยอดต้องมี ส่วนโน้ตใส่ก็ได้ไม่ใส่ก็ได้</p>
    ${CATS.map(([k, label]) => `
    <div class="card"><b>${label}</b><div class="small">${diffLine(k)}</div>
      ${(w.actual[k] || []).map((it) => `<div class="row"><span class="grow">${esc(it.title) || '(ไม่มีหัวข้อ)'}${it.note ? ` <span class="tag">${esc(it.note)}</span>` : ''}</span><b>${fmt(num(it.amount))}</b> <button class="xbtn" data-del="${k}:${it.id}">ลบ</button></div>`).join('') || '<p class="small">ยังไม่จดรายการ</p>'}
      <details class="addform" id="df-${k}"><summary>+ เพิ่มรายการ${label.replace(/^[^\s]+\s/, '')}</summary>
      <div class="frow"><div style="flex:2"><input id="n-${k}-title" placeholder="${ph[k]}"></div>
      <div><input id="n-${k}-amount" class="biginput" style="font-size:18px!important" inputmode="numeric" placeholder="ยอด"></div></div>
      <input id="n-${k}-note" placeholder="โน้ต (ไม่ใส่ก็ได้)">
      <div class="small over" id="warn-${k}" style="display:none">ใส่หัวข้อ + ยอดก่อนบันทึก</div>
      <button class="btn btn-sm" data-add="${k}">บันทึกรายการ</button></details></div>`).join('')}
    <hr>
    <div class="row"><span>แผนรวม (ที่ตั้งไว้)</span><b>${fmt(p.total)}</b></div>
    <div class="row"><span>จ่ายจริงรวม</span><b>${fmt(a.total)}</b></div>
    <div class="row" style="font-size:19px;font-weight:700"><span>เหลือ / เกิน</span><span>${total === 0 ? 'พอดีงบ' : total > 0 ? `−${fmt(total)} เกินนิดหน่อย` : `+${fmt(-total)} เหลือ`}</span></div>
    <button class="btn" id="close">จบทริป → สรุป</button>
    <div class="btn-row"><button class="btn btn2 btn-sm" id="unlockBack">🔓 ปลดล็อกกลับไปแก้แผน</button></div></div>`

  el.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => {
    const k = b.dataset.add
    const title = (el.querySelector(`#n-${k}-title`).value || '').trim()
    const amount = (el.querySelector(`#n-${k}-amount`).value || '').trim()
    const note = (el.querySelector(`#n-${k}-note`).value || '').trim()
    const warn = el.querySelector(`#warn-${k}`)
    if (!title || !num(amount)) { if (warn) warn.style.display = 'block'; return }
    w.actual[k].push(mkItem({ title, amount, note }))
    ctx.refresh()
    const dd = el.querySelector(`#df-${k}`)
    if (dd) dd.open = true
  })
  el.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => {
    const [k, id] = b.dataset.del.split(':')
    w.actual[k] = w.actual[k].filter((x) => x.id !== id)
    ctx.refresh()
  })
  const ub = el.querySelector('#unlockBack')
  if (ub) ub.onclick = () => {
    if (!confirm('ปลดล็อกกลับไปแก้แผน? (ยอดจดจริงที่จดไว้ยังอยู่)')) return
    t.locked = false
    ctx.persist()
    ctx.go({ name: 'detail', tripId: t.id, candId: w.id })
  }
  el.querySelector('#close').onclick = () => {
    if (!confirm(`จบทริป “${t.name || ''}” แล้วสรุปเลย?`)) return
    t.closed = true; t.status = 'สรุปแล้ว'
    ctx.persist()
    ctx.go({ name: 'final', tripId: t.id })
  }
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
