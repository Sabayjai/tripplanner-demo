import { uid, num, fmt, planTotals, hasDetail, winnerOf, catLabel } from '../store.js'
import { ask } from '../modal.js'

// ระดับ 2 · เทียบ+เคาะ+ขออนุมัติ (J2/J4/J6-ก่อนไป) — ศูนย์กลาง ใบละการ์ด แตะทั้งใบเปิดได้
export function renderCompare(el, ctx) {
  const t = ctx.activeTrip()
  if (!t) { el.innerHTML = `<div class="screen"><p class="hint">ไม่เจอทริปนี้แล้ว</p></div>`; return }
  const list = t.candidates || []
  const w = winnerOf(t)
  const wTotal = w ? planTotals(w) : null
  // R024 ข้อ 1: ยอดถูกสุดในกลุ่มเอาไว้เทียบว่าแต่ละใบแพงกว่ากันเท่าไหร่
  const detailed = list.filter(hasDetail).map((c) => planTotals(c).total)
  const minTotal = detailed.length ? Math.min(...detailed) : null

  el.innerHTML = `
    <div class="screen"><h2>เทียบตัวเลือก</h2>
    <p class="hint">คุย เทียบ เคาะ ขออนุมัติ — จบในจอนี้จอเดียว • แตะการ์ดเพื่อเข้าไปกรอกได้ทุกใบ</p>
    ${list.length ? list.map((c) => {
      const d = planTotals(c)
      const filled = hasDetail(c)
      const st = c.winner ? '🏆 แผนที่เลือก · ล็อกแล้ว' : filled ? '' : 'ยังไม่กรอก — แตะการ์ดเพื่อกรอก'
      // R024 ข้อ 4: บอกใบ้ว่ามีอะไรซ่อนอยู่ข้างใน กดถึงเจอ
      const acts = ['✏️ แก้']
      if (!c.winner && filled) acts.push('🏆 เคาะ')
      if (!c.winner) acts.push('🗑️ ลบ')
      return `<div class="card tap ${c.winner ? 'pick' : ''}" data-go="${c.id}">
        <span class="goleaf">${esc(c.dest) || '(ใบใหม่)'} ›</span>
        <div class="small">${esc(c.nights) || 'ยังไม่ใส่คืน'}${c.pros ? ` • ${esc(c.pros)}` : ''}</div>
        <div class="row"><span>คร่าวๆ</span><b>${esc(c.estimate) || '—'}</b></div>
        <div class="row"><span>ละเอียด</span><b>${filled ? fmt(d.total) : '—'}</b></div>
        ${detailLines(c)}
        ${diffLine(c, d, minTotal)}
        ${st ? `<div class="small">${esc(st)}</div>` : ''}
        <details class="more">
          <summary><span class="when-closed">${acts.join(' • ')}</span><span class="when-open">▾ ซ่อน</span></summary>
          <button class="btn btn2 btn-sm" data-edit="${c.id}" title="แก้ข้อมูลใบ">✏️ แก้ข้อมูลใบนี้</button>
          ${!c.winner && hasDetail(c) ? `<button class="btn btn-sm" data-knock="${c.id}">${w ? 'เปลี่ยนเป็นใบนี้ 🏆' : 'เคาะใบนี้ 🏆'}</button>` : ''}
          ${!c.winner ? `<button class="btn btnDanger btn-sm" data-delc="${c.id}">🗑️ ลบใบนี้</button>` : ''}
        </details>
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
  el.querySelectorAll('details.more summary').forEach((s) => s.onclick = (e) => e.stopPropagation())
  el.querySelectorAll('[data-knock]').forEach((b) => b.onclick = async (e) => {
    e.stopPropagation()
    const c = list.find((x) => x.id === b.dataset.knock)
    if (!c) return
    const cur = winnerOf(t)
    const switching = cur && cur.id !== c.id
    const go = switching
      ? await ask({ mood: '🔄', title: `เปลี่ยนแผนที่เลือกเป็น “${c.dest || 'ใบนี้'}”?`, message: 'ยอดจดจริงที่จดไว้ยังค้างที่ใบเดิมนะ', ok: 'เปลี่ยนเลย' })
      : await ask({ mood: '🏆', title: `เคาะ “${c.dest || 'ใบนี้'}” เป็นแผนที่เลือก?`, message: 'ล็อกแผน+งบ แล้วไปจดเงินจริงได้เลย', ok: 'เคาะเลย 🏆' })
    if (!go) return
    for (const x of list) x.winner = false
    c.winner = true; c.picked = true
    t.approvedId = c.id; t.locked = true; t.approvedTotal = String(planTotals(c).total); t.departed = true
    if (t.status !== 'สรุปแล้ว') t.status = 'ทำอยู่'
    ctx.refresh()
  })
  el.querySelectorAll('[data-delc]').forEach((b) => b.onclick = async (e) => {
    e.stopPropagation()
    const c = list.find((x) => x.id === b.dataset.delc)
    if (!c) return
    const go = await ask({ mood: '🗑️', title: `ลบใบ “${c.dest || 'ใบนี้'}”?`, message: 'ยอดที่กรอกไว้ในใบนี้จะหายหมดนะ', ok: 'ลบเลย', danger: true })
    if (!go) return
    t.candidates = t.candidates.filter((x) => x.id !== c.id)
    if (t.approvedId === c.id) { t.approvedId = ''; t.locked = false; t.approvedTotal = ''; t.departed = false }
    ctx.refresh()
  })
  const dep = el.querySelector('[data-depart]')
  if (dep) dep.onclick = async () => {
    if (!(await ask({ mood: '🚗', title: 'ออกเดินทางแล้ว?', message: 'เริ่มขั้นจดเงินจริงได้เลย', ok: 'ออกเดินทาง' }))) return
    t.departed = true; t.locked = true; ctx.refresh(); ctx.go({ name: 'actual', tripId: t.id })
  }
  const toa = el.querySelector('[data-toactual]')
  if (toa) toa.onclick = () => ctx.go({ name: 'actual', tripId: t.id })
  el.querySelectorAll('[data-unlock]').forEach((unl) => unl.onclick = async () => {
    if (!(await ask({ mood: '🔓', title: 'ปลดล็อกเพื่อกลับไปแก้แผนที่เลือก?', message: 'แก้เสร็จอย่าลืมล็อกกลับนะ', ok: 'ปลดล็อก' }))) return
    t.locked = false
    ctx.refresh()
    if (w) ctx.go({ name: 'detail', tripId: t.id, candId: w.id })
  })
  const lck = el.querySelector('[data-lock]')
  if (lck) lck.onclick = () => { t.locked = true; ctx.refresh() }
  const unw = el.querySelector('[data-unwin]')
  if (unw) unw.onclick = async () => {
    if (!(await ask({ mood: '🏆', title: `ถอด “${w?.dest || 'ใบนี้'}” จากแผนที่เลือก?`, message: 'ยอดที่กรอกไว้ยังอยู่นะ', ok: 'ถอดเลย' }))) return
    if (w) { w.winner = false }
    t.approvedId = ''; t.locked = false; t.approvedTotal = ''; t.departed = false
    ctx.refresh()
  }
}

// สรุปของในใบแบบย่อ โชว์เฉพาะหมวดที่กรอกแล้ว (เดาได้โดยไม่ต้องเปิดใบ)
// R024 ข้อ 1: หมวดที่แพงสุดในใบนี้ตีกรอบไว้ เทียบ 2 ใบรู้ทันทีว่าต่างตรงไหน
function detailLines(c) {
  const out = []
  const items = (k) => (c.plan?.[k] || [])
  const sum = (k) => items(k).reduce((s, it) => s + num(it.amount), 0)
  const names = (k) => items(k).map((it) => (it.title || '').trim()).filter(Boolean)
  const stops = (c.stops || []).filter(Boolean)
  const sums = { travel: sum('travel'), stay: sum('stay'), food: sum('food'), activity: sum('activity') }
  const top = Object.entries(sums).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  const mark = (k) => (k === top && sums[k] > 0 ? ' ← แพงสุด' : '')
  const tr = sums.travel
  if (tr > 0 || stops.length) out.push({ k: 'travel', l: `🚗 ${tr > 0 ? fmt(tr) : '—'}${stops.length ? ` • แวะ ${stops.length} จุด` : ''}${mark('travel')}` })
  const st = sums.stay
  if (st > 0) { const n = names('stay'); out.push({ k: 'stay', l: `🏠 ${n.length ? esc(n[0]) + (n.length > 1 ? ` +${n.length - 1}` : '') + ' · ' : ''}${fmt(st)}${mark('stay')}` }) }
  const fo = sums.food
  if (fo > 0) { const n = names('food'); out.push({ k: 'food', l: `🍜 ${n.length === 1 ? esc(n[0]) + ' · ' : n.length > 1 ? `${n.length} อย่าง · ` : ''}${fmt(fo)}${mark('food')}` }) }
  const ac = sums.activity
  if (ac > 0) { const n = names('activity'); out.push({ k: 'activity', l: `🎡 ${n.length ? esc(n.slice(0, 2).join(' • ')) + (n.length > 2 ? ` +${n.length - 2}` : '') + ' · ' : ''}${fmt(ac)}${mark('activity')}` }) }
  if (!out.length) return ''
  return `<div class="dlines">${out.map(({ k, l }) => `<div${k === top ? ' class="topcat"' : ''}>${l}</div>`).join('')}</div>`
}

// R024 ข้อ 1: เทียบกับใบถูกสุด — รู้ว่าต่างกันกี่บาทโดยไม่ต้องลบเลขเอง
function diffLine(c, d, minTotal) {
  if (!hasDetail(c) || minTotal == null) return ''
  if (c.winner) return ''
  const diff = d.total - minTotal
  if (diff <= 0) return `<div class="small diff cheapest">✅ ถูกสุดในกลุ่ม</div>`
  // ชี้หมวดที่ทำให้แพงกว่า: หมวดแพงสุดของใบนี้
  const entries = [['travel', d.travel], ['stay', d.stay], ['food', d.food], ['activity', d.activity]]
  entries.sort((a, b) => b[1] - a[1])
  const [topK, topV] = entries[0]
  const topTxt = topV > 0 ? ` (แพงสุด: ${catLabel(topK).replace(/^[^\s]+\s/, '')} ${fmt(topV)})` : ''
  return `<div class="small diff">แพงกว่าถูกสุด +${fmt(diff)}${esc(topTxt)}</div>`
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
