const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const previewCard = document.getElementById('previewCard');
const dropZone = document.getElementById('dropZone');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const fileName = document.getElementById('fileName');
const resultsArea = document.getElementById('resultsArea');
const boxesCanvas = document.getElementById('boxesCanvas');
const cameraDialog = document.getElementById('cameraDialog');
const cameraVideo = document.getElementById('cameraVideo');
let selectedFile = null;
let cameraStream = null;
let predictionHistory = [];
let toastTimer;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function setStatus(message, ready = false) { statusText.textContent = message; statusText.style.color = ready ? '#168641' : ''; }
function clearCanvas() { const ctx = boxesCanvas.getContext('2d'); ctx.clearRect(0, 0, boxesCanvas.width, boxesCanvas.height); }
function setupCanvasToImage() { const r = previewImage.getBoundingClientRect(); if (!r.width || !r.height) return; boxesCanvas.width = Math.round(r.width); boxesCanvas.height = Math.round(r.height); }
function hashCode(str) { return [...str].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0); }

function drawBoxes(data) {
  setupCanvasToImage(); clearCanvas();
  const ctx = boxesCanvas.getContext('2d'); const naturalW = previewImage.naturalWidth || 1; const naturalH = previewImage.naturalHeight || 1;
  for (const b of data.boundingBoxes || []) {
    const x = b.x1 * boxesCanvas.width / naturalW, y = b.y1 * boxesCanvas.height / naturalH;
    const w = (b.x2 - b.x1) * boxesCanvas.width / naturalW, h = (b.y2 - b.y1) * boxesCanvas.height / naturalH;
    const hue = Math.abs(hashCode(b.label)) % 360; ctx.strokeStyle = `hsl(${hue} 82% 53%)`; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    const label = `${b.label} ${(b.confidence * 100).toFixed(0)}%`; ctx.font = '600 12px DM Sans, sans-serif'; const labelW = ctx.measureText(label).width + 12;
    ctx.fillStyle = `hsl(${hue} 75% 40%)`; ctx.fillRect(x, Math.max(0, y - 22), labelW, 22); ctx.fillStyle = '#fff'; ctx.fillText(label, x + 6, Math.max(15, y - 7));
  }
}

function renderResults(data) {
  const items = data.detectedItems || [];
  resultsArea.innerHTML = `<div class="result-card"><div class="result-grid"><div class="metric"><strong>DETECTED ITEMS</strong><span>${items.length} item${items.length === 1 ? '' : 's'} found</span></div><div class="metric"><strong>RECOMMENDED BIN</strong><span>${data.recommendedBin}</span></div><div class="metric"><strong>MODEL RESPONSE</strong><span>Inference complete</span></div></div><div class="chips">${items.map(item => `<span class="chip">${item.label} · ${Math.round(item.confidence * 100)}%</span>`).join('')}</div><p>${data.summary}</p></div>`;
}

function escapeHtml(value) { const element = document.createElement('div'); element.textContent = value ?? ''; return element.innerHTML; }
function rowClass(label) { return String(label).toLowerCase().replace(/[^a-z]/g, ''); }
function renderPredictionHistory(filter = '') {
  const rows = document.getElementById('predictionRows');
  const query = filter.trim().toLowerCase();
  const visible = predictionHistory.filter(item => !query || Object.values(item).some(value => String(value).toLowerCase().includes(query)));
  if (!visible.length) { rows.innerHTML = `<tr class="no-data"><td colspan="6">${predictionHistory.length ? 'No model predictions match this search.' : 'No model predictions yet. Analyze an image to create the first real result.'}</td></tr>`; return; }
  rows.innerHTML = visible.map(item => `<tr><td>#${item.id}</td><td><span class="table-item ${rowClass(item.label)}">${escapeHtml(item.label)}</span></td><td>${escapeHtml(item.bin)}</td><td><strong>${item.confidence}%</strong></td><td>${escapeHtml(item.timestamp)}</td><td><span class="status-badge">● Complete</span></td></tr>`).join('');
}
function renderDistribution() {
  const container = document.getElementById('classDistribution');
  const countByClass = {};
  predictionHistory.forEach(run => run.items.forEach(item => { countByClass[item.label] = (countByClass[item.label] || 0) + 1; }));
  const entries = Object.entries(countByClass).sort((a, b) => b[1] - a[1]);
  if (!entries.length) { container.innerHTML = '<p class="chart-empty">Run an image analysis to see detected classes.</p>'; return; }
  const max = entries[0][1];
  container.innerHTML = entries.map(([label, count]) => `<div><span>${escapeHtml(label)}</span><i><b style="width:${Math.max(8, count / max * 100)}%"></b></i><strong>${count}</strong></div>`).join('');
}
function addModelRun(data) {
  const items = data.detectedItems || [];
  const top = items.reduce((best, item) => !best || item.confidence > best.confidence ? item : best, null);
  predictionHistory.unshift({ id: `PRD-${Date.now().toString().slice(-6)}`, label: top?.label || 'No detection', bin: data.recommendedBin || 'No recommendation', confidence: top ? (top.confidence * 100).toFixed(1) : '—', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), items });
  renderPredictionHistory(document.getElementById('predictionSearch').value); renderDistribution();
}

async function analyzeImage(file) {
  analyzeBtn.disabled = true; analyzeBtn.innerHTML = 'Analyzing…'; setStatus('Running YOLOv8 inference…');
  try {
    const formData = new FormData(); formData.append('file', file);
    const response = await fetch('/predict', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
    const data = await response.json(); renderResults(data); drawBoxes(data); addModelRun(data); setStatus('Inference complete · results visualized', true);
  } catch (error) { console.error(error); setStatus('Prediction failed. Confirm the Flask model server is running.'); resultsArea.innerHTML = '<div class="empty-state"><span>!</span><div><strong>Could not reach the model</strong><p>Start app.py and try your image again.</p></div></div>'; }
  finally { analyzeBtn.disabled = false; analyzeBtn.innerHTML = 'Analyze image <span>→</span>'; }
}

function showPreview(file) {
  if (!file || !file.type.startsWith('image/')) return;
  selectedFile = file; fileName.textContent = file.name || 'Camera capture'; previewCard.hidden = false; clearCanvas();
  const reader = new FileReader(); reader.onload = event => { previewImage.src = event.target.result; previewImage.onload = () => { setupCanvasToImage(); clearCanvas(); }; }; reader.readAsDataURL(file);
  setStatus('Image ready for analysis'); analyzeBtn.disabled = false;
}
function resetPreview() { selectedFile = null; imageInput.value = ''; previewCard.hidden = true; previewImage.removeAttribute('src'); clearCanvas(); analyzeBtn.disabled = true; resultsArea.innerHTML = '<div class="empty-state"><span>⌁</span><div><strong>Awaiting image input</strong><p>Your detection results will appear here after analysis.</p></div></div>'; }
function stopCamera() { if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); cameraStream = null; }

imageInput.addEventListener('change', e => showPreview(e.target.files?.[0]));
analyzeBtn.addEventListener('click', () => selectedFile && analyzeImage(selectedFile));
clearBtn.addEventListener('click', resetPreview);
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); showPreview(e.dataTransfer.files?.[0]); });
document.getElementById('cameraBtn').addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia) { imageInput.click(); return; }
  try { cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); cameraVideo.srcObject = cameraStream; cameraDialog.showModal(); }
  catch (error) { console.warn(error); alert('Camera access was unavailable. You can still choose an image from your device.'); }
});
document.getElementById('captureBtn').addEventListener('click', () => { const canvas = document.createElement('canvas'); canvas.width = cameraVideo.videoWidth; canvas.height = cameraVideo.videoHeight; canvas.getContext('2d').drawImage(cameraVideo, 0, 0); canvas.toBlob(blob => { if (blob) showPreview(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })); }, 'image/jpeg', .92); stopCamera(); cameraDialog.close(); });
document.getElementById('closeCamera').addEventListener('click', () => { stopCamera(); cameraDialog.close(); });
document.getElementById('cancelCamera').addEventListener('click', () => { stopCamera(); cameraDialog.close(); });
cameraDialog.addEventListener('close', stopCamera);
window.addEventListener('resize', () => { if (selectedFile && previewImage.complete) clearCanvas(); });
document.getElementById('refreshBtn').addEventListener('click', e => { e.currentTarget.textContent = '↻ Updated'; setTimeout(() => e.currentTarget.textContent = '↻ Refresh', 1200); });
document.getElementById('themeBtn').addEventListener('click', e => {
  const isDark = document.body.classList.toggle('dark'); localStorage.setItem('sortiq-theme', isDark ? 'dark' : 'light');
  e.currentTarget.textContent = isDark ? '☀' : '◐'; e.currentTarget.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`); showToast(`${isDark ? 'Dark' : 'Light'} mode enabled`);
});
if (localStorage.getItem('sortiq-theme') === 'dark') { document.body.classList.add('dark'); document.getElementById('themeBtn').textContent = '☀'; }
document.getElementById('refreshBtn').addEventListener('click', () => { renderPredictionHistory(document.getElementById('predictionSearch').value); renderDistribution(); showToast('Dashboard data refreshed.'); });
document.getElementById('viewModelBtn').addEventListener('click', () => { document.getElementById('model').scrollIntoView({ behavior: 'smooth', block: 'center' }); showToast('Showing active model details.'); });
document.getElementById('distributionBtn').addEventListener('click', () => { document.getElementById('predictions').scrollIntoView({ behavior: 'smooth' }); });
document.getElementById('notificationsBtn').addEventListener('click', () => showToast('No new model alerts. All services are operational.'));
document.getElementById('helpBtn').addEventListener('click', () => showToast('Choose an image or camera photo, then select Analyze image.'));
document.getElementById('profileBtn').addEventListener('click', () => showToast('Signed in as Alex Morgan · ML Engineer'));
document.getElementById('deployBtn').addEventListener('click', () => showToast('Deployment requests require server-side approval. The active model remains v2.4.0.'));
document.querySelector('.menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('mobile-open'));
document.querySelectorAll('.side-nav a').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('.side-nav a').forEach(item => item.classList.remove('active')); link.classList.add('active'); document.querySelector('.sidebar').classList.remove('mobile-open'); }));
document.getElementById('searchBtn').addEventListener('click', () => { const input = document.getElementById('predictionSearch'); input.hidden = !input.hidden; if (!input.hidden) input.focus(); });
document.getElementById('predictionSearch').addEventListener('input', e => renderPredictionHistory(e.target.value));
function downloadCsv(filename, rows) { const url = URL.createObjectURL(new Blob([rows], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function exportRuns() { const header = 'Prediction ID,Detected item,Recommended bin,Confidence,Timestamp\n'; const rows = predictionHistory.map(item => [item.id, item.label, item.bin, item.confidence, item.timestamp].map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'); downloadCsv('sortiq-model-predictions.csv', header + rows); }
document.getElementById('exportBtn').addEventListener('click', () => { if (!predictionHistory.length) return showToast('Run an image analysis before exporting results.'); exportRuns(); showToast('Model prediction CSV downloaded.'); });
document.getElementById('reportBtn').addEventListener('click', () => { if (!predictionHistory.length) return showToast('Run an image analysis before downloading a report.'); exportRuns(); showToast('Your model-results report is downloading.'); });
