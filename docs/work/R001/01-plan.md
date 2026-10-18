# Work Plan · R001 ทริปครอบครัว (Phase Requirements) — เน้น Candidate Plans

- **ชื่องาน / รอบงาน:** R001 - เตรียม Requirement ทริปครอบครัว
- **ผู้รับผิดชอบ:** AI (ผู้ลงมือ) / พ่อ (ผู้ตรวจรับ, เตรียมส่งภรรยาอนุมัติ)
- **วันที่:** 2026-10-18
- **Agent ที่ใช้:** `.claude/agents/phase1-requirements.md`

---

## 1. เป้าหมาย (Goal)
- ได้ Requirement ระบบ 1 ไฟล์ (`docs/requirements/family-trip.md`) ที่มี Candidate Plans A/B/C + ตารางเทียบ เอาไปหารือกับภรรยาก่อนล็อก 1 แผนแล้วค่อยขออนุมัติงบ

## 2. ขอบเขตงาน (Scope)
- **ทำ (In Scope):**
  - [x] สร้าง Agent Phase 1 (แบบไม่ล็อกปลายทาง)
  - [x] ร่าง Requirement ระบบ `family-trip.md` ครบ 8 US + ตารางเทียบ Candidate A/B/C (ทะเลเป็นแค่ 1 ตัวเลือก)
  - [x] พ่อตัดสิน scope: หลายทริป/Candidate ไม่ fix/ตัวเลขไม่บังคับ/ตัดเผื่อฉุกเฉิน/จดแค่ตัวเลข (ไม่ต้องล็อก 1 แผนก่อน Design)
  - [x] Open Questions เหลือ 0 (ย้ายเป็นบันทึกการตัดสินใจแล้ว)
  - [x] พ่อตรวจรับ Requirement ระบบ = Accepted (พร้อมขึ้น Phase Design)
- **ไม่ทำ (Out of Scope):**
  - ออกแบบ UI / เขียนโค้ด / จองจริง / จ่ายเงินจริง

## 3. เกณฑ์การตรวจรับ (Acceptance Criteria)
- [x] `family-trip.md` มี Candidate แบบไม่ fix + ตารางเทียบ (ไม่ fix ทะเล)
- [x] มี 9 US ครบ (หลายทริป/Candidate/เดินทาง/ที่พัก/กิจกรรม/งบ 4 หมวด/Finalize/Actual ตัวเลข/สรุปบนเครื่องพ่อ)
- [x] Open Questions เหลือ 0 (เป็นบันทึกการตัดสินใจแล้ว)
- [x] พ่อ Accept Requirement แล้ว

## 4. ข้อสังเกต / ขั้นตอนถัดไป
- ไม่มีคำถามค้างแล้ว Requirement = Accepted
- ถัดไป (Phase Design): โครงข้อมูลทริป/Candidate/งบ 4 หมวด/Actual ตัวเลข + หน้าสรุปบนเครื่องพ่อหน้าตาแบบไหน
