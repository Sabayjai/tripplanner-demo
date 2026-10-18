import { num, fmt, mkItem, planTotals, peopleOf } from '../store.js'

// ใบรายละเอียด (J3) — โครงเดียวกับจดเงินจริงเป๊ะ: ทุกหมวด = การ์ดหัวข้อยอดรวม + แถวรายการ + ฟอร์ม +เพิ่มรายการ พับไว้
export function renderDetail(el, ctx) {
  const t = ctx.activeTrip()
  const c = (t?.candidates || []).find((x) => x.id === ctx.view.candId)
  if (!t || !c) { el.innerHTML = `<div class="screen"><p class="hint">ไม่เจอใบนี้แล้ว</p></div>`; return }
  // ล็อกเฉพาะใบตัวจริงเท่านั้น — ใบอื่นกลับมาแก้ได้เสมอ
  const locked = t.locked && c.winner

  const d = planTotals(c)
  const people = peopleOf(t) || 1
  const catRow = (k) => {
    const items = c.plan[k] || []
    return items.map((it) => {
      let tags = ''
      if (k === 'stay' && (it.pricePerNight || it.nights)) tags += `<span class="tag">${esc(it.pricePerNight) || '—'} × ${esc(it.nights) || '—'} คืน</span>`
      if (k === 'activity') {
        if (it.feePerPerson || it.count) tags += `<span class="tag">${esc(it.feePerPerson) || '—'}/คน × ${esc(it.count) || people}</span>`
        if (it.loc) tags += `<span class="tag">${esc(it.loc)}</span>`
        if (it.by) tags += `<span class="tag">${esc(it.by)}เสนอ</span>`
      }
      if (it.place) tags += `<span class="tag">${esc(it.place)}</span>`
      return `<div class="row"><span class="grow">${esc(it.title) || '(ไม่มีหัวข้อ)'} ${tags}${it.note ? `<br><span class="small">${esc(it.note)}</span>` : ''}</span><b>${fmt(num(it.amount))}</b>${locked ? '' : ` <button class="xbtn" data-del="${k}:${it.id}">ลบ</button>`}</div>`
    }).join('') || '<p class="small">ยังไม่มีรายการ</p>'
  }
  const addForm = (k) => {
    if (locked) return ''
    if (k === 'stay') return `<details class="addform" id="df-${k}"><summary>+ เพิ่มค่าที่พัก</summary>
      <input id="n-${k}-title" placeholder="ชื่อที่พัก">
      <div class="frow"><div><label>ราคา/คืน</label><input id="n-${k}-ppn" inputmode="numeric" placeholder="เช่น 2,000"></div>
      <div><label>จำนวนคืน</label><input id="n-${k}-nn" inputmode="numeric" placeholder="เช่น 2"></div></div>
      <div class="small" id="pv-${k}"></div>
      <input id="n-${k}-note" placeholder="โน้ต (ไม่ใส่ก็ได้)">
      <button class="btn btn-sm" data-add="${k}">บันทึกรายการ</button></details>`
    if (k === 'activity') return `<details class="addform" id="df-${k}"><summary>+ เพิ่มกิจกรรม</summary>
      <div class="frow"><div style="flex:2"><input id="n-${k}-title" placeholder="ชื่อกิจกรรม"></div>
      <div><input id="n-${k}-fee" class="biginput" style="font-size:18px!important" inputmode="numeric" placeholder="ค่าเข้า/คน"></div></div>
      <div class="small" id="pv-${k}">× ${people} คนในทริปนี้</div>
      <div class="frow"><div><input id="n-${k}-place" placeholder="สถานที่"></div><div><input id="n-${k}-by" placeholder="ใครเสนอ"></div></div>
      <input id="n-${k}-note" placeholder="หมายเหตุเด็ก (ไม่ใส่ก็ได้)">
      <label>อยู่ตรงไหน</label><select id="n-${k}-loc"><option>ใกล้ที่พัก</option><option>ระหว่างทาง</option></select>
      <button class="btn btn-sm" data-add="${k}">บันทึกรายการ</button></details>`
    const ph = k === 'travel' ? 'หัวข้อ เช่น ค่าน้ำมันขากลับ' : 'หัวข้อ เช่น หมูกระทะมื้อเย็น'
    return `<details class="addform" id="df-${k}"><summary>+ เพิ่มค่า${k === 'travel' ? 'เดินทาง' : 'กิน'}</summary>
      <div class="frow"><div style="flex:2"><input id="n-${k}-title" placeholder="${ph}"></div>
      <div><input id="n-${k}-amount" class="biginput" style="font-size:18px!important" inputmode="numeric" placeholder="ยอด"></div></div>
      <input id="n-${k}-note" placeholder="โน้ต (ไม่ใส่ก็ได้)">
      <button class="btn btn-sm" data-add="${k}">บันทึกรายการ</button></details>`
  }

  el.innerHTML = `
    <div class="screen"><h2>${esc(c.dest) || '(ใบใหม่)'}</h2>
    <p class="hint">ใบนี้ใบเดียว ไม่ปนกับใบอื่น • แตะ + เพื่อเพิ่ม กดบันทึกทุกครั้ง${locked ? ' • 🔒 ล็อกแล้ว แก้ต้องปลดล็อกก่อน' : ''}</p>
    ${locked ? `<p class="hint">🔒 ใบนี้ล็อกแล้ว (เคาะเป็นแผนที่เลือก) กลับไปตารางเทียบเพื่อปลดล็อกก่อนถึงแก้ได้</p>` : ''}
    <div class="card"><b>🚗 เดินทาง</b><div class="small">รวม ${fmt(d.travel)}</div>
      <p class="hint">เก็บ 3 อย่าง: ① พาหนะ ② ค่าใช้จ่าย (น้ำมัน/ทางด่วน/…) ③ จุดแวะพัก</p>
      <label>① ไปด้วยอะไร</label>
      ${locked ? `<div class="row"><span>พาหนะ</span><b>${esc(c.vehicle)}</b></div>`
        : `<input id="v-vehicle" value="${esc(c.vehicle)}" placeholder="เช่น รถยนต์ส่วนตัว">`}
      <label>② ค่าใช้จ่าย</label>
      ${catRow('travel')}
      ${addForm('travel')}
      <label>③ จุดแวะพักระหว่างทาง</label>
      ${(c.stops || []).map((s, i) => `<div class="row"><span class="grow">📍 ${esc(s)}</span>${locked ? '' : `<button class="xbtn" data-delstop="${i}">ลบ</button>`}</div>`).join('') || '<p class="small">ยังไม่มีจุดแวะ</p>'}
      ${locked ? '' : `<div class="frow"><div style="flex:2"><input id="v-stop" placeholder="เช่น ปั๊ม PT ขาไป"></div><div><button class="btn btn2 btn-sm" id="addStop" style="height:100%">+ เพิ่ม</button></div></div>`}
    </div>
    <div class="card"><b>🏠 ที่พัก</b><div class="small">รวม ${fmt(d.stay)}</div>
      <p class="hint">ใส่ราคา/คืนกับจำนวนคืน ระบบคูณให้เอง</p>${catRow('stay')}${addForm('stay')}</div>
    <div class="card"><b>🍜 กิน</b><div class="small">รวม ${fmt(d.food) || '— (ยังไม่ตั้งก็ได้)'}</div>
      <p class="hint">ค่ากินรวมของใบนี้ จดทีละมื้อก็ได้</p>${catRow('food')}${addForm('food')}</div>
    <div class="card"><b>🎡 กิจกรรม</b><div class="small">รวม ${fmt(d.activity)}</div>
      <p class="hint">ใส่ค่าเข้า/คน ระบบคูณจำนวนคนในทริป (${people} คน) ให้เอง</p>${catRow('activity')}${addForm('activity')}</div>
    <hr>
    <div class="row"><span>เดินทาง / ที่พัก / กิจกรรม${d.food ? ' / กิน' : ''}</span><b>${fmt(d.travel)} / ${fmt(d.stay)} / ${fmt(d.activity)}${d.food ? ` / ${fmt(d.food)}` : ''}</b></div>
    <div class="row" style="font-size:19px;font-weight:700"><span>รวมใบนี้</span><span>${fmt(d.total)}</span></div>
    <button class="btn" id="backCompare">กลับไปเคาะที่ตารางเทียบ 🏆</button></div>`

  el.querySelector('#backCompare').onclick = () => ctx.go({ name: 'compare', tripId: t.id })
  if (!locked) {
    const vv = el.querySelector('#v-vehicle')
    if (vv) vv.oninput = () => { c.vehicle = vv.value; ctx.persist() }
    const as = el.querySelector('#addStop')
    if (as) as.onclick = () => {
      const v = el.querySelector('#v-stop').value.trim()
      if (!v) return
      c.stops.push(v); ctx.refresh()
    }
    el.querySelectorAll('[data-delstop]').forEach((b) => b.onclick = () => {
      c.stops.splice(Number(b.dataset.delstop), 1); ctx.refresh()
    })
    el.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => {
      const [k, id] = b.dataset.del.split(':')
      c.plan[k] = c.plan[k].filter((x) => x.id !== id)
      ctx.refresh()
    })
    // ตัวอย่างยอดสดตอนกรอกที่พัก/กิจกรรม (สอนวิธีคิดโดยไม่ต้องเดา)
    const ppn = el.querySelector('#n-stay-ppn'), nn = el.querySelector('#n-stay-nn'), pvS = el.querySelector('#pv-stay')
    if (ppn && nn && pvS) {
      const upd = () => {
        const a = num(ppn.value) * num(nn.value)
        pvS.textContent = a ? `${fmt(num(ppn.value))} × ${nn.value.trim() || '—'} คืน = ${fmt(a)}` : ''
      }
      ppn.oninput = nn.oninput = upd
    }
    const fee = el.querySelector('#n-activity-fee'), pvA = el.querySelector('#pv-activity')
    if (fee && pvA) {
      fee.oninput = () => {
        const a = num(fee.value) * people
        pvA.textContent = num(fee.value) ? `${fmt(num(fee.value))}/คน × ${people} คน = ${fmt(a)}` : `× ${people} คนในทริปนี้`
      }
    }
    el.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => {
      const k = b.dataset.add
      const gv = (id) => (el.querySelector(`#n-${k}-${id}`)?.value || '').trim()
      if (k === 'stay') {
        const ppn2 = gv('ppn'), nn2 = gv('nn')
        const amt = num(ppn2) * num(nn2)
        if (!gv('title') && !amt) return
        c.plan.stay.push(mkItem({ title: gv('title') || 'ที่พัก', amount: String(amt || ''), note: gv('note'), pricePerNight: ppn2, nights: nn2 }))
      } else if (k === 'activity') {
        const fee2 = gv('fee')
        if (!gv('title') && !num(fee2)) return
        const count = String(people)
        c.plan.activity.push(mkItem({ title: gv('title'), amount: String(num(fee2) * people || ''), note: gv('note'), place: gv('place'), by: gv('by'), loc: el.querySelector(`#n-${k}-loc`).value, feePerPerson: fee2, count }))
      } else {
        if (!gv('title') && !num(gv('amount'))) return
        c.plan[k].push(mkItem({ title: gv('title'), amount: gv('amount'), note: gv('note') }))
      }
      ctx.refresh()
      const dd = el.querySelector(`#df-${k}`)
      if (dd) dd.open = true
    })
  }
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
