// js/ui.js
// Branding, cover upload, theme, settings modal, help modal, profile, and UI preferences.

function triggerLogoUpload() {
    document.getElementById('logoUploadInput').click();
}

async function handleLogoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
        showToast("Logo file is too large. Please use an image under 2MB.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        await BridgeWorkDB.set("settings", "customLogo", base64);
        await updateBrandingUI();
        showToast("Logo updated!", "success");
    };
    reader.readAsDataURL(file);
}

function triggerProfileUpload() {
    document.getElementById('profileUploadInput').click();
}

async function handleProfileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        await BridgeWorkDB.set("settings", "userAvatar", base64);
        await updateProfileUI();
        showToast("Profile picture updated!", "success");
    };
    reader.readAsDataURL(file);
}

async function updateBrandingUI() {
    const logo = await BridgeWorkDB.get("settings", "customLogo");
    if (logo) {
        const container = document.getElementById('logoIconContainer');
        if (container) container.innerHTML = `<img src="${logo}">`;
        const favicon = document.getElementById('favicon');
        if (favicon) favicon.href = logo;
    }
}

let currentCoverTarget = null;
let isRepositioning = false;
let startY = 0;
let startPos = 50;
let activeViewId = null;
let tempPos = 50;

function triggerCoverUpload(viewId) {
    currentCoverTarget = viewId;
    document.getElementById('coverUploadInput').click();
}

function handleCoverUpload(input) {
    const file = input.files[0];
    if (!file || !currentCoverTarget) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        await BridgeWorkDB.set("settings", "cover_" + currentCoverTarget, base64);
        await updateCoverUI(currentCoverTarget);
        startRepositioning(currentCoverTarget);
        showToast("Cover updated! Drag to adjust the view.", "success");
    };
    reader.readAsDataURL(file);
}

async function updateCoverUI(viewId) {
    const imgId = viewId.replace('View', 'CoverImg');
    const imgEl = document.getElementById(imgId);
    const wrapper = document.querySelector(`#${viewId} .profile-cover-wrapper`);
    if (!imgEl || !wrapper) return;
    const storedImage = await BridgeWorkDB.get("settings", "cover_" + viewId);
    if (storedImage) {
        imgEl.src = storedImage;
        wrapper.classList.add('has-custom-cover');
    } else {
        wrapper.classList.remove('has-custom-cover');
    }
    const pos = appCoverPositions[viewId] || 50;
    imgEl.style.objectPosition = `center ${pos}%`;
}

function startRepositioning(viewId) {
    isRepositioning = true;
    activeViewId = viewId;
    const wrapper = document.querySelector(`#${viewId} .profile-cover-wrapper`);
    const img = document.getElementById(viewId.replace('View', 'CoverImg'));
    wrapper.classList.add('repositioning-mode');
    startPos = appCoverPositions[viewId] || 50;
    tempPos = startPos;

    const moveHandler = (e) => {
        if (!isRepositioning) return;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        if (startY === 0) startY = clientY;
        const diff = clientY - startY;
        const sensitivity = 0.2;
        tempPos = Math.max(0, Math.min(100, startPos - (diff * sensitivity)));
        img.style.objectPosition = `center ${tempPos}%`;
    };

    const stopHandler = () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('touchmove', moveHandler);
        startY = 0;
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('mouseup', stopHandler, { once: true });
    window.addEventListener('touchend', stopHandler, { once: true });
}

function saveRepositioning(viewId) {
    isRepositioning = false;
    appCoverPositions[viewId] = tempPos;
    BridgeWorkDB.set("settings", "coverPositions", appCoverPositions);
    const wrapper = document.querySelector(`#${viewId} .profile-cover-wrapper`);
    if (wrapper) wrapper.classList.remove('repositioning-mode');
    showToast("Position saved!", "success");
}

function changeAppLang(lang) {
    updateI18n(lang);
    const btnEN = document.getElementById("btnEN");
    const btnKH = document.getElementById("btnKH");
    if (btnEN) btnEN.classList.toggle("active", lang === "en");
    if (btnKH) btnKH.classList.toggle("active", lang === "kh");

    const settingsLangSelect = document.getElementById("settingsLangSelect");
    if (settingsLangSelect) settingsLangSelect.value = lang;

    populateCategorySelect();
    render();
    if (typeof updateWeather === 'function') updateWeather();
}

function toggleMobileSidebar() {
    document.body.classList.toggle('mobile-sidebar-open');
}

function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let icon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    if (type === "success") icon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    if (type === "error") icon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    toast.innerHTML = `${icon}<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add("fade-out"); setTimeout(() => toast.remove(), 300); }, 3500);
}







function getCurrentViewMonthYear(viewName) {
    if (viewName === 'dashboard') return { month: dashboardMonthState, year: dashboardYearState };
    if (viewName === 'income') return { month: incomeMonthState, year: incomeYearState };
    if (viewName === 'expense') return { month: expenseMonthState, year: expenseYearState };
    return { month: new Date().getMonth(), year: new Date().getFullYear() };
}

function showView(viewName) {
    currentView = viewName;

    // Auto-close mobile sidebar when a view is selected
    document.body.classList.remove('mobile-sidebar-open');

    // Update body classes for layout switching
    document.body.classList.toggle('home-shell', viewName === 'home');
    document.body.classList.toggle('tool-shell', viewName !== 'home');
    document.body.classList.toggle('report-dashboard-shell', viewName === 'dashboard');
    document.body.classList.toggle('full-screen-tool-shell', 
        viewName === 'ocr' || 
        viewName === 'compressImage' || 
        viewName === 'invoice' ||
        viewName === 'jpgViewer');

    const homeView = document.getElementById("homeView");
    const dashboardView = document.getElementById("dashboardView");
    const reportsView = document.getElementById("reportsView");
    const notesView = document.getElementById("notesView");
    const todoView = document.getElementById("todoView");
    const kanbanView = document.getElementById("kanbanView");
    const mainHeaderPanel = document.getElementById("mainHeaderPanel");
    const loanView = document.getElementById("loanView");
    const incomeView = document.getElementById("incomeView");
    const expenseView = document.getElementById("expenseView");
    const chatbotView = document.getElementById("chatbotView");
    const reportControls = document.getElementById("reportControls");
    const jpgViewerView = document.getElementById("jpgViewerView");

    if (currentView === 'dashboard') { dashboardMonthState = viewMonth; dashboardYearState = viewYear; }
    else if (currentView === 'income') { incomeMonthState = viewMonth; incomeYearState = viewYear; }
    else if (currentView === 'expense') { expenseMonthState = viewMonth; expenseYearState = viewYear; }

    const newViewDateState = getCurrentViewMonthYear(viewName);
    viewMonth = newViewDateState.month;
    viewYear = newViewDateState.year;

    if (homeView) homeView.style.display = (viewName === 'home') ? 'block' : 'none';
    if (dashboardView) dashboardView.style.display = (viewName === 'dashboard') ? 'block' : 'none';
    if (reportsView) reportsView.style.display = (viewName === 'dashboard') ? 'block' : 'none';
    if (notesView) notesView.style.display = (viewName === 'notes') ? 'block' : 'none';
    if (eagleGalleryView) eagleGalleryView.style.display = (viewName === 'eagleGallery') ? 'block' : 'none';
    if (todoView) todoView.style.display = (viewName === 'todo') ? 'block' : 'none';
    if (kanbanView) kanbanView.style.display = (viewName === 'kanban') ? 'block' : 'none';
    if (loanView) loanView.style.display = (viewName === 'loan') ? 'block' : 'none';
    if (incomeView) incomeView.style.display = (viewName === 'income') ? 'block' : 'none';
    if (expenseView) expenseView.style.display = (viewName === 'expense') ? 'block' : 'none';
    if (typeof ocrView !== 'undefined' && ocrView) ocrView.style.display = (viewName === 'ocr') ? 'block' : 'none';
    if (compressImageView) compressImageView.style.display = (viewName === 'compressImage') ? 'block' : 'none';
    if (invoiceView) invoiceView.style.display = (viewName === 'invoice') ? 'block' : 'none';
    if (chatbotView) chatbotView.style.display = (viewName === 'chatbot') ? 'block' : 'none';
    if (jpgViewerView) jpgViewerView.style.display = (viewName === 'jpgViewer') ? 'block' : 'none';

    if (reportControls) {
        const monthlyViews = ['dashboard', 'income', 'expense'];
        reportControls.style.display = monthlyViews.includes(viewName) ? 'flex' : 'none';
    }

    document.querySelectorAll(".sidebar a").forEach(link => {
        const view = link.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
        link.classList.toggle("active", view === viewName);
    });
    document.querySelectorAll(".mobile-nav button").forEach(btn => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        btn.classList.toggle("active", onclickAttr.includes(`'${viewName}'`));
    });

    if (viewName === 'kanban') renderKanbanBoard();
    if (viewName === 'loan') renderLoans();
    if (viewName === 'income') renderIncomes();
    if (viewName === 'expense') renderExpenses();
    if (viewName === 'eagleGallery') renderEagleGallery();

    triggerStagger();
    render();
    updateMonthDisplay();
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    BridgeWorkDB.set("settings", "darkMode", isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    updateThemeUI();
}

function updateThemeUI() {
    const btn = document.getElementById("darkToggle");
    if (!btn) return;
    btn.innerHTML = isDarkMode 
        ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark Mode' 
        : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Light Mode';
}

function openHelpModal(filterTag = null) {
    const modal = document.getElementById("helpModal");
    if (!modal) return;
    if (!filterTag && currentView !== 'dashboard') {
        const viewToTagMap = {
            'notes': 'notes',
            'todo': 'todo',
            'kanban': 'todo',
            'loan': 'loan',
            'income': 'income',
            'eagleGallery': 'guide'
        };
        helpModalFilter = viewToTagMap[currentView] || "all";
    } else {
        helpModalFilter = filterTag || "all";
    }
    helpSearchQuery = "";
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
    renderHelpContent(helpModalFilter);
}

function closeHelpModal() {
    const modal = document.getElementById("helpModal");
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function renderHelpContent(filterTag = "all") {
    const contentArea = document.getElementById("helpContentArea");
    const sidebarBtns = document.querySelectorAll(".help-sidebar-btn");
    if (!contentArea) return;

    sidebarBtns.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === filterTag);
    });

    let html = `
        <div class="todo-input-group" style="margin-bottom: 24px; border-radius: 12px; box-shadow: var(--shadow); border: 1px solid var(--border-color);">
            <input type="text" id="helpSearchInput" placeholder="${getTranslation('help_search_ph')}" value="${helpSearchQuery}" oninput="handleHelpSearch(this.value, '${filterTag}')">
        </div>
    `;

    const filteredTopics = appHelpTopics.filter(topic => {
        const matchesTag = filterTag === "all" || (filterTag === "new" ? topic.tags.includes("new") : topic.tags.includes(filterTag));
        const q = helpSearchQuery.toLowerCase();
        const titleText = (topic.title[currentLang] || topic.title.en).toLowerCase();
        const contentText = (topic.content[currentLang] || topic.content.en).toLowerCase();
        const matchesSearch = !q || titleText.includes(q) || contentText.includes(q);
        return matchesTag && matchesSearch;
    }).sort((a, b) => {
        if (filterTag === "new") return (b.version || "").localeCompare(a.version || "");
        const titleA = a.title[currentLang] || a.title.en;
        const titleB = b.title[currentLang] || b.title.en;
        return titleA.localeCompare(titleB);
    });

    if (filteredTopics.length === 0) {
        contentArea.innerHTML = html + `<div style="text-align: center; padding: 60px 20px; color: var(--text-muted);"><p style="font-size: 14px; font-weight: 600;">${currentLang === 'kh' ? 'រកមិនឃើញប្រធានបទដែលត្រូវគ្នាទេ' : 'No matching help topics found.'}</p><button class="btn btn-outline" style="margin-top: 10px;" onclick="handleHelpSearch('', '${filterTag}')">Clear Search</button></div>`;
        return;
    }

    html += filteredTopics.map(topic => `
        <div class="help-topic-card card animate-stagger" style="margin-bottom: 20px; padding: 20px;">
            ${topic.image ? `
                <div class="help-topic-image" style="margin-bottom: 15px; border-radius: 8px; overflow: hidden; height: 120px; border: 1px solid var(--border-color);">
                    <img src="${topic.image}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            ` : ''}
            <h3 style="font-size: 16px; margin-top: 0; color: var(--primary);">${highlightText(topic.title[currentLang] || topic.title.en, helpSearchQuery)}</h3>
            <div style="font-size: 13px; line-height: 1.6; color: var(--text-main);">${highlightText(topic.content[currentLang] || topic.content.en, helpSearchQuery)}</div>
            ${topic.tags && topic.tags.length > 0 ? `<div style="margin-top: 15px; display: flex; gap: 8px; flex-wrap: wrap;">${topic.tags.map(tag => `<span class="badge" style="font-size: 9px; text-transform: uppercase; background: var(--bg-page); color: var(--text-muted); border: 1px solid var(--border-color);">${tag}</span>`).join('')}</div>` : ''}
        </div>
    `).join('');

    contentArea.innerHTML = html;
    const searchInp = document.getElementById("helpSearchInput");
    if (helpSearchQuery && searchInp) {
        searchInp.focus();
        searchInp.setSelectionRange(helpSearchQuery.length, helpSearchQuery.length);
    }
}

function handleHelpSearch(val, filterTag) {
    helpSearchQuery = val;
    renderHelpContent(filterTag);
}

async function showWhatsNewAlert() {
    if (appPrefs.lastSeenAppVersion !== APP_VERSION) {
        showToast(getTranslation('whats_new_toast').replace('{version}', APP_VERSION), "success");
        appPrefs.lastSeenAppVersion = APP_VERSION;
        await BridgeWorkDB.set("settings", "prefs", appPrefs);
    }
}

async function saveNotes() {
    await BridgeWorkDB.set("notes", "main", appNotes);
}

async function saveTodos() {
    await BridgeWorkDB.set("todos", "main", appTodos);
}

function addCategory() {
    var inp = document.getElementById("newCatInput");
    var val = inp.value.trim();
    if (val && !appCategories.includes(val)) {
        appCategories.push(val);
        saveCategories();
        inp.value = "";
        renderCategories();
        populateCategorySelect();
    }
}

function delCategory(idx) {
    appCategories.splice(idx, 1);
    saveCategories();
    renderCategories();
    populateCategorySelect();
}

function updateLimit(val, viewType = 'dashboard') {
    DAILY_HOUR_LIMIT = parseFloat(val) || 7.5;
    BridgeWorkDB.set("settings", "limit", DAILY_HOUR_LIMIT);
    render();
    renderAllViews();
}

function openSettings() {
    const modal = document.getElementById("settingsModal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

    setVal("limitInput", DAILY_HOUR_LIMIT);
    setVal("profileName", userName);
    setVal("profileRole", userRole);
    setVal("profileBehance", appPrefs.behanceUrl || "");
    setVal("profileFacebook", appPrefs.facebookUrl || "");
    setVal("profileTiktok", appPrefs.tiktokUrl || "");
    setVal("wsNameInput", currentWorkspace.name);
    setVal("wsPosterTarget", currentWorkspace.posterTarget);
    setVal("wsHoursTarget", currentWorkspace.hoursTarget);
    setVal("wsIncomeTarget", currentWorkspace.incomeTarget || 1000);

    setCheck("showModuleLoan", appPrefs.showLoan);
    setCheck("showModuleTodo", appPrefs.showTodo);
    setCheck("showModuleIncome", appPrefs.showIncome);
    setCheck("showIncomePrivacy", appPrefs.incomePrivacy);
    setVal("uiScaleInput", appPrefs.uiScale || 100);
    setVal("currencyInput", appPrefs.currency || "$");
    setCheck("compactSidebarInput", !!appPrefs.compactSidebar);
    setCheck("animationsInput", appPrefs.animations !== false);
    setVal("dateFormatInput", appPrefs.dateFormat || 'DD/MM/YYYY');
    setVal("accentColorInput", appPrefs.accentColor || '#6366f1');
    setVal("backgroundImageInput", appPrefs.backgroundImage || 'none');
    // Apply background image settings
    applyBackgroundImage();
    setCheck("focusModeInput", appPrefs.focusMode !== false);
    setCheck("showModuleExpenses", appPrefs.showExpenses);
    setVal("msgDash", appPrefs.toolMessages?.dashboard || "");
    setVal("msgNotes", appPrefs.toolMessages?.notes || "");
    setVal("msgTodo", appPrefs.toolMessages?.todo || "");
    setVal("msgLoan", appPrefs.toolMessages?.loan || "");
    setVal("msgIncome", appPrefs.toolMessages?.income || "");
    setVal("msgExpenses", appPrefs.toolMessages?.expenses || "");
    setCheck("showModuleTicker", appPrefs.showTicker);
    setCheck("homeShowWeatherInput", appPrefs.homeShowWeather);
    setCheck("homeShowProgressInput", appPrefs.homeShowProgress);
    setCheck("homeShowDecorInput", appPrefs.homeShowDecor);
    setCheck("homeShowNewsInput", appPrefs.homeShowNews);

    // Filter tabs based on context (Home vs Report)
    const isHome = currentView === 'home';
    const reportTabs = ['project', 'categories', 'modules', 'data'];
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        btn.style.display = (isHome && reportTabs.includes(tab)) ? 'none' : 'flex';
    });

    const langSelect = document.getElementById("settingsLangSelect");
    if (langSelect) langSelect.value = currentLang;
    
    // Default to Launcher tab if on Home, otherwise Profile
    const startTab = currentView === 'home' ? 'launcher' : 'profile';
    switchSettingsTab(startTab);
    
    renderCategories();
}

function toggleSocialLinks(e) {
    if (e) e.stopPropagation();
    const container = document.getElementById('profileSocialLinks');
    if (container) container.classList.toggle('show');
}

async function saveProfile() {
    userName = document.getElementById("profileName").value;
    userRole = document.getElementById("profileRole").value;
    appPrefs.behanceUrl = document.getElementById("profileBehance").value;
    appPrefs.facebookUrl = document.getElementById("profileFacebook").value;
    appPrefs.tiktokUrl = document.getElementById("profileTiktok").value;
    await BridgeWorkDB.set("settings", "userName", userName);
    await BridgeWorkDB.set("settings", "userRole", userRole);
    await BridgeWorkDB.set("settings", "prefs", appPrefs);
    updateProfileUI();
    showToast("Profile updated!", "success");
}

async function updateProfileUI() {
    document.querySelectorAll("[data-i18n='user_name']").forEach(el => {
        el.textContent = userName;
        // Minimal scaling for Khmer names in sidebar/profile
        if (currentLang === 'kh') {
            el.style.fontSize = '0.9em';
            el.style.letterSpacing = '0';
        } else {
            el.style.fontSize = '';
            el.style.letterSpacing = 'normal'; // Ensure normal letter spacing for non-Khmer
        }
    });
    document.querySelectorAll("[data-i18n='user_role']").forEach(el => {
        el.textContent = userRole;
        if (currentLang === 'kh') el.style.fontSize = '0.8em'; 
        else el.style.fontSize = '';
    });
    const avatar = await BridgeWorkDB.get("settings", "userAvatar") || "assets/images/tra.jpg";
    document.querySelectorAll(".avatar").forEach(img => img.src = avatar);
    window.currentUserAvatar = avatar;
    document.querySelectorAll('.profile-social-links').forEach(socialContainer => {
        if (!socialContainer) return;
        let html = '';
        if (appPrefs.behanceUrl) html += `<a href="${appPrefs.behanceUrl}" target="_blank" class="social-icon" title="Behance"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 13H15V11H22V13M18.5 10H14.5V8.5H18.5V10M11 13V15.5H8V13H11M11 8.5V11H8V8.5H11M13 13C13 11.5 12.3 10.3 11.2 9.7C12.1 9 12.6 7.9 12.6 6.8C12.6 4.1 10.5 2 7.8 2H2V18.1H8.1C10.8 18.1 13 16 13 13.3V13M7.5 4.5H8.1C9.3 4.5 10.1 5.3 10.1 6.5C10.1 7.7 9.3 8.5 8.1 8.5H7.5V4.5M8.1 15.6H7.5V11H8.1C9.3 11 10.1 11.8 10.1 13C10.1 14.2 9.3 15.6 8.1 15.6Z"/></svg></a>`;
        if (appPrefs.facebookUrl) html += `<a href="${appPrefs.facebookUrl}" target="_blank" class="social-icon" title="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg></a>`;
        if (appPrefs.tiktokUrl) html += `<a href="${appPrefs.tiktokUrl}" target="_blank" class="social-icon" title="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.31-.75.42-1.24 1.25-1.33 2.1-.1.7.1 1.41.53 1.97.44.46 1.09.68 1.71.68 1.53.06 2.94-1.03 3.25-2.53.06-1 .04-2.01.04-3.01.01-4.42-.02-8.84.02-13.26z"/></svg></a>`;
        socialContainer.innerHTML = html;
    });
}

function closeSettings() {
    const modal = document.getElementById("settingsModal");
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function renderCategories() {
    var list = document.getElementById("categoryList");
    if (!list) return;
    list.innerHTML = "";
    appCategories.forEach((cat, idx) => {
        var div = document.createElement("div");
        div.className = "cat-pill";
        div.innerHTML = `<span>${getCatLabel(cat)}</span> <button class="del-btn" onclick="delCategory(${idx})">✕</button>`;
        list.appendChild(div);
    });
}
