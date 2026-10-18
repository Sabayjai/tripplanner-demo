// แก้ข้อมูลทริป — ฟอร์มจริง (บันทึกได้) ทุกช่องว่างได้
export function renderTripEdit(el, ctx) {
  const { trips } = ctx
  const t = ctx.activeTrip()
  if (!t) { el.innerHTML = `<div class="screen"><p class="hint">ไม่เจอทริปนี้แล้ว</p></div>`; return }
  el.innerHTML = `
    <div class="screen"><h2>${ctx.view.isNew ? 'เพิ่มทริป' : 'แก้ทริป'}</h2>
    <p class="hint">ทุกช่องว่างได้ • บันทึกแล้วกลับทริปของฉัน</p>
    <label>ชื่อทริป</label><input id="f-name" value="${esc(t.name)}" placeholder="เช่น ชะอำ 2 คืน">
    <label>ช่วงวันที่ (ยืดหยุ่น)</label><input id="f-date" value="${esc(t.dateRange)}" placeholder="เช่น 12–14 ต.ค.">
    <div class="frow"><div><label>ผู้ใหญ่</label><input id="f-ad" inputmode="numeric" value="${esc(t.adults)}" placeholder="เช่น 2"></div>
    <div><label>เด็ก</label><input id="f-kid" inputmode="numeric" value="${esc(t.kids)}" placeholder="เช่น 1"></div></div>
    <label>สถานะ</label><select id="f-st">
      ${['ร่าง', 'กำลังวางแผน', 'สรุปแล้ว'].map((s) => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select>
    <button class="btn" id="save">บันทึก → กลับทริปของฉัน</button>
    ${ctx.view.isNew ? '' : `<button class="btn btnDanger" id="del">ลบทริปนี้</button>`}
    </div>`
  const v = (id) => el.querySelector(id).value.trim()
  el.querySelector('#save').onclick = () => {
    t.name = v('#f-name'); t.dateRange = v('#f-date'); t.adults = v('#f-ad'); t.kids = v('#f-kid')
    t.status = el.querySelector('#f-st').value
    t.closed = t.status === 'สรุปแล้ว'
    ctx.persist()
    ctx.go({ name: 'trips' })
  }
  const del = el.querySelector('#del')
  if (del) del.onclick = () => {
    if (!confirm(`ลบทริป “${t.name || 'ทริปใหม่'}” พร้อมใบทั้งหมด?`)) return
    const i = trips.findIndex((x) => x.id === t.id)
    if (i >= 0) trips.splice(i, 1)
    ctx.persist()
    ctx.go({ name: 'trips' })
  }
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
