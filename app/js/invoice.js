// app/js/invoice.js
// Logic for the Invoice Generator tool - 100% based on VUTHY TAILOR snippet

const khMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const khDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const INVOICE_PROFILE_STORAGE_KEY = 'bridgework_invoice_profile_v1';
const INVOICE_PROFILE_TEMPLATES_STORAGE_KEY = 'bridgework_invoice_profile_templates_v1';
const INVOICE_PROFILE_PANEL_KEY = 'bridgework_invoice_profile_panel_open';
const DEFAULT_INVOICE_LOGO = 'https://img.icons8.com/ios-filled/100/8B0000/trousers.png';
const INVOICE_EXPORT_STYLE_ID = 'invoiceExportFitStyles';

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
        <td class="text-center font-bold text-gray-300 text-xs">${count}</td>
        <td class="px-4"><div contenteditable="true" class="w-full text-gray-700 font-bold italic">...</div></td>
        <td class="text-center"><div contenteditable="true" class="qty font-black bg-gray-50 rounded" oninput="calc()">0</div></td>
        <td class="text-center"><div contenteditable="true" class="price font-black bg-gray-50 rounded" oninput="calc()">0.00</div></td>
        <td class="text-right pr-4 font-black text-blue-900 font-black"><span class="invoice-currency-symbol">$</span> <span class="row-total">0.00</span></td>
        <td class="no-print text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="this.closest('tr').remove(); refreshNums(); calc();" class="text-red-300 hover:text-red-700 font-bold px-2 text-xl transition-all">✕</button>
        </td>
    `;
    body.appendChild(tr);
    setupInvoiceEditablePlaceholders(tr);
    calc();
}

function refreshNums() {
    document.querySelectorAll('#rows-body tr').forEach((r, i) => r.cells[0].innerText = i + 1); 
}

function getInvoiceCurrencySymbol() {
    const selected = document.getElementById('invoiceCurrencySelect')?.value;
    const raw = selected || (typeof appPrefs === 'object' && appPrefs ? appPrefs.currency : '') || '$';
    const normalized = String(raw).trim().toLowerCase();
    if (['riel', 'khr', '៛'].includes(normalized)) return '៛';
    return raw || '$';
}

function isInvoiceRielCurrency() {
    return getInvoiceCurrencySymbol() === '៛';
}

function formatInvoiceNumber(value) {
    const num = Number(value) || 0;
    return isInvoiceRielCurrency() ? Math.round(num).toLocaleString() : num.toFixed(2);
}

function formatInvoicePriceText(value) {
    const numberText = formatInvoiceNumber(value);
    const symbol = getInvoiceCurrencySymbol();
    return symbol === '៛' ? `${numberText} ${symbol}` : `${symbol} ${numberText}`;
}

function stripInvoiceCurrency(value) {
    return String(value || '').replace(/[$៛,\s]/g, '').replace(/[^\d.-]/g, '');
}

function parseInvoiceNumber(value) {
    return parseFloat(stripInvoiceCurrency(value)) || 0;
}

function updateInvoiceCurrencySymbols() {
    const symbol = getInvoiceCurrencySymbol();
    document.querySelectorAll('.invoice-currency-symbol').forEach(el => {
        el.textContent = symbol;
    });
    const selector = document.getElementById('invoiceCurrencySelect');
    if (selector) selector.value = symbol === '៛' ? '៛' : '$';
}

async function setInvoiceCurrency(symbol) {
    if (typeof appPrefs === 'object' && appPrefs) {
        appPrefs.currency = symbol;
        if (typeof savePrefs === 'function') await savePrefs();
    }
    const settingsCurrency = document.getElementById('currencyInput');
    if (settingsCurrency) settingsCurrency.value = symbol;
    updateInvoiceCurrencySymbols();
    formatInvoiceEditableMoneyFields();
    calc();
}

function formatInvoiceEditableMoneyFields() {
    document.querySelectorAll('#rows-body .price').forEach(el => {
        const text = String(el.textContent || '').trim();
        if (!text || text === '0' || text === '0.00') return;
        el.textContent = formatInvoicePriceText(parseInvoiceNumber(text));
    });
    const dep = document.getElementById('dep');
    if (dep) {
        const text = String(dep.textContent || '').trim();
        if (text && text !== '0' && text !== '0.00') dep.textContent = formatInvoiceNumber(parseInvoiceNumber(text));
    }
}

function getInvoiceEditableMoneyText(el) {
    const value = parseInvoiceNumber(el.textContent);
    return el.classList.contains('price') ? formatInvoicePriceText(value) : formatInvoiceNumber(value);
}

function prepareInvoiceMoneyFieldForEdit(el) {
    const value = parseInvoiceNumber(el.textContent);
    el.textContent = value ? String(value) : '';
}

function calc() {
    let sub = 0;
    updateInvoiceCurrencySymbols();
    document.querySelectorAll('#rows-body tr').forEach(r => {
        const q = parseFloat(r.querySelector('.qty').innerText) || 0;
        const p = parseInvoiceNumber(r.querySelector('.price').innerText);
        const amt = q * p;
        r.querySelector('.row-total').innerText = formatInvoiceNumber(amt);
        sub += amt;
    });

    const isTaxEnabled = document.getElementById('taxToggle').checked;
    const vatVal = isTaxEnabled ? sub * 0.15 : 0;
    const totalVal = sub + vatVal;
    const depVal = parseInvoiceNumber(document.getElementById('dep').innerText);
    const balVal = totalVal - depVal;

    // UI Updates
    document.getElementById('sub').innerText = formatInvoiceNumber(sub);
    document.getElementById('vat').innerText = formatInvoiceNumber(vatVal);
    document.getElementById('grand').innerText = formatInvoiceNumber(totalVal);
    document.getElementById('bal').innerText = formatInvoiceNumber(balVal);

    // Toggle Rows based on tax status
    document.getElementById('vatRow').style.display = isTaxEnabled ? 'flex' : 'none';
    document.getElementById('subtotalRow').style.display = isTaxEnabled ? 'flex' : 'none';
}

function setupInvoiceEditablePlaceholders(root = document) {
    const editablePlaceholders = [
        { selector: '#rows-body td:nth-child(2) [contenteditable="true"]', value: '...' },
        { selector: '#rows-body .qty', value: '0' },
        { selector: '#rows-body .price', value: '0.00' },
        { selector: '#dep', value: '0.00' },
        { selector: '#clientName[contenteditable="true"]', value: '...' },
        { selector: '#clientPhone[contenteditable="true"]', value: '...' }
    ];

    editablePlaceholders.forEach(({ selector, value }) => {
        root.querySelectorAll(selector).forEach(el => {
            if (el.dataset.invoicePlaceholderBound === 'true') return;
            el.dataset.invoicePlaceholderBound = 'true';
            el.dataset.invoicePlaceholderValue = value;

            el.addEventListener('focus', () => {
                const currentText = String(el.textContent || '').trim();
                if (currentText === value || ((el.classList.contains('price') || el.id === 'dep') && parseInvoiceNumber(currentText) === 0)) {
                    el.textContent = '';
                } else if (el.classList.contains('price') || el.id === 'dep') {
                    prepareInvoiceMoneyFieldForEdit(el);
                }
            });

            el.addEventListener('blur', () => {
                if (!String(el.textContent || '').trim()) {
                    el.textContent = value;
                    if (el.classList.contains('qty') || el.classList.contains('price')) calc();
                } else if (el.classList.contains('price') || el.id === 'dep') {
                    el.textContent = getInvoiceEditableMoneyText(el);
                    calc();
                }
            });
        });
    });
}

function getInvoicePaperSpec() {
    const selected = (document.getElementById('invoicePaperSize')?.value || 'A4').toUpperCase();
    const specs = {
        A4: { label: 'A4', width: '210mm', height: '297mm', padding: '12mm', outputWidth: 2480, outputHeight: 3508 },
        A5: { label: 'A5', width: '148mm', height: '210mm', padding: '8mm', outputWidth: 1748, outputHeight: 2480 }
    };
    return specs[selected] || specs.A4;
}

function getInvoiceCapturePaperSpec() {
    return { label: 'A4', width: '210mm', height: '297mm', padding: '12mm' };
}

function applyInvoicePaperStyle(area, spec) {
    if (!area) return;
    area.style.width = spec.width;
    area.style.height = spec.height;
    area.style.minHeight = spec.height;
    area.style.maxHeight = spec.height;
    area.style.maxWidth = 'none';
    area.style.borderRadius = '0';
    area.style.margin = '0 auto';
    area.style.padding = spec.padding;
    area.style.boxShadow = 'none';
    area.style.background = '#ffffff';
    area.style.boxSizing = 'border-box';
    area.style.overflow = 'hidden';
}

function ensureInvoiceExportStyles(doc = document) {
    if (doc.getElementById(INVOICE_EXPORT_STYLE_ID)) return;

    const style = doc.createElement('style');
    style.id = INVOICE_EXPORT_STYLE_ID;
    style.textContent = `
        .invoice-export-fit { overflow: hidden !important; }
        .invoice-export-fit > div:nth-of-type(1) { margin-bottom: 2mm !important; }
        .invoice-export-fit > div:nth-of-type(2) { margin-bottom: 3mm !important; }
        .invoice-export-fit > div:nth-of-type(3) { margin-bottom: 4mm !important; }
        .invoice-export-fit > div:nth-of-type(4) { margin-top: 2mm !important; }
        .invoice-export-fit > div:nth-of-type(5) { margin-top: 9mm !important; padding-left: 10mm !important; padding-right: 10mm !important; }
        .invoice-export-fit > div:nth-of-type(5) p { margin-bottom: 12mm !important; }
        .invoice-export-fit .w-16 { width: 13mm !important; }
        .invoice-export-fit .w-16 img { max-width: 100% !important; height: auto !important; }
        .invoice-export-fit #businessNameKh { font-size: 27pt !important; line-height: 1.05 !important; margin-bottom: 1mm !important; }
        .invoice-export-fit #businessNameEn { font-size: 21pt !important; line-height: 1.05 !important; }
        .invoice-export-fit #businessAddressKh,
        .invoice-export-fit #businessAddressEn { font-size: 9.5pt !important; line-height: 1.2 !important; }
        .invoice-export-fit #businessPhone { font-size: 14pt !important; line-height: 1.15 !important; margin-top: 1mm !important; }
        .invoice-export-fit #clientName,
        .invoice-export-fit #clientPhone { min-height: 5mm !important; }
        .invoice-export-fit #docTitle,
        .invoice-export-fit h3 { font-size: 24pt !important; line-height: 1.05 !important; }
        .invoice-export-fit #khDate { font-size: 15pt !important; line-height: 1.05 !important; }
        .invoice-export-fit #enDate { font-size: 8.5pt !important; }
        .invoice-export-fit table { margin-bottom: 3mm !important; table-layout: fixed !important; border-collapse: separate !important; border-spacing: 0 !important; }
        .invoice-export-fit thead { display: table-header-group !important; }
        .invoice-export-fit thead th {
            padding: 4mm 5px 4mm !important;
            font-size: 7.6pt !important;
            line-height: 1.25 !important;
            vertical-align: middle !important;
            white-space: normal !important;
            overflow: visible !important;
            height: 12mm !important;
        }
        .invoice-export-fit thead th:nth-child(2) {
            text-align: left !important;
        }
        .invoice-export-fit tbody tr:first-child td {
            padding-top: 4mm !important;
        }
        .invoice-export-fit tbody td {
            padding: 3px 5px !important;
            font-size: 9pt !important;
            line-height: 1.1 !important;
            vertical-align: middle !important;
        }
        .invoice-export-fit th,
        .invoice-export-fit td { overflow: hidden !important; text-overflow: ellipsis !important; }
        .invoice-export-fit .qty,
        .invoice-export-fit .price { padding: 0 4px !important; min-height: 0 !important; line-height: 1.1 !important; }
        .invoice-export-fit .aba-box { padding: 3.5mm !important; border-radius: 5mm !important; }
        .invoice-export-fit #abaNumber { font-size: 18pt !important; line-height: 1.05 !important; }
        .invoice-export-fit #grand { font-size: 29pt !important; line-height: 1 !important; }
        .invoice-export-fit #bal { font-size: 24pt !important; line-height: 1 !important; }
        .invoice-export-fit .balance-box { padding-top: 2mm !important; padding-bottom: 2mm !important; margin-top: 2mm !important; }
    `;
    doc.head.appendChild(style);
}

function applyInvoiceExportFit(area, spec) {
    if (!area) return;
    ensureInvoiceExportStyles(document);
    area.classList.add('invoice-export-fit', `invoice-export-${spec.label.toLowerCase()}`);
}

function removeInvoiceExportFit(area, spec) {
    if (!area) return;
    area.classList.remove('invoice-export-fit', `invoice-export-${spec.label.toLowerCase()}`);
    area.style.removeProperty('--invoice-fit-scale');
}

function scaleInvoiceToFitPage(area) {
    if (!area) return;
    area.style.removeProperty('--invoice-fit-scale');
    const availableHeight = area.clientHeight;
    const contentHeight = area.scrollHeight;
    if (!availableHeight || !contentHeight || contentHeight <= availableHeight) return;

    const scale = Math.max(0.72, Math.min(1, (availableHeight / contentHeight) - 0.015));
    area.style.setProperty('--invoice-fit-scale', String(scale));
}

function getInvoiceCanvasDataUrl(canvas, spec) {
    if (!spec.outputWidth || !spec.outputHeight) {
        return canvas.toDataURL("image/jpeg", 1.0);
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = spec.outputWidth;
    outputCanvas.height = spec.outputHeight;

    const ctx = outputCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

    const scale = Math.min(
        outputCanvas.width / canvas.width,
        outputCanvas.height / canvas.height
    );
    const drawWidth = canvas.width * scale;
    const drawHeight = canvas.height * scale;
    const drawX = (outputCanvas.width - drawWidth) / 2;
    const drawY = (outputCanvas.height - drawHeight) / 2;

    ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

    return outputCanvas.toDataURL("image/jpeg", 1.0);
}

async function saveImage() {
    const target = document.getElementById('capture-area') || document.getElementById('invoiceCaptureArea');
    if (!target) return;
    const controls = document.querySelectorAll('.no-print');
    controls.forEach(c => c.style.visibility = 'hidden');

    const originalStyle = target.getAttribute('style') || '';
    const paperSpec = getInvoicePaperSpec();
    const captureSpec = getInvoiceCapturePaperSpec();
    applyInvoicePaperStyle(target, captureSpec);
    applyInvoiceExportFit(target, captureSpec);

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
                // Force selected paper size in clone
                const area = clonedDoc.getElementById('capture-area') || clonedDoc.getElementById('invoiceCaptureArea');
                ensureInvoiceExportStyles(clonedDoc);
                applyInvoicePaperStyle(area, captureSpec);
                if (area) area.classList.add('invoice-export-fit', `invoice-export-${captureSpec.label.toLowerCase()}`);
            }
        });
        const link = document.createElement('a');
        link.download = `VUTHY_TAILOR_Invoice_${paperSpec.label}_${Date.now()}.jpg`;
        link.href = getInvoiceCanvasDataUrl(canvas, paperSpec);
        link.click();
    } catch (e) {
        console.error(e);
    } finally {
        controls.forEach(c => c.style.visibility = 'visible');
        removeInvoiceExportFit(target, captureSpec);
        if (originalStyle) target.setAttribute('style', originalStyle);
        else target.removeAttribute('style');
    }
}

// Function to update the document title (Invoice/Quotation)
function updateDocumentTitle() {
    const docTypeSelect = document.getElementById('docType');
    const docTitleEl = document.getElementById('docTitle') || document.querySelector('#capture-area h3, #invoiceCaptureArea h3'); // This is the h3 element on the invoice
    if (!docTypeSelect || !docTitleEl) return;

    const docType = docTypeSelect.value;
    const isKhmer = typeof currentLang !== 'undefined' && currentLang === 'kh';

    docTitleEl.textContent = docType === 'quotation' ? (isKhmer ? 'សេចក្តីសំរេច / QUOTATION' : 'QUOTATION') : (isKhmer ? 'វិក្កយបត្រ / INVOICE' : 'INVOICE');
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
    if (body.rows.length === 0) for(let i=0; i<10; i++) addRow();
    setupInvoiceEditablePlaceholders();
    updateInvoiceCurrencySymbols();

    // Load saved company profile preset (if any)
    if (typeof window.loadInvoiceProfile === 'function') window.loadInvoiceProfile();
    updateDocumentTitle(); // Ensure document title is set on init
    const savedPanelState = localStorage.getItem(INVOICE_PROFILE_PANEL_KEY);
    syncInvoiceProfileSetupToggle(savedPanelState === null ? false : savedPanelState === 'true');
}

function syncInvoiceProfileSetupToggle(forceOpen = null) {
    const content = document.getElementById('invoiceProfileSetupContent');
    const buttonText = document.getElementById('toggleProfileSetupText');
    if (!content || !buttonText) return;

    const isOpen = forceOpen === null ? content.style.display !== 'none' : !!forceOpen;
    content.style.display = isOpen ? 'block' : 'none';
    buttonText.textContent = isOpen ? 'Hide Company Profile Setup' : 'Show Company Profile Setup';
    buttonText.setAttribute('aria-expanded', String(isOpen));
    localStorage.setItem(INVOICE_PROFILE_PANEL_KEY, String(isOpen));
}

function toggleInvoiceProfileSetup() {
    const content = document.getElementById('invoiceProfileSetupContent');
    if (!content) return;
    const nextOpen = content.style.display === 'none' || getComputedStyle(content).display === 'none';
    syncInvoiceProfileSetupToggle(nextOpen);
}

function getElValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
}

function getInvoiceProfileTemplateName() {
    const typedName = getElValue('profileTemplateName');
    const companyName = firstProfileValue(getElValue('profileCompanyNameEn'), getElValue('profileCompanyNameKh'), getInvoiceTextValue('businessNameEn'));
    return firstProfileValue(typedName, companyName, 'Default Company');
}

function setInvoiceProfileTemplateName(value) {
    setElValue('profileTemplateName', value || '');
}

function getInvoiceTextValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    const raw = el.tagName === 'INPUT' ? el.value : el.textContent;
    return String(raw || '')
        .replace(/^\s*Tel\s*:\s*/i, '')
        .replace(/^\s*Address\s*:\s*/i, '')
        .replace(/^\s*អាសយដ្ឋាន\s*:\s*/i, '')
        .trim();
}

function firstProfileValue(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

function normalizeInvoiceProfile(profile = {}, usePrefs = true) {
    const prefs = usePrefs && typeof appPrefs === 'object' && appPrefs ? appPrefs : {};
    return {
        templateId: profile.templateId || '',
        templateName: firstProfileValue(profile.templateName),
        businessNameKh: firstProfileValue(profile.businessNameKh, profile.companyNameKh, prefs.businessNameKh),
        businessNameEn: firstProfileValue(profile.businessNameEn, profile.companyNameEn, prefs.businessNameEn, prefs.businessName),
        businessTel: firstProfileValue(profile.businessTel, profile.businessPhone, profile.companyTel, prefs.businessPhone),
        businessAddressKh: firstProfileValue(profile.businessAddressKh, profile.companyAddressKh, prefs.businessAddressKh),
        businessAddressEn: firstProfileValue(profile.businessAddressEn, profile.companyAddressEn, prefs.businessAddressEn),
        abaName: firstProfileValue(profile.abaName),
        abaNumber: firstProfileValue(profile.abaNumber),
        managerName: firstProfileValue(profile.managerName),
        clientName: firstProfileValue(profile.clientName),
        clientPhone: firstProfileValue(profile.clientPhone),
        invoiceLogo: profile.invoiceLogo || null
    };
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
    return normalizeInvoiceProfile({
        templateName: getInvoiceProfileTemplateName(),
        businessNameKh: firstProfileValue(getElValue('profileCompanyNameKh'), getInvoiceTextValue('businessNameKh')),
        businessNameEn: firstProfileValue(getElValue('profileCompanyNameEn'), getInvoiceTextValue('businessNameEn')),
        businessTel: firstProfileValue(getElValue('profileCompanyTel'), getInvoiceTextValue('businessPhone')),
        businessAddressKh: firstProfileValue(getElValue('profileCompanyAddressKh'), getInvoiceTextValue('businessAddressKh')),
        businessAddressEn: firstProfileValue(getElValue('profileCompanyAddressEn'), getInvoiceTextValue('businessAddressEn')),
        abaName: firstProfileValue(getElValue('profileAbaName'), getInvoiceTextValue('abaName')),
        abaNumber: firstProfileValue(getElValue('profileAbaNumber'), getInvoiceTextValue('abaNumber')),
        managerName: firstProfileValue(getElValue('profileManagerName'), getInvoiceTextValue('managerName')),
        clientName: firstProfileValue(getElValue('profileClientName'), getInvoiceTextValue('clientName')),
        clientPhone: firstProfileValue(getElValue('profileClientPhone'), getInvoiceTextValue('clientPhone')),

        // logo stored separately (base64 string)
        invoiceLogo: window.__invoiceLogoBase64 || null
    }, false);
}

function applyInvoiceProfileToInvoice(profile, useDefaults = false) {
    profile = normalizeInvoiceProfile(profile, false);
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
    setProfileInput('profileTemplateName', profile.templateName);
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

function readInvoiceProfileFromLocalStorage() {
    try {
        const raw = localStorage.getItem(INVOICE_PROFILE_STORAGE_KEY);
        return raw ? normalizeInvoiceProfile(JSON.parse(raw), false) : null;
    } catch (e) {
        console.warn('Invoice profile localStorage read failed:', e);
        return null;
    }
}

function makeInvoiceProfileTemplateId(name) {
    const base = String(name || 'profile')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    return base || `profile-${Date.now()}`;
}

function makeUniqueInvoiceProfileTemplateId(name, profiles, currentId = '') {
    const base = makeInvoiceProfileTemplateId(name);
    if (!profiles[base] || base === currentId) return base;

    let counter = 2;
    let id = `${base}-${counter}`;
    while (profiles[id] && id !== currentId) {
        counter += 1;
        id = `${base}-${counter}`;
    }
    return id;
}

function findInvoiceProfileTemplateIdByName(templates, name) {
    const normalizedName = String(name || '').trim().toLowerCase();
    if (!normalizedName || !templates || !templates.profiles) return '';

    return Object.keys(templates.profiles).find(id => {
        const profileName = String(templates.profiles[id]?.templateName || '').trim().toLowerCase();
        return profileName === normalizedName;
    }) || '';
}

function normalizeInvoiceProfileTemplates(rawTemplates) {
    const fallbackProfile = readInvoiceProfileFromLocalStorage();
    const templates = rawTemplates && typeof rawTemplates === 'object'
        ? { ...rawTemplates }
        : { activeId: '', profiles: {} };

    if (!templates.profiles || typeof templates.profiles !== 'object') templates.profiles = {};

    if (fallbackProfile && !Object.keys(templates.profiles).length) {
        const templateName = firstProfileValue(fallbackProfile.templateName, fallbackProfile.businessNameEn, fallbackProfile.businessNameKh, 'Default Company');
        const templateId = makeInvoiceProfileTemplateId(templateName);
        templates.activeId = templateId;
        templates.profiles[templateId] = normalizeInvoiceProfile({ ...fallbackProfile, templateId, templateName }, false);
    }

    Object.keys(templates.profiles).forEach(id => {
        const profile = normalizeInvoiceProfile(templates.profiles[id], false);
        profile.templateId = id;
        profile.templateName = firstProfileValue(profile.templateName, profile.businessNameEn, profile.businessNameKh, 'Company Profile');
        templates.profiles[id] = profile;
    });

    if (!templates.activeId || !templates.profiles[templates.activeId]) {
        templates.activeId = Object.keys(templates.profiles)[0] || '';
    }

    return templates;
}

function readInvoiceProfileTemplatesFromLocalStorage() {
    try {
        const raw = localStorage.getItem(INVOICE_PROFILE_TEMPLATES_STORAGE_KEY);
        return normalizeInvoiceProfileTemplates(raw ? JSON.parse(raw) : null);
    } catch (e) {
        console.warn('Invoice profile templates localStorage read failed:', e);
        return normalizeInvoiceProfileTemplates(null);
    }
}

function writeInvoiceProfileTemplatesToLocalStorage(templates) {
    try {
        localStorage.setItem(INVOICE_PROFILE_TEMPLATES_STORAGE_KEY, JSON.stringify(normalizeInvoiceProfileTemplates(templates)));
    } catch (e) {
        console.warn('Invoice profile templates localStorage save failed:', e);
    }
}

async function readInvoiceProfileTemplates() {
    let templates = null;
    if (typeof BridgeWorkDB !== 'undefined') {
        templates = await BridgeWorkDB.get('settings', 'invoiceProfiles');
    }

    const localTemplates = readInvoiceProfileTemplatesFromLocalStorage();
    const dbHasProfiles = templates && templates.profiles && Object.keys(templates.profiles).length;
    if (!dbHasProfiles) {
        const legacyProfile = typeof BridgeWorkDB !== 'undefined'
            ? await BridgeWorkDB.get('settings', 'invoiceProfile')
            : null;
        templates = localTemplates;

        if (legacyProfile && !Object.keys(templates.profiles).length) {
            const profile = normalizeInvoiceProfile(legacyProfile, false);
            const templateName = firstProfileValue(profile.templateName, profile.businessNameEn, profile.businessNameKh, 'Default Company');
            const templateId = makeInvoiceProfileTemplateId(templateName);
            templates.activeId = templateId;
            templates.profiles[templateId] = normalizeInvoiceProfile({ ...profile, templateId, templateName }, false);
        }
    }

    return normalizeInvoiceProfileTemplates(templates);
}

async function writeInvoiceProfileTemplates(templates) {
    const normalized = normalizeInvoiceProfileTemplates(templates);
    writeInvoiceProfileTemplatesToLocalStorage(normalized);
    if (typeof BridgeWorkDB !== 'undefined') {
        await BridgeWorkDB.set('settings', 'invoiceProfiles', normalized);
    }
    return normalized;
}

function populateInvoiceProfileSelect(templates) {
    const select = document.getElementById('savedInvoiceProfileSelect');
    if (!select) return;

    const normalized = normalizeInvoiceProfileTemplates(templates);
    const profiles = Object.values(normalized.profiles)
        .sort((a, b) => String(a.templateName || '').localeCompare(String(b.templateName || '')));

    select.innerHTML = profiles.length
        ? profiles.map(profile => `<option value="${escapeInvoiceOptionValue(profile.templateId)}">${escapeInvoiceOptionValue(profile.templateName)}</option>`).join('')
        : '<option value="">No saved templates</option>';
    select.value = normalized.activeId || '';
}

function escapeInvoiceOptionValue(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function writeInvoiceProfileToLocalStorage(profile) {
    try {
        localStorage.setItem(INVOICE_PROFILE_STORAGE_KEY, JSON.stringify(normalizeInvoiceProfile(profile, false)));
    } catch (e) {
        console.warn('Invoice profile localStorage save failed:', e);
    }
}

function syncInvoiceProfileToAppPrefs(profile) {
    if (typeof appPrefs !== 'object' || !appPrefs) return;
    appPrefs.businessNameKh = profile.businessNameKh;
    appPrefs.businessNameEn = profile.businessNameEn;
    appPrefs.businessPhone = profile.businessTel;
    appPrefs.businessAddressKh = profile.businessAddressKh;
    appPrefs.businessAddressEn = profile.businessAddressEn;
}

async function loadInvoiceProfile(templateId = null) {
    updateDocumentTitle(); // Ensure title is correct on load
    try {
        const templates = await readInvoiceProfileTemplates();
        const select = document.getElementById('savedInvoiceProfileSelect');
        const selectedId = templateId || (select && select.value) || templates.activeId;
        const profile = templates.profiles[selectedId]
            ? normalizeInvoiceProfile(templates.profiles[selectedId], false)
            : normalizeInvoiceProfile({}, true);
        populateInvoiceProfileSelect(templates);
        const hasSavedProfile = Object.values(profile).some(value => typeof value === 'string' && value.trim());
        if (!hasSavedProfile && !profile.invoiceLogo) { applyInvoiceProfileToInvoice({}, true); return; } // If no profile saved, apply empty with defaults

        templates.activeId = profile.templateId || selectedId;
        await writeInvoiceProfileTemplates(templates);
        populateInvoiceProfileSelect(templates);
        setInvoiceProfileTemplateName(profile.templateName);
        window.__invoiceLogoBase64 = profile.invoiceLogo || null;
        applyInvoiceProfileToInvoice(profile, true);
        writeInvoiceProfileToLocalStorage(profile);
    } catch (e) {
        console.error('loadInvoiceProfile failed:', e);
        const fallbackProfile = readInvoiceProfileFromLocalStorage();
        if (fallbackProfile) {
            window.__invoiceLogoBase64 = fallbackProfile.invoiceLogo || null;
            applyInvoiceProfileToInvoice(fallbackProfile, true);
        } else {
            applyInvoiceProfileToInvoice({}, true); // Fallback to empty profile on error
        }
    }
}

async function saveInvoiceProfile() {
    try {
        const templates = await readInvoiceProfileTemplates();
        const templateName = getInvoiceProfileTemplateName();
        const matchingNameId = findInvoiceProfileTemplateIdByName(templates, templateName);
        const templateId = matchingNameId || makeUniqueInvoiceProfileTemplateId(templateName, templates.profiles);
        const profile = normalizeInvoiceProfile({
            ...getInvoiceProfileFromInputs(),
            templateId,
            templateName
        }, false);
        templates.activeId = templateId;
        templates.profiles[templateId] = profile;
        await writeInvoiceProfileTemplates(templates);
        writeInvoiceProfileToLocalStorage(profile);
        syncInvoiceProfileToAppPrefs(profile);
        if (typeof BridgeWorkDB === 'undefined') {
            console.warn('BridgeWorkDB missing; cannot save invoice profile.');
        } else {
            await BridgeWorkDB.set('settings', 'invoiceProfile', profile);
            if (typeof savePrefs === 'function') await savePrefs();
        }
        populateInvoiceProfileSelect(templates);
        setInvoiceProfileTemplateName(profile.templateName);
        applyInvoiceProfileToInvoice(profile);
        if (typeof showToast === 'function') showToast(`Invoice profile "${profile.templateName}" saved!`, 'success');
    } catch (e) {
        console.error('saveInvoiceProfile failed:', e);
        if (typeof showToast === 'function') showToast('Failed to save invoice profile', 'error');
    }
}

async function loadSelectedInvoiceProfile() {
    const select = document.getElementById('savedInvoiceProfileSelect');
    await loadInvoiceProfile(select ? select.value : null);
}

async function deleteInvoiceProfile() {
    const select = document.getElementById('savedInvoiceProfileSelect');
    if (!select || !select.value) return;

    const templates = await readInvoiceProfileTemplates();
    const profile = templates.profiles[select.value];
    if (!profile) return;
    if (!confirm(`Delete invoice profile "${profile.templateName}"?`)) return;

    delete templates.profiles[select.value];
    templates.activeId = Object.keys(templates.profiles)[0] || '';
    await writeInvoiceProfileTemplates(templates);
    populateInvoiceProfileSelect(templates);

    if (templates.activeId) await loadInvoiceProfile(templates.activeId);
    else {
        applyInvoiceProfileToInvoice({}, true);
        setInvoiceProfileTemplateName('');
        writeInvoiceProfileToLocalStorage({});
    }

    if (typeof showToast === 'function') showToast('Invoice profile deleted', 'info');
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
    const logoLeftImg = document.querySelector('#capture-area .w-16 img[alt="logo left"]') ||
                        document.querySelector('#invoiceCaptureArea .w-16 img[alt="logo left"]');
    if (logoLeftImg) {
        logoLeftImg.src = DEFAULT_INVOICE_LOGO;
    }

    // Also clear file input value (best-effort)
    const input = document.getElementById('invoiceLogoUpload');
    if (input) input.value = '';
}

async function clearInvoiceProfile() {
    if (!confirm('Clear all company profile preset fields?')) return;
    
    const fields = [
        'profileTemplateName', 'profileCompanyNameKh', 'profileCompanyNameEn', 'profileCompanyTel',
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
    // Note: This does NOT delete the saved profile from DB. 
    // User must click "Save" after clearing if they want to overwrite the saved preset with empty data.
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
window.loadSelectedInvoiceProfile = loadSelectedInvoiceProfile;
window.saveInvoiceProfile = saveInvoiceProfile;
window.deleteInvoiceProfile = deleteInvoiceProfile;
window.handleInvoiceLogoUpload = handleInvoiceLogoUpload;
window.clearInvoiceLogo = clearInvoiceLogo;
window.clearInvoiceProfile = clearInvoiceProfile;
window.updateInvoiceFromPreset = updateInvoiceFromPreset;
window.toggleInvoiceProfileSetup = toggleInvoiceProfileSetup;
window.updateInvoiceCurrencySymbols = updateInvoiceCurrencySymbols;

window.initInvoiceView = initInvoiceView;
window.addRow = addRow;
window.calc = calc;
window.setInvoiceCurrency = setInvoiceCurrency;
window.saveImage = saveImage;
window.triggerInvoiceCalendar = triggerInvoiceCalendar;
window.updateInvoiceDate = updateInvoiceDate;
window.refreshNums = refreshNums;
window.updateDocumentTitle = updateDocumentTitle;
window.exportInvoiceToExcel = exportInvoiceToExcel;
