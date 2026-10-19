import { ask } from '../modal.js'

// แก้ข้อมูลใบ (หัวใบเทียบ) — ฟอร์มจริง ทุกช่องว่างได้
export function renderCandEdit(el, ctx) {
  const t = ctx.activeTrip()
  const c = (t?.candidates || []).find((x) => x.id === ctx.view.candId)
  if (!t || !c) { el.innerHTML = `<div class="screen"><p class="hint">ไม่เจอใบนี้แล้ว</p></div>`; return }
  el.innerHTML = `
    <div class="screen"><h2>${ctx.view.isNew ? 'เพิ่มตัวเลือก' : `แก้ใบ: ${esc(c.dest) || '(ใบใหม่)'}`}</h2>
    <p class="hint">เลขตรงนี้คือเลขคุยคร่าวๆ • ยอดละเอียดกรอกที่หน้าใบรายละเอียด</p>
    <label>ปลายทาง (ไม่ fix)</label><input id="f-dest" value="${esc(c.dest)}" placeholder="เช่น ทะเล ชะอำ/หัวหิน">
    <div class="frow"><div><label>จำนวนคืน</label><input id="f-night" value="${esc(c.nights)}" placeholder="เช่น 2 คืน"></div>
    <div><label>งบคร่าวๆ</label><input id="f-est" value="${esc(c.estimate)}" placeholder="เช่น 10,000-12,000"></div></div>
    <label>ข้อดีสั้นๆ</label><input id="f-pros" value="${esc(c.pros)}" placeholder="เช่น ลูกเล่นน้ำเยอะ">
    <button class="btn" id="save">บันทึก → กลับตารางเทียบ</button>
    ${ctx.view.isNew ? '' : `<button class="btn btnDanger" id="del">ลบใบนี้</button>`}
    </div>`
  const v = (id) => el.querySelector(id).value.trim()
  el.querySelector('#save').onclick = () => {
    c.dest = v('#f-dest'); c.nights = v('#f-night'); c.estimate = v('#f-est'); c.pros = v('#f-pros')
    ctx.persist()
    ctx.go({ name: 'compare', tripId: t.id })
  }
  const del = el.querySelector('#del')
  if (del) del.onclick = async () => {
    if (!(await ask({ mood: '🗑️', title: `ลบใบ “${c.dest || 'ใบนี้'}”?`, message: 'ยอดที่กรอกไว้ในใบนี้จะหายหมดนะ', ok: 'ลบเลย', danger: true }))) return
    t.candidates = t.candidates.filter((x) => x.id !== c.id)
    if (t.approvedId === c.id) { t.approvedId = ''; t.locked = false; t.approvedTotal = ''; t.departed = false }
    ctx.persist()
    ctx.go({ name: 'compare', tripId: t.id })
  }
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
