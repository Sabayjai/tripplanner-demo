// Popup ถาม-ตอบน่ารักเข้าธีม ใช้แทน browser confirm/alert
// ใช้: if (!(await ask({ mood, title, message, ok, danger }))) return
export function ask({ mood = '🤔', title = 'แน่ใจนะ?', message = '', ok = 'ตกลงเลย', cancel = 'ไว้ก่อน', danger = false } = {}) {
  return new Promise((resolve) => {
    const ov = document.createElement('div')
    ov.className = 'mov'
    ov.innerHTML = `
      <div class="mbox">
        <div class="mmood">${mood}</div>
        <div class="mtitle">${esc(title)}</div>
        ${message ? `<div class="mhint">${esc(message)}</div>` : ''}
        <div class="mrow">
          ${cancel ? `<button class="btn btn2 btn-sm m-cancel">${esc(cancel)}</button>` : ''}
          <button class="btn btn-sm ${danger ? 'btnDanger' : ''} m-ok">${esc(ok)}</button>
        </div>
      </div>`
    const done = (v) => { ov.remove(); resolve(v) }
    ov.querySelector('.m-ok').onclick = () => done(true)
    const cx = ov.querySelector('.m-cancel')
    if (cx) cx.onclick = () => done(false)
    ov.onclick = (e) => { if (e.target === ov) done(false) }
    document.body.appendChild(ov)
  })
}

// แจ้งสั้นๆ ใน popup เดียวกัน (แทน alert)
export function tell({ mood = '🎉', title = 'เรียบร้อย', message = '', ok = 'โอเค!' } = {}) {
  return ask({ mood, title, message, ok, cancel: '', danger: false }).then(() => true)
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
