// app/js/ocr.js

let ocrPreviewUrl = null;

async function performOCR(region = 'all') {
    const fileInput = document.getElementById('ocrFileInput');
    const langSelect = document.getElementById('ocrLangSelect');
    const resultArea = document.getElementById('ocrResult');
    const status = document.getElementById('ocrStatus');
    const progressFill = document.getElementById('ocrProgressFill');
    const progressWrap = document.getElementById('ocrProgressWrap');

    if (!fileInput.files || !fileInput.files[0]) return;

    resultArea.value = ""; // Clear previous results
    document.getElementById('ocrDownloadBtn').style.display = 'none';
    document.querySelectorAll('#ocrView .compress-preset, #ocrView .compress-run-btn').forEach(b => b.disabled = true);
    
    progressWrap.classList.add('active');
    status.className = 'compress-status';
    status.innerHTML = `<span></span> Preparing ${region}...`;

    const lang = langSelect.value; // 'khm', 'eng', or 'khm+eng'

    try {
        const originalImage = await loadImageForOCR(fileInput.files[0]);
        const processedImage = await cropImageForOCR(originalImage, region);

        const worker = await Tesseract.createWorker(lang, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    progressFill.style.width = progress + '%';
                    status.innerHTML = `<span></span> Scanning ${region}: ${progress}%`;
                } else {
                    status.innerHTML = `<span></span> ${m.status}...`;
                }
            }
        });

        const { data: { text } } = await worker.recognize(processedImage);
        const cleanedText = cleanOCRResult(text);
        
        // Append result if scanning multiple areas
        if (resultArea.value) {
            resultArea.value += `\n\n--- ${region.toUpperCase()} ---\n` + cleanedText;
        } else {
            resultArea.value = cleanedText;
        }
        document.getElementById('ocrDownloadBtn').style.display = 'block';
        
        await worker.terminate();
        
        status.className = 'compress-status success';
        status.innerHTML = '<span></span> OCR Complete';
        showToast(getTranslation('ocr_success'), "success");
    } catch (err) {
        console.error(err);
        status.className = 'compress-status error';
        status.innerHTML = '<span></span> OCR Failed';
        showToast("Failed to recognize text", "error");
    } finally {
        document.querySelectorAll('#ocrView .compress-preset, #ocrView .compress-run-btn').forEach(b => b.disabled = false);
        setTimeout(() => progressWrap.classList.remove('active'), 1000);
    }
}

function loadImageForOCR(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

function cropImageForOCR(img, region) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

    if (region === 'header') {
        sHeight = img.height * 0.25; // Top 20%
    } else if (region === 'footer') {
        sy = img.height * 0.75; // Bottom 20%
        sHeight = img.height * 0.25;
    } else if (region === 'body') {
        sy = img.height * 0.20;
        sHeight = img.height * 0.60;
    }

    canvas.width = sWidth;
    canvas.height = sHeight;

    // Draw white background (prevents transparency issues)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grayscale / High Contrast filter
    ctx.filter = 'grayscale(100%) contrast(300%) brightness(100%)';
    
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    return canvas.toDataURL('image/jpeg', 0.9);
}

function handleOCRFile(input) {
    const file = input.files[0];
    const runBtn = document.getElementById('ocrRunBtn');
    const previewContainer = document.getElementById('ocrPreviewContainer');
    
    if (file) {
        runBtn.disabled = false;
        
        // Clean up old preview URL to save memory
        if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
        
        ocrPreviewUrl = URL.createObjectURL(file);
        
        previewContainer.innerHTML = `
            <div class="compress-preview-card">
                <img src="${ocrPreviewUrl}" alt="Preview">
                <div>
                    <strong title="${file.name}">${file.name}</strong>
                    <small>${(file.size / 1024).toFixed(1)} KB</small>
                </div>
                <button class="compress-remove-btn" onclick="removeOCRFile()">✕</button>
            </div>
        `;
        
        showToast("Image ready for scan", "info");
    }
}

function removeOCRFile() {
    const fileInput = document.getElementById('ocrFileInput');
    const runBtn = document.getElementById('ocrRunBtn');
    const previewContainer = document.getElementById('ocrPreviewContainer');
    
    fileInput.value = "";
    runBtn.disabled = true;
    if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
    ocrPreviewUrl = null;
    previewContainer.innerHTML = "";
}

function downloadOCRText() {
    const text = document.getElementById('ocrResult').value;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_result_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function copyOCRText() {
    const result = document.getElementById('ocrResult');
    if (!result.value) return;
    
    result.select();
    document.execCommand('copy');
    showToast("Text copied to clipboard", "success");
}

function cleanOCRResult(text) {
    // Remove common OCR noise symbols and clean up whitespace
    return text
        // Remove a broader set of symbols mistaken for text
        .replace(/[|«»=~—_>\\/[\]{}()$#%&*+^"';]/g, ' ')
        // Remove repetitive dots/dashes (common layout artifacts)
        .replace(/[.-]{2,}/g, ' ')
        // Remove isolated single punctuation marks
        .replace(/\s+[.-]\s+/g, ' ')
        // Collapse multiple spaces into one
        .replace(/\s+/g, ' ')
        .split('\n')
        .map(line => line.trim())
        // Filter out short non-Khmer lines (likely debris)
        .filter(line => line.length > 1 || /[\u1780-\u17FF]/.test(line))
        .join('\n')
        .trim();
}

window.performOCR = performOCR;
window.downloadOCRText = downloadOCRText;
window.handleOCRFile = handleOCRFile;
window.copyOCRText = copyOCRText;
window.removeOCRFile = removeOCRFile;

function setupOCRDropZone() {
    const dropZone = document.getElementById("ocrDropZone");
    if (!dropZone) return;
    
    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, event => {
            event.preventDefault();
            dropZone.classList.add("dragover");
        });
    });
    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, event => {
            event.preventDefault();
            dropZone.classList.remove("dragover");
        });
    });
    dropZone.addEventListener("drop", event => {
        const fileInput = document.getElementById('ocrFileInput');
        fileInput.files = event.dataTransfer.files;
        handleOCRFile(fileInput);
    });
}

// Initialize listeners when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupOCRDropZone);
} else {
    setupOCRDropZone();
}