// app/js/invoice.js
// Logic for the Invoice Generator tool - 100% based on VUTHY TAILOR snippet

const khMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const khDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

function toKhmerNum(num) {
    return num.toString().split('').map(x => khDigits[parseInt(x)] || x).join('');
}

function triggerInvoiceCalendar() {
    document.getElementById('hiddenDatePicker').showPicker();
}

function updateInvoiceDate(dateStr) {
    if (!dateStr) return;
    const d = new Date(dateStr);
    document.getElementById('khDate').innerText = `ថ្ងៃទី ${toKhmerNum(d.getDate())} ខែ ${khMonths[d.getMonth()]} ឆ្នាំ ${toKhmerNum(d.getFullYear())}`;
    document.getElementById('enDate').innerText = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
}

function addRow() {
    const body = document.getElementById('rows-body');
    const count = body.rows.length + 1;
    const tr = document.createElement('tr');
    tr.className = "group hover:bg-amber-50 transition-colors";
    tr.innerHTML = `
        <td class="text-center font-bold text-gray-800 text-xs">${count}</td>
        <td class="px-4"><div contenteditable="true" class="w-full text-gray-700 font-bold italic">...</div></td>
        <td class="text-center"><div contenteditable="true" class="qty font-black bg-gray-50 rounded" oninput="calc()">0</div></td>
        <td class="text-center"><div contenteditable="true" class="price font-black bg-gray-50 rounded" oninput="calc()">0.00</div></td>
        <td class="text-right pr-4 font-black text-blue-900"><span class="invoice-currency-symbol">$</span> <span class="row-total">0.00</span></td>
        <td class="no-print text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="this.closest('tr').remove(); refreshNums(); calc();" class="text-red-300 hover:text-red-700 font-bold px-2 text-xl transition-all">✕</button>
        </td>
    `;
    body.appendChild(tr);
    calc();
}

function refreshNums() {
    document.querySelectorAll('#rows-body tr').forEach((r, i) => {
        if (r.cells[0]) r.cells[0].innerText = i + 1;
    }); 
}

function calc() {
    let sub = 0;
    document.querySelectorAll('#rows-body tr').forEach(r => {
        const q = parseFloat(r.querySelector('.qty').innerText) || 0;
        const p = parseFloat(r.querySelector('.price').innerText.replace(/[^0-9.]/g, '')) || 0;
        const amt = q * p;
        r.querySelector('.row-total').innerText = amt.toFixed(2);
        sub += amt;
    });

    const isTaxEnabled = document.getElementById('taxToggle').checked;
    const vatVal = isTaxEnabled ? sub * 0.15 : 0;
    const totalVal = sub + vatVal;
    const depVal = parseFloat(document.getElementById('dep').innerText.replace(/[^0-9.]/g, '')) || 0;
    const balVal = totalVal - depVal;

    // UI Updates
    document.getElementById('sub').innerText = sub.toFixed(2);
    document.getElementById('vat').innerText = vatVal.toFixed(2);
    document.getElementById('grand').innerText = totalVal.toFixed(2);
    document.getElementById('bal').innerText = balVal.toFixed(2);

    // Toggle Rows based on tax status
    if (document.getElementById('vatRow')) document.getElementById('vatRow').style.display = isTaxEnabled ? 'flex' : 'none';
    if (document.getElementById('subtotalRow')) document.getElementById('subtotalRow').style.display = isTaxEnabled ? 'flex' : 'none';
}

function goBack() {
    window.history.back();
}

async function exportPdf() {
    const target = document.getElementById('capture-area') || document.getElementById('invoiceCaptureArea');
    if (!target) return;
    const controls = document.querySelectorAll('.no-print');
    controls.forEach(c => c.style.visibility = 'hidden');

    const originalStyle = target.getAttribute('style') || '';
    
    target.style.width = '210mm';
    target.style.minHeight = '297mm';
    target.style.maxWidth = 'none';
    target.style.borderRadius = '0';
    target.style.margin = '0 auto';
    target.style.padding = '12mm';
    target.style.boxShadow = 'none';
    target.style.transform = 'none'; // Prevent mobile scaling from leaking into the export

    try {
        // Ensure html2canvas and jspdf are loaded
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            if (typeof showToast === 'function') showToast('Required libraries (html2canvas, jspdf) not loaded.', 'error');
            return;
        }

        const canvas = await html2canvas(target, { 
            scale: 3, 
            backgroundColor: "#ffffff", 
            useCORS: true,
            onclone: (clonedDoc) => {
                // Force display of tax rows only if they were visible in main doc
                const state = document.getElementById('taxToggle')?.checked; // Use optional chaining for safety
                if (clonedDoc.getElementById('vatRow')) clonedDoc.getElementById('vatRow').style.display = state ? 'flex' : 'none';
                if (clonedDoc.getElementById('subtotalRow')) clonedDoc.getElementById('subtotalRow').style.display = state ? 'flex' : 'none';
                // Force A4 size in clone
                const area = clonedDoc.getElementById('capture-area');
                if (area) { // Check if area exists
                    area.style.width = '210mm';
                    area.style.minHeight = '297mm';
                    area.style.maxWidth = 'none';
                    area.style.borderRadius = '0';
                    area.style.margin = '0 auto';
                    area.style.padding = '12mm';
                    area.style.boxShadow = 'none';
                }
            }
        });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`VUTHY_TAILOR_Invoice_${Date.now()}.pdf`);
        if (typeof showToast === 'function') showToast('Invoice exported to PDF!', 'success');
    } catch (e) {
        console.error('exportPdf failed:', e);
        if (typeof showToast === 'function') showToast('Failed to export PDF.', 'error');
    } finally {
        controls.forEach(c => c.style.visibility = 'visible');
        target.setAttribute('style', originalStyle);
    }
}

async function saveImage() {
    const target = document.getElementById('capture-area') || document.getElementById('invoiceCaptureArea');
    if (!target) return;
    const controls = document.querySelectorAll('.no-print');
    controls.forEach(c => c.style.visibility = 'hidden');

    const originalStyle = target.getAttribute('style') || '';
    
    target.style.width = '210mm';
    target.style.minHeight = '297mm';
    target.style.maxWidth = 'none';
    target.style.borderRadius = '0';
    target.style.margin = '0 auto';
    target.style.padding = '12mm';
    target.style.boxShadow = 'none';
    target.style.transform = 'none'; // Prevent mobile scaling from leaking into the export

    try {
        const canvas = await html2canvas(target, { 
            scale: 3, 
            backgroundColor: "#ffffff", 
            useCORS: true,
            // allowTaint: window.location.protocol === 'file:', // Not in snippet
            onclone: (clonedDoc) => {
                // Force display of tax rows only if they were visible in main doc
                const state = document.getElementById('taxToggle').checked;
                clonedDoc.getElementById('vatRow').style.display = state ? 'flex' : 'none';
                clonedDoc.getElementById('subtotalRow').style.display = state ? 'flex' : 'none';
                // Force A4 size in clone
                const area = clonedDoc.getElementById('capture-area');
                area.style.width = '210mm';
                area.style.minHeight = '297mm';
                area.style.maxWidth = 'none';
                area.style.borderRadius = '0';
                area.style.margin = '0 auto';
                area.style.padding = '12mm';
                area.style.boxShadow = 'none';
            }
        });
        const link = document.createElement('a');
        link.download = `VUTHY_TAILOR_Invoice_${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 1.0);
        link.click();
    } catch (e) {
        console.error(e);
    } finally {
        controls.forEach(c => c.style.visibility = 'visible');
        target.setAttribute('style', originalStyle);
    }
}

// Function to update the document title (Invoice/Quotation)
function updateDocumentTitle() {
    const docTypeSelect = document.getElementById('docType');
    const docTitleEl = document.getElementById('docTitle'); // This is the h3 element on the invoice
    if (!docTypeSelect || !docTitleEl) return;

    const docType = docTypeSelect.value;
    const isKhmer = typeof currentLang !== 'undefined' && currentLang === 'kh';

    docTitleEl.textContent = docType === 'quotation' ? (isKhmer ? 'សេចក្តីសំរេច / QUOTATION' : 'QUOTATION') : (isKhmer ? 'វិក្កយបត្រ / INVOICE' : 'INVOICE');
}


function setInvoiceCurrency(symbol) {
    document.querySelectorAll('.invoice-currency-symbol').forEach(el => {
        el.textContent = symbol;
    });
    const priceTh = document.querySelector('#invoiceView table th:nth-child(4)');
    const amountTh = document.querySelector('#invoiceView table th:nth-child(5)');
    if (priceTh) priceTh.textContent = `PRICE (${symbol})`;
    if (amountTh) amountTh.textContent = `AMOUNT (${symbol})`;
    calc();
}

function initInvoiceView() {
    const body = document.getElementById('rows-body');
    if (!body) return;

    // Default Initialization
    const today = new Date();
    const hiddenPicker = document.getElementById('hiddenDatePicker');
    if (hiddenPicker && !hiddenPicker.value) {
        hiddenPicker.valueAsDate = today;
        updateInvoiceDate(today.toISOString().split('T')[0]);
    }

    // Default rows
    if (body.rows.length === 0) for(let i=0; i<8; i++) addRow();

    // Load saved company profile preset (if any)
    if (typeof window.loadInvoiceProfile === 'function') window.loadInvoiceProfile();
    updateDocumentTitle(); // Ensure document title is set on init
}

function getElValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
}

function setElValue(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val == null ? '' : String(val);
}

function updateInvoiceFromPreset() {
    const profile = getInvoiceProfileFromInputs();
    applyInvoiceProfileToInvoice(profile, false); // false means don't force hardcoded defaults while typing
}

function getInvoiceProfileFromInputs() {
    return {
        businessNameKh: getElValue('profileCompanyNameKh'),
        businessNameEn: getElValue('profileCompanyNameEn'),
        businessTel: getElValue('profileCompanyTel'),
        businessAddressKh: getElValue('profileCompanyAddressKh'),
        businessAddressEn: getElValue('profileCompanyAddressEn'),
        abaName: getElValue('profileAbaName'),
        abaNumber: getElValue('profileAbaNumber'),
        managerName: getElValue('profileManagerName'),

        clientName: getElValue('profileClientName'),
        clientPhone: getElValue('profileClientPhone'),

        // logo stored separately (base64 string)
        invoiceLogo: window.__invoiceLogoBase64 || null
    };
}

function applyInvoiceProfileToInvoice(profile, useDefaults = false) {
    if (!profile || typeof profile !== 'object') {
        profile = {}; // Treat null/undefined profile as empty for defaults
    }

    // Helper to set value for input fields in the profile preset section
    const setProfileInput = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value === null || value === undefined ? '' : String(value);
    };

    // Helper to set text content for display elements on the invoice
    // Uses placeholder only if value is null or undefined. Empty string is displayed as empty.
    const setInvoiceText = (id, value, placeholder = '') => {
        const el = document.getElementById(id);
        if (el) {
            if (useDefaults && (value === null || value === undefined || String(value).trim() === '')) {
                el.textContent = placeholder;
            } else {
                el.textContent = (value === null || value === undefined) ? placeholder : String(value);
            }
        }
    };

    // Helper for elements that could be input or div/span on the invoice
    const setInvoiceValOrText = (id, value, placeholder = '') => {
        const el = document.getElementById(id);
        if (!el) return;
        let textToSet = (value === null || value === undefined) ? placeholder : String(value);
        if (useDefaults && (value === null || value === undefined || String(value).trim() === '')) {
            textToSet = placeholder;
        }

        if (el.tagName === 'INPUT') el.value = textToSet;
        else el.textContent = textToSet;
    };

    // 1. Update profile preset input fields
    setProfileInput('profileCompanyNameKh', profile.businessNameKh);
    setProfileInput('profileCompanyNameEn', profile.businessNameEn);
    setProfileInput('profileCompanyTel', profile.businessTel);
    setProfileInput('profileCompanyAddressKh', profile.businessAddressKh);
    setProfileInput('profileCompanyAddressEn', profile.businessAddressEn);
    setProfileInput('profileAbaName', profile.abaName);
    setProfileInput('profileAbaNumber', profile.abaNumber);
    setProfileInput('profileManagerName', profile.managerName);
    setProfileInput('profileClientName', profile.clientName);
    setProfileInput('profileClientPhone', profile.clientPhone);

    // 2. Update invoice display fields
    setInvoiceText('businessNameKh', profile.businessNameKh, useDefaults ? 'វុទ្ធី ឯកទេសកាត់ដេរ' : '...');
    setInvoiceText('businessNameEn', profile.businessNameEn, useDefaults ? 'VUTHY TAILOR' : '...');

    // Update iOS header title
    const iosHeaderTitleEl = document.querySelector('.ios-header-title');
    if (iosHeaderTitleEl) {
        iosHeaderTitleEl.textContent = profile.businessNameEn || 'VUTHY TAILOR';
    }

    // Handle phone with prefix
    const displayedPhone = profile.businessTel;
    if (useDefaults && (displayedPhone === null || displayedPhone === undefined || String(displayedPhone).trim() === '')) {
        setInvoiceText('businessPhone', null, 'Tel : 098 22 00 20 / 012 690 595 ➲ 031 7000002');
    } else {
        const phoneStr = String(displayedPhone || '');
        setInvoiceText('businessPhone', phoneStr && !phoneStr.toLowerCase().startsWith('tel') ? `Tel : ${phoneStr}` : phoneStr);
    }

    // Handle addresses with prefixes
    const displayedAddressKh = profile.businessAddressKh;
    if (useDefaults && (displayedAddressKh === null || displayedAddressKh === undefined || String(displayedAddressKh).trim() === '')) {
        setInvoiceText('businessAddressKh', null, 'អាសយដ្ឋាន: ផ្ទះលេខ ៦៩៥EO ផ្លូវមុនីវង្ស សង្កាត់បឹងកេងកង ៣ ខណ្ឌចំការមន ភ្នំពេញ');
    } else {
        const addrStr = String(displayedAddressKh || '');
        setInvoiceText('businessAddressKh', addrStr && !addrStr.startsWith('អាសយដ្ឋាន') ? `អាសយដ្ឋាន: ${addrStr}` : addrStr);
    }

    const displayedAddressEn = profile.businessAddressEn;
    if (useDefaults && (displayedAddressEn === null || displayedAddressEn === undefined || String(displayedAddressEn).trim() === '')) {
        setInvoiceText('businessAddressEn', null, 'Address : #695Eo, Street Monivong, Sangkat Boengkengkang III, Khan Chamka Morn, Phnom Penh');
    } else {
        const addrStr = String(displayedAddressEn || '');
        setInvoiceText('businessAddressEn', addrStr && !addrStr.toLowerCase().startsWith('address') ? `Address : ${addrStr}` : addrStr);
    }

    // Client name and phone (these are inputs in the profile preset, but divs on the invoice)
    setInvoiceValOrText('clientName', profile.clientName, useDefaults ? '...' : '');
    setInvoiceValOrText('clientPhone', profile.clientPhone, useDefaults ? '...' : '');

    // ABA and Manager Name
    setInvoiceText('abaName', profile.abaName, useDefaults ? 'LIM VUTHY' : '');
    setInvoiceText('abaNumber', profile.abaNumber, useDefaults ? '000 665 944' : '');
    setInvoiceText('managerName', profile.managerName, useDefaults ? 'LIM VUTHY' : '');

    // Invoice logo
    const logoLeftImg = document.querySelector('#capture-area .w-16 img[alt="logo left"]') || 
                        document.querySelector('#invoiceCaptureArea .w-16 img[alt="logo left"]');
    if (logoLeftImg && profile.invoiceLogo) {
        logoLeftImg.src = profile.invoiceLogo;
    }
}
async function loadInvoiceProfile() {
    updateDocumentTitle(); // Ensure title is correct on load
    try {
        if (typeof BridgeWorkDB === 'undefined') {
            console.warn('BridgeWorkDB missing; cannot load invoice profile.');
            return;
        }
        const profile = await BridgeWorkDB.get('settings', 'invoiceProfile');
        if (!profile) { applyInvoiceProfileToInvoice({}, true); return; } // If no profile saved, apply empty with defaults

        window.__invoiceLogoBase64 = profile.invoiceLogo || null;
        applyInvoiceProfileToInvoice(profile, true);
    } catch (e) {
        console.error('loadInvoiceProfile failed:', e);
        applyInvoiceProfileToInvoice({}, true); // Fallback to empty profile on error
    }
}

async function saveInvoiceProfile() {
    const profile = getInvoiceProfileFromInputs();
    try {
        if (typeof BridgeWorkDB === 'undefined') {
            console.warn('BridgeWorkDB missing; cannot save invoice profile.');
            return;
        }
        await BridgeWorkDB.set('settings', 'invoiceProfile', profile);
        applyInvoiceProfileToInvoice(profile);
        if (typeof showToast === 'function') showToast('Invoice company profile saved!', 'success');
    } catch (e) {
        console.error('saveInvoiceProfile failed:', e);
        if (typeof showToast === 'function') showToast('Failed to save invoice profile', 'error');
    }
}

function handleInvoiceLogoUpload(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    // basic size guard: 3MB
    if (file.size > 1024 * 1024 * 3) {
        if (typeof showToast === 'function') showToast('Logo too large (max 3MB).', 'error');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const base64 = String(reader.result || '');
        window.__invoiceLogoBase64 = base64;

        // Update immediate preview on invoice (logo left)
        const logoLeftImg = document.querySelector('#capture-area .w-16 img[alt="logo left"]') || 
                            document.querySelector('#invoiceCaptureArea .w-16 img[alt="logo left"]');
        if (logoLeftImg) {
            logoLeftImg.src = base64;
        }
    };
    reader.readAsDataURL(file);
}

function clearInvoiceLogo() {
    window.__invoiceLogoBase64 = null;
    const logoLeftImg = document.querySelector('#invoiceCaptureArea .w-16 img[alt="logo left"]');
    if (logoLeftImg) {
        logoLeftImg.src = 'https://img.icons8.com/ios-filled/100/8B0000/trousers.png';
    }

    // Also clear file input value (best-effort)
    const input = document.getElementById('invoiceLogoUpload');
    if (input) input.value = '';
}

async function clearInvoiceProfile() {
    if (!confirm('Clear all company profile preset fields?')) return;
    if (!confirm('Clear all company profile preset fields and remove from saved data?')) return;
    
    const fields = [
        'profileCompanyNameKh', 'profileCompanyNameEn', 'profileCompanyTel',
        'profileCompanyAddressKh', 'profileCompanyAddressEn', 'profileAbaName',
        'profileAbaNumber', 'profileManagerName', 'profileClientName', 'profileClientPhone'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    window.__invoiceLogoBase64 = null;
    clearInvoiceLogo();

    
    // Apply an empty profile to the invoice view (truly clear it, no defaults)
    applyInvoiceProfileToInvoice({
        businessNameKh: '', businessNameEn: '', businessTel: '', businessAddressKh: '', businessAddressEn: '',
        abaName: '', abaNumber: '', managerName: '', clientName: '', clientPhone: ''
    }, false);

    if (typeof showToast === 'function') showToast('Profile fields cleared', 'info');
    // User must click "Save" after clearing if they want to overwrite the saved preset with empty data.
    // Delete from IndexedDB
    if (typeof BridgeWorkDB !== 'undefined') {
        await BridgeWorkDB.delete('settings', 'invoiceProfile');
    }

    if (typeof showToast === 'function') showToast('Profile fields cleared and saved data removed!', 'info');
}

// New function to toggle the visibility of the invoice profile setup content
function toggleInvoiceProfileSetup() {
    const setupContent = document.getElementById('invoiceProfileSetupContent');
    const toggleButtonText = document.getElementById('toggleProfileSetupText');
    if (setupContent.style.display === 'none' || setupContent.classList.contains('hidden')) {
        setupContent.style.display = 'block';
        setupContent.classList.remove('hidden');
        if (toggleButtonText) toggleButtonText.textContent = 'Hide';
    } else {
        setupContent.style.display = 'none';
        setupContent.classList.add('hidden');
        if (toggleButtonText) toggleButtonText.textContent = 'Setup';
    }
}

function exportInvoiceToExcel() {
    if (typeof XLSX === 'undefined') {
        if (typeof showToast === 'function') showToast('XLSX library not loaded.', 'error');
        return;
    }
    const data = [];
    document.querySelectorAll('#rows-body tr').forEach(row => {
        const desc = row.querySelector('td:nth-child(2) div')?.textContent || "";
        const qty = row.querySelector('.qty')?.textContent || "0";
        const price = row.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '') || "0";
        const total = row.querySelector('.row-total')?.textContent || "0.00";
        data.push({
            Description: desc,
            Qty: qty,
            Price: price,
            Total: total
        });
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    XLSX.writeFile(wb, "invoice.xlsx");
    if (typeof showToast === 'function') showToast('Invoice exported to Excel!', 'success');
}

// Export to window for inline onclick
window.loadInvoiceProfile = loadInvoiceProfile;
window.saveInvoiceProfile = saveInvoiceProfile;
window.handleInvoiceLogoUpload = handleInvoiceLogoUpload;
window.clearInvoiceLogo = clearInvoiceLogo;
window.clearInvoiceProfile = clearInvoiceProfile;
window.updateInvoiceFromPreset = updateInvoiceFromPreset;

window.initInvoiceView = initInvoiceView;
window.addRow = addRow;
window.calc = calc;
window.saveImage = saveImage;
window.triggerInvoiceCalendar = triggerInvoiceCalendar;
window.updateInvoiceDate = updateInvoiceDate;
window.refreshNums = refreshNums;
window.updateDocumentTitle = updateDocumentTitle;
window.toggleInvoiceProfileSetup = toggleInvoiceProfileSetup; // Export new function
window.exportInvoiceToExcel = exportInvoiceToExcel;
window.goBack = goBack; // Export new function
window.exportPdf = exportPdf; // Export new function
