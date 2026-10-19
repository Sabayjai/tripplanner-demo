// Store กลางก้อนเดียว key `trips` — โมเดลใหม่ตามต้นแบบ UX Redesign (Accept แล้ว)
// ทริปมี "ขั้น" ไม่ใช่แท็บ: 1 ทริปของฉัน → 2 เทียบ+เคาะ+ขออนุมัติ ⇄ 3 ลงละเอียดทีละใบ → 4 จดเงินจริง → 5 สรุปจบทริป
// ยอดเงินมี 2 ที่เท่านั้น: ยอดของใบนั้น กับยอดขอเบิก — ไม่มีเลข sum ข้ามใบ
const KEY = 'trips'

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

// แปลง "1,500" / "" / null -> ตัวเลข (ว่าง = 0 แต่ไม่บังคับกรอก)
export const num = (v) => {
  if (v === '' || v == null) return 0
  const n = Number(String(v).replace(/[, ]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export const fmt = (n) => (Number(n) || 0).toLocaleString('th-TH')

export const CATS = [
  ['travel', '🚗 เดินทาง'],
  ['stay', '🏠 ที่พัก'],
  ['food', '🍜 กิน'],
  ['activity', '🎡 กิจกรรม'],
]
export const catLabel = (k) => (CATS.find((c) => c[0] === k) || [])[1] || k

export const peopleOf = (t) => num(t?.adults) + num(t?.kids)

export const mkItem = (o = {}) => ({ id: uid(), title: '', amount: '', note: '', ...o })

const asList = (v) => (Array.isArray(v) ? v : [])

// ---- migrate ข้อมูลเก่า (แท็บ 5 หน้า) มาเป็นโมเดลรายการต่อใบ ----
function migrateCandidate(c, trip) {
  c.id = c.id || uid()
  // ทุกใบกรอกละเอียดได้เลย ไม่ต้องเข้ารอบก่อน (R012 ตัด toggle ทิ้ง)
  if (c.winner == null) c.winner = c.stage === 'ตัวจริง'
  c.picked = true
  delete c.selected
  delete c.stage
  if (!c.vehicle && c.travel?.vehicle) c.vehicle = c.travel.vehicle
  if (!c.vehicle) c.vehicle = 'รถยนต์ส่วนตัว'
  if (!Array.isArray(c.stops)) c.stops = asList(c.travel?.stops).filter(Boolean)

  // แผนละเอียด: เดิมมีแค่ เดินทาง(น้ำมัน+ทางด่วน) / ที่พัก / กิจกรรม → แปลงเป็นรายการ
  if (!c.plan) {
    const people = peopleOf(trip) || 1
    const travel = []
    if (num(c.travel?.fuel)) travel.push(mkItem({ title: 'ค่าน้ำมัน', amount: String(num(c.travel.fuel)) }))
    if (num(c.travel?.toll)) travel.push(mkItem({ title: 'ค่าทางด่วน', amount: String(num(c.travel.toll)) }))
    const stay = []
    if (c.stay?.name || num(c.stay?.pricePerNight) || num(c.stay?.nights)) {
      const amt = num(c.stay?.total) || num(c.stay?.pricePerNight) * num(c.stay?.nights)
      stay.push(mkItem({ title: c.stay?.name || 'ที่พัก', amount: String(amt || ''), pricePerNight: c.stay?.pricePerNight || '', nights: c.stay?.nights || '' }))
    }
    const activity = asList(c.activities).map((a) => mkItem({
      title: a.name || '', amount: String(num(a.feePerPerson) * people || ''),
      note: a.note || '', place: a.place || '', by: a.by || '', loc: a.loc || 'ใกล้ที่พัก',
      feePerPerson: a.feePerPerson || '', count: String(people),
    }))
    c.plan = { travel, stay, food: [], activity }
  } else {
    for (const [k] of CATS) c.plan[k] = asList(c.plan[k])
  }
  if (!c.actual) c.actual = { travel: [], stay: [], food: [], activity: [] }
  else for (const [k] of CATS) c.actual[k] = asList(c.actual[k])
  delete c.travel
  delete c.stay
  delete c.activities
  return c
}

function migrateTrip(t) {
  t.id = t.id || uid()
  t.candidates = asList(t.candidates).map((c) => migrateCandidate(c, t))
  if (['วางแผน', 'กำลังวางแผน', 'ร่าง'].includes(t.status)) t.status = 'ทำอยู่'
  if (!t.status) t.status = 'ทำอยู่'
  // finalize เดิม → ใบตัวจริง + ล็อก
  const finId = t.finalize?.candidateId
  const w = t.candidates.find((c) => c.id === finId) || t.candidates.find((c) => c.winner)
  if (w) { w.winner = true; w.picked = true }
  // เคาะ = อนุมัติทันที: ใบตัวจริงถือว่าออกเดินทางแล้ว ไม่ต้องกดออกเดินทางแยกอีกขั้น
  if (t.departed == null) t.departed = !!w
  if (t.approvedId == null) t.approvedId = w?.id || ''
  if (t.locked == null) t.locked = !!t.finalize?.locked || !!w
  if (t.approvedTotal == null) t.approvedTotal = t.finalize?.total ?? ''
  // budget/actual ระดับทริปเดิม → ย้ายเข้าใบตัวจริง (ยังไม่มีตัวจริง → ใบแรกที่เข้ารอบ → ใบแรก กันข้อมูลหาย)
  const wInner = t.candidates.find((c) => c.id === t.approvedId) || t.candidates.find((c) => c.winner) || t.candidates.find((c) => c.picked) || t.candidates[0]
  if (wInner) {
    const bmap = { travel: t.budget?.travel, stay: t.budget?.stay, food: t.budget?.food, activity: t.budget?.activity }
    for (const [k, v] of Object.entries(bmap)) {
      if (num(v) && !wInner.plan[k].length) wInner.plan[k].push(mkItem({ title: 'งบเดิม', amount: String(num(v)) }))
    }
    const amap = { travel: t.actual?.travel, stay: t.actual?.stay, food: t.actual?.food, activity: t.actual?.activity }
    for (const [k, v] of Object.entries(amap)) {
      if (num(v)) wInner.actual[k].push(mkItem({ title: 'จดเดิม', amount: String(num(v)) }))
    }
  }
  delete t.budget
  delete t.actual
  delete t.finalize
  if (t.closed == null) t.closed = t.status === 'สรุปแล้ว'
  if (t.lesson == null) t.lesson = ''
  return t
}

function seed() {
  const t1 = uid()
  const cA = uid(), cB = uid(), cC = uid()
  return [migrateTrip({
    id: t1, name: '🧪 ทริปตัวอย่าง · เที่ยววันหยุด 2 คืน', dateRange: '12–14 ต.ค.', adults: 2, kids: 1,
    status: 'ทำอยู่', departed: true, closed: false, lesson: '',
    approvedId: cA, locked: true, approvedTotal: '6450',
    candidates: [
      {
        id: cA, dest: 'ทะเล ชะอำ/หัวหิน', nights: '2 คืน', estimate: '10,000-12,000',
        pros: 'ลูกเล่นน้ำเยอะ', picked: true, winner: true,
        vehicle: 'รถยนต์ส่วนตัว', stops: ['ปั๊ม PT', 'ร้านข้าวแกง'],
        plan: {
          travel: [
            { id: uid(), title: 'ค่าน้ำมัน', amount: '1500', note: 'ปั๊ม PT' },
            { id: uid(), title: 'ทางด่วน', amount: '200', note: '' },
          ],
          stay: [{ id: uid(), title: 'บ้านพักชะอำ', amount: '4000', note: '', pricePerNight: '2000', nights: '2' }],
          food: [],
          activity: [
            { id: uid(), title: 'เล่นน้ำชายหาด', amount: '600', note: 'เด็กเล่นได้', place: 'หน้าหาด', by: 'น้อง', loc: 'ใกล้ที่พัก', feePerPerson: '200', count: '3' },
            { id: uid(), title: 'ตลาดน้ำ', amount: '150', note: '', place: 'ทางผ่าน', by: 'พ่อ', loc: 'ระหว่างทาง', feePerPerson: '50', count: '3' },
          ],
        },
        actual: { travel: [], stay: [], food: [], activity: [] },
      },
      {
        id: cB, dest: 'เขาใหญ่', nights: '2 คืน', estimate: '7,000-9,000',
        pros: 'เดินทางสั้น', picked: true, winner: false,
        vehicle: 'รถยนต์ส่วนตัว', stops: [],
        plan: { travel: [], stay: [], food: [], activity: [] },
        actual: { travel: [], stay: [], food: [], activity: [] },
      },
      {
        id: cC, dest: 'เมือง+สวนสนุก', nights: '1 คืน', estimate: '6,000-8,000',
        pros: 'งบน้อยสุด', picked: false, winner: false,
        vehicle: 'รถยนต์ส่วนตัว', stops: [],
        plan: { travel: [], stay: [], food: [], activity: [] },
        actual: { travel: [], stay: [], food: [], activity: [] },
      },
    ],
  })]
}

export function loadTrips() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const s = seed()
      localStorage.setItem(KEY, JSON.stringify(s))
      return s
    }
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.map(migrateTrip)
  } catch { return [] }
}

export function saveTrips(trips) {
  localStorage.setItem(KEY, JSON.stringify(trips))
}

// ---- ยอดต่อใบ (ไม่ sum ข้ามใบ) ----
export function planTotals(c) {
  const o = {}
  let total = 0
  for (const [k] of CATS) {
    let s = 0
    for (const it of asList(c?.plan?.[k])) s += num(it.amount)
    o[k] = s
    total += s
  }
  o.total = total
  return o
}
export const planTotal = (c) => planTotals(c).total
export const hasDetail = (c) => planTotal(c) > 0

// ---- ยอดจดจริงของใบตัวจริง ----
export function actualTotals(t) {
  const w = winnerOf(t)
  const o = {}
  let total = 0
  for (const [k] of CATS) {
    let s = 0
    for (const it of asList(w?.actual?.[k])) s += num(it.amount)
    o[k] = s
    total += s
  }
  o.total = total
  return o
}

export const winnerOf = (t) =>
  (t?.candidates || []).find((c) => c.id === t?.approvedId) ||
  (t?.candidates || []).find((c) => c.winner)

export const pickedOf = (t) => (t?.candidates || []).filter((c) => c.picked)

// ---- สถานะทริป เหลือ 3 อย่างพอ (R024: ทำอยู่ / รอเที่ยว / จบแล้ว) ----
export function tripStatus(t) {
  if (!t) return 'ทำอยู่'
  if (t.closed || t.status === 'สรุปแล้ว') return 'จบแล้ว'
  if (winnerOf(t)) return 'รอเที่ยว'
  return 'ทำอยู่'
}

// เปิดทริปแล้วต้องไปจอไหน (ทางไปแค่ 3 ทาง — เคาะแล้วถือว่าอนุมัติทันที ไปจดเงินจริงได้เลย)
export function continueTarget(t) {
  if (!t) return 'trips'
  if (t.closed || t.status === 'สรุปแล้ว') return 'final'
  if (winnerOf(t)) return 'actual'
  return 'compare'
}

// คัดลอกทริปทั้งก้อน (id ใหม่หมด)
export function copyTrip(trip) {
  const c = JSON.parse(JSON.stringify(trip))
  const reid = (items) => asList(items).forEach((it) => { it.id = uid() })
  c.id = uid()
  c.name = (c.name || 'ทริป') + ' (สำเนา)'
  c.status = 'ทำอยู่'
  c.approvedId = ''
  c.locked = false
  c.approvedTotal = ''
  c.departed = false
  c.closed = false
  c.lesson = ''
  for (const cd of c.candidates || []) {
    cd.id = uid()
    cd.winner = false
    for (const [k] of CATS) { reid(cd.plan?.[k]); reid(cd.actual?.[k]) }
  }
  return c
}
