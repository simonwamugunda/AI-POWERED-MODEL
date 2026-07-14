const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const dropZone = document.getElementById('dropZone');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusText = document.getElementById('statusText');
const resultsArea = document.getElementById('resultsArea');

let selectedFile = null;

const categoryMap = {
  plastic: { label: 'Plastic', bin: 'Blue bin', note: 'Rinse and place in the plastic recycling stream.' },
  glass: { label: 'Glass', bin: 'Glass bin', note: 'Remove lids and place clean glass in the glass container.' },
  metal: { label: 'Metal', bin: 'Metal recycling', note: 'Clean and crush cans where possible.' },
  paper: { label: 'Paper', bin: 'Paper recycling', note: 'Keep dry and place in the paper stream.' },
  cardboard: { label: 'Cardboard', bin: 'Cardboard recycling', note: 'Flatten boxes before disposal.' }
};

function setStatus(message, isReady = false) {
  statusText.textContent = message;
  statusText.style.color = isReady ? '#d1fae5' : 'var(--muted)';
}

function renderResults(data) {
  const itemsMarkup = data.detectedItems
    .map((item) => `
      <div class="metric">
        <strong>${item.label}</strong>
        <span>${Math.round(item.confidence * 100)}% confidence</span>
      </div>
    `)
    .join('');

  resultsArea.innerHTML = `
    <div class="result-card">
      <div class="result-grid">
        <div class="metric">
          <strong>Image</strong>
          <span>${data.imageName}</span>
        </div>
        <div class="metric">
          <strong>Detected items</strong>
          <span>${data.detectedItems.length}</span>
        </div>
        <div class="metric">
          <strong>Recommended bin</strong>
          <span>${data.recommendedBin}</span>
        </div>
      </div>
      <div class="chips">
        ${data.detectedItems.map((item) => `<span class="chip">${item.label}</span>`).join('')}
      </div>
      <p>${data.summary}</p>
      <div class="result-grid">${itemsMarkup}</div>
    </div>
  `;
}

function mockPrediction(fileName) {
  const categories = Object.keys(categoryMap);
  const count = 1 + Math.floor(Math.random() * 3);
  const detectedItems = Array.from({ length: count }, (_, index) => {
    const key = categories[(index + Math.floor(Math.random() * categories.length)) % categories.length];
    const item = categoryMap[key];
    return {
      label: item.label,
      confidence: 0.82 + Math.random() * 0.15
    };
  });

  const top = detectedItems[0];
  const bin = categoryMap[top.label.toLowerCase()]?.bin || 'Mixed recycling';
  return {
    imageName: fileName,
    detectedItems,
    recommendedBin: bin,
    summary: `Detected ${detectedItems.length} recyclable item${detectedItems.length > 1 ? 's' : ''} with strong confidence. The suggested sorting path is ${bin.toLowerCase()}.`
  };
}

async function analyzeImage(file) {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  setStatus('Running inference on the uploaded image...');

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/predict', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      renderResults(data);
      setStatus('Inference complete.', true);
      return;
    }
  } catch (error) {
    console.warn('Backend prediction unavailable, using demo output.', error);
  }

  const demoResult = mockPrediction(file.name);
  renderResults(demoResult);
  setStatus('Demo output generated locally. Connect a YOLOv8 backend to replace this mock result.', true);

  analyzeBtn.disabled = false;
  analyzeBtn.textContent = 'Analyze image';
}

function showPreview(file) {
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewImage.src = event.target.result;
    previewImage.style.display = 'block';
    setStatus(`Loaded ${file.name}. Ready to analyze.`);
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze image';
  };
  reader.readAsDataURL(file);
}

imageInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) showPreview(file);
});

analyzeBtn.addEventListener('click', () => {
  if (!selectedFile) return;
  analyzeImage(selectedFile);
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const file = event.dataTransfer.files?.[0];
  if (file) {
    showPreview(file);
    imageInput.files = event.dataTransfer.files;
  }
});
