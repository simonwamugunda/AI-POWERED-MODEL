const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const previewCard = document.getElementById('previewCard');
const dropZone = document.getElementById('dropZone');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const fileName = document.getElementById('fileName');
const imageMeta = document.getElementById('imageMeta');
const resultsArea = document.getElementById('resultsArea');
const boxesCanvas = document.getElementById('boxesCanvas');
const imageRenderer = document.getElementById('imageRenderer');
const detectionLegend = document.getElementById('detectionLegend');
const analysisLoading = document.getElementById('analysisLoading');
const cameraDialog = document.getElementById('cameraDialog');
const cameraVideo = document.getElementById('cameraVideo');
const classColors = { CAN: '#7c3aed', GLASS: '#16a34a', 'PAPER CUP': '#d97706', PET: '#2563eb', TETRA: '#db2777', TRASH: '#475569', WRAPPER: '#dc2626' };
let selectedFile = null;
let cameraStream = null;
let latestInference = null;
let predictionHistory = [];
let toastTimer;

function showToast(message) { const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800); }
function setStatus(message, state = 'ready') { statusText.textContent = message; statusText.classList.toggle('is-loading', state === 'loading'); }
function setLoading(isLoading) { analysisLoading.hidden = !isLoading; }
function clearCanvas() { const ctx = boxesCanvas.getContext('2d'); ctx.clearRect(0, 0, boxesCanvas.width, boxesCanvas.height); }
function colorFor(label) { return classColors[String(label).toUpperCase()] || '#2563eb'; }

function resizeCanvasToImage() {
  const rect = previewImage.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const dpr = window.devicePixelRatio || 1;
  boxesCanvas.width = Math.round(rect.width * dpr);
  boxesCanvas.height = Math.round(rect.height * dpr);
  boxesCanvas.style.width = `${rect.width}px`;
  boxesCanvas.style.height = `${rect.height}px`;
  return true;
}

function drawBoxes(data = latestInference) {
  if (!data || !resizeCanvasToImage()) return;
  const ctx = boxesCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const displayW = boxesCanvas.width / dpr;
  const displayH = boxesCanvas.height / dpr;
  const naturalW = previewImage.naturalWidth || 1;
  const naturalH = previewImage.naturalHeight || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, displayW, displayH);
  ctx.lineJoin = 'round';
  for (const box of data.boundingBoxes || []) {
    const x = box.x1 * displayW / naturalW;
    const y = box.y1 * displayH / naturalH;
    const w = (box.x2 - box.x1) * displayW / naturalW;
    const h = (box.y2 - box.y1) * displayH / naturalH;
    const color = colorFor(box.label);
    const label = `${box.label} ${(box.confidence * 100).toFixed(0)}%`;
    ctx.font = '700 12px DM Sans, sans-serif';
    const labelW = Math.ceil(ctx.measureText(label).width + 14);
    const labelH = 23;
    const labelY = y >= labelH + 4 ? y - labelH - 3 : Math.min(displayH - labelH, y + 3);
    ctx.save();
    ctx.shadowColor = '#0f172a99'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 1;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    ctx.shadowColor = 'transparent'; ctx.fillStyle = color; ctx.fillRect(x, labelY, Math.min(labelW, displayW - x), labelH);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x + 7, labelY + 15);
    ctx.restore();
  }
}

function updateLegend(data) {
  const count = data?.boundingBoxes?.length || 0;
  detectionLegend.hidden = !data;
  detectionLegend.textContent = count ? `${count} detection${count === 1 ? '' : 's'}` : 'No objects detected';
}
function renderResults(data) {
  const items = data.detectedItems || [];
  if (!items.length) { resultsArea.innerHTML = '<div class="empty-state"><span>!</span><div><strong>No items detected</strong><p>Try a clearer, closer image of a waste item.</p></div></div>'; return; }
  resultsArea.innerHTML = `<div class="result-card"><div class="result-grid"><div class="metric"><strong>DETECTED ITEMS</strong><span>${items.length} item${items.length === 1 ? '' : 's'} found</span></div><div class="metric"><strong>RECOMMENDED BIN</strong><span>${escapeHtml(data.recommendedBin)}</span></div><div class="metric"><strong>MODEL RESPONSE</strong><span>Inference complete</span></div></div><div class="chips">${items.map(item => `<span class="chip">${escapeHtml(item.label)} · ${Math.round(item.confidence * 100)}%</span>`).join('')}</div><p>${escapeHtml(data.summary)}</p></div>`;
}
function escapeHtml(value) { const element = document.createElement('div'); element.textContent = value ?? ''; return element.innerHTML; }
function rowClass(label) { return String(label).toLowerCase().replace(/[^a-z]/g, ''); }
function renderPredictionHistory(filter = '') { const rows = document.getElementById('predictionRows'); const query = filter.trim().toLowerCase(); const visible = predictionHistory.filter(item => !query || Object.values(item).some(value => String(value).toLowerCase().includes(query))); rows.innerHTML = visible.length ? visible.map(item => `<tr><td>#${item.id}</td><td><span class="table-item ${rowClass(item.label)}">${escapeHtml(item.label)}</span></td><td>${escapeHtml(item.bin)}</td><td><strong>${item.confidence}%</strong></td><td>${escapeHtml(item.timestamp)}</td><td><span class="status-badge">● Complete</span></td></tr>`).join('') : `<tr class="no-data"><td colspan="6">${predictionHistory.length ? 'No model predictions match this search.' : 'No model predictions yet. Analyze an image to create the first real result.'}</td></tr>`; }
function addModelRun(data) { const items = data.detectedItems || []; const top = items.reduce((best, item) => !best || item.confidence > best.confidence ? item : best, null); predictionHistory.unshift({ id: `PRD-${Date.now().toString().slice(-6)}`, label: top?.label || 'No detection', bin: data.recommendedBin || 'No recommendation', confidence: top ? (top.confidence * 100).toFixed(1) : '—', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }); renderPredictionHistory(document.getElementById('predictionSearch').value); }

async function analyzeImage(file) {
  analyzeBtn.disabled = true; analyzeBtn.innerHTML = 'Analyzing…'; setStatus('Running YOLOv8 inference…', 'loading'); setLoading(true);
  try { const formData = new FormData(); formData.append('file', file); const response = await fetch('/predict', { method: 'POST', body: formData }); if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`); latestInference = await response.json(); renderResults(latestInference); updateLegend(latestInference); drawBoxes(); addModelRun(latestInference); setStatus('Inference complete', 'complete'); }
  catch (error) { console.error(error); latestInference = null; updateLegend(null); setStatus('Prediction failed. Confirm the Flask server is running.', 'error'); resultsArea.innerHTML = '<div class="empty-state"><span>!</span><div><strong>Could not reach the model</strong><p>Start app.py and try your image again.</p></div></div>'; }
  finally { setLoading(false); analyzeBtn.disabled = false; analyzeBtn.innerHTML = 'Re-analyze image <span>→</span>'; }
}
function showPreview(file) {
  if (!file || !file.type.startsWith('image/')) return;
  selectedFile = file; latestInference = null; updateLegend(null); previewCard.hidden = false; fileName.textContent = file.name || 'Camera capture'; setStatus('Ready to analyze'); analyzeBtn.disabled = false; analyzeBtn.innerHTML = 'Analyze image <span>→</span>'; clearCanvas();
  const reader = new FileReader(); reader.onload = event => { previewImage.onload = () => { imageMeta.textContent = `${previewImage.naturalWidth} × ${previewImage.naturalHeight} px`; resizeCanvasToImage(); clearCanvas(); }; previewImage.src = event.target.result; }; reader.readAsDataURL(file);
}
function resetPreview() { selectedFile = null; latestInference = null; imageInput.value = ''; previewCard.hidden = true; previewImage.removeAttribute('src'); updateLegend(null); setLoading(false); clearCanvas(); analyzeBtn.disabled = true; resultsArea.innerHTML = '<div class="empty-state"><span>⌁</span><div><strong>Awaiting image input</strong><p>Your detection results will appear here after analysis.</p></div></div>'; }
function stopCamera() { if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); cameraStream = null; }

imageInput.addEventListener('change', e => showPreview(e.target.files?.[0])); analyzeBtn.addEventListener('click', () => selectedFile && analyzeImage(selectedFile)); clearBtn.addEventListener('click', resetPreview);
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); }); dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover')); dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); showPreview(e.dataTransfer.files?.[0]); });
new ResizeObserver(() => { if (selectedFile && previewImage.complete) drawBoxes(); }).observe(imageRenderer);
window.addEventListener('orientationchange', () => requestAnimationFrame(() => drawBoxes()));
document.getElementById('cameraBtn').addEventListener('click', async () => { if (!navigator.mediaDevices?.getUserMedia) { imageInput.click(); return; } try { cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); cameraVideo.srcObject = cameraStream; cameraDialog.showModal(); } catch (error) { console.warn(error); showToast('Camera access was unavailable. Choose an image instead.'); } });
document.getElementById('captureBtn').addEventListener('click', () => { const canvas = document.createElement('canvas'); canvas.width = cameraVideo.videoWidth; canvas.height = cameraVideo.videoHeight; canvas.getContext('2d').drawImage(cameraVideo, 0, 0); canvas.toBlob(blob => { if (blob) showPreview(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })); }, 'image/jpeg', .92); stopCamera(); cameraDialog.close(); });
['closeCamera', 'cancelCamera'].forEach(id => document.getElementById(id).addEventListener('click', () => { stopCamera(); cameraDialog.close(); })); cameraDialog.addEventListener('close', stopCamera);
document.getElementById('themeBtn').addEventListener('click', e => { const isDark = document.body.classList.toggle('dark'); localStorage.setItem('sortiq-theme', isDark ? 'dark' : 'light'); e.currentTarget.textContent = isDark ? '☀' : '◐'; e.currentTarget.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`); }); if (localStorage.getItem('sortiq-theme') === 'dark') { document.body.classList.add('dark'); document.getElementById('themeBtn').textContent = '☀'; }
document.getElementById('refreshBtn').addEventListener('click', () => { renderPredictionHistory(document.getElementById('predictionSearch').value); showToast('Dashboard data refreshed.'); }); document.getElementById('viewModelBtn').addEventListener('click', () => document.getElementById('model').scrollIntoView({ behavior: 'smooth', block: 'center' })); document.getElementById('notificationsBtn').addEventListener('click', () => showToast('No new model alerts.')); document.getElementById('helpBtn').addEventListener('click', () => showToast('Choose an image or camera photo, then select Analyze image.')); document.getElementById('profileBtn').addEventListener('click', () => showToast('Signed in as Alex Morgan · ML Engineer')); document.getElementById('deployBtn').addEventListener('click', () => showToast('Deployment requests require server-side approval.')); document.querySelector('.menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('mobile-open')); document.querySelectorAll('.side-nav a').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('.side-nav a').forEach(item => item.classList.remove('active')); link.classList.add('active'); document.querySelector('.sidebar').classList.remove('mobile-open'); }));
document.getElementById('searchBtn').addEventListener('click', () => { const input = document.getElementById('predictionSearch'); input.hidden = !input.hidden; if (!input.hidden) input.focus(); }); document.getElementById('predictionSearch').addEventListener('input', e => renderPredictionHistory(e.target.value));
function downloadCsv(filename, rows) { const url = URL.createObjectURL(new Blob([rows], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function exportRuns() { const header = 'Prediction ID,Detected item,Recommended bin,Confidence,Timestamp\n'; const rows = predictionHistory.map(item => [item.id, item.label, item.bin, item.confidence, item.timestamp].map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'); downloadCsv('sortiq-model-predictions.csv', header + rows); }
['exportBtn', 'reportBtn'].forEach(id => document.getElementById(id).addEventListener('click', () => { if (!predictionHistory.length) return showToast('Run an image analysis before exporting.'); exportRuns(); showToast('Model prediction CSV downloaded.'); }));
