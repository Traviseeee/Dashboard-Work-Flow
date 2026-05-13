// js/init.js
// App initialization, migration, persistence, workspace management, CSV sync, and backup.

// 1. Migration Logic: LocalStorage -> IndexedDB
async function migrateFromLocalStorage() {
    const isMigrated = localStorage.getItem("bw_migrated") === "true";
    if (isMigrated) return;

    console.log("BridgeWork Pro: Initiating data migration...");

    const migrationMap = [
        { ls: "bwData", store: "app_data", key: "main" },
        { ls: "bwNotes", store: "notes", key: "main" },
        { ls: "bwTodos", store: "todos", key: "main" },
        { ls: "bwLoans", store: "loans", key: "main" },
        { ls: "bwIncomes", store: "incomes", key: "main" },
        { ls: "bwExpenses", store: "expenses", key: "main" },
        { ls: "bwWorkspaces", store: "workspaces", key: "main" },
        { ls: "bwEvents", store: "events", key: "main" },
        { ls: "bwPrefs", store: "settings", key: "prefs" },
        { ls: "bwUserName", store: "settings", key: "userName" },
        { ls: "bwUserRole", store: "settings", key: "userRole" },
        { ls: "bwDarkMode", store: "settings", key: "darkMode" },
        { ls: "bwActiveWorkspaceId", store: "settings", key: "activeWorkspaceId" },
        { ls: "bwLang", store: "settings", key: "lang" },
        { ls: "bwLimit", store: "settings", key: "limit" },
        { ls: "bwCustomLogo", store: "settings", key: "customLogo" },
        { ls: "bwUserAvatar", store: "settings", key: "userAvatar" },
        { ls: "bwCovers", store: "settings", key: "coverPositions" }
    ];

    for (const item of migrationMap) {
        const val = localStorage.getItem(item.ls);
        if (val !== null) {
            let data = val;
            try { data = JSON.parse(val); } catch (e) { }
            await BridgeWorkDB.set(item.store, item.key, data);
        }
    }

    localStorage.setItem("bw_migrated", "true");
    console.log("BridgeWork Pro: Migration successfully completed.");
}

// 2. App Initialization Entry Point
async function initializeApp() {
    if (window.location.protocol === 'file:') {
        const msg = "Security Alert: Running via file://. Browser security restricts critical features like AI, Exports, and Sync. Please run 'node server.js' and visit http://localhost:3000";
        console.warn(`[BridgeWork Pro] ${msg}`);
        // Notify the user visually that they should use a local server
        setTimeout(() => {
            if (typeof showToast === 'function') {
                const securityMsg = currentLang === 'kh' ? "សូមប្រើប្រាស់ local server ដើម្បីប្រើប្រាស់មុខងារទាំងអស់" : "Please use a local server for full functionality (node server.js).";
                showToast(securityMsg, "error");
            }
        }, 2000);
    }

    await BridgeWorkDB.init();
    await migrateFromLocalStorage();

    appData = await BridgeWorkDB.get("app_data", "main") || [];
    appNotes = await BridgeWorkDB.get("notes", "main") || [];
    appTodos = await BridgeWorkDB.get("todos", "main") || [];
    appLoans = await BridgeWorkDB.get("loans", "main") || [];
    appIncomes = await BridgeWorkDB.get("incomes", "main") || [];
    appExpenses = await BridgeWorkDB.get("expenses", "main") || [];
    eagleAssets = await BridgeWorkDB.get("eagle_assets", "main") || [];

    appEvents = await BridgeWorkDB.get("events", "main") || [];
    workspaces = await BridgeWorkDB.get("workspaces", "main") || workspaces;
    userName = await BridgeWorkDB.get("settings", "userName") || "Chin Chetra";
    userRole = await BridgeWorkDB.get("settings", "userRole") || "Graphic Designer";
    isDarkMode = await BridgeWorkDB.get("settings", "darkMode") === true;
    activeWorkspaceId = await BridgeWorkDB.get("settings", "activeWorkspaceId") || "default";
    const savedPrefs = await BridgeWorkDB.get("settings", "prefs") || {};
    appPrefs = { ...appPrefs, ...savedPrefs };
    currentLang = await BridgeWorkDB.get("settings", "lang") || currentLang;
    updateProfileUI();

    if (appData.length > 0) {
        const sorted = [...appData].sort((a, b) => String(b.date).localeCompare(String(a.date)));
        const latest = String(sorted[0].date).split(/[-/]/);
        if (latest.length === 3) {
            viewYear = parseInt(latest[0]) || viewYear;
            viewMonth = parseInt(latest[1]) - 1;
            dashboardYearState = parseInt(latest[0]) || dashboardYearState;
            dashboardMonthState = parseInt(latest[1]) - 1;
        }
    }

    viewMonth = dashboardMonthState;
    viewYear = dashboardYearState;

    DAILY_HOUR_LIMIT = parseFloat(await BridgeWorkDB.get("settings", "limit")) || DEFAULT_DAILY_HOUR_LIMIT;
    appCoverPositions = await BridgeWorkDB.get("settings", "coverPositions") || {};

    let foundWorkspace = workspaces.find(w => String(w.id) === String(activeWorkspaceId));
    if (!foundWorkspace) {
        foundWorkspace = workspaces[0];
        activeWorkspaceId = foundWorkspace.id;
    }
    currentWorkspace = foundWorkspace;
    appCategories = currentWorkspace.categories;

    appIncomes = appIncomes.map(inc => {
        if (!inc.id) inc.id = "inc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        return inc;
    });

    appTodos = appTodos.map(todo => {
        if (!todo.workspaceId) todo.workspaceId = "default";
        return todo;
    });

    appData = appData.map(item => {
        if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
            const dObj = new Date(item.date);
            if (!isNaN(dObj.getTime())) {
                const y = dObj.getUTCFullYear();
                const m = String(dObj.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(dObj.getUTCDate()).padStart(2, '0');
                item.date = `${y}-${m}-${dd}`;
            }
        }
        return item;
    });

    await changeAppLang(currentLang);
    updateSyncStatus();

    ['dashboardView', 'notesView', 'todoView', 'loanView', 'incomeView', 'expenseView'].forEach(async (view) => {
        if (view === 'todoView') updateTodoWorkspaceSelector();
        await updateCoverUI(view);
    });
    appPrefs.showExpenses = savedPrefs.showExpenses !== undefined ? savedPrefs.showExpenses : true;
    applyAppPrefs();
    await showView(currentView || 'home', true);
    showWhatsNewAlert();
    if (currentView === 'eagleGallery') refreshEagleAssets();
    render();
    renderAllViews();

    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.classList.remove('loading');
}

let lineChart, barChart, incomePieChart;
let editIndex = -1;

let dashboardMonthState = new Date().getMonth();
let dashboardYearState = new Date().getFullYear();
let incomeMonthState = new Date().getMonth();
let incomeYearState = new Date().getFullYear();
let expenseMonthState = new Date().getMonth();
let expenseYearState = new Date().getFullYear();
let modalRows = [];
let searchQuery = "";
let currentSort = { key: 'date', dir: 'asc' };
let lastReminderDate = "";
let currentView = 'home';
let currentIncomeId = null;

async function save() {
    await BridgeWorkDB.set("app_data", "main", appData);
}

async function saveLoans() {
    await BridgeWorkDB.set("loans", "main", appLoans);
}

async function saveIncomes() {
    await BridgeWorkDB.set("incomes", "main", appIncomes);
}

async function saveExpenses() {
    await BridgeWorkDB.set("expenses", "main", appExpenses);
}

async function savePrefs() {
    await BridgeWorkDB.set("settings", "prefs", appPrefs);
}

async function saveWorkspaces() {
    await BridgeWorkDB.set("workspaces", "main", workspaces);
}

function saveCategories() {
    currentWorkspace.categories = [...appCategories];
    saveWorkspaces();
}

async function switchWorkspace(id) {
    const nextWorkspace = workspaces.find(w => String(w.id) === String(id)) || workspaces[0];
    if (!nextWorkspace) return;

    activeWorkspaceId = nextWorkspace.id;
    await BridgeWorkDB.set("settings", "activeWorkspaceId", activeWorkspaceId);
    currentWorkspace = nextWorkspace;
    appCategories = currentWorkspace.categories || [...DEFAULT_CATEGORIES];
    populateCategorySelect();
    clearSearchInput();

    const wsData = appData.filter(d => String(d.workspaceId || "default") === String(activeWorkspaceId));
    if (wsData.length > 0) {
        const sorted = wsData.sort((a, b) => String(b.date).localeCompare(String(a.date)));
        const latest = String(sorted[0].date).split(/[-/]/);
        if (latest.length === 3) {
            viewYear = parseInt(latest[0]);
            viewMonth = parseInt(latest[1]) - 1;
        }
    }

    updateTodoWorkspaceSelector();
    render();
    const calendarModal = document.getElementById("calendarModal");
    if (calendarModal && calendarModal.style.display !== "none" && typeof renderCalendar === "function") {
        renderCalendar();
    }
    updateWorkspaceUI();
    showToast(`Switched to ${currentWorkspace.name}`, "info");
}

function updateTodoWorkspaceSelector() {
    const sel = document.getElementById("todoWorkspaceSelect");
    if (!sel) return;
    sel.innerHTML = workspaces.map(ws => 
        `<option value="${ws.id}" ${String(ws.id) === String(activeWorkspaceId) ? 'selected' : ''}>${ws.name}</option>`
    ).join('');
}

function getWorkspaceName(id) {
    const ws = workspaces.find(w => w.id === id);
    return ws ? ws.name : "Unknown Project";
}

function openWorkspaceModal() {
    const modal = document.getElementById("workspaceModal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
    document.getElementById("newWsName").value = "";
    document.getElementById("newWsPoster").value = 30;
    document.getElementById("newWsHours").value = 100;
}

function closeWorkspaceModal() {
    const modal = document.getElementById("workspaceModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function saveNewWorkspace() {
    const name = document.getElementById("newWsName").value.trim();
    if (!name) { showToast("Please enter a project name", "error"); return; }
    const newWs = {
        id: "ws_" + Date.now(),
        name,
        posterTarget: parseFloat(document.getElementById("newWsPoster").value) || DEFAULT_POSTER_TARGET,
        hoursTarget: parseFloat(document.getElementById("newWsHours").value) || DEFAULT_HOURS_TARGET,
        incomeTarget: 1000,
        categories: [...DEFAULT_CATEGORIES]
    };
    workspaces.push(newWs);
    saveWorkspaces();
    updateTodoWorkspaceSelector();
    updateWorkspaceUI();
    closeWorkspaceModal();
    showToast(`Project "${name}" created`, "success");
}

function updateWorkspaceUI() {
    const select = document.getElementById("workspaceSelect");
    if (!select) return;
    select.innerHTML = workspaces.map(ws => 
        `<option value="${ws.id}" ${ws.id === activeWorkspaceId ? 'selected' : ''}>${ws.name}</option>`
    ).join('');

    const settingsProjTitle = document.getElementById("settingsProjectTitle");
    if (settingsProjTitle) {
        settingsProjTitle.textContent = `${getTranslation('settings_project_tab')}: ${currentWorkspace.name}`;
    }
    const sidebarLabel = document.getElementById("sidebarProjectName");
    if (sidebarLabel) sidebarLabel.textContent = currentWorkspace.name;
    else render();
}

function getSmartPerformanceInsight(posters, hours) {
    const posterGoal = currentWorkspace.posterTarget || 30;
    const hourGoal = currentWorkspace.hoursTarget || 100;
    const now = new Date();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const currentDay = viewMonth === now.getMonth() && viewYear === now.getFullYear() ? now.getDate() : daysInMonth;
    const daysLeft = daysInMonth - currentDay;

    if (posters >= posterGoal && hours >= hourGoal) {
        return currentLang === 'kh' ? "អស្ចារ្យណាស់! អ្នកបានសម្រេចគោលដៅខែនេះហើយ។" : "Outstanding! You've hit all targets for this month.";
    }

    if (daysLeft > 0 && posters < posterGoal) {
        const remaining = posterGoal - posters;
        const perDay = (remaining / daysLeft).toFixed(1);
        return currentLang === 'kh' 
            ? `ត្រូវការធ្វើបន្ថែម ${remaining} ទៀត (ប្រហែល ${perDay} ក្នុងមួយថ្ងៃ) ដើម្បីសម្រេចគោលដៅ!` 
            : `Need ${remaining} more posters (${perDay}/day) to hit your goal by end of month!`;
    }

    if (posters < posterGoal) {
        const remaining = posterGoal - posters;
        return currentLang === 'kh' ? `នៅសល់តែ ${remaining} ផ្ទាំងទៀតប៉ុណ្ណោះដើម្បីសម្រេចគោលដៅ!` : `Just ${remaining} more posters to reach your monthly goal!`;
    }
    return currentLang === 'kh' ? "បន្តការងារដ៏ល្អនេះទៀត!" : "Keep up the great momentum!";
}

function updateWorkspaceField(field, val) {
    const ws = workspaces.find(w => w.id === activeWorkspaceId);
    if (ws) {
        if (field === 'name') ws.name = val;
        else ws[field] = parseFloat(val) || 0;
        saveWorkspaces();
        updateWorkspaceUI();
        render();
    }
}

async function deleteActiveWorkspace() {
    if (workspaces.length <= 1) {
        showToast(currentLang === 'kh' ? "មិនអាចលុបគម្រោងចុងក្រោយបានទេ" : "Cannot delete the last project.", "error");
        return;
    }

    const ws = workspaces.find(w => w.id === activeWorkspaceId);
    const confirmMsg = currentLang === 'kh' 
        ? `តើអ្នកប្រាកដថាចង់លុបគម្រោង "${ws.name}" មែនទេ? រាល់ទិន្នន័យការងារទាំងអស់ក្នុងគម្រោងនេះនឹងត្រូវលុបចោល។` 
        : `Are you sure you want to delete project "${ws.name}"? All work entries associated with this project will be permanently removed. This action cannot be undone.`;

    if (confirm(confirmMsg)) {
        const deletedId = activeWorkspaceId;
        appData = appData.filter(d => (d.workspaceId || "default") !== deletedId);
        save();
        await BridgeWorkDB.delete("file_handles", "csvHandle_" + deletedId);
        workspaces = workspaces.filter(w => w.id !== deletedId);
        saveWorkspaces();
        switchWorkspace(workspaces[0].id);
        closeSettings();
        showToast(currentLang === 'kh' ? "បានលុបគម្រោងរួចរាល់" : "Project deleted successfully", "success");
    }
}

function ensureSecureContext(isManual = false) {
    const hasFileSystemAPI = !!window.showOpenFilePicker;
    if (isManual && !hasFileSystemAPI) {
        showToast(currentLang === 'kh' ? "មុខងារនេះមិនត្រូវបានគាំទ្រក្នុងកម្មវិធីរុករករបស់អ្នកទេ" : "This feature is not supported in your current browser configuration.", "error");
        return false;
    }
    return true;
}

async function updateSyncStatus() {
    const csvEl = document.getElementById("csvStatus");
    if (!csvEl) return;
    const handle = await BridgeWorkDB.get("file_handles", "csvHandle_" + activeWorkspaceId);
    if (handle) {
        csvEl.textContent = (currentLang === 'kh' ? "ភ្ជាប់រួច: " : "Linked: ") + handle.name;
        csvEl.classList.add("status-active");
    } else {
        csvEl.textContent = "";
        csvEl.classList.remove("status-active");
    }
}

async function linkCSV() {
    if (!ensureSecureContext(true)) return;
    try {
        const handleKey = "csvHandle_" + activeWorkspaceId;
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }], multiple: false });
        if (!handle) return;
        await BridgeWorkDB.set("file_handles", handleKey, handle);
        updateSyncStatus();
        const file = await handle.getFile();
        const text = await file.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const getVal = (row, ...keys) => {
            const rowKeys = Object.keys(row);
            for (let k of keys) {
                if (row[k] !== undefined) return row[k];
                const fuzzy = rowKeys.find(rk => rk.replace(/^\ufeff/, '').trim().toLowerCase() === k.toLowerCase());
                if (fuzzy) return row[fuzzy];
            }
            return "";
        };

        const imported = json.map(row => ({
            date: getVal(row, t[currentLang].th_date, 'date', 'Date'),
            task: getVal(row, t[currentLang].th_task, 'task', 'Task'),
            category: getVal(row, t[currentLang].th_type, 'category', 'Category', 'type'),
            quantity: parseFloat(getVal(row, t[currentLang].th_qty, 'quantity', 'qty', 'Qty')) || 1,
            hours: parseFloat(getVal(row, t[currentLang].th_hours, 'hours', 'Hours')) || 0,
            workspaceId: activeWorkspaceId
        })).filter(item => item.date && item.task).map(item => {
            let dObj;
            if (typeof item.date === 'number') {
                dObj = new Date(Math.round((item.date - 25569) * 86400 * 1000));
            } else if (typeof item.date === 'string' && item.date.includes('-')) {
                const p = item.date.split(/[-/]/);
                if (p.length === 3) dObj = new Date(Date.UTC(p[0], p[1]-1, p[2]));
            } else { dObj = new Date(item.date); }
            if (dObj && !isNaN(dObj.getTime())) {
                const y = dObj.getUTCFullYear();
                const m = String(dObj.getUTCMonth() + 1).padStart(2, '0');
                const d = String(dObj.getUTCDate()).padStart(2, '0');
                item.date = `${y}-${m}-${d}`;
            }
            return item;
        });

        if (imported.length > 0) {
            const firstDateParts = String(imported[0].date).split(/[-/]/);
            if (firstDateParts.length === 3) {
                viewYear = parseInt(firstDateParts[0]);
                viewMonth = parseInt(firstDateParts[1]) - 1;
            }
            appData = appData.filter(d => (d.workspaceId || "default") !== activeWorkspaceId);
            appData.push(...imported);
            await save();
            render();
        }
        showToast(currentLang === 'kh' ? "បានភ្ជាប់ និងទាញយកទិន្នន័យរួចរាល់" : "CSV Linked and imported!", "success");
    } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
    }
}

async function importProjectFromCSV() {
    if (!ensureSecureContext(true)) return;
    try {
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }], multiple: false });
        if (!handle) return;
        const file = await handle.getFile();
        const projectName = file.name.replace(/\.[^/.]+$/, "");
        const newWs = {
            id: "ws_" + Date.now(),
            name: projectName,
            posterTarget: 30,
            hoursTarget: 100,
            categories: [...DEFAULT_CATEGORIES],
            incomeTarget: 1000
        };
        workspaces.push(newWs);
        await BridgeWorkDB.set("workspaces", "main", workspaces);
        await BridgeWorkDB.set("file_handles", "csvHandle_" + newWs.id, handle);
        const text = await file.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const getVal = (row, ...keys) => {
            const rowKeys = Object.keys(row);
            for (let k of keys) {
                if (row[k] !== undefined) return row[k];
                const fuzzy = rowKeys.find(rk => rk.replace(/^\ufeff/, '').trim().toLowerCase() === k.toLowerCase());
                if (fuzzy) return row[fuzzy];
            }
            return "";
        };
        const imported = json.map(row => ({
            date: getVal(row, t[currentLang].th_date, 'date', 'Date'),
            task: getVal(row, t[currentLang].th_task, 'task', 'Task'),
            category: getVal(row, t[currentLang].th_type, 'category', 'Category', 'type'),
            quantity: parseFloat(getVal(row, t[currentLang].th_qty, 'quantity', 'qty', 'Qty')) || 1,
            hours: parseFloat(getVal(row, t[currentLang].th_hours, 'hours', 'Hours')) || 0,
            workspaceId: newWs.id
        })).filter(item => item.date && item.task).map(item => {
            let dObj;
            if (typeof item.date === 'number') {
                dObj = new Date(Math.round((item.date - 25569) * 86400 * 1000));
            } else if (typeof item.date === 'string' && item.date.includes('-')) {
                const p = item.date.split(/[-/]/);
                if (p.length === 3) dObj = new Date(Date.UTC(p[0], p[1]-1, p[2]));
            } else { dObj = new Date(item.date); }
            if (dObj && !isNaN(dObj.getTime())) {
                const y = dObj.getUTCFullYear();
                const m = String(dObj.getUTCMonth() + 1).padStart(2, '0');
                const d = String(dObj.getUTCDate()).padStart(2, '0');
                item.date = `${y}-${m}-${d}`;
            }
            return item;
        });
        if (imported.length > 0) {
            const firstDateParts = String(imported[0].date).split(/[-/]/);
            if (firstDateParts.length === 3) {
                viewYear = parseInt(firstDateParts[0]);
                viewMonth = parseInt(firstDateParts[1]) - 1;
            }
            appData.push(...imported);
            await save();
        }
        updateWorkspaceUI();
        await switchWorkspace(newWs.id);
        closeWorkspaceModal();
        showToast(currentLang === 'kh' ? `បាននាំចូលគម្រោង "${projectName}" រួចរាល់!` : `Project "${projectName}" imported!`, "success");
    } catch (err) {
        if (err.name !== 'AbortError') console.error("Import failed:", err);
    }
}

async function exportCSV(isManual = false) {
    if (!ensureSecureContext(isManual)) return;
    try {
        const handle = await BridgeWorkDB.get("file_handles", "csvHandle_" + activeWorkspaceId);
        if (!handle) return;
        if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
            if (await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') return;
        }
        const workspaceData = appData.filter(d => (d.workspaceId || "default") === activeWorkspaceId);
        const cleanData = workspaceData.map(item => ({ Date: item.date, Task: item.task, Category: item.category, Quantity: item.quantity || 1, Hours: item.hours }));
        const worksheet = XLSX.utils.json_to_sheet(cleanData);
        const csvContent = "\ufeff" + XLSX.utils.sheet_to_csv(worksheet);
        const writable = await handle.createWritable();
        await writable.write(csvContent);
        await writable.close();
        if (isManual) showToast("CSV Sync complete", "success");
    } catch (err) {
        if (isManual) showToast("CSV Sync failed", "error");
        console.error("CSV Sync failed:", err);
    }
}

async function backupData() {
    const data = {
        app_data: await BridgeWorkDB.get("app_data", "main"),
        notes: await BridgeWorkDB.get("notes", "main"),
        todos: await BridgeWorkDB.get("todos", "main"),
        loans: await BridgeWorkDB.get("loans", "main"),
        expenses: await BridgeWorkDB.get("expenses", "main"),
        incomes: await BridgeWorkDB.get("incomes", "main"),
        workspaces: await BridgeWorkDB.get("workspaces", "main"),
        events: await BridgeWorkDB.get("events", "main"),
        settings: {
            userName: await BridgeWorkDB.get("settings", "userName"),
            userRole: await BridgeWorkDB.get("settings", "userRole"),
            darkMode: await BridgeWorkDB.get("settings", "darkMode"),
            lang: await BridgeWorkDB.get("settings", "lang"),
            limit: await BridgeWorkDB.get("settings", "limit"),
            prefs: await BridgeWorkDB.get("settings", "prefs"),
            coverPositions: await BridgeWorkDB.get("settings", "coverPositions")
        }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgework_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast(getTranslation('backup_success'), "success");
}

function stringifyPackageValue(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
}

function normalizePackageRows(rows, fallbackRow) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    const normalized = sourceRows.map(row => {
        if (!row || typeof row !== "object") return { Value: stringifyPackageValue(row) };
        return Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, stringifyPackageValue(value)])
        );
    });
    return normalized.length ? normalized : [fallbackRow];
}

function appendPackageSheet(workbook, sheetName, rows, fallbackRow) {
    const worksheet = XLSX.utils.json_to_sheet(normalizePackageRows(rows, fallbackRow));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

function appendPackageDataSheet(workbook, packageData) {
    const rows = [];
    Object.entries(packageData).forEach(([store, value]) => {
        if (Array.isArray(value)) {
            value.forEach(item => rows.push({ Store: store, Json: JSON.stringify(item) }));
        } else {
            rows.push({ Store: store, Json: JSON.stringify(value || {}) });
        }
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "PackageData");
}

function appendPackageBackupSheet(workbook, packageData) {
    const json = JSON.stringify(packageData);
    const chunkSize = 25000;
    const rows = [];
    for (let i = 0; i < json.length; i += chunkSize) {
        rows.push({ Part: rows.length + 1, JsonChunk: json.slice(i, i + chunkSize) });
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "BridgeWorkBackup");
}

async function exportPackage() {
    try {
        const workbook = XLSX.utils.book_new();
        const today = new Date().toISOString().split("T")[0];
        const packageData = {
            app_data: appData,
            notes: appNotes,
            todos: appTodos,
            loans: appLoans,
            incomes: appIncomes,
            expenses: appExpenses,
            events: appEvents,
            workspaces: workspaces,
            settings: {
                userName,
                userRole,
                darkMode: isDarkMode,
                lang: currentLang,
                limit: DAILY_HOUR_LIMIT,
                prefs: appPrefs,
                coverPositions: appCoverPositions,
                activeWorkspaceId
            }
        };
        const dashboardRows = appData.map(item => ({
            Date: item.date || "",
            WorkspaceId: item.workspaceId || "default",
            Workspace: getWorkspaceName(item.workspaceId || "default"),
            Task: item.task || "",
            Category: item.category || "",
            Quantity: item.quantity || 1,
            Hours: item.hours || 0,
            Image: item.image || "",
            SavedPath: item.savedPath || ""
        }));
        const noteRows = appNotes.map(note => ({
            ID: note.id || Date.now(),
            Date: note.date || "",
            Pinned: note.isPinned ? "Yes" : "No",
            Content: note.content || ""
        }));
        const taskRows = appTodos.map(task => ({
            ID: task.id || Date.now(),
            Date: task.date || "",
            WorkspaceId: task.workspaceId || "default",
            Workspace: getWorkspaceName(task.workspaceId || "default"),
            Title: task.title || task.text || "",
            Category: task.category || "",
            Status: task.status || (task.completed ? "done" : "backlog"),
            Completed: task.completed ? "Yes" : "No",
            Labels: (task.labels || []).join(", ")
        }));
        const workspaceRows = workspaces.map(workspace => ({
            ID: workspace.id,
            Name: workspace.name,
            PosterTarget: workspace.posterTarget || "",
            HoursTarget: workspace.hoursTarget || "",
            IncomeTarget: workspace.incomeTarget || "",
            Categories: (workspace.categories || []).join(", ")
        }));
        const settingsRows = [{
            UserName: userName,
            UserRole: userRole,
            Language: currentLang,
            Currency: appPrefs.currency,
            DarkMode: isDarkMode ? "Yes" : "No",
            ActiveWorkspaceId: activeWorkspaceId,
            ActiveWorkspace: getWorkspaceName(activeWorkspaceId),
            ExportedAt: new Date().toLocaleString()
        }];

        appendPackageSheet(workbook, "Dashboard", dashboardRows, { Message: "No dashboard entries" });
        appendPackageSheet(workbook, "Notes", noteRows, { Message: "No notes" });
        appendPackageSheet(workbook, "Tasks", taskRows, { Message: "No tasks" });
        appendPackageSheet(workbook, "Loans", appLoans, { Message: "No loans" });
        appendPackageSheet(workbook, "Income", appIncomes, { Message: "No income records" });
        appendPackageSheet(workbook, "Expenses", appExpenses, { Message: "No expense records" });
        appendPackageSheet(workbook, "Events", appEvents, { Message: "No calendar events" });
        appendPackageSheet(workbook, "Workspaces", workspaceRows, { Message: "No workspaces" });
        appendPackageSheet(workbook, "Settings", settingsRows, { Message: "No settings" });
        appendPackageBackupSheet(workbook, packageData);
        appendPackageDataSheet(workbook, packageData);

        XLSX.writeFile(workbook, `bridgework_package_${today}.xlsx`);
        showToast(getTranslation("package_export_success"), "success");
    } catch (err) {
        console.error("Package export failed:", err);
        showToast(getTranslation("package_export_error"), "error");
    }
}

window.exportPackage = exportPackage;

function parsePackageValue(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return fallback;
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                return JSON.parse(trimmed);
            } catch {
                return value;
            }
        }
    }
    return value;
}

function readPackageSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" }).filter(row => !row.Message);
}

function parsePackageList(value) {
    const parsed = parsePackageValue(value, []);
    if (Array.isArray(parsed)) return parsed;
    if (!parsed) return [];
    return String(parsed).split(",").map(item => item.trim()).filter(Boolean);
}

function parsePackageBoolean(value) {
    return String(value || "").toLowerCase() === "yes" || value === true;
}

function readInternalPackageData(workbook) {
    const rows = readPackageSheet(workbook, "PackageData");
    if (!rows.length) return null;
    return rows.reduce((data, row) => {
        const store = row.Store;
        if (!store) return data;
        const parsed = parsePackageValue(row.Json, {});
        if (store === "settings") {
            data.settings = parsed || {};
        } else {
            if (!Array.isArray(data[store])) data[store] = [];
            data[store].push(parsed);
        }
        return data;
    }, {});
}

function readChunkedPackageBackup(workbook) {
    const rows = readPackageSheet(workbook, "BridgeWorkBackup");
    if (!rows.length) return null;
    const json = rows
        .sort((a, b) => Number(a.Part || 0) - Number(b.Part || 0))
        .map(row => row.JsonChunk || "")
        .join("");
    try {
        const data = JSON.parse(json);
        return data && typeof data === "object" ? data : null;
    } catch (err) {
        console.warn("Chunked package backup could not be parsed:", err);
        return null;
    }
}

function hasUsablePackageData(packageData) {
    if (!packageData || typeof packageData !== "object") return false;
    const stores = ["app_data", "notes", "todos", "loans", "incomes", "expenses", "events", "workspaces"];
    return stores.some(store => Array.isArray(packageData[store]) && packageData[store].some(item => item && typeof item === "object"));
}

async function applyPackageData(packageData, fallbackSettings = {}) {
    const settings = packageData.settings || {};
    const prefs = settings.prefs || (fallbackSettings.Currency ? { ...appPrefs, currency: fallbackSettings.Currency } : appPrefs);

    const cleanRows = (rows) => Array.isArray(rows) ? rows.filter(row => row && typeof row === "object" && !Array.isArray(row)) : [];
    const importedWorkspaces = cleanRows(packageData.workspaces);
    const importedAppData = cleanRows(packageData.app_data);
    const importedNotes = cleanRows(packageData.notes);
    const importedTodos = cleanRows(packageData.todos);
    const importedLoans = cleanRows(packageData.loans);
    const importedIncomes = cleanRows(packageData.incomes);
    const importedExpenses = cleanRows(packageData.expenses);
    const importedEvents = cleanRows(packageData.events);
    const importedWorkspaceList = importedWorkspaces.length ? importedWorkspaces : workspaces;
    const importedUserName = settings.userName || fallbackSettings.UserName || userName;
    const importedUserRole = settings.userRole || fallbackSettings.UserRole || userRole;
    const importedDarkMode = settings.darkMode !== undefined ? settings.darkMode : isDarkMode;
    const importedLang = settings.lang || fallbackSettings.Language || currentLang;
    const importedLimit = settings.limit || DAILY_HOUR_LIMIT;
    const importedCoverPositions = settings.coverPositions || appCoverPositions || {};
    const importedActiveWorkspaceId = settings.activeWorkspaceId || fallbackSettings.ActiveWorkspaceId || activeWorkspaceId;

    await BridgeWorkDB.set("app_data", "main", importedAppData);
    await BridgeWorkDB.set("notes", "main", importedNotes);
    await BridgeWorkDB.set("todos", "main", importedTodos);
    await BridgeWorkDB.set("loans", "main", importedLoans);
    await BridgeWorkDB.set("incomes", "main", importedIncomes);
    await BridgeWorkDB.set("expenses", "main", importedExpenses);
    await BridgeWorkDB.set("events", "main", importedEvents);
    await BridgeWorkDB.set("workspaces", "main", importedWorkspaceList);
    await BridgeWorkDB.set("settings", "prefs", prefs);
    await BridgeWorkDB.set("settings", "userName", importedUserName);
    await BridgeWorkDB.set("settings", "userRole", importedUserRole);
    await BridgeWorkDB.set("settings", "darkMode", importedDarkMode);
    await BridgeWorkDB.set("settings", "lang", importedLang);
    await BridgeWorkDB.set("settings", "limit", importedLimit);
    await BridgeWorkDB.set("settings", "coverPositions", importedCoverPositions);
    await BridgeWorkDB.set("settings", "activeWorkspaceId", importedActiveWorkspaceId);

    appData = importedAppData;
    appNotes = importedNotes;
    appTodos = importedTodos;
    appLoans = importedLoans;
    appIncomes = importedIncomes;
    appExpenses = importedExpenses;
    appEvents = importedEvents;
    workspaces = importedWorkspaceList;
    userName = importedUserName;
    userRole = importedUserRole;
    isDarkMode = importedDarkMode;
    currentLang = importedLang;
    DAILY_HOUR_LIMIT = importedLimit;
    appCoverPositions = importedCoverPositions;
    appPrefs = { ...appPrefs, ...prefs };
    activeWorkspaceId = importedWorkspaceList.some(ws => String(ws.id) === String(importedActiveWorkspaceId))
        ? importedActiveWorkspaceId
        : ((importedWorkspaceList[0] && importedWorkspaceList[0].id) || "default");
    currentWorkspace = importedWorkspaceList.find(ws => String(ws.id) === String(activeWorkspaceId)) || importedWorkspaceList[0];
    appCategories = currentWorkspace?.categories || [];
}

function refreshAfterPackageLoad() {
    if (typeof updateWorkspaceSelector === "function") updateWorkspaceSelector();
    if (typeof updateTodoWorkspaceSelector === "function") updateTodoWorkspaceSelector();
    if (typeof render === "function") render();
    if (typeof renderNotes === "function") renderNotes();
    if (typeof renderTodos === "function") renderTodos();
    if (typeof renderLoans === "function") renderLoans();
    if (typeof renderIncomes === "function") renderIncomes();
    if (typeof renderExpenses === "function") renderExpenses();
    if (typeof updateProfileUI === "function") updateProfileUI();
}

async function loadPackage(input) {
    const file = input.files[0];
    input.value = "";
    if (!file) return;
    if (!confirm(t[currentLang].alert_restore_confirm)) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const workbook = XLSX.read(e.target.result, { type: "array" });
            const chunkedPackageData = readChunkedPackageBackup(workbook);
            const internalPackageData = hasUsablePackageData(chunkedPackageData) ? chunkedPackageData : readInternalPackageData(workbook);
            if (hasUsablePackageData(internalPackageData)) {
                const settings = readPackageSheet(workbook, "Settings")[0] || {};
                await applyPackageData(internalPackageData, settings);
                refreshAfterPackageLoad();
                showToast(getTranslation("package_load_success"), "success");
                setTimeout(() => window.location.reload(), 1500);
                return;
            }

            const importedWorkspaces = readPackageSheet(workbook, "Workspaces").map(row => ({
                id: String(row.ID || row.Id || row.id || Date.now()),
                name: row.Name || "Imported Project",
                posterTarget: Number(row.PosterTarget || 30),
                hoursTarget: Number(row.HoursTarget || 100),
                incomeTarget: Number(row.IncomeTarget || 1000),
                categories: parsePackageList(row.Categories)
            }));
            const workspaceList = importedWorkspaces.length ? importedWorkspaces : workspaces;
            const workspaceNameMap = workspaceList.reduce((map, workspace) => {
                map[String(workspace.name)] = String(workspace.id);
                return map;
            }, {});
            const resolveWorkspaceId = (row) => String(row.WorkspaceId || workspaceNameMap[row.Workspace] || "default");

            const importedData = readPackageSheet(workbook, "Dashboard").map(row => ({
                date: row.Date || "",
                workspaceId: resolveWorkspaceId(row),
                task: row.Task || "",
                category: row.Category || "",
                quantity: Number(row.Quantity || 1),
                hours: Number(row.Hours || 0),
                image: row.Image || null,
                savedPath: row.SavedPath || null
            })).filter(item => item.date || item.task);
            const importedNotes = readPackageSheet(workbook, "Notes").map(row => ({
                id: Number(row.ID || Date.now() + Math.random()),
                date: row.Date || "",
                isPinned: parsePackageBoolean(row.Pinned),
                content: row.Content || ""
            })).filter(note => note.content);
            const importedTodos = readPackageSheet(workbook, "Tasks").map(row => ({
                id: Number(row.ID || Date.now() + Math.random()),
                date: row.Date || new Date().toISOString().split("T")[0],
                workspaceId: resolveWorkspaceId(row),
                title: row.Title || "",
                text: row.Title || "",
                category: row.Category || "",
                status: row.Status || "backlog",
                completed: parsePackageBoolean(row.Completed) || row.Status === "done",
                labels: parsePackageList(row.Labels),
                initials: userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "??"
            })).filter(task => task.title || task.text);

            const settings = readPackageSheet(workbook, "Settings")[0] || {};
            const importedPrefs = { ...appPrefs };
            if (settings.Currency) importedPrefs.currency = settings.Currency;

            await applyPackageData({
                app_data: importedData,
                notes: importedNotes,
                todos: importedTodos,
                loans: readPackageSheet(workbook, "Loans").map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, parsePackageValue(value)]))),
                incomes: readPackageSheet(workbook, "Income").map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, parsePackageValue(value)]))),
                expenses: readPackageSheet(workbook, "Expenses").map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, parsePackageValue(value)]))),
                events: readPackageSheet(workbook, "Events").map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, parsePackageValue(value)]))),
                workspaces: workspaceList,
                settings: { prefs: importedPrefs }
            }, settings);

            refreshAfterPackageLoad();
            showToast(getTranslation("package_load_success"), "success");
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.error("Package load failed:", err);
            showToast(getTranslation("package_load_error"), "error");
        }
    };
    reader.readAsArrayBuffer(file);
}

window.loadPackage = loadPackage;

async function restoreData(input) {
    const file = input.files[0];
    if (!file) return;
    if (!confirm(t[currentLang].alert_restore_confirm)) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            for (const store in data) {
                if (store === 'settings') {
                    for (const key in data.settings) {
                        await BridgeWorkDB.set("settings", key, data.settings[key]);
                    }
                } else {
                    await BridgeWorkDB.set(store, "main", data[store]);
                }
            }
            showToast(getTranslation('restore_success'), "success");
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            showToast(getTranslation('restore_error'), "error");
        }
    };
    reader.readAsText(file);
}

async function resetAllSettings() {
    if (!confirm(t[currentLang].alert_clear)) return;
    await BridgeWorkDB.delete("settings", "prefs");
    await BridgeWorkDB.delete("settings", "limit");
    await BridgeWorkDB.delete("settings", "lang");
    showToast(getTranslation('reset_success'), "info");
    setTimeout(() => window.location.reload(), 1000);
}

function updateToolTickerMessage(view, message) {
    if (!appPrefs.toolMessages) appPrefs.toolMessages = {};
    appPrefs.toolMessages[view] = message;
    savePrefs();
    render();
}

function applyModuleVisibility() {
    const expenseLink = document.querySelector('a[onclick="showView(\'expense\')"]');
    const loanLink = document.querySelector('a[onclick="showView(\'loan\')"]');
    const todoLink = document.querySelector('a[onclick="showView(\'todo\')"]');
    const incomeLink = document.querySelector('a[onclick="showView(\'income\')"]');
    if (loanLink) loanLink.style.display = appPrefs.showLoan ? 'flex' : 'none';
    if (todoLink) todoLink.style.display = appPrefs.showTodo ? 'flex' : 'none';
    if (incomeLink) incomeLink.style.display = appPrefs.showIncome ? 'flex' : 'none';
    if (expenseLink) expenseLink.style.display = appPrefs.showExpenses ? 'flex' : 'none';
}
