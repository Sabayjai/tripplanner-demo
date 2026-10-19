import { fmt, num, planTotals, actualTotals, winnerOf, CATS } from '../store.js'
import { ask } from '../modal.js'

// สรุปจบทริป (J6-หลังกลับ) — อ่านอย่างเดียว เก็บเป็นบทเรียน
export function renderFinal(el, ctx) {
  const t = ctx.activeTrip()
  const w = winnerOf(t)
  if (!t) { el.innerHTML = `<div class="screen"><p class="hint">ไม่เจอทริปนี้แล้ว</p></div>`; return }
  if (!w) {
    el.innerHTML = `<div class="screen"><h2>สรุป: ${esc(t.name)}</h2><p class="hint">ทริปนี้ยังไม่มีแผนที่เลือก</p>
    <button class="btn" id="bk">‹ กลับทริปของฉัน</button></div>`
    el.querySelector('#bk').onclick = () => ctx.go({ name: 'trips' })
    return
  }
  const p = planTotals(w)
  const a = actualTotals(t)
  const total = a.total - p.total
  el.innerHTML = `
    <div class="screen"><h2>สรุป: ${esc(t.name)} 🏆 ${esc(w.dest)}</h2>
    <div class="row"><span>แผน</span><b>${fmt(p.total)}</b></div>
    <div class="row"><span>จ่ายจริง</span><b>${fmt(a.total)}</b></div>
    <div class="row" style="font-weight:700"><span>${total > 0 ? 'เกินงบ' : total < 0 ? 'เหลือ' : 'พอดีงบ'}</span><span>${total === 0 ? '—' : fmt(Math.abs(total))}</span></div>
    <hr>
    ${CATS.map(([k, label]) => `<details class="card fincat"><summary><b>${label}</b><span class="small">แผน ${fmt(p[k])} • จริง ${fmt(a[k])} ›</span></summary>${actualRows(w, k)}</details>`).join('')}
    <hr>
    <label>บทเรียนทริปหน้า (จำไว้เอง)</label>
    <textarea id="lesson" placeholder="เช่น กันงบกินเพิ่มอีกนิด">${esc(t.lesson)}</textarea>
    <button class="btn" id="saveLesson">บันทึกบทเรียน</button>
    <div class="btn-row"><button class="btn btn2 btn-sm" id="reopen">เปิดทริปอีกครั้ง</button><button class="btn btn2 btn-sm" id="home">‹ กลับทริปของฉัน</button></div>
    </div>`
  const sb = el.querySelector('#saveLesson')
  sb.onclick = () => {
    t.lesson = el.querySelector('#lesson').value.trim()
    ctx.persist()
    sb.textContent = 'บันทึกแล้ว ✓'
    setTimeout(() => { sb.textContent = 'บันทึกบทเรียน' }, 1500)
  }
  el.querySelector('#reopen').onclick = async () => {
    if (!(await ask({ mood: '🔄', title: 'เปิดทริปอีกครั้ง?', message: 'กลับไปขั้นจดเงินจริง', ok: 'เปิดเลย' }))) return
    t.closed = false
    if (t.status === 'สรุปแล้ว') t.status = 'ทำอยู่'
    ctx.persist()
    ctx.go({ name: 'actual', tripId: t.id })
  }
  el.querySelector('#home').onclick = () => ctx.go({ name: 'trips' })
}

// อ่านอย่างเดียว: รายการที่จดจริงแยกหมวด เรียงตามวัน (เหมือนหน้าจดจริงแต่ไม่มีปุ่มลบ)
function actualRows(w, k) {
  const items = [...(w.actual?.[k] || [])].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
  if (!items.length) return '<p class="small">หมวดนี้ยังไม่จดรายการ</p>'
  let lastDay = ''
  return items.map((it) => {
    const day = it.date ? fmtDate(it.date) : 'ไม่ระบุวัน'
    const head = day !== lastDay ? `<div class="dayhead">📅 ${esc(day)}</div>` : ''
    lastDay = day
    return `${head}<div class="row"><span class="grow">${esc(it.title) || '(ไม่มีหัวข้อ)'}${it.note ? ` <span class="tag">${esc(it.note)}</span>` : ''}</span><b>${fmt(num(it.amount))}</b></div>`
  }).join('')
}

const THM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const fmtDate = (iso) => { const pa = String(iso || '').split('-'); return pa.length === 3 ? `${+pa[2]} ${THM[+pa[1] - 1] || ''}` : iso }

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
