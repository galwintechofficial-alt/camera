// ===== STATE =====
let currentShift = null;
let startPhotoData = null;
let endPhotoData = null;
let startStream = null;
let endStream = null;
let startMarked = false;
let endMarked = false;

const SHIFT_RATE = 400;
const SHIFTS = {
  Morning: { icon: '🌅', start: '06:00', end: '14:00', color: '#f59e0b' },
  Evening: { icon: '🌇', start: '14:00', end: '22:00', color: '#7c3aed' },
  Night:   { icon: '🌙', start: '22:00', end: '06:00', color: '#3b82f6' }
};

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  document.getElementById('liveClock').textContent =
    now.toLocaleTimeString('en-IN', { hour12: false });
  document.getElementById('liveDate').textContent =
    now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  event.currentTarget.classList.add('active');
  if (tab === 'history') { populateFilters(); renderHistory(); }
  if (tab === 'salary') { populateSalaryFilters(); renderSalary(); renderSalaryTable(); }
}

// ===== SHIFT SELECTION =====
function selectShift(btn) {
  document.querySelectorAll('.shift-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  currentShift = btn.getAttribute('data-shift');
  startPhotoData = null;
  endPhotoData = null;
  startMarked = false;
  endMarked = false;

  // Reset UI
  resetCameraUI('start');
  resetCameraUI('end');

  const now = new Date();
  document.getElementById('selectedShiftDisplay').textContent = currentShift + ' ' + SHIFTS[currentShift].icon;
  document.getElementById('todayDate').textContent = now.toLocaleDateString('en-IN');
  document.getElementById('shiftStatus').textContent = 'Ready';
  document.getElementById('statusCard').style.display = 'block';
  document.getElementById('startSection').style.display = 'block';
  document.getElementById('endSection').style.display = 'none';
  document.getElementById('todaySummary').style.display = 'none';
  document.getElementById('startDone').style.display = 'none';
  document.getElementById('endDone').style.display = 'none';
  showToast('✅ ' + currentShift + ' shift selected!', 'success');
}

// ===== CAMERA =====
async function openCamera(type) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    const video = document.getElementById(type + 'Video');
    video.srcObject = stream;
    video.style.display = 'block';
    video.classList.add('active');
    if (type === 'start') startStream = stream;
    else endStream = stream;

    document.getElementById(type + 'CamBtn').style.display = 'none';
    document.getElementById(type + 'CapBtn').style.display = 'inline-flex';
    const preview = document.getElementById(type + 'Preview');
    preview.style.display = 'none';
    preview.classList.remove('shown');
  } catch (e) {
    showToast('❌ Camera access denied. Gallery upload use panunga!', 'error');
  }
}

function capturePhoto(type) {
  const video = document.getElementById(type + 'Video');
  const canvas = document.getElementById(type + 'Canvas');
  const preview = document.getElementById(type + 'Preview');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
  if (type === 'start') startPhotoData = dataURL;
  else endPhotoData = dataURL;

  preview.src = dataURL;
  preview.style.display = 'block';
  preview.classList.add('shown');
  video.style.display = 'none';
  video.classList.remove('active');

  // Stop stream
  const stream = type === 'start' ? startStream : endStream;
  if (stream) stream.getTracks().forEach(t => t.stop());

  document.getElementById(type + 'CapBtn').style.display = 'none';
  document.getElementById(type + 'RetakeBtn').style.display = 'inline-flex';
  document.getElementById(type + 'CamBtn').style.display = 'none';

  const attendBtn = document.getElementById(type + 'AttendanceBtn');
  if (attendBtn) attendBtn.style.display = 'block';
  showToast('📸 Photo captured!', 'success');
}

function retakePhoto(type) {
  const preview = document.getElementById(type + 'Preview');
  preview.style.display = 'none';
  preview.classList.remove('shown');
  if (type === 'start') startPhotoData = null;
  else endPhotoData = null;
  document.getElementById(type + 'RetakeBtn').style.display = 'none';
  document.getElementById(type + 'CamBtn').style.display = 'inline-flex';
  document.getElementById(type + 'AttendanceBtn').style.display = 'none';
  openCamera(type);
}

function handleFileUpload(type, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataURL = e.target.result;
    if (type === 'start') startPhotoData = dataURL;
    else endPhotoData = dataURL;
    const preview = document.getElementById(type + 'Preview');
    preview.src = dataURL;
    preview.style.display = 'block';
    preview.classList.add('shown');
    document.getElementById(type + 'AttendanceBtn').style.display = 'block';
    document.getElementById(type + 'RetakeBtn').style.display = 'inline-flex';
    document.getElementById(type + 'CamBtn').style.display = 'none';
    showToast('🖼️ Image uploaded!', 'success');
  };
  reader.readAsDataURL(file);
}

function resetCameraUI(type) {
  const video = document.getElementById(type + 'Video');
  if (video) { video.style.display = 'none'; video.classList.remove('active'); }
  const preview = document.getElementById(type + 'Preview');
  if (preview) { preview.style.display = 'none'; preview.classList.remove('shown'); preview.src = ''; }
  const capBtn = document.getElementById(type + 'CapBtn');
  if (capBtn) capBtn.style.display = 'none';
  const retakeBtn = document.getElementById(type + 'RetakeBtn');
  if (retakeBtn) retakeBtn.style.display = 'none';
  const camBtn = document.getElementById(type + 'CamBtn');
  if (camBtn) camBtn.style.display = 'inline-flex';
  const attendBtn = document.getElementById(type + 'AttendanceBtn');
  if (attendBtn) attendBtn.style.display = 'none';
}

// ===== ATTENDANCE =====
function markAttendanceStart() {
  if (!startPhotoData) { showToast('📸 Photo எடுக்கவும்!', 'error'); return; }
  startMarked = true;
  const now = new Date();
  document.getElementById('startAttendanceBtn').style.display = 'none';
  document.getElementById('startDone').style.display = 'block';
  document.getElementById('shiftStatus').textContent = 'In Progress ⏳';
  document.getElementById('endSection').style.display = 'block';
  document.getElementById('startSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast('✅ Start attendance marked! ' + now.toLocaleTimeString('en-IN'), 'success');

  // Save partial record
  savePartialRecord(now);
}

function markAttendanceEnd() {
  if (!endPhotoData) { showToast('📸 End photo எடுக்கவும்!', 'error'); return; }
  endMarked = true;
  const now = new Date();
  document.getElementById('endAttendanceBtn').style.display = 'none';
  document.getElementById('endDone').style.display = 'block';
  document.getElementById('shiftStatus').textContent = 'Completed ✅';
  showToast('🎉 Shift completed! ₹' + SHIFT_RATE + ' earned!', 'success');
  completeRecord(now);
  showTodaySummary();
}

// ===== DATABASE (localStorage) =====
function getDB() {
  const raw = localStorage.getItem('shiftTrackerDB');
  return raw ? JSON.parse(raw) : [];
}
function saveDB(data) {
  localStorage.setItem('shiftTrackerDB', JSON.stringify(data));
}

function savePartialRecord(startTime) {
  const db = getDB();
  const id = Date.now().toString();
  const record = {
    id,
    shift: currentShift,
    date: startTime.toISOString().split('T')[0],
    startTime: startTime.toISOString(),
    endTime: null,
    startPhoto: startPhotoData,
    endPhoto: null,
    amount: 0,
    status: 'partial'
  };
  db.push(record);
  saveDB(db);
  localStorage.setItem('shiftTrackerCurrentId', id);
}

function completeRecord(endTime) {
  const db = getDB();
  const id = localStorage.getItem('shiftTrackerCurrentId');
  const idx = db.findIndex(r => r.id === id);
  if (idx !== -1) {
    db[idx].endTime = endTime.toISOString();
    db[idx].endPhoto = endPhotoData;
    db[idx].amount = SHIFT_RATE;
    db[idx].status = 'complete';
  } else {
    // Fallback: create full record
    db.push({
      id: Date.now().toString(),
      shift: currentShift,
      date: endTime.toISOString().split('T')[0],
      startTime: null,
      endTime: endTime.toISOString(),
      startPhoto: startPhotoData,
      endPhoto: endPhotoData,
      amount: SHIFT_RATE,
      status: 'complete'
    });
  }
  saveDB(db);
}

// ===== TODAY SUMMARY =====
function showTodaySummary() {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];
  const todayRecs = db.filter(r => r.date === today);
  const totalToday = todayRecs.reduce((s, r) => s + (r.amount || 0), 0);

  let html = '<div class="summary-grid">';
  html += `<div class="summary-item"><div class="summary-label">Shift</div><div class="summary-val">${currentShift} ${SHIFTS[currentShift].icon}</div></div>`;
  html += `<div class="summary-item"><div class="summary-label">Today Shifts</div><div class="summary-val">${todayRecs.filter(r=>r.status==='complete').length}</div></div>`;
  html += `<div class="summary-item"><div class="summary-label">Today Earned</div><div class="summary-val" style="color:var(--accent3)">₹${totalToday}</div></div>`;
  html += `<div class="summary-item"><div class="summary-label">Total Records</div><div class="summary-val">${db.length}</div></div>`;
  html += '</div>';

  document.getElementById('summaryContent').innerHTML = html;
  document.getElementById('todaySummary').style.display = 'block';
}

// ===== HISTORY =====
function populateFilters() {
  const db = getDB();
  const months = [...new Set(db.map(r => r.date.substring(0, 7)))].sort().reverse();
  const sel = document.getElementById('filterMonth');
  sel.innerHTML = '<option value="">All Months</option>';
  months.forEach(m => {
    const d = new Date(m + '-01');
    sel.innerHTML += `<option value="${m}">${d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>`;
  });
}

function renderHistory() {
  const db = getDB();
  const monthFilter = document.getElementById('filterMonth').value;
  const shiftFilter = document.getElementById('filterShift').value;
  let filtered = db;
  if (monthFilter) filtered = filtered.filter(r => r.date.startsWith(monthFilter));
  if (shiftFilter) filtered = filtered.filter(r => r.shift === shiftFilter);
  filtered = [...filtered].reverse();

  const list = document.getElementById('historyList');
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No attendance records found</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(r => {
    const s = SHIFTS[r.shift];
    const startT = r.startTime ? new Date(r.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';
    const endT = r.endTime ? new Date(r.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';
    const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const photos = `
      ${r.startPhoto ? `<img src="${r.startPhoto}" class="history-thumb" title="Start Photo" onclick="viewPhoto('${r.id}','start')" alt="Start">` : ''}
      ${r.endPhoto ? `<img src="${r.endPhoto}" class="history-thumb" title="End Photo" onclick="viewPhoto('${r.id}','end')" alt="End">` : ''}
    `;
    return `
    <div class="history-item">
      <div class="history-shift-badge badge-${r.shift}">${s.icon}</div>
      <div class="history-info">
        <div class="history-date">📅 ${dateStr}</div>
        <div class="history-shift-name">${r.shift} Shift</div>
        <div class="history-times">⏱ ${startT} → ${endT}</div>
        <div class="history-photos">${photos}</div>
      </div>
      <div>
        <div class="history-amount">₹${r.amount}</div>
        <div class="history-status ${r.status === 'complete' ? 'status-complete' : 'status-partial'}">
          ${r.status === 'complete' ? '✅ Done' : '⏳ Partial'}
        </div>
      </div>
    </div>`;
  }).join('');
}

function clearAllData() {
  if (!confirm('⚠️ All attendance data delete ஆகும். Sure-ஆ?')) return;
  localStorage.removeItem('shiftTrackerDB');
  localStorage.removeItem('shiftTrackerCurrentId');
  renderHistory();
  showToast('🗑️ All data cleared', 'error');
}

// ===== PHOTO MODAL =====
function viewPhoto(id, type) {
  const db = getDB();
  const rec = db.find(r => r.id === id);
  if (!rec) return;
  const src = type === 'start' ? rec.startPhoto : rec.endPhoto;
  if (!src) return;
  document.getElementById('modalImg').src = src;
  document.getElementById('modalCaption').textContent =
    `${rec.shift} Shift — ${type === 'start' ? 'Start' : 'End'} Photo — ${new Date(rec.date + 'T12:00:00').toLocaleDateString('en-IN')}`;
  document.getElementById('photoModal').classList.add('open');
}
function closeModal() {
  document.getElementById('photoModal').classList.remove('open');
}

// ===== SALARY =====
function populateSalaryFilters() {
  const db = getDB();
  const months = [...new Set(db.map(r => r.date.substring(0, 7)))].sort().reverse();
  const sel = document.getElementById('salaryFilterMonth');
  sel.innerHTML = '<option value="">All Months</option>';
  months.forEach(m => {
    const d = new Date(m + '-01');
    sel.innerHTML += `<option value="${m}">${d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>`;
  });
}

function renderSalary() {
  const db = getDB();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const monthStr = today.substring(0, 7);

  const completed = db.filter(r => r.status === 'complete');

  const todayRecs = completed.filter(r => r.date === today);
  const weekRecs = completed.filter(r => new Date(r.date + 'T12:00:00') >= weekStart);
  const monthRecs = completed.filter(r => r.date.startsWith(monthStr));

  const sum = arr => arr.reduce((s, r) => s + r.amount, 0);

  document.getElementById('salToday').textContent = '₹' + sum(todayRecs);
  document.getElementById('salWeek').textContent = '₹' + sum(weekRecs);
  document.getElementById('salMonth').textContent = '₹' + sum(monthRecs);
  document.getElementById('salTotal').textContent = '₹' + sum(completed);

  document.getElementById('shiftToday').textContent = todayRecs.length + ' shift(s)';
  document.getElementById('shiftWeek').textContent = weekRecs.length + ' shift(s)';
  document.getElementById('shiftMonth').textContent = monthRecs.length + ' shift(s)';
  document.getElementById('shiftTotal').textContent = completed.length + ' shift(s)';
}

function renderSalaryTable() {
  const db = getDB();
  const monthFilter = document.getElementById('salaryFilterMonth').value;
  let recs = db.filter(r => r.status === 'complete');
  if (monthFilter) recs = recs.filter(r => r.date.startsWith(monthFilter));
  recs = [...recs].reverse();

  if (!recs.length) {
    document.getElementById('salaryTable').innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><p>No salary records found</p></div>`;
    return;
  }

  let html = `<table class="salary-table">
    <thead><tr>
      <th>Date</th><th>Shift</th><th>Start</th><th>End</th><th>Amount</th>
    </tr></thead><tbody>`;

  recs.forEach(r => {
    const s = SHIFTS[r.shift];
    const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const startT = r.startTime ? new Date(r.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';
    const endT = r.endTime ? new Date(r.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';
    html += `<tr>
      <td>${dateStr}</td>
      <td>${s.icon} ${r.shift}</td>
      <td>${startT}</td>
      <td>${endT}</td>
      <td class="amount-cell">₹${r.amount}</td>
    </tr>`;
  });

  const total = recs.reduce((s, r) => s + r.amount, 0);
  html += `<tr style="font-weight:700;border-top:2px solid var(--border)">
    <td colspan="4" style="color:var(--text)">Total (${recs.length} shifts)</td>
    <td class="amount-cell" style="font-size:20px">₹${total}</td>
  </tr>`;
  html += '</tbody></table>';
  document.getElementById('salaryTable').innerHTML = html;
}

// ===== EXPORT =====
function exportJSON() {
  const db = getDB();
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'shift_attendance_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('💾 JSON exported!', 'success');
}

function exportCSV() {
  const db = getDB();
  if (!db.length) { showToast('No data to export', 'error'); return; }
  const headers = ['Date', 'Shift', 'Start Time', 'End Time', 'Amount', 'Status'];
  const rows = db.map(r => [
    r.date,
    r.shift,
    r.startTime ? new Date(r.startTime).toLocaleTimeString('en-IN') : '',
    r.endTime ? new Date(r.endTime).toLocaleTimeString('en-IN') : '',
    r.amount,
    r.status
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'shift_attendance_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  showToast('📊 CSV exported!', 'success');
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize month selects when switching tabs
});
