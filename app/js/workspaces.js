// ===== WORKSPACE MANAGEMENT =====
async function switchWorkspace(id) {
    activeWorkspaceId = id;
    await BridgeWorkDB.set("settings", "activeWorkspaceId", id);
    
    currentWorkspace = workspaces.find(w => w.id === id);
    appCategories = currentWorkspace.categories;
    populateCategorySelect();
    
    clearSearchInput();

    const wsData = appData.filter(d => String(d.workspaceId || "default") === String(id));
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
    updateWorkspaceUI();
    showToast(`Switched to ${currentWorkspace.name}`, "info");
}

function updateTodoWorkspaceSelector() {
    const sel = document.getElementById("todoWorkspaceSelect");
    if (!sel) return;
    sel.innerHTML = workspaces.map(ws => 
        `<option value="${ws.id}" ${ws.id === activeWorkspaceId ? 'selected' : ''}>${ws.name}</option>`
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
        name: name,
        posterTarget: parseFloat(document.getElementById("newWsPoster").value) || DEFAULT_POSTER_TARGET,
        hoursTarget: parseFloat(document.getElementById("newWsHours").value) || DEFAULT_HOURS_TARGET,
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
    if (csvEl) {
        const handle = await BridgeWorkDB.get("file_handles", "csvHandle_" + activeWorkspaceId);
        if (handle) {
            csvEl.textContent = (currentLang === 'kh' ? "ភ្ជាប់រួច: " : "Linked: ") + handle.name;
            csvEl.classList.add("status-active");
        } else {
            csvEl.textContent = "";
            csvEl.classList.remove("status-active");
        }
    }
}

async function linkCSV() {
    if (!ensureSecureContext(true)) return;
    try {
        const handleKey = "csvHandle_" + activeWorkspaceId;
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }],
            multiple: false
        });
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
            const firstDateParts = String(imported[0].date).split('-');
            if (firstDateParts.length === 3) {
                viewYear = parseInt(firstDateParts[0]);
                viewMonth = parseInt(firstDateParts[1]) - 1;
            }
            
            appData = appData.filter(d => (d.workspaceId || "default") !== activeWorkspaceId);
            appData.push(...imported); await save(); render();
        }
        showToast(currentLang === 'kh' ? "បានភ្ជាប់ និងទាញយកទិន្នន័យរួចរាល់" : "CSV Linked and imported!", "success");
    } catch (err) { if (err.name !== 'AbortError') console.error(err); }
}

async function importProjectFromCSV() {
    if (!ensureSecureContext(true)) return;
    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }],
            multiple: false
        });
        if (!handle) return;
        const file = await handle.getFile();
        const projectName = file.name.replace(/\.[^/.]+$/, "");
        
        const newWs = {
            id: "ws_" + Date.now(),
            name: projectName,
            posterTarget: 30,
            hoursTarget: 100,
            categories: [...DEFAULT_CATEGORIES]
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
            appData.push(...imported); await save(); 
        }

        updateWorkspaceUI();
        await switchWorkspace(newWs.id);
        closeWorkspaceModal();
        showToast(currentLang === 'kh' ? `បាននាំចូលគម្រោង "${projectName}" រួចរាល់!` : `Project "${projectName}" imported!`, "success");
    } catch (err) { if (err.name !== 'AbortError') console.error("Import failed:", err); }
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
        const cleanData = workspaceData.map(item => ({
            Date: item.date,
            Task: item.task,
            Category: item.category,
            Quantity: item.quantity || 1,
            Hours: item.hours
        }));
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
