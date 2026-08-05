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

async function analyzeImage(file) {
  analyzeBtn.disabled = true; analyzeBtn.innerHTML = 'Analyzing…'; setStatus('Running YOLOv8 inference…');
  try {
    const formData = new FormData(); formData.append('file', file);
    const response = await fetch('/predict', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
    const data = await response.json(); renderResults(data); drawBoxes(data); setStatus('Inference complete · results visualized', true);
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
