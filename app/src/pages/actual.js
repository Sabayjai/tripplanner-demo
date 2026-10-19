import { fmt, num, mkItem, planTotals, actualTotals, winnerOf, CATS } from '../store.js'
import { ask } from '../modal.js'

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
  // R024 ข้อ 6: เรียงตามวันที่ + กรุ๊ปเป็นวันๆ จดย้อนหลังก็ไม่ปนกัน
  const rowsOf = (k) => {
    const items = [...(w.actual[k] || [])].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    let lastDay = ''
    return items.map((it) => {
      const day = it.date ? fmtDate(it.date) : 'ไม่ระบุวัน'
      const head = day !== lastDay ? `<div class="dayhead">📅 ${esc(day)}</div>` : ''
      lastDay = day
      return `${head}<div class="row"><span class="grow">${esc(it.title) || '(ไม่มีหัวข้อ)'}${it.note ? ` <span class="tag">${esc(it.note)}</span>` : ''}</span><b>${fmt(num(it.amount))}</b> <button class="xbtn" data-del="${k}:${it.id}">ลบ</button></div>`
    }).join('') || '<p class="small">ยังไม่จดรายการ</p>'
  }

  el.innerHTML = `
    <div class="screen"><h2>จดเงินจริง (แผนที่เลือกเท่านั้น)</h2>
    <p class="hint">🏆 ${esc(w.dest)} • จดทีละรายการเหมือนสมุดบัญชี • หัวข้อ+ยอดต้องมี ส่วนโน้ตใส่ก็ได้ไม่ใส่ก็ได้</p>
    ${CATS.map(([k, label]) => `
    <div class="card"><b>${label}</b><div class="small">${diffLine(k)}</div>
      ${rowsOf(k)}
      <details class="addform" id="df-${k}"><summary>+ เพิ่มรายการ${label.replace(/^[^\s]+\s/, '')}</summary>
      <div class="frow"><div style="flex:2"><input id="n-${k}-title" placeholder="${ph[k]}"></div>
      <div><input id="n-${k}-amount" class="biginput" style="font-size:18px!important" inputmode="numeric" placeholder="ยอด"></div></div>
      <div class="frow"><div><input id="n-${k}-date" type="date" value="${today()}"></div><div style="flex:2"><input id="n-${k}-note" placeholder="โน้ต (ไม่ใส่ก็ได้)"></div></div>
      <div class="small over" id="warn-${k}" style="display:none">ใส่หัวข้อ + ยอดก่อนบันทึก</div>
      <button class="btn btn-sm" data-add="${k}">บันทึกรายการ</button></details></div>`).join('')}
    <hr>
    <div class="row"><span>แผนรวม (ที่ตั้งไว้)</span><b>${fmt(p.total)}</b></div>
    <div class="row"><span>จ่ายจริงรวม</span><b>${fmt(a.total)}</b></div>
    <div class="row" style="font-size:19px;font-weight:700"><span>เหลือ / เกิน</span><span>${total === 0 ? 'พอดีงบ' : total > 0 ? `−${fmt(total)} เกินนิดหน่อย` : `+${fmt(-total)} เหลือ`}</span></div>
    <button class="btn" id="close">จบทริป → สรุป</button>
    <div class="btn-row"><button class="btn btn2 btn-sm" id="unlockBack">↩ กลับไปขั้นเทียบ</button></div></div>`

  el.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => {
    const k = b.dataset.add
    const title = (el.querySelector(`#n-${k}-title`).value || '').trim()
    const amount = (el.querySelector(`#n-${k}-amount`).value || '').trim()
    const note = (el.querySelector(`#n-${k}-note`).value || '').trim()
    const date = (el.querySelector(`#n-${k}-date`).value || '').trim()
    const warn = el.querySelector(`#warn-${k}`)
    if (!title || !num(amount)) { if (warn) warn.style.display = 'block'; return }
    w.actual[k].push(mkItem({ title, amount, note, date }))
    ctx.refresh()
  })
  el.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    const [k, id] = b.dataset.del.split(':')
    const it = (w.actual[k] || []).find((x) => x.id === id)
    if (!it) return
    if (!(await ask({ mood: '🗑️', title: `ลบ “${it.title || 'รายการนี้'}”?`, message: `ยอด ${fmt(num(it.amount))} จะหายจากสมุดจดจริง`, ok: 'ลบเลย', danger: true }))) return
    w.actual[k] = w.actual[k].filter((x) => x.id !== id)
    ctx.refresh()
  })
  const ub = el.querySelector('#unlockBack')
  // ปลดล็อกจากหน้านี้ = ถอนการเคาะ กลับไปขั้นเทียบ สถานะยังไม่เคาะ (ยอดจดจริงค้างที่ใบเดิม)
  if (ub) ub.onclick = async () => {
    if (!(await ask({ mood: '↩️', title: 'กลับไปขั้นเทียบตัวเลือก?', message: 'อนุมัติจะหลุด สถานะกลับเป็นยังไม่เคาะ (ยอดจดจริงค้างที่ใบเดิมนะ)', ok: 'กลับไปเทียบ' }))) return
    if (w) { w.winner = false }
    t.approvedId = ''; t.locked = false; t.approvedTotal = ''; t.departed = false
    ctx.persist()
    ctx.go({ name: 'compare', tripId: t.id })
  }
  el.querySelector('#close').onclick = async () => {
    if (!(await ask({ mood: '🎉', title: `จบทริป “${t.name || ''}” แล้วสรุปเลย?`, message: 'สรุปแล้วกลับมาจดต่อได้นะถ้าเปิดทริปอีกครั้ง', ok: 'สรุปเลย' }))) return
    t.closed = true; t.status = 'สรุปแล้ว'
    ctx.persist()
    ctx.go({ name: 'final', tripId: t.id })
  }
}

const THM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const fmtDate = (iso) => { const p = String(iso || '').split('-'); return p.length === 3 ? `${+p[2]} ${THM[+p[1] - 1] || ''}` : iso }

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
