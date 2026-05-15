// app/js/invoice.js
// Logic for the Invoice Generator tool

const khMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const khDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

function toKhmerNum(num) {
    return num.toString().split('').map(x => khDigits[parseInt(x)] || x).join('');
}

function triggerCalendar() {
    const picker = document.getElementById('hiddenDatePicker');
    if (picker && picker.showPicker) {
        picker.showPicker();
    } else if (picker) {
        picker.click();
    }
}

function updateInvoiceDate(dateStr) {
    if (!dateStr) return;
    const d = new Date(dateStr);
    const khDate = document.getElementById('khDate');
    const enDate = document.getElementById('enDate');
    const display = document.getElementById('invoiceDateDisplay');

    if (khDate) khDate.innerText = `ថ្ងៃទី ${toKhmerNum(d.getDate())} ខែ ${khMonths[d.getMonth()]} ឆ្នាំ ${toKhmerNum(d.getFullYear())}`;

    const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (enDate) enDate.innerText = formattedDate.replace(/ /g, '-');
    if (display) display.innerText = formattedDate;
}

function addRow() {
    const body = document.getElementById('rows-body');
    if (!body) return;
    const count = body.rows.length + 1;
    const tr = document.createElement('tr');
    tr.className = "group hover:bg-amber-50 transition-colors";
    tr.innerHTML = `
        <td class="text-center font-bold text-gray-300 text-xs">${count}</td>
        <td class="px-4"><div contenteditable="true" class="w-full text-gray-700 font-bold italic">...</div></td>
        <td class="text-center"><div contenteditable="true" class="qty font-black bg-gray-50 rounded" oninput="calc()" onblur="calc()">0</div></td>
        <td class="text-center"><div contenteditable="true" class="price font-black bg-gray-50 rounded" oninput="calc()" onblur="calc()">0.00</div></td>
        <td class="text-right pr-4 font-black text-blue-900 font-black">$ <span class="row-total">0.00</span></td>
        <td class="no-print text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="this.closest('tr').remove(); refreshNums(); calc();" class="text-red-300 hover:text-red-700 font-bold px-2 text-xl transition-all">✕</button>
        </td>
    `;
    body.appendChild(tr);
    calc();
}

function refreshNums() { 
    document.querySelectorAll('#rows-body tr').forEach((r, i) => r.cells[0].innerText = i + 1); 
}

function getInvoiceRows() {
    return Array.from(document.querySelectorAll('#rows-body tr')).map((row, index) => {
        const description = row.cells[1]?.innerText?.trim() || '';
        const qty = row.querySelector('.qty')?.innerText?.trim() || '0';
        const price = row.querySelector('.price')?.innerText?.trim() || '0.00';
        const amount = row.querySelector('.row-total')?.innerText?.trim() || '0.00';
        return { no: index + 1, description, qty, price, amount };
    });
}

function getText(id, fallback = '-') {
    const el = document.getElementById(id);
    if (!el) return fallback;
    return (el.value !== undefined ? el.value : el.innerText).trim() || fallback;
}

function getDocumentTypeMeta() {
    const docType = document.getElementById('docType')?.value || 'invoice';
    if (docType === 'quotation') {
        return { type: 'quotation', khEnTitle: 'សម្រង់តម្លៃ / QUOTATION', sheetName: 'Quotation', fileLabel: 'QUOTATION' };
    }
    return { type: 'invoice', khEnTitle: 'វិក្កយបត្រ / INVOICE', sheetName: 'Invoice', fileLabel: 'INVOICE' };
}

function updateDocumentTitle() {
    const meta = getDocumentTypeMeta();
    const titleEl = document.getElementById('docTitleLabel');
    if (titleEl) {
        titleEl.innerText = meta.khEnTitle;
        titleEl.style.fontSize = '34px'; // Increased font size for better visibility
    }
}

function exportInvoiceToExcel() {
    calc();
    const docMeta = getDocumentTypeMeta();
    const invoiceNumber = getText('invoiceNumber', '000XXX');
    const clientName = getText('clientName', 'Client');
    
    const rows = getInvoiceRows();
    const csvRows = rows.map(r => [r.no, r.description, r.qty, r.price, r.amount]);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
        [docMeta.khEnTitle],
        ["Nº", invoiceNumber],
        ["Client", clientName],
        [],
        ["No", "Description", "Qty", "Price", "Amount"],
        ...csvRows,
        [],
        ["Total", document.getElementById('grand')?.innerText || "0.00"]
    ]);
    
    XLSX.utils.book_append_sheet(wb, ws, docMeta.sheetName);
    XLSX.writeFile(wb, `VUTHY_TAILOR_${docMeta.fileLabel}_${invoiceNumber}_${clientName}.xlsx`.replace(/\s+/g, '_'));
    showToast("Excel exported!", "success");
}

function calc() {
    let sub = 0;
    document.querySelectorAll('#rows-body tr').forEach(r => {
        const qtyCell = r.querySelector('.qty');
        const priceCell = r.querySelector('.price');
        const totalCell = r.querySelector('.row-total');
        if (!qtyCell || !priceCell || !totalCell) return;
        const q = parseFloat(qtyCell.innerText.replace(/[^0-9.]/g, '')) || 0;
        const p = parseFloat(priceCell.innerText.replace(/[$,\s]/g, '')) || 0;
        const amt = q * p;
        totalCell.innerText = amt.toFixed(2);
        sub += amt;
    });

    const isTaxEnabled = document.getElementById('taxToggle')?.checked;
    const vatVal = isTaxEnabled ? sub * 0.15 : 0;
    const totalVal = sub + vatVal;
    const depVal = parseFloat(document.getElementById('dep')?.innerText.replace(/[$,\s]/g, '')) || 0;
    const balVal = totalVal - depVal;

    if (document.getElementById('sub')) document.getElementById('sub').innerText = sub.toFixed(2);
    if (document.getElementById('vat')) document.getElementById('vat').innerText = vatVal.toFixed(2);
    if (document.getElementById('grand')) document.getElementById('grand').innerText = totalVal.toFixed(2);
    if (document.getElementById('bal')) document.getElementById('bal').innerText = balVal.toFixed(2);

    if (document.getElementById('vatRow')) document.getElementById('vatRow').style.display = isTaxEnabled ? 'flex' : 'none';
    if (document.getElementById('subtotalRow')) document.getElementById('subtotalRow').style.display = isTaxEnabled ? 'flex' : 'none';
}

async function saveImage() {
    const target = document.getElementById('invoiceCaptureArea');
    if (!target) return;
    const originalStyle = target.getAttribute('style') || '';
    
    target.style.width = '210mm';
    target.style.minHeight = '297mm';
    target.style.maxWidth = 'none';
    target.style.borderRadius = '0';
    target.style.padding = '12mm';
    target.style.boxShadow = 'none';

    try {
        const canvas = await html2canvas(target, { 
            scale: 2, 
            backgroundColor: "#ffffff", 
            useCORS: window.location.protocol !== 'file:',
            allowTaint: window.location.protocol === 'file:'
        });
        const link = document.createElement('a');
        const invoiceNo = getText('setupInvoiceNumber', Date.now());
        link.download = `Invoice_${invoiceNo}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.9);
        link.click();
        showToast("Invoice saved as image", "success");
    } catch (e) {
        console.error(e);
        showToast("Failed to save image", "error");
    } finally {
        target.setAttribute('style', originalStyle);
    }
}

/**
 * Updates the visual invoice header (the preview) based on input setup fields.
 */
function updateInvoiceHeader() {
    const name = getText('setupBusinessName', 'YOUR BUSINESS NAME');
    const nameKh = getText('setupBusinessNameKh', 'ក្រុមហ៊ុនរបស់អ្នក');
    const phone = getText('setupPhone', '012 345 678');
    const address = getText('setupAddress', 'Address details here...');
    const bankName = getText('setupBankName', 'BANK');
    const bankNo = getText('setupBankNumber', '000 000 000');
    const manager = getText('setupManagerName', 'Manager Name');

    const set = (id, val, prefix = '', size = null) => { 
        const el = document.getElementById(id); 
        if (el) {
            el.innerText = prefix + val;
            if (size) el.style.fontSize = size;
        }
    };

    set('businessNameEn', name.toUpperCase(), '', '36px'); // Made English header bigger
    set('businessNameKh', nameKh, '', '42px');             // Made Khmer header bigger
    set('businessPhone', phone, 'Tel : ', '14px');
    set('businessAddress', address, '', '12px');
    set('invoiceFooterPhone', phone, 'Tel : ');
    set('invoiceFooterAddress', address);
    set('abaName', name.toUpperCase()); 
    set('abaNumber', bankNo);
    set('bankTitleLabel', bankName.toUpperCase() + ' PAYMENT INFO', '', '16px');
    set('invoiceManagerName', manager); // Corrected ID to match index.html
}

/**
 * Toggles the visibility of the dedicated invoice information setup panel.
 */
function toggleInvoiceSetup() {
    const panel = document.getElementById('invoiceSetupPanel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden') || panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    panel.classList.toggle('hidden', !isHidden);
}

/**
 * Saves the current setup inputs as a new reusable business profile.
 */
async function saveCurrentAsProfile() {
    const profileName = prompt("Enter a name for this business profile (e.g., 'Main Branch'):");
    if (!profileName) return;

    if (!appPrefs.invoice) appPrefs.invoice = {};
    if (!appPrefs.invoice.profiles) appPrefs.invoice.profiles = [];

    const newProfile = {
        id: "prof_" + Date.now(),
        profileName: profileName,
        businessNameEn: getText('setupBusinessName'),
        businessNameKh: getText('setupBusinessNameKh'),
        phone: getText('setupPhone'),
        address: getText('setupAddress'),
        bankName: getText('setupBankName'),
        bankNumber: getText('setupBankNumber'),
        managerName: getText('setupManagerName'),
        logo: document.getElementById('invoiceLogo')?.src || ''
    };

    appPrefs.invoice.profiles.push(newProfile);
    if (typeof savePrefs === 'function') await savePrefs();
    renderProfileSelector();
    showToast(`Profile "${profileName}" saved!`, "success");
}

/**
 * Loads a selected business profile into the setup inputs.
 */
function loadInvoiceProfile(profileId) {
    if (!profileId || !appPrefs.invoice?.profiles) return;
    const p = appPrefs.invoice.profiles.find(prof => prof.id === profileId);
    if (!p) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('setupBusinessName', p.businessNameEn);
    set('setupBusinessNameKh', p.businessNameKh);
    set('setupPhone', p.phone);
    set('setupAddress', p.address);
    set('setupBankName', p.bankName);
    set('setupBankNumber', p.bankNumber);
    set('setupManagerName', p.managerName);

    const logo = document.getElementById('invoiceLogo');
    if (logo && p.logo) logo.src = p.logo;

    updateInvoiceHeader();
    showToast(`Switched to profile: ${p.profileName}`, "info");
}

/**
 * Renders the dropdown options for saved business profiles.
 */
function renderProfileSelector() {
    const sel = document.getElementById('invoiceProfileSelect');
    if (!sel) return;
    const profiles = appPrefs.invoice?.profiles || [];
    
    let html = `<option value="">-- Select Business Profile --</option>`;
    profiles.forEach(p => {
        html += `<option value="${p.id}">${p.profileName}</option>`;
    });
    sel.innerHTML = html;
}

/**
 * Handles the file upload for the invoice logo.
 */
function handleInvoiceLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logo = document.getElementById('invoiceLogo');
            if (logo) logo.src = e.target.result;
            showToast("Invoice logo updated!", "success");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function saveInvoiceSetup() {
    if (!appPrefs.invoice) appPrefs.invoice = {};
    
    appPrefs.invoice.businessNameEn = document.getElementById('setupBusinessName')?.value || '';
    appPrefs.invoice.businessNameKh = document.getElementById('setupBusinessNameKh')?.value || '';
    appPrefs.invoice.phone = document.getElementById('setupPhone')?.value || '';
    appPrefs.invoice.address = document.getElementById('setupAddress')?.value || '';
    appPrefs.invoice.bankName = document.getElementById('setupBankName')?.value || '';
    appPrefs.invoice.bankNumber = document.getElementById('setupBankNumber')?.value || '';
    appPrefs.invoice.invoiceNumber = document.getElementById('setupInvoiceNumber')?.value || '';
    appPrefs.invoice.managerName = document.getElementById('setupManagerName')?.value || '';
    
    const logoImg = document.getElementById('invoiceLogo');
    if (logoImg && logoImg.src.startsWith('data:')) {
        appPrefs.invoice.logo = logoImg.src;
    }

    if (typeof savePrefs === 'function') await savePrefs();
    showToast("Invoice setup information saved!", "success");
    updateInvoiceHeader();
}

function initInvoiceView() {
    const body = document.getElementById('rows-body');
    // Load saved preferences into setup inputs
    if (appPrefs.invoice) {
        if (document.getElementById('setupBusinessName')) document.getElementById('setupBusinessName').value = appPrefs.invoice.businessNameEn || '';
        if (document.getElementById('setupBusinessNameKh')) document.getElementById('setupBusinessNameKh').value = appPrefs.invoice.businessNameKh || '';
        if (document.getElementById('setupPhone')) document.getElementById('setupPhone').value = appPrefs.invoice.phone || '';
        if (document.getElementById('setupAddress')) document.getElementById('setupAddress').value = appPrefs.invoice.address || '';
        if (document.getElementById('setupBankName')) document.getElementById('setupBankName').value = appPrefs.invoice.bankName || '';
        if (document.getElementById('setupBankNumber')) document.getElementById('setupBankNumber').value = appPrefs.invoice.bankNumber || '';
        if (document.getElementById('setupInvoiceNumber')) document.getElementById('setupInvoiceNumber').value = appPrefs.invoice.invoiceNumber || '';
        if (document.getElementById('setupManagerName')) document.getElementById('setupManagerName').value = appPrefs.invoice.managerName || '';
        
        const logo = document.getElementById('invoiceLogo');
        if (logo && appPrefs.invoice.logo) {
            logo.src = appPrefs.invoice.logo;
        }
    }

    renderProfileSelector();

    // Update the invoice display with loaded/default values
    updateInvoiceHeader();

    // Add default rows if none exist
    if (body && body.rows.length === 0) {
        for(let i=0; i<8; i++) addRow();
        updateDocumentTitle();
        const today = new Date();
        const picker = document.getElementById('hiddenDatePicker');
        if (picker) picker.valueAsDate = today;
        updateInvoiceDate(today.toISOString().split('T')[0]);
    }

    // Set today's date if not already set
    const today = new Date();
    const picker = document.getElementById('hiddenDatePicker');
    if (picker && !picker.value) picker.valueAsDate = today;
    updateInvoiceDate(picker?.value || today.toISOString().split('T')[0]);
}

function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

window.initInvoiceView = initInvoiceView;
window.addRow = addRow;
window.calc = calc;
window.saveImage = saveImage;
window.exportInvoiceToExcel = exportInvoiceToExcel;
window.updateDocumentTitle = updateDocumentTitle;
window.saveInvoiceSetup = saveInvoiceSetup;
window.triggerCalendar = triggerCalendar;
window.updateInvoiceDate = updateInvoiceDate;
window.toggleInvoiceSetup = toggleInvoiceSetup;
window.saveCurrentAsProfile = saveCurrentAsProfile;
window.loadInvoiceProfile = loadInvoiceProfile;
window.renderProfileSelector = renderProfileSelector;
