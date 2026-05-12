// App.js is now the remaining legacy entry file. Most app state, initialization, UI helpers, help content, notes, and task logic moved into js/state.js, js/init.js, js/ui.js, and js/tasks.js.

// Branding, help, workspaces and file sync / CSV logic moved into module files (js/branding.js, js/help.js, js/workspaces.js)

// ===== SAVE =====
async function save() {
    await BridgeWorkDB.set("app_data", "main", appData);
}

// Stale workspace/help/file sync code removed; logic now lives in js/workspaces.js and js/help.js.

// ===== LANGUAGE SWITCHER =====
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
}

// ===== TOAST NOTIFICATION =====
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

// Helper to get the current month/year state for a given view
function getCurrentViewMonthYear(viewName) {
    if (viewName === 'dashboard') return { month: dashboardMonthState, year: dashboardYearState };
    if (viewName === 'income') return { month: incomeMonthState, year: incomeYearState };
    if (viewName === 'expense') return { month: expenseMonthState, year: expenseYearState };
    return { month: new Date().getMonth(), year: new Date().getFullYear() }; // Fallback
}

// ===== NAVIGATION =====
function showView(viewName) {
    // Prevent access to Eagle Gallery - Coming Soon
    if (viewName === 'eagleGallery') {
        showToast('Eagle Assets feature is coming soon!', 'info');
        return;
    }

    currentView = viewName;
    const dashboardView = document.getElementById("dashboardView");
    const reportsView = document.getElementById("reportsView");
    const notesView = document.getElementById("notesView");
    const todoView = document.getElementById("todoView");
    const kanbanView = document.getElementById("kanbanView");
    const mainHeaderPanel = document.getElementById("mainHeaderPanel");
    const loanView = document.getElementById("loanView");
    const incomeView = document.getElementById("incomeView");
    const expenseView = document.getElementById("expenseView");
    const ticker = document.querySelector(".ticker-wrap");
    const eagleGalleryView = document.getElementById("eagleGalleryView");
    const chatbotView = document.getElementById("chatbotView");
    const homeView = document.getElementById("homeView");
    const reportControls = document.getElementById("reportControls"); // This contains month navigation

    // 1. Save current view's month/year state before switching
    if (currentView === 'dashboard') { dashboardMonthState = viewMonth; dashboardYearState = viewYear; }
    else if (currentView === 'income') { incomeMonthState = viewMonth; incomeYearState = viewYear; }
    else if (currentView === 'expense') { expenseMonthState = viewMonth; expenseYearState = viewYear; }

    // 2. Update currentView
    currentView = viewName;

    // 3. Load new view's month/year state into global viewMonth/viewYear
    const newViewDateState = getCurrentViewMonthYear(currentView);
    viewMonth = newViewDateState.month;
    viewYear = newViewDateState.year;
    
    // Hierarchy: Dashboard shows both stats and the recent entries table
    if (dashboardView) dashboardView.style.display = (viewName === 'dashboard') ? 'block' : 'none';
    if (reportsView) reportsView.style.display = (viewName === 'dashboard') ? 'block' : 'none';
    if (notesView) notesView.style.display = (viewName === 'notes') ? 'block' : 'none';
    if (eagleGalleryView) eagleGalleryView.style.display = (viewName === 'eagleGallery') ? 'block' : 'none';
    if (document.getElementById("helpModal")) document.getElementById("helpModal").style.display = 'none'; // Close help modal if open
    if (todoView) todoView.style.display = (viewName === 'todo') ? 'block' : 'none';
    if (kanbanView) kanbanView.style.display = (viewName === 'kanban') ? 'block' : 'none';
    if (loanView) loanView.style.display = (viewName === 'loan') ? 'block' : 'none';
    if (incomeView) incomeView.style.display = (viewName === 'income') ? 'block' : 'none';
    // New: Expense View
    if (expenseView) expenseView.style.display = (viewName === 'expense') ? 'block' : 'none';
    // AI Chatbot View
    if (chatbotView) chatbotView.style.display = (viewName === 'chatbot') ? 'block' : 'none';
    // Home View
    if (homeView) { 
        homeView.style.display = (viewName === 'home') ? 'block' : 'none';
        if (viewName === 'home') {
            updateGreetingText();
            updateDateTimeText();
        }
    }

    // Show date navigation for views that depend on monthly reporting (Dashboard, Income, Expense)
    if (reportControls) {
        const monthlyViews = ['dashboard', 'income', 'expense'];
        reportControls.style.display = monthlyViews.includes(viewName) ? 'flex' : 'none';
    }
    
    // Update Sidebar Active State
    document.querySelectorAll(".sidebar a").forEach(link => {
        const view = link.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
        link.classList.toggle("active", view === viewName);
    });
    document.querySelectorAll(".mobile-nav button").forEach(btn => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        btn.classList.toggle("active", onclickAttr.includes(`'${viewName}'`));
    });

    if (viewName === 'kanban') renderKanbanBoard();
    if (viewName === 'loan') renderLoans(); // New: Render loans when switching to loan view
    if (viewName === 'income') renderIncomes(); // New: Render incomes
    if (viewName === 'expense') renderExpenses(); // Render expenses
    if (viewName === 'eagleGallery') renderEagleGallery();
    
    triggerStagger();
    render();
    updateMonthDisplay(); // Update month display in header
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    BridgeWorkDB.set("settings", "darkMode", isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    updateThemeUI();
}

function updateThemeUI() {
    const btn = document.getElementById("darkToggle");
    if (btn) {
        btn.innerHTML = isDarkMode 
            ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark Mode' 
            : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Light Mode';
    }
}

// Help functionality now lives in js/help.js

// ===== NOTES LOGIC =====
async function saveNotes() {
    await BridgeWorkDB.set("notes", "main", appNotes);
}

function addNote() {
    const input = document.getElementById("noteInput");
    const val = input.value.trim();
    if (!val) return;
    
    const newNote = {
        id: Date.now(),
        content: val,
        isPinned: false,
        date: new Date().toLocaleString(currentLang === 'kh' ? 'km-KH' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
    };
    
    appNotes.unshift(newNote);
    input.value = "";
    saveNotes();
    renderNotes();
    showToast(currentLang === 'kh' ? "បានរក្សាទុកកំណត់ត្រា" : "Note saved!", "success");
}

function togglePin(id) {
    const note = appNotes.find(n => n.id === id);
    if (note) {
        note.isPinned = !note.isPinned;
        saveNotes();
        renderNotes();
    }
}

function deleteNote(id) {
    appNotes = appNotes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
}

function handleNoteSearch(val) {
    noteSearchQuery = val.toLowerCase();
    renderNotes();
}

function parseSmartContent(text, noteId) {
    // Safe highlighting for values, URLs, and Prices
    const highlight = (str) => {
        if (!str) return "";
        return str
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="note-link">$1</a>')
            .replace(/\b(KPI|\d+(\.\d+)?pt|\d+\/month|\d+%)\b/gi, '<span class="highlight-val">$1</span>')
            .replace(/(\$\d+(?:\.\d+)?|\d+(?:\.\d+)?\$)/g, '<span class="highlight-price">$1</span>');
    };

    let lines = text.split('\n');
    return lines.map(line => {
        line = line.trim();
        if (!line) return '<br>';
        
        if (line.endsWith(':')) return `<div class="note-section-header">${highlight(line)}</div>`;
        
        if (line.startsWith('-') || line.startsWith('*')) {
            let content = line.substring(1).trim();
            return `<div class="note-todo-item"><span class="bullet">○</span><span class="todo-text">${highlight(content)}</span><button class="btn-tiny-add" onclick="convertNoteToTodo('${content.replace(/'/g, "\\'")}')" title="Add to To-Do List"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg></button></div>`;
        }
        
        return `<div class="note-text-line">${highlight(line)}</div>`;
    }).join('');
}

async function convertNoteToTodo(content) {
    document.getElementById('todoInput').value = content;
    addTodo();
    // Switch to todo view to show the result
    showView('todo');
    showToast("Converted from note!", "success");
}

function renderNotes() {
    const grid = document.getElementById("notesGrid");
    if (!grid) return;

    // Filter by search and Sort: Pinned first
    const filtered = appNotes.filter(n => n.content.toLowerCase().includes(noteSearchQuery || ""));
    const sortedNotes = filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    if (sortedNotes.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted)">No notes found matching your search.</div>`;
        return;
    }

    grid.innerHTML = sortedNotes.map(n => {
        const isKPI = n.content.toUpperCase().includes("KPI");
        return `
        <div class="note-sticky ${n.isPinned ? 'pinned' : ''} ${isKPI ? 'is-kpi' : ''}">
            <div class="note-card-header">
                <div class="note-date">${n.date}</div>
                <div class="note-actions">
                    <button class="note-star" onclick="togglePin(${n.id})" title="Pin note">${n.isPinned ? '★' : '☆'}</button>
                    <button class="note-delete" onclick="deleteNote(${n.id})">✕</button>
                </div>
            </div>
            ${isKPI ? '<div class="kpi-badge">GOALS & PERFORMANCE</div>' : ''}
            <div class="note-content">${parseSmartContent(n.content, n.id)}</div>
        </div>
    `}).join('');
}

// ===== TODO LOGIC =====
async function saveTodos() {
    await BridgeWorkDB.set("todos", "main", appTodos);
}

function addTodo() {
    const input = document.getElementById("todoInput");
    const wsSelect = document.getElementById("todoWorkspaceSelect");
    const btn = document.querySelector("#todoView .todo-input-group .btn-primary");
    const val = input.value.trim();
    if (!val) return;
    
    if (currentTodoId) {
        const todo = appTodos.find(t => t.id === currentTodoId);
        if (todo) {
            todo.title = val;
            todo.text = val;
            todo.workspaceId = wsSelect ? wsSelect.value : activeWorkspaceId;
            if (val.startsWith('!')) {
                if (!todo.labels.includes('Urgent')) todo.labels.push('Urgent');
            } else {
                todo.labels = todo.labels.filter(l => l !== 'Urgent');
            }
            showToast(currentLang === 'kh' ? "បានកែប្រែការងារ" : "Task updated!", "success");
        }
        currentTodoId = null;
        if (btn) btn.textContent = t[currentLang].settings_add;
    } else {
        const newTodo = {
            id: Date.now(),
            title: val,
            text: val, // Compatibility fallback
            completed: false,
            status: 'backlog', // Initialize for Kanban
            date: new Date().toISOString().split('T')[0], // Standard YYYY-MM-DD
            labels: val.startsWith('!') ? ['Urgent'] : [], // Start with empty labels, add 'Feature' if needed
            workspaceId: wsSelect ? wsSelect.value : activeWorkspaceId, // Link to the selected workspace
            initials: (userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : '??')
        };
        appTodos.unshift(newTodo);
        showToast(currentLang === 'kh' ? "បានបន្ថែមការងារថ្មី" : "Task added!", "success");
    }

    input.value = "";
    saveTodos();
    renderTodos();
}

function editTodo(id) {
    const todo = appTodos.find(t => t.id === id);
    if (!todo) return;

    currentTodoId = id;
    const input = document.getElementById("todoInput");
    const wsSelect = document.getElementById("todoWorkspaceSelect");
    const btn = document.querySelector("#todoView .todo-input-group .btn-primary");

    input.value = todo.title || todo.text;
    if (wsSelect) wsSelect.value = todo.workspaceId;
    if (btn) btn.textContent = t[currentLang].btn_update;
    
    input.focus();
    // Scroll to input if needed
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function cycleTodoStatus(id) {
    const todo = appTodos.find(t => t.id === id);
    if (todo) {
        const sequence = ['backlog', 'in-progress', 'review', 'done'];
        let currentIndex = sequence.indexOf(todo.status || 'backlog');
        let nextIndex = (currentIndex + 1) % sequence.length;
        
        todo.status = sequence[nextIndex];
        todo.completed = (todo.status === 'done');

        // Link to Dashboard: If task is now "done", offer to add as Work Entry
        if (todo.status === 'done') {
            const confirmLog = confirm(currentLang === 'kh' 
                ? `ការងារនេះរួចរាល់ហើយ! ចង់បញ្ជូនទៅកាន់ Dashboard របស់គម្រោង ${getWorkspaceName(todo.workspaceId)} ដែរឬទេ?`
                : `Task finished! Would you like to log this as a completed item in the ${getWorkspaceName(todo.workspaceId)} Dashboard?`);
            
            if (confirmLog) {
                await logTodoToWork(todo);
            }
        }

        saveTodos();
        renderTodos();
    }
}

async function logTodoToWork(todo) {
    const entry = {
        date: new Date().toISOString().split('T')[0],
        task: todo.title || todo.text,
        category: appCategories[0], // Default category
        hours: DAILY_HOUR_LIMIT, 
        quantity: 1,
        image: null,
        workspaceId: todo.workspaceId
    };
    
    appData.push(entry);
    await save();
    showToast("Dashboard Updated!", "success");
    render();
}

function toggleTodo(id) {
    const todo = appTodos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        todo.status = todo.completed ? 'done' : 'backlog';
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    appTodos = appTodos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

function updateSidebarBadges() {
    const badge = document.getElementById("todoBadge");
    if (!badge) return;
    const remaining = appTodos.filter(t => !t.completed).length;
    badge.textContent = remaining > 0 ? remaining : "";
    badge.style.display = remaining > 0 ? "flex" : "none";
}

function renderTodos() {
    const list = document.getElementById("todoList");
    if (!list) return;

    // Filter todos by active workspace
    const filteredTodos = appTodos.filter(t => String(t.workspaceId || "default") === String(activeWorkspaceId));
    
    const total = filteredTodos.length;
    const completed = filteredTodos.filter(t => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Smart Holiday Suggestions
    const today = new Date();
    const upcomingHolidays = [];
    for (let i = 0; i <= 10; i++) { // Look 10 days ahead
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        if (khmerHolidays[dateStr]) {
            const hName = khmerHolidays[dateStr][currentLang];
            // Check if we already have a task for this holiday
            const alreadyDone = appData.some(item => 
                String(item.workspaceId || "default") === String(activeWorkspaceId) &&
                String(item.task || "").toLowerCase().includes(hName.toLowerCase())
            );
            if (!alreadyDone) upcomingHolidays.push({ name: hName, date: dateStr, daysLeft: i });
        }
    }

    const renderHolidaySuggestion = h => `
        <div class="todo-item todo-suggestion">
            <div class="icon-box">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div style="flex:1">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${h.name} Poster</div>
                <div style="font-size: 11px; color: #c2410c; font-weight: 700; margin-top: 4px;">${h.daysLeft === 0 ? 'TODAY' : h.daysLeft + ' days remaining'}</div>
            </div>
            <button class="btn btn-primary" onclick="document.getElementById('todoInput').value='Design ${h.name} Poster'; addTodo();">Add Task</button>
        </div>
    `;

    if (filteredTodos.length === 0) {
        list.innerHTML = `
            <div class="todo-header-area">
                <div class="todo-title-row">
                    <div>
                        <h2>To-Do List</h2>
                        <p style="font-size:11px; color:var(--text-muted); margin:4px 0 0 0">Productivity & Daily Priorities</p>
                    </div>
                    <div class="todo-stats-text">0/0 completed (0%)</div>
                </div>
                <div class="todo-progress-bg">
                    <div class="todo-progress-fill" style="width: 0%"></div>
                </div>
            </div>
            ${upcomingHolidays.map(renderHolidaySuggestion).join('')}
            <div class="empty-state">${t[currentLang].todo_empty}</div>
        `;
    } else {
        const todayCheck = new Date(); // For overdue check
        todayCheck.setHours(0, 0, 0, 0);
        const todayStr = todayCheck.toISOString().split('T')[0];

        let html = `
            <div class="todo-header-area">
                <div class="todo-title-row">
                    <div>
                        <h2>${currentLang === 'kh' ? 'បញ្ជីការងារត្រូវធ្វើ' : 'To-Do List'}</h2>
                        <p style="font-size:11px; color:var(--text-muted); margin:4px 0 0 0">✦ ${currentLang === 'kh' ? 'ផលិតភាព និងអាទិភាពប្រចាំថ្ងៃ' : 'Productivity & Daily Priorities'}</p>
                    </div>
                    <div class="todo-stats-text">${completed}/${total} ${currentLang === 'kh' ? 'រួចរាល់' : 'completed'} (${pct}%)</div>
                </div>
                <div class="todo-progress-bg">
                    <div class="todo-progress-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;

        // Render Smart Suggestions first
        upcomingHolidays.forEach(h => {
            html += renderHolidaySuggestion(h);
        });

        const statusLabels = {
            backlog: { en: 'Draft', kh: 'ព្រាង', class: '' },
            'in-progress': { en: 'In Progress', kh: 'កំពុងធ្វើ', class: 'badge-orange' },
            review: { en: 'Review', kh: 'ពិនិត្យ', class: 'badge-purple' },
            done: { en: 'Done', kh: 'រួចរាល់', class: 'badge-blue' }
        };

        const sections = {
            backlog: [],
            'in-progress': [],
            review: [],
            done: []
        };

        [...filteredTodos].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return b.id - a.id;
        }).forEach(task => {
            const key = statusLabels[task.status] ? task.status : 'backlog';
            sections[key].push(task);
        });

        const renderTask = task => {
            const cleanText = task.text.replace(/^!\s*/, '');
            const taskDate = new Date(task.date);
            const isOverdue = !task.completed && taskDate < todayCheck && task.date !== todayStr;
            

            const currentStatus = statusLabels[task.status] || statusLabels.backlog;

            // Check if task.labels contains 'Urgent'
            const isHigh = task.labels?.includes('Urgent') || task.text.startsWith("!");

            return `
                <div class="todo-item ${task.completed ? 'done' : ''} ${isHigh ? 'priority-high' : ''}">
                    <div class="todo-status-pill ${currentStatus.class}" onclick="cycleTodoStatus(${task.id})" style="cursor:pointer; min-width: 80px; text-align: center; font-size: 9px; padding: 4px 8px; border-radius: 8px; font-weight: 800; border: 1px solid var(--border-color);">
                        ${currentStatus[currentLang]}
                    </div>
                    <div class="todo-text">
                        ${cleanText}
                        <div style="font-size: 9px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-top: 2px;">
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align: middle; margin-right: 2px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            ${getWorkspaceName(task.workspaceId)}
                        </div>
                    </div>
                    ${isHigh ? `<span class="priority-badge">${currentLang === 'kh' ? 'បន្ទាន់' : 'URGENT'}</span>` : ''}
                    ${isOverdue ? `<span class="priority-badge" style="background:#f59e0b">${currentLang === 'kh' ? 'ហួសកំណត់' : 'OVERDUE'}</span>` : ''}
                    <div style="display:flex; gap:4px">
                        <button class="del-btn" onclick="editTodo(${task.id})" title="Edit task"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="todo-del" onclick="deleteTodo(${task.id})" title="Delete task">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        };

        const renderSection = (statusKey, title, tasks) => {
            if (!tasks.length) return '';
            return `
                <div class="todo-section">
                    <div class="todo-section-header">
                        <span>${title}</span>
                        <span>${tasks.length}</span>
                    </div>
                    ${tasks.map(renderTask).join('')}
                </div>
            `;
        };

        html += renderSection('backlog', statusLabels.backlog[currentLang], sections.backlog);
        html += renderSection('in-progress', statusLabels['in-progress'][currentLang], sections['in-progress']);
        html += renderSection('review', statusLabels.review[currentLang], sections.review);
        html += renderSection('done', statusLabels.done[currentLang], sections.done);

        list.innerHTML = html;
    }
    updateSidebarBadges();
}

// ===== EAGLE ASSETS LOGIC =====
async function refreshEagleAssets() {
    showToast('Eagle Assets feature is coming soon!', 'info');
}

function renderEagleGallery() {
    const grid = document.getElementById("eagleGalleryGrid");
    if (!grid) return;

    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
        <h3 style="margin-bottom: 10px; color: var(--primary);">Coming Soon</h3>
        <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">
            The Eagle Assets integration feature is currently under development. 
            Stay tuned for updates!
        </p>
    </div>`;
}

// ===== KANBAN BOARD LOGIC =====
async function renderKanbanBoard() {
    const board = document.getElementById("kanbanBoard");
    if (!board) return;

    const statuses = [
        { id: 'backlog', label: 'BACKLOG' }, // Corresponds to 'Draft' or 'Pending'
        { id: 'in-progress', label: 'IN PROGRESS' },
        { id: 'review', label: 'REVIEW' },
        { id: 'done', label: 'DONE' }
    ];

    board.innerHTML = statuses.map(status => {
        const tasks = appTodos.filter(t => {
            // Filter by active workspace and then by status
            const taskStatus = t.status || (t.completed ? 'done' : 'backlog');
            return t.workspaceId === activeWorkspaceId && taskStatus === status.id;
        });

        return `
            <div class="kanban-column" data-status="${status.id}">
                <div class="kanban-column-header">
                    <h3 style="letter-spacing: 1.5px; font-weight: 800;">${status.label}</h3>
                    <span class="kanban-column-count">${tasks.length}</span>
                </div>
                <div class="kanban-cards">
                    ${tasks.map(task => renderKanbanCard(task)).sort((a,b) => b.id - a.id).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    initDragAndDrop();
}

function renderKanbanCard(task) {
    // Data Structure Assumption: title, date, labels, initials
    const title = task.title || task.text || "Untitled Task";
    const date = task.date || "No Date";
    const labels = task.labels || (task.text && task.text.startsWith('!') ? ['Urgent'] : ['Feature']);
    // Use the initials from the current user, or the task's assigned initials if available
    const initials = task.initials || (userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : '??'); 
    const displayDate = date.includes('-') ? formatDisplayDate(date) : date;

    return `
        <div class="kanban-card" draggable="true" id="todo-${task.id}">
            <div class="kanban-card-labels">
                ${labels.map(l => `<span class="kanban-label label-${l.toLowerCase()}">${l}</span>`).join('')}
            </div>
            <div class="kanban-card-title">
                ${title}
                <span class="kanban-project-name">${getWorkspaceName(task.workspaceId)}</span>
            </div>
            <div class="kanban-card-footer">
                <div class="kanban-card-date">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style="margin-left: 4px;">${displayDate}</span>
                </div>
                <div class="kanban-card-avatar" title="${userName}">${initials}</div>
            </div>
        </div>
    `;
}

function initDragAndDrop() {
    const cards = document.querySelectorAll(".kanban-card");
    const columns = document.querySelectorAll(".kanban-column");

    cards.forEach(card => {
        card.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", e.target.id);
            e.target.classList.add("dragging");
        });
        card.addEventListener("dragend", e => e.target.classList.remove("dragging"));
    });

    columns.forEach(column => {
        column.addEventListener("dragover", e => {
            e.preventDefault();
            column.classList.add("drag-over");
        });
        column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
        column.addEventListener("drop", async (e) => {
            e.preventDefault();
            column.classList.remove("drag-over");

            const cardId = e.dataTransfer.getData("text/plain");
            const id = parseInt(cardId.replace('todo-', ''));
            const newStatus = column.getAttribute("data-status");

            const todoIdx = appTodos.findIndex(t => t.id === id);
            if (todoIdx !== -1) {
                // Update local state
                appTodos[todoIdx].status = newStatus;
                appTodos[todoIdx].completed = (newStatus === 'done');
                
                // Professional Sync: Global state + IndexedDB
                await BridgeWorkDB.set("todos", "main", appTodos);
                renderKanbanBoard();
            }
        });
    });
}

function updateAppSetting(key, val) {
    appPrefs[key] = val;
    savePrefs(); // Use the new savePrefs function
    if (['uiScale', 'compactSidebar', 'animations', 'accentColor', 'backgroundImage'].includes(key)) applyAppPrefs();
    if (key === 'currency') render(); 
}

function applyAppPrefs() {
    // Apply UI Scale
    const scale = (parseFloat(appPrefs.uiScale) || 100) / 100;
    // Using zoom is the most effective way to scale a px-based UI across fonts and spacing
    document.body.style.zoom = scale;
    
    // Apply Visual Toggles
    document.body.classList.toggle('compact-sidebar', !!appPrefs.compactSidebar);
    document.body.classList.toggle('no-animations', appPrefs.animations === false);

    // Apply Theme Color
    document.documentElement.style.setProperty('--primary', appPrefs.accentColor || '#6366f1');
    
    // Apply Background Image
    applyBackgroundImage();
    
    // Apply Sidebar visibility logic
    applyModuleVisibility();
}

function applyBackgroundImage() {
    const bgImage = appPrefs.backgroundImage || 'none';
    const bodyBefore = document.querySelector('body::before');
    
    if (bgImage === 'none') {
        document.body.style.setProperty('--bg-image', 'none');
    } else if (bgImage === 'custom' && appPrefs.customBackground) {
        document.body.style.setProperty('--bg-image', `url(${appPrefs.customBackground})`);
    } else {
        // Use Unsplash images for predefined options
        const imageUrls = {
            'nature1': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
            'nature2': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
            'nature3': 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&h=1080&fit=crop',
            'abstract1': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop',
            'abstract2': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&h=1080&fit=crop',
            'city1': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop',
            'city2': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&h=1080&fit=crop'
        };
        document.body.style.setProperty('--bg-image', `url(${imageUrls[bgImage]})`);
    }
    
    // Show/hide custom upload input
    const customUpload = document.getElementById('customBackgroundUpload');
    if (customUpload) {
        customUpload.style.display = bgImage === 'custom' ? 'flex' : 'none';
    }
}

function handleBackgroundUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            appPrefs.customBackground = e.target.result;
            savePrefs();
            applyBackgroundImage();
        };
        reader.readAsDataURL(file);
    }
}

// ===== LOAN LOGIC =====
function calculateMonthlyPayment(principal, annualRate, termMonths) {
    if (principal <= 0 || annualRate < 0 || termMonths <= 0) return 0;
    const monthlyRate = (annualRate / 100) / 12;
    if (monthlyRate === 0) return parseFloat((principal / termMonths).toFixed(2)); // Simple interest for 0 rate
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    return parseFloat(payment.toFixed(2));
}

function generateAmortizationSchedule(loan) {
    const schedule = [];
    let balance = loan.amount;
    const monthlyRate = (loan.interestRate / 100) / 12;
    const monthlyPayment = loan.monthlyPayment;

    let currentMonth = new Date(loan.startDate);
    currentMonth.setDate(1); // Start of the month

    for (let i = 0; i < loan.termMonths; i++) {
        const interest = balance * monthlyRate;
        let principalPaid = monthlyPayment - interest;
        
        // Adjust for the last payment
        if (balance < principalPaid) {
            principalPaid = balance;
        }
        
        balance -= principalPaid;
        if (balance < 0) balance = 0; // Ensure balance doesn't go negative

        const paymentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), loan.paymentDay);
        const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
        
        // Find if this payment month is marked as paid in the loan's payments array
        const paidEntry = loan.payments.find(p => p.month === paymentMonthStr);

        schedule.push({
            month: paymentMonthStr,
            dueDate: dueDateStr,
            principal: parseFloat(principalPaid.toFixed(2)),
            interest: parseFloat(interest.toFixed(2)),
            monthlyPayment: parseFloat((principalPaid + interest).toFixed(2)),
            remainingBalance: parseFloat(balance.toFixed(2)),
            isPaid: paidEntry ? paidEntry.isPaid : false,
            paidDate: paidEntry ? paidEntry.paidDate : null
        });

        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    return schedule;
}

var currentLoanId = null; // To track which loan is being edited/viewed

function openLoanModal(loanId = null) {
    const modal = document.getElementById("loanModal");
    const title = document.getElementById("loanModalTitle");
    const saveBtn = document.getElementById("btnSaveLoan");

    currentLoanId = loanId;

    if (loanId) {
        const loan = appLoans.find(l => l.id === loanId);
        if (!loan) return;
        document.getElementById("loanName").value = loan.name;
        document.getElementById("loanAmount").value = loan.amount;
        document.getElementById("loanInterestRate").value = loan.interestRate;
        document.getElementById("loanTermMonths").value = loan.termMonths;
        document.getElementById("loanStartDate").value = loan.startDate;
        document.getElementById("loanPaymentDay").value = loan.paymentDay;
        document.getElementById("loanMonthlyPayment").value = loan.monthlyPayment;
        title.textContent = t[currentLang].loan_update_loan;
        saveBtn.textContent = t[currentLang].loan_update_loan;
    } else {
        document.getElementById("loanName").value = "";
        document.getElementById("loanAmount").value = "";
        document.getElementById("loanInterestRate").value = "";
        document.getElementById("loanTermMonths").value = "";
        document.getElementById("loanStartDate").value = new Date().toISOString().split('T')[0];
        document.getElementById("loanPaymentDay").value = 6;
        document.getElementById("loanMonthlyPayment").value = "";
        title.textContent = t[currentLang].loan_modal_title;
        saveBtn.textContent = t[currentLang].loan_save_loan;
    }
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeLoanModal() {
    const modal = document.getElementById("loanModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function saveLoan() {
    const name = document.getElementById("loanName").value.trim();
    const amount = parseFloat(document.getElementById("loanAmount").value);
    const interestRate = parseFloat(document.getElementById("loanInterestRate").value);
    const termMonths = parseInt(document.getElementById("loanTermMonths").value);
    const startDate = document.getElementById("loanStartDate").value;
    const paymentDay = parseInt(document.getElementById("loanPaymentDay").value);
    let monthlyPayment = parseFloat(document.getElementById("loanMonthlyPayment").value);

    if (!name || isNaN(amount) || isNaN(interestRate) || isNaN(termMonths) || !startDate || isNaN(paymentDay)) {
        showToast(t[currentLang].loan_alert_fill, "error");
        return;
    }

    if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
        monthlyPayment = calculateMonthlyPayment(amount, interestRate, termMonths);
    }

    if (currentLoanId) {
        const loanIndex = appLoans.findIndex(l => l.id === currentLoanId);
        if (loanIndex > -1) {
            appLoans[loanIndex] = {
                ...appLoans[loanIndex],
                name, amount, interestRate, termMonths, startDate, paymentDay, monthlyPayment
            };
        }
    } else {
        const newLoan = {
            id: "loan_" + Date.now(),
            name, amount, interestRate, termMonths, startDate, paymentDay, monthlyPayment,
            payments: [] // Initialize with empty payments
        };
        appLoans.push(newLoan);
    }
    saveLoans();
    renderLoans();
    closeLoanModal();
    showToast(t[currentLang].loan_save_loan + " " + name, "success");
}

function deleteLoan(loanId) {
    if (confirm(t[currentLang].loan_alert_delete)) {
        appLoans = appLoans.filter(l => l.id !== loanId);
        saveLoans();
        renderLoans();
        showToast(t[currentLang].loan_delete_loan + " " + t[currentLang].loan_report_title, "success");
    }
}

function renderLoans() {
    const loanList = document.getElementById("loanList");
    const loanEmptyState = document.getElementById("loanEmptyState");
    if (!loanList || !loanEmptyState) return;

    loanList.innerHTML = "";
    if (appLoans.length === 0) {
        loanEmptyState.style.display = "block";
        return;
    } else {
        loanEmptyState.style.display = "none";
    }

    appLoans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        const parseLD = (s) => { const p = s.split('-'); return new Date(p[0], p[1]-1, p[2]); };
        const today = new Date();
        today.setHours(0,0,0,0);

        const totalPaid = schedule.filter(p => p.isPaid).reduce((sum, p) => sum + p.monthlyPayment, 0);
        const remainingBalance = schedule.length > 0 ? schedule[schedule.length - 1].remainingBalance : loan.amount;
        const nextPayment = schedule.find(p => !p.isPaid && parseLD(p.dueDate) >= today);
        
        const diffDays = nextPayment ? Math.round((parseLD(nextPayment.dueDate) - today) / 86400000) : -1;
        
        let alertBadge = "";
        if (diffDays === 0) alertBadge = `<span class="badge badge-danger" style="margin-left:8px; flex-shrink: 0;">${t[currentLang].loan_due_today}</span>`;
        else if (diffDays > 0 && diffDays <= 5) alertBadge = `<span class="badge badge-warning" style="margin-left:8px; flex-shrink: 0;">${t[currentLang].loan_due_soon}</span>`;

        let nextPayMsg = nextPayment 
            ? (currentLang === 'kh' 
                ? `បង់ $${Number(loan.monthlyPayment).toLocaleString()} នៅថ្ងៃ ${formatDisplayDate(nextPayment.dueDate)}`
                : `Pay $${Number(loan.monthlyPayment).toLocaleString()} on ${formatDisplayDate(nextPayment.dueDate)}`)
            : (currentLang === 'kh' ? 'រួចរាល់ទាំងអស់' : 'All Paid');

        if (nextPayment && diffDays > 0 && diffDays <= 5) {
            nextPayMsg += currentLang === 'kh' ? ` (នៅសល់ ${diffDays} ថ្ងៃ)` : ` (${diffDays} days left)`;
        }

        const repaymentPct = Math.min(100, (totalPaid / (loan.amount || 1)) * 100);

        const loanCard = document.createElement("div");
        loanCard.className = "card animate-stagger"; // Use existing card styles
        loanCard.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
                <h3 style="display:flex; align-items:center; font-size: 14px; gap: 8px; margin: 0; flex: 1; min-width: 0;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary); flex-shrink: 0;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${loan.name}</span> ${alertBadge}
                </h3>
                <div class="card-actions" style="display: flex; gap: 6px; margin-left: 10px; flex-shrink: 0;">
                    <button class="del-btn edit-btn-minimal" onclick="openLoanModal('${loan.id}')" style="width:24px; height:24px; border-color: var(--primary); color: var(--primary);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="del-btn" onclick="deleteLoan('${loan.id}')" style="width:24px; height:24px">✕</button>
                </div>
            </div>
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 8px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${t[currentLang].loan_amount}</div>
                        <div style="font-size: 13px; font-weight: 700;">$${loan.amount.toLocaleString()}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 8px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${t[currentLang].loan_monthly_payment_short}</div>
                        <div style="font-size: 13px; font-weight: 700; color: var(--primary);">$${loan.monthlyPayment.toLocaleString()}</div>
                    </div>
                </div>

                <div style="background: var(--bg-main); border-radius: 10px; padding: 12px; margin-bottom: 16px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px;">
                    <div style="background: rgba(99, 102, 241, 0.1); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div>
                        <div style="font-size: 8px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${t[currentLang].loan_next_payment}</div>
                        <div style="font-size: 11px; font-weight: 600; ${diffDays <= 5 && diffDays >= 0 ? 'color:#ef4444' : ''}">${nextPayMsg}</div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 10px;">
                        <span style="color: var(--text-muted);">${t[currentLang].loan_remaining_balance}</span>
                        <span style="font-weight: 700; color: #ef4444">$${remainingBalance.toLocaleString()}</span>
                    </div>
                    <div style="width: 100%; height: 5px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${repaymentPct}%; height: 100%; background: #10b981; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px;">
                        <span style="color: var(--text-muted);">${t[currentLang].loan_total_paid}</span>
                        <span style="font-weight: 700; color: #10b981">$${totalPaid.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer" style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                <button class="btn btn-outline" style="width: 100%; justify-content: center; font-size: 10px; padding: 6px;" onclick="openLoanPaymentsModal('${loan.id}')">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    ${t[currentLang].loan_payment_history}
                </button>
            </div>
        `;
        loanList.appendChild(loanCard);
    });
}

function openLoanPaymentsModal(loanId) {
    const modal = document.getElementById("loanPaymentsModal");
    const title = document.getElementById("loanPaymentsModalTitle");
    const tableBody = document.getElementById("loanPaymentsTableBody");
    const loanTotalPaidEl = document.getElementById("loanTotalPaid");
    const loanRemainingBalanceEl = document.getElementById("loanRemainingBalance");
    const loanNextPaymentEl = document.getElementById("loanNextPayment");

    currentLoanId = loanId;
    const loan = appLoans.find(l => l.id === loanId);
    if (!loan) return;

    title.textContent = `${loan.name} - ${t[currentLang].loan_payment_history}`;
    tableBody.innerHTML = "";

    const schedule = generateAmortizationSchedule(loan);
    let totalPaid = 0;
    let remainingBalance = loan.amount;
    let nextPaymentDueDate = t[currentLang].loan_no_loans;

    const todayNow = new Date();
    const currentYM = `${todayNow.getFullYear()}-${String(todayNow.getMonth() + 1).padStart(2, '0')}`;

    schedule.forEach(payment => {
        if (payment.isPaid) {
            totalPaid += payment.monthlyPayment;
        }
        remainingBalance = payment.remainingBalance; // Last payment's remaining balance
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const pDate = (s) => { const p = s.split('-'); return new Date(p[0], p[1]-1, p[2]); };
        const isFuture = payment.month > currentYM;

        if (!payment.isPaid && pDate(payment.dueDate) >= today && nextPaymentDueDate === t[currentLang].loan_no_loans) {
            nextPaymentDueDate = formatDisplayDate(payment.dueDate);
        }

        const row = tableBody.insertRow();
        row.className = payment.isPaid ? "paid" : (new Date(payment.dueDate) < new Date() && !payment.isPaid ? "overdue" : "");
        row.innerHTML = `
            <td>${payment.month}</td>
            <td>${formatDisplayDate(payment.dueDate)}</td>
            <td>$${payment.principal.toLocaleString()}</td>
            <td>$${payment.interest.toLocaleString()}</td>
            <td>$${payment.monthlyPayment.toLocaleString()}</td>
            <td>$${payment.remainingBalance.toLocaleString()}</td>
            <td>
                <input type="checkbox" ${payment.isPaid ? 'checked' : ''} 
                       ${isFuture && !payment.isPaid ? 'disabled' : ''} 
                       onchange="toggleLoanPaymentStatus('${loan.id}', '${payment.month}')"
                       style="${isFuture && !payment.isPaid ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
            </td>
            <td>${payment.paidDate ? formatDisplayDate(payment.paidDate) : (currentLang === 'kh' ? 'មិនទាន់' : 'N/A')}</td>
            <td>
                ${payment.isPaid ? `<button class="btn-icon" onclick="editLoanPaidDate('${loan.id}', '${payment.month}')" title="Edit Paid Date"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` : ''}
            </td>
        `;
    });

    loanTotalPaidEl.textContent = `$${totalPaid.toLocaleString()}`;
    loanRemainingBalanceEl.textContent = `$${remainingBalance.toLocaleString()}`;
    loanNextPaymentEl.textContent = nextPaymentDueDate;

    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeLoanPaymentsModal() {
    const modal = document.getElementById("loanPaymentsModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function toggleLoanPaymentStatus(loanId, monthStr) {
    const loan = appLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Block marking future months as paid
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let entry = loan.payments.find(p => p.month === monthStr);

    if (monthStr > currentYM && (!entry || !entry.isPaid)) {
        showToast(currentLang === 'kh' ? "មិនអាចបង់ប្រាក់សម្រាប់ខែបន្ទាប់បានទេ" : "Cannot mark future months as paid.", "error");
        openLoanPaymentsModal(loanId);
        return;
    }

    let paymentEntry = loan.payments.find(p => p.month === monthStr);

    if (paymentEntry) {
        paymentEntry.isPaid = !paymentEntry.isPaid;
        paymentEntry.paidDate = paymentEntry.isPaid ? new Date().toISOString().split('T')[0] : null;
    } else if (!paymentEntry) {
        // If marking as paid for the first time, create the entry
        loan.payments.push({
            month: monthStr,
            isPaid: true,
            paidDate: new Date().toISOString().split('T')[0]
        });
    }
    saveLoans();
    openLoanPaymentsModal(loanId); // Re-render the payments modal
    showToast(t[currentLang].loan_paid_status + " updated!", "info");
}

function editLoanPaidDate(loanId, monthStr) {
    const loan = appLoans.find(l => l.id === loanId);
    if (!loan) return;
    const paymentEntry = loan.payments.find(p => p.month === monthStr);
    if (!paymentEntry) return;

    // Create a temporary date input to trigger the native calendar picker
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    // Default to the current entry date or today
    dateInput.value = paymentEntry.paidDate || new Date().toISOString().split('T')[0];
    
    // The element must be in the DOM for showPicker() to work in most browsers
    dateInput.style.position = 'fixed';
    dateInput.style.top = '-1000px'; 
    document.body.appendChild(dateInput);

    dateInput.onchange = () => {
        if (dateInput.value) {
            paymentEntry.paidDate = dateInput.value;
            saveLoans();
            openLoanPaymentsModal(loanId);
            showToast("Paid date updated!", "success");
        }
        document.body.removeChild(dateInput);
    };

    // Use the modern showPicker() API if available, otherwise fallback to click()
    if (dateInput.showPicker) {
        dateInput.showPicker();
    } else {
        dateInput.click();
    }
}

let currentSelectedDate = null;
function openDayEventsModal(dateStr) {
    const modal = document.getElementById("dayEventsModal");
    const title = document.getElementById("dayEventsTitle");
    currentSelectedDate = dateStr;
    
    title.textContent = formatDisplayDate(dateStr);
    document.getElementById("newEventTitle").value = "";
    renderDayEventsList(dateStr);
    
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeDayEventsModal() {
    const modal = document.getElementById("dayEventsModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function renderDayEventsList(dateStr) {
    const list = document.getElementById("dayEventsList");
    const dayEvents = appEvents.filter(e => e.date === dateStr);
    if (dayEvents.length === 0) {
        list.innerHTML = `<div style="font-size:11px; color:var(--text-muted); text-align:center; padding:10px;">${currentLang === 'kh' ? 'មិនទាន់មានព្រឹត្តិការណ៍' : 'No custom events.'}</div>`;
    } else {
        list.innerHTML = dayEvents.map(e => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:8px; border-radius:8px; margin-bottom:5px; border: 1px solid var(--border-color);">
                <span style="font-size:12px; font-weight:600;">${e.title}</span>
                <button class="del-btn" onclick="deleteCustomEvent(${e.id}, '${dateStr}')" style="width:20px;height:20px">✕</button>
            </div>
        `).join('');
    }
}

function saveCustomEvent() {
    const title = document.getElementById("newEventTitle").value.trim();
    if (!title) return;
    appEvents.push({ id: Date.now(), date: currentSelectedDate, title });
    BridgeWorkDB.set("events", "main", appEvents);
    renderDayEventsList(currentSelectedDate);
    renderCalendar();
    showToast("Event added!", "success");
}

function deleteCustomEvent(id, dateStr) {
    appEvents = appEvents.filter(e => e.id !== id);
    BridgeWorkDB.set("events", "main", appEvents);
    renderDayEventsList(dateStr);
    renderCalendar();
}

function filterTasksForSelectedDay() {
    if (!currentSelectedDate) return;
    handleSearch(currentSelectedDate);
    closeDayEventsModal();
    closeCalendarModal();
}

// ===== INCOME LOGIC =====

function renderIncomes() {
    const tableBody = document.getElementById("incomeTableBody");
    const totalMonthlyEl = document.getElementById("totalMonthlyIncome");
    const totalOverallEl = document.getElementById("totalOverallIncome");
    const netProfitEl = document.getElementById("netProfitDisplay");
    const goalBar = document.getElementById("incomeGoalBar");
    const goalText = document.getElementById("incomeGoalText");
    
    if (!tableBody) return;

    const cur = appPrefs.currency || "$";
    
    // 1. Overall Total (All Time)
    const totalOverallIncome = appIncomes
        .filter(inc => inc.status === 'Received')
        .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

    // 2. Monthly Filtered Data for Table & Monthly Stats
    const currentMonthIncomes = appIncomes.filter(inc => {
        if (!inc.date) return false;
        const parts = String(inc.date).split(/[-/]/);
        return parseInt(parts[1]) - 1 === viewMonth && parseInt(parts[0]) === viewYear;
    });

    const monthlyIncome = currentMonthIncomes
        .filter(inc => inc.status === 'Received')
        .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

    const pendingIncome = currentMonthIncomes
        .filter(inc => inc.status !== 'Received')
        .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const avgDailyIncome = daysInMonth > 0 ? (monthlyIncome / daysInMonth) : 0;
    const entryCount = currentMonthIncomes.length;

    // Calculate Loans for this month to determine Net Profit
    // Calculate total monthly loan obligations for the current viewMonth/viewYear
    const currentMonthLoanObligations = appLoans.reduce((sum, loan) => {
        const loanStartDate = new Date(loan.startDate);
        const loanEndDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + loan.termMonths, 0); // Last day of the last payment month

        const currentPeriodStart = new Date(viewYear, viewMonth, 1);
        const currentPeriodEnd = new Date(viewYear, viewMonth + 1, 0);

        // Check if the loan is active within the current viewMonth/viewYear
        if (loanStartDate <= currentPeriodEnd && loanEndDate >= currentPeriodStart) {
            return sum + (parseFloat(loan.monthlyPayment) || 0);
        }
        return sum;
    }, 0);

    const currentMonthExpenses = appExpenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getUTCMonth() === viewMonth && d.getUTCFullYear() === viewYear;
    }).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    const currentNetProfit = monthlyIncome - currentMonthLoanObligations - currentMonthExpenses;

    totalMonthlyEl.textContent = `${cur}${monthlyIncome.toLocaleString()}`;
    if (totalOverallEl) {
        totalOverallEl.textContent = `${cur}${totalOverallIncome.toLocaleString()}`;
        totalOverallEl.classList.toggle('blur-sensitive', !!appPrefs.incomePrivacy);
    }
    netProfitEl.textContent = `${cur}${currentNetProfit.toLocaleString()}`;
    totalMonthlyEl.classList.toggle('blur-sensitive', !!appPrefs.incomePrivacy);
    netProfitEl.classList.toggle('blur-sensitive', !!appPrefs.incomePrivacy);

    const pendingAmountEl = document.getElementById('incomePendingAmount');
    const receivedAmountEl = document.getElementById('incomeReceivedAmount');
    const entryCountEl = document.getElementById('incomeEntryCount');
    const avgPerDayEl = document.getElementById('incomeAvgPerDay');

    if (receivedAmountEl) receivedAmountEl.textContent = `${cur}${monthlyIncome.toLocaleString()}`;
    if (pendingAmountEl) pendingAmountEl.textContent = `${cur}${pendingIncome.toLocaleString()}`;
    if (entryCountEl) entryCountEl.textContent = entryCount;
    if (avgPerDayEl) avgPerDayEl.textContent = `${cur}${avgDailyIncome.toFixed(2)}`;

    renderIncomePieChart(monthlyIncome, pendingIncome);

    const goal = currentWorkspace.incomeTarget || 1000;
    const pct = Math.min(100, (monthlyIncome / goal) * 100);
    
    if (goalBar) goalBar.style.width = pct + "%";
    if (goalText) goalText.textContent = Math.round(pct) + "%";

    // Filter table items to current month and sort by date descending
    tableBody.innerHTML = currentMonthIncomes.sort((a, b) => new Date(b.date) - new Date(a.date)).map((inc) => {
        return `
        <tr class="animate-stagger">
            <td>${formatDisplayDate(inc.date)}</td>
            <td style="font-weight:600">${inc.project}</td>
            <td><span class="badge ${badgeFor(inc.category)}">${getCatLabel(inc.category)}</span></td>
            <td style="font-weight:700; color: #10b981" class="${appPrefs.incomePrivacy ? 'blur-sensitive' : ''}">${cur}${parseFloat(inc.amount).toLocaleString()}</td>
            <td><span class="badge ${inc.status === 'Received' ? 'badge-blue' : 'badge-orange'}">${inc.status}</span></td>
            <td style="display:flex;gap:4px">
                <button class="del-btn" onclick="openIncomeModal('${inc.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="del-btn" onclick="deleteIncome('${inc.id}')">✕</button>
            </td>
        </tr>
    `}).join('');

    // Update toggle icon
    const eyeBtn = document.getElementById("btnToggleIncomePrivacy");
    if (eyeBtn) {
        eyeBtn.innerHTML = appPrefs.incomePrivacy 
            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
}

async function toggleIncomePrivacy() {
    appPrefs.incomePrivacy = !appPrefs.incomePrivacy;
    await BridgeWorkDB.set("settings", "prefs", appPrefs);
    renderIncomes();
    showToast(appPrefs.incomePrivacy ? "Privacy mode on" : "Privacy mode off", "info");
}

function openIncomeModal(incomeId = null) {
    const modal = document.getElementById("incomeModal");
    const title = document.getElementById("incomeModalTitle");
    const saveBtn = document.getElementById("btnSaveIncome");

    currentIncomeId = incomeId;

    if (incomeId) {
        const income = appIncomes.find(inc => inc.id === incomeId);
        if (!income) {
            console.warn("Income not found for ID:", incomeId);
            return;
        }
        document.getElementById("incDate").value = income.date;
        document.getElementById("incProject").value = income.project;
        document.getElementById("incAmount").value = income.amount;
        document.getElementById("incStatus").value = income.status;
        document.getElementById("incCategory").value = income.category;
        title.textContent = t[currentLang].sidebar_income + " (Edit)";
        saveBtn.textContent = t[currentLang].btn_update;
    } else {
        document.getElementById("incDate").value = new Date().toISOString().split('T')[0];
        document.getElementById("incProject").value = "";
        document.getElementById("incAmount").value = "";
        document.getElementById("incStatus").value = "Received"; // Default to received
        document.getElementById("incCategory").value = "Design Service"; // Default category
        title.textContent = t[currentLang].sidebar_income;
        saveBtn.textContent = t[currentLang].btn_save;
    }
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeIncomeModal() {
    const modal = document.getElementById("incomeModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function saveIncome() {
    const date = document.getElementById("incDate").value;
    const project = document.getElementById("incProject").value.trim();
    const amount = document.getElementById("incAmount").value;
    const status = document.getElementById("incStatus").value;
    const category = document.getElementById("incCategory").value;

    if (!date || !project || !amount) {
        showToast(t[currentLang].alert_fill, "error");
        return;
    }

    if (currentIncomeId) {
        // Update existing income
        const incomeIndex = appIncomes.findIndex(inc => inc.id === currentIncomeId);
        if (incomeIndex > -1) {
            appIncomes[incomeIndex] = {
                ...appIncomes[incomeIndex],
                date, project, amount: parseFloat(amount), status, category
            };
        }
        showToast("Income updated!", "success");
    } else {
        // Add new income
        appIncomes.push({ id: "inc_" + Date.now(), date, project, amount: parseFloat(amount), status, category });
        showToast("Income saved!", "success");
    }
    
    saveIncomes();
    render();
    renderIncomes(); // Only re-render incomes table
    closeIncomeModal();
}

function deleteIncome(incomeId) {
    if (confirm(t[currentLang].alert_clear)) {
        appIncomes = appIncomes.filter(inc => inc.id !== incomeId);
        saveIncomes();
        renderIncomes();
        showToast("Income deleted", "info");
    }
}

// ===== IMAGE PREVIEW =====
function showPreview(src) {
    const overlay = document.getElementById("imagePreviewOverlay");
    const img = document.getElementById("previewImage");
    if (!overlay || !img || !src) return;
    img.src = src;
    overlay.style.display = "flex";
    setTimeout(() => overlay.classList.add("show"), 10);
}

function closePreview() {
    const overlay = document.getElementById("imagePreviewOverlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    setTimeout(() => overlay.style.display = "none", 300);
}

function previewImageAt(idx) {
    if (modalRows[idx] && modalRows[idx].image) showPreview(modalRows[idx].image);
}

function removeImageAt(idx) {
    modalRows[idx].image = null;
    modalRows[idx].file = null;
    renderModalRows();
}

function checkDailyReminder() {
    const now = new Date();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const currentTime = hrs * 60 + mins;
    const startTime = 16 * 60; // 4:00 PM
    const endTime = 17 * 60 + 30; // 5:30 PM

    const todayStr = now.toISOString().split('T')[0];
    const hasReport = appData.some(d => d.date === todayStr);

    if (!hasReport && currentTime >= startTime && currentTime < endTime) {
        showToast(t[currentLang].reminder_msg, "error");
    }
}

function populateCategorySelect() {
    var sel = document.getElementById("category");
    var todoCat = document.getElementById("todoCategorySelect");
    if (!sel && !todoCat) return;

    var options = appCategories.map(cat => {
        return `<option value="${cat}">${getCatLabel(cat)}</option>`;
    }).join('');

    if (sel) sel.innerHTML = options;
    if (todoCat) todoCat.innerHTML = options;
}

function updateGreeting() {
    const hr = new Date().getHours();
    const el = document.getElementById("greeting");
    if (!el) return;
    
    // Select all cover overlay elements to update all views simultaneously
    const welcomeNames = document.querySelectorAll('.profile-info-overlay h1');
    const coverGreetings = document.querySelectorAll('.profile-info-overlay .greeting-text');
    const coverWeather = document.querySelectorAll('.cover-weather-info');

    let g = "Welcome back";
    if (hr < 12) g = "Good Morning";
    else if (hr < 18) g = "Good Afternoon";
    else g = "Good Evening";
    
    if (currentLang === 'kh') {
        if (hr < 12) g = "អរុណសួស្តី";
        else if (hr < 18) g = "ទិវាសួស្តី";
        else g = "សាយ័ន្តសួស្តី";
    }

    el.innerHTML = `${g}, `;
    
    if (currentLang === 'kh') el.style.fontSize = '0.95em'; else el.style.fontSize = '';

    welcomeNames.forEach(nameEl => { 
        nameEl.textContent = userName; 
        // Adjusting font size for Khmer headings on the profile cover
        if (currentLang === 'kh') nameEl.style.fontSize = '1.5rem'; 
        else nameEl.style.fontSize = '';
    });
    coverGreetings.forEach(greetEl => { 
        greetEl.innerHTML = `<span>${g}, </span>`; 
        // Adjusting font size for Khmer sub-text on the profile cover
        if (currentLang === 'kh') greetEl.style.fontSize = '0.75rem'; 
        else greetEl.style.fontSize = '';
    });
    coverWeather.forEach(wEl => {
        // Scale down the weather/tagline for a minimal Khmer look
        if (currentLang === 'kh') wEl.style.fontSize = '0.7rem'; 
        else wEl.style.fontSize = '';
    });
}

function updateClock() {
    const el = document.getElementById("clockDisplay");
    if (!el) return;
    const now = new Date();
    const hrs = now.getHours();
    
    // Dynamic Time Emojis
    let timeEmoji = "🌙"; 
    let emojiClass = "night-moon";
    
    if (hrs >= 5 && hrs < 8) { timeEmoji = "🌅"; emojiClass = "sunrise-glow"; }
    else if (hrs >= 8 && hrs < 11) { timeEmoji = "☀️"; emojiClass = "weather-sun"; }
    else if (hrs >= 11 && hrs < 16) { timeEmoji = "🌤️"; emojiClass = "weather-cloud"; }
    else if (hrs >= 16 && hrs < 19) { timeEmoji = "🌇"; emojiClass = "sunset-glow"; }
    else if (hrs >= 19 && hrs < 22) { timeEmoji = "🌃"; emojiClass = "night-city"; }

    const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    };
    
    let timeStr = now.toLocaleTimeString(currentLang === 'kh' ? 'km-KH' : 'en-US', options);
    // Add blinking effect to separators
    const animatedTime = timeStr.replace(/:/g, '<span class="clock-sep">:</span>');

    el.innerHTML = `<span class="widget-emoji ${emojiClass}">${timeEmoji}</span> ${animatedTime}`;
}

/**
 * Updates the weather display widgets.
 * Note: To use real live data, you can fetch from: https://wttr.in/Phnom+Penh?format=j1
 */
async function updateWeather() {
    const el = document.getElementById("weatherDisplay");
    const coverWeatherContainers = document.querySelectorAll(".cover-weather-info");
    const hrs = new Date().getHours();
    const isNight = hrs >= 18 || hrs < 6;
    
    // Simulated weather logic (replaces static text)
    const temps = isNight ? [24, 25, 26, 27, 28] : [31, 32, 33, 34, 35];
    const temp = temps[Math.floor(Math.random() * temps.length)];

    let conditions;
    if (isNight) {
        conditions = [
            { label: currentLang === 'kh' ? "មេឃស្រឡះ (យប់)" : "Clear Night", emoji: "🌙", class: "night-moon" },
            { label: currentLang === 'kh' ? "មានពពកខ្លះ" : "Cloudy Night", emoji: "☁️", class: "weather-cloud" },
            { label: currentLang === 'kh' ? "ភ្លៀង" : "Rainy Night", emoji: "🌧️", class: "weather-rain" }
        ];
    } else {
        conditions = [
            { label: currentLang === 'kh' ? "មេឃស្រឡះ" : "Sunny", emoji: "☀️", class: "weather-sun" },
            { label: currentLang === 'kh' ? "ស្រទុំ" : "Partly Cloudy", emoji: "⛅", class: "weather-cloud" },
            { label: currentLang === 'kh' ? "ភ្លៀង" : "Rainy", emoji: "🌧️", class: "weather-rain" },
            { label: currentLang === 'kh' ? "មេឃស្រឡះ" : "Clear Sky", emoji: "✨", class: "sparkle-glow" }
        ];
    }

    const cond = conditions[Math.floor(Math.random() * conditions.length)];
    const city = currentLang === 'kh' ? 'ភ្នំពេញ' : 'Phnom Penh';

    if (el) el.innerHTML = `<span class="widget-emoji ${cond.class}">${cond.emoji}</span> ${cond.label} • ${city}: ${temp}°C`;
    coverWeatherContainers.forEach(container => {
        container.innerHTML = `<span class="widget-emoji ${cond.class}">${cond.emoji}</span> ${cond.label} • ${temp}°C`;
    });
    updateGreeting();
    applyVisualWeatherEffects(cond.label);
}

/**
 * Injects animated particles into the .weather-effect-layer based on condition
 */
function applyVisualWeatherEffects(conditionLabel) {
    const layers = document.querySelectorAll('.weather-effect-layer');
    layers.forEach(layer => {
        layer.innerHTML = ''; // Clear existing effects
        
        if (conditionLabel === "Sunny" || conditionLabel === "Clear") {
            const sun = document.createElement('div');
            sun.className = 'sun-glow';
            layer.appendChild(sun);
        } 
        else if (conditionLabel === "Partly Cloudy") {
            for (let i = 0; i < 6; i++) {
                const cloud = document.createElement('div');
                cloud.className = 'cloud-particle';
                cloud.style.top = `${20 + Math.random() * 40}%`;
                cloud.style.left = `-${100 + Math.random() * 100}px`;
                cloud.style.width = `${120 + Math.random() * 100}px`;
                cloud.style.height = `${40 + Math.random() * 30}px`;
                cloud.style.animationDuration = `${20 + Math.random() * 20}s`;
                cloud.style.animationDelay = `${Math.random() * 10}s`;
                layer.appendChild(cloud);
            }
        } 
        else if (conditionLabel === "Rainy") {
            for (let i = 0; i < 80; i++) {
                const drop = document.createElement('div');
                drop.className = 'rain-drop';
                drop.style.left = `${Math.random() * 100}%`;
                drop.style.top = `-${Math.random() * 200}px`;
                drop.style.animationDuration = `${0.4 + Math.random() * 0.3}s`;
                drop.style.animationDelay = `${Math.random() * 2}s`;
                layer.appendChild(drop);
            }
        }
    });
}

// ===== DATE FORMATTER (DD/Month/YYYY) =====
function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    
    // Split by - or / to get exact numbers, avoiding timezone shifts
    const parts = dateStr.split(/[-/]/);
    if (parts.length < 3) return dateStr;
    
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    
    const day = String(d).padStart(2, '0');
    const monthNum = String(m + 1).padStart(2, '0');
    const monthNames = currentLang === 'kh' 
        ? ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"]
        : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    if (appPrefs.dateFormat === 'MM/DD/YYYY') return `${monthNum}/${day}/${y}`;
    return `${day}/${monthNames[m]}/${y}`;
}

// ===== ANIMATION HELPERS =====
function animateValue(objId, start, end, duration) {
    let startTimestamp = null;
    const obj = document.getElementById(objId);
    if (!obj) return;

    end = Number(end); // Ensure end is a number

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start) + "%";
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function triggerStagger() {
    const containers = document.querySelectorAll('.animate-stagger');
    containers.forEach(container => {
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            children[i].style.animation = 'none';
            void children[i].offsetWidth; // trigger reflow
            children[i].style.animation = null;
        }
    });
}

// ===== MODAL =====
function openModal(idx = -1) {
    const modal = document.getElementById("modal");
    const title = document.getElementById("modalTitle");
    const saveBtn = document.getElementById("btnSaveEntry");

    editIndex = idx;
    modalRows = [];

    if (idx > -1) {
        const item = appData[idx];
        document.getElementById("date").value = item.date;
        modalRows.push({ ...item });
        title.textContent = t[currentLang].modal_title_edit;
        saveBtn.textContent = t[currentLang].btn_update;
    } else {
        document.getElementById("date").value = new Date().toISOString().split('T')[0];
        modalRows.push({ task: "", category: appCategories[0], hours: 7.5, quantity: 1, image: null, file: null });
        title.textContent = t[currentLang].modal_title;
        saveBtn.textContent = t[currentLang].btn_save;
    }

    renderModalRows();
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10); // Add 'show' class after display is 'flex' to trigger animation
}

function renderModalRows() {
    const container = document.getElementById("taskRowsContainer");
    if (!container) return;
    container.innerHTML = "";

    modalRows.forEach((row, i) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "form-row-multi";
        rowDiv.innerHTML = `
            <div class="form-group" style="flex:2">
                <label>${t[currentLang].form_task}</label>
                <input type="text" value="${row.task || ''}" oninput="updateRowData(${i}, 'task', this.value)" placeholder="${t[currentLang].form_task_ph}">
            </div>
            <div class="form-group" style="flex:1.5">
                <label>${t[currentLang].form_category}</label>
                <select onchange="updateRowData(${i}, 'category', this.value)">
                    ${appCategories.map(cat => `<option value="${cat}" ${cat === row.category ? 'selected' : ''}>${getCatLabel(cat)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="flex:0.6">
                <label>Qty</label>
                <input type="number" value="${row.quantity}" min="1" oninput="updateRowData(${i}, 'quantity', this.value)">
            </div>
            <div class="form-group" style="flex:1">
                <label>Image</label>
                <div style="display:flex; align-items:center; gap:8px">
                    <input type="file" accept="image/*" onchange="handleImageUpload(${i}, this)" style="font-size:9px; padding:4px; width:100%; ${row.image ? 'display:none' : ''}">
                    ${row.image ? `
                        <div style="position:relative; display:inline-block">
                            <div class="image-thumbnail" onclick="previewImageAt(${i})" title="Click to preview">
                                <img src="${row.image}">
                            </div>
                            <button onclick="removeImageAt(${i})" style="position:absolute; top:-6px; right:-6px; width:16px; height:16px; background:#ef4444; color:#fff; border:none; border-radius:50%; font-size:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.2)">✕</button>
                        </div>
                    ` : ''}
                </div>
            </div>
            ${modalRows.length > 1 ? `<button class="del-btn" style="margin-top:16px" onclick="removeTaskRow(${i})">✕</button>` : ''}
        `;
        container.appendChild(rowDiv);
    });
}

function handleImageUpload(idx, input) {
    const file = input.files[0];
    if (!file) return;
    
    // Check file size (optional - 5MB limit)
    if (file.size > 1024 * 1024 * 5) { 
        showToast("Image too large. Please use an image under 5MB.", "error");
        input.value = "";
        return;
    }

    modalRows[idx].file = file; // Store the original file object

    const reader = new FileReader();
    reader.onload = (e) => {
        modalRows[idx].image = e.target.result;
        renderModalRows();
    };
    reader.readAsDataURL(file);
}

function updateRowData(idx, field, val) {
    modalRows[idx][field] = field === 'quantity' ? Number(val) : val;
    
    if (field === 'task' && val.length > 3) {
        const suggestion = suggestCategory(val);
        if (suggestion && appCategories.includes(suggestion)) {
            modalRows[idx].category = suggestion;
            renderModalRows();
        }
    }
}

function suggestCategory(taskName) {
    const task = taskName.toLowerCase();
    const map = {
        "Brand Promotion": ["poster", "artwork", "design", "logo", "branding", "print"],
        "SHV Promotion": ["shv", "sihanouk", "villas", "beach"],
        "BD Promotion": ["bd", "business", "proposal", "partnership"],
        "Campaign and Contents": ["campaign", "content", "social", "facebook", "tiktok", "video"]
    };
    for (const [cat, keywords] of Object.entries(map)) {
        if (keywords.some(k => task.includes(k))) return cat;
    }
    return null;
}

function addTaskRow() {
    const dist = DAILY_HOUR_LIMIT / (modalRows.length + 1);
    modalRows.forEach(r => r.hours = dist);
    modalRows.push({ task: "", category: appCategories[0], hours: dist, quantity: 1, image: null, file: null });
    renderModalRows();
}

function removeTaskRow(idx) {
    modalRows.splice(idx, 1);
    if (modalRows.length > 0) {
        const dist = DAILY_HOUR_LIMIT / modalRows.length;
        modalRows.forEach(r => r.hours = dist);
    }
    renderModalRows();
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.remove('show');
    // Hide after animation completes
    setTimeout(() => {
        modal.style.display = "none";
        editIndex = -1;
    }, 300); // Match CSS transition duration
}

// ===== SETTINGS MODAL =====
function switchSettingsTab(tabName) {
    // 1. Update Sidebar Button Active State
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // 2. Toggle Content Section Visibility
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

function updateModuleVisibility(module, isVisible) {
    if (module === 'loan') appPrefs.showLoan = isVisible;
    if (module === 'todo') appPrefs.showTodo = isVisible;
    if (module === 'income') appPrefs.showIncome = isVisible; // New: Income visibility
    if (module === 'ticker') appPrefs.showTicker = isVisible;
    if (module === 'expenses') appPrefs.showExpenses = isVisible; // New
    if (module === 'incomePrivacy') appPrefs.incomePrivacy = isVisible;
    
    BridgeWorkDB.set("settings", "prefs", appPrefs);
    applyModuleVisibility();
    showToast(t[currentLang].settings_visibility_alert, "info");
}

async function backupData() {
    const data = {
        app_data: await BridgeWorkDB.get("app_data", "main"),
        notes: await BridgeWorkDB.get("notes", "main"),
        todos: await BridgeWorkDB.get("todos", "main"),
        loans: await BridgeWorkDB.get("loans", "main"),
        expenses: await BridgeWorkDB.get("expenses", "main"), // New: Backup expenses
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
    savePrefs(); // Use the new savePrefs function
    render(); // Re-render to apply the new ticker message
}

function applyModuleVisibility() {
    const expenseLink = document.querySelector('a[onclick="showView(\'expense\')"]');
    const loanLink = document.querySelector('a[onclick="showView(\'loan\')"]');
    const todoLink = document.querySelector('a[onclick="showView(\'todo\')"]');
    const incomeLink = document.querySelector('a[onclick="showView(\'income\')"]');
    if (loanLink) loanLink.style.display = appPrefs.showLoan ? 'flex' : 'none';
    if (todoLink) todoLink.style.display = appPrefs.showTodo ? 'flex' : 'none';
    if (incomeLink) incomeLink.style.display = appPrefs.showIncome ? 'flex' : 'none';
    // New: Handle expense tracker visibility
    if (expenseLink) expenseLink.style.display = appPrefs.showExpenses ? 'flex' : 'none';

    // Update sidebar links for todos and kanban to reflect current workspace
    const todoSidebarLink = document.querySelector('.sidebar a[onclick="showView(\'todo\')"]');
    const kanbanSidebarLink = document.querySelector('.sidebar a[onclick="showView(\'kanban\')"]');
    // No direct change needed here, as the `showView` function already handles filtering.
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

    const settingsProjTitle = document.getElementById("settingsProjectTitle");
    if (settingsProjTitle) settingsProjTitle.textContent = `${getTranslation('settings_project_tab')}: ${currentWorkspace.name}`;

    // Set name and targets for current workspace
    setVal("wsNameInput", currentWorkspace.name);
    setVal("wsPosterTarget", currentWorkspace.posterTarget);
    setVal("wsHoursTarget", currentWorkspace.hoursTarget);
    setVal("wsIncomeTarget", currentWorkspace.incomeTarget || 1000);

    // Set preferences
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

    // Set Language UI in settings
    const langSelect = document.getElementById("settingsLangSelect");
    if (langSelect) langSelect.value = currentLang;

    switchSettingsTab('profile');
    
    renderCategories();
}

function toggleSocialLinks(e) {
    if (e) e.stopPropagation();
    const container = document.getElementById('profileSocialLinks');
    if (container) {
        container.classList.toggle('show');
    }
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
        // Scale down Khmer text which appears naturally larger
        if (currentLang === 'kh') el.style.fontSize = '0.95em'; else el.style.fontSize = '';
    });
    document.querySelectorAll("[data-i18n='user_role']").forEach(el => {
        el.textContent = userRole;
        if (currentLang === 'kh') el.style.fontSize = '0.9em'; else el.style.fontSize = '';
    });
    const avatar = await BridgeWorkDB.get("settings", "userAvatar") || "assets/images/tra.jpg";
    document.querySelectorAll(".avatar").forEach(img => img.src = avatar);
    window.currentUserAvatar = avatar;

    // Render Social Links
    document.querySelectorAll('.profile-social-links').forEach(socialContainer => {
        if (socialContainer) {
            let html = '';
            if (appPrefs.behanceUrl) {
                html += `<a href="${appPrefs.behanceUrl}" target="_blank" class="social-icon" title="Behance"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 13H15V11H22V13M18.5 10H14.5V8.5H18.5V10M11 13V15.5H8V13H11M11 8.5V11H8V8.5H11M13 13C13 11.5 12.3 10.3 11.2 9.7C12.1 9 12.6 7.9 12.6 6.8C12.6 4.1 10.5 2 7.8 2H2V18.1H8.1C10.8 18.1 13 16 13 13.3V13M7.5 4.5H8.1C9.3 4.5 10.1 5.3 10.1 6.5C10.1 7.7 9.3 8.5 8.1 8.5H7.5V4.5M8.1 15.6H7.5V11H8.1C9.3 11 10.1 11.8 10.1 13C10.1 14.2 9.3 15.6 8.1 15.6Z"/></svg></a>`;
            }
            if (appPrefs.facebookUrl) {
                html += `<a href="${appPrefs.facebookUrl}" target="_blank" class="social-icon" title="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg></a>`;
            }
            if (appPrefs.tiktokUrl) {
                html += `<a href="${appPrefs.tiktokUrl}" target="_blank" class="social-icon" title="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.31-.75.42-1.24 1.25-1.33 2.1-.1.7.1 1.41.53 1.97.44.46 1.09.68 1.71.68 1.53.06 2.94-1.03 3.25-2.53.06-1 .04-2.01.04-3.01.01-4.42-.02-8.84.02-13.26z"/></svg></a>`;
            }
            socialContainer.innerHTML = html;
        }
    });
}

function closeSettings() {
    const modal = document.getElementById("settingsModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}
function renderCategories() {
    var list = document.getElementById("categoryList");
    list.innerHTML = "";
    appCategories.forEach((cat, idx) => {
        var div = document.createElement("div");
        div.className = "cat-pill";
        div.innerHTML = `<span>${getCatLabel(cat)}</span> <button class="del-btn" onclick="delCategory(${idx})">✕</button>`;
        list.appendChild(div);
    });
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
    renderAllViews(); // Re-render all views that might depend on this
}

// ===== HELPERS =====
function getCatLabel(cat) {
    if (cat === "Brand Promotion") return t[currentLang].cat_brand;
    if (cat === "SHV Promotion") return t[currentLang].cat_shv;
    if (cat === "BD Promotion") return t[currentLang].cat_bd;
    if (cat === "Campaign and Contents") return t[currentLang].cat_campaign;
    if (cat === "Salary") return t[currentLang].income_salary;
    return cat;
}

function getExpenseCatLabel(cat) {
    if (cat === "Software/Tools") return t[currentLang].expense_cat_software;
    if (cat === "Hardware") return t[currentLang].expense_cat_hardware;
    if (cat === "Food & Drink") return t[currentLang].expense_cat_food;
    return t[currentLang].expense_cat_other; // Default to other
}

function badgeFor(cat) {
    if (cat === "Brand Promotion") return 'badge-blue';
    if (cat === "SHV Promotion") return 'badge-orange';
    if (cat === "BD Promotion") return 'badge-purple';
    if (cat === "Salary") return 'badge-green'; // Using badge-green for salary
    return 'badge-blue';
}

function getSmartPerformanceInsight(posters, hours) {
    if (currentLang === 'kh') {
        if (posters >= 30) return "អ្នកធ្វើបានល្អណាស់! អ្នកបានសម្រេចគោលដៅខែនេះហើយ។";
        if (posters >= 15) return "អ្នកកំពុងដើរលើផ្លូវត្រូវហើយ! បន្តការខិតខំប្រឹងប្រែងទៀត។";
        return "ព្យាយាមបន្ថែមទៀតដើម្បីសម្រេចគោលដៅរបស់អ្នក! អ្នកអាចធ្វើបាន។";
    }
    if (posters >= 30) return "Outstanding! You have reached your monthly target.";
    if (posters >= 15) return "Great progress! You are on track to meet your goals.";
    return "Keep pushing! Every poster counts towards your success.";
}

// ===== HIGHLIGHT HELPER =====
function highlightText(text, query) {
    if (!query || !text) return text || "";
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Smart highlighting: Only highlight outside of HTML tags
    return String(text).split(/(<[^>]*>)/).map(part => {
        if (part.startsWith('<') && part.endsWith('>')) return part;
        return part.replace(regex, '<mark>$1</mark>');
    }).join('');
}

function clearSearchInput() {
    const inp = document.getElementById("searchInput");
    if (inp) inp.value = "";
    searchQuery = "";
}

// ===== SEARCH =====
function handleSearch(val) {
    searchQuery = val.toLowerCase();
    render();
}

// ===== MONTHLY REPORT MODAL =====
function openReportModal() {
    const now = new Date();
    document.getElementById("reportMonth").value = now.getMonth() + 1;
    document.getElementById("reportYear").value = now.getFullYear();
    // Report modal always uses the dashboard's current month/year as default
    document.getElementById("reportMonth").value = dashboardMonthState + 1;
    document.getElementById("reportYear").value = dashboardYearState;
    const modal = document.getElementById("reportModal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
}
function closeReportModal() {
    const modal = document.getElementById("reportModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

async function generateReport(type) {
    try {
        const m = parseInt(document.getElementById("reportMonth").value);
        const y = parseInt(document.getElementById("reportYear").value);
        
        if (window.location.protocol === 'file:') {
            showToast("Report generation is blocked by browser security on local files. Please use a local server.", "error");
            return;
        }

        const filtered = appData.filter(d => {
            if (!d.date) return false;
            const matchesWorkspace = d.workspaceId ? d.workspaceId === activeWorkspaceId : activeWorkspaceId === "default";
            const parts = d.date.split('-');
            return parseInt(parts[1]) === m && parseInt(parts[0]) === y && matchesWorkspace;
        });

        // Fix Sync: Update the UI to the selected month/year before capturing the snapshot
        viewMonth = m - 1;
        viewYear = y;
        render();
        
        // Temporarily set dashboard's state for report generation
        dashboardMonthState = m - 1;
        dashboardYearState = y;

        if (filtered.length === 0) {
            showToast(currentLang === 'kh' ? "មិនមានទិន្នន័យសម្រាប់គ្រានេះទេ" : "No data for the selected period", "error");
            return;
        }

        // Ensure fonts are fully loaded before capturing
        await document.fonts.ready;
        render(); 
        await new Promise(r => setTimeout(r, 1000)); // Wait for charts to animate

        const element = document.querySelector(".main");
        
        // Security-aware options for html2canvas
        const h2cOptions = {
            scale: 2,
            useCORS: window.location.protocol !== 'file:', // Disable CORS logic on file:// to prevent security errors
            allowTaint: window.location.protocol === 'file:',
            backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
            logging: false
        };

        if (type === 'pdf') {
            const canvas = await html2canvas(element, h2cOptions);
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`BridgeWork_Report_${m}_${y}.pdf`);
        } else {
            const canvas = await html2canvas(element, h2cOptions);
            const link = document.createElement('a');
            link.download = `BridgeWork_Snapshot_${m}_${y}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 0.9);
            link.click();
        }
        closeReportModal();
        // Restore dashboard's original month/year after report generation
        dashboardMonthState = new Date().getMonth(); // Or load from saved state if needed
        dashboardYearState = new Date().getFullYear();
    } catch (err) {
        console.error("Report generation failed:", err);
        showToast("Export failed. Please check browser console for details.", "error");
    }
}

// ===== ADD DATA =====
async function addData() {
    const dateVal = document.getElementById("date").value;
    if (!dateVal) { showToast(t[currentLang].alert_fill, "error"); return; }

    const validRows = modalRows.filter(r => r.task.trim() !== "");
    if (validRows.length === 0) { showToast(t[currentLang].alert_fill, "error"); return; }

    // 1. Identify all tasks that will exist for this date to distribute hours
    let otherTaskIndices = [];
    appData.forEach((item, idx) => {
        if (item.date === dateVal && idx !== editIndex) {
            otherTaskIndices.push(idx);
        }
    });
    
    let totalCount = otherTaskIndices.length + validRows.length;
    let distributedHours = DAILY_HOUR_LIMIT / totalCount;

    // 2. Update existing tasks for this date to maintain the total hour cap
    otherTaskIndices.forEach(idx => {
        appData[idx].hours = distributedHours;
    });

    let savedFilesCount = 0;
    for (const [i, row] of validRows.entries()) {
        let savedPath = row.savedPath || null;
        const entry = { 
            date: dateVal, 
            task: row.task.trim(), 
            category: row.category, 
            hours: distributedHours,
            quantity: row.quantity,
            image: row.image || null,
            savedPath: savedPath,
            workspaceId: activeWorkspaceId
        };

        if (editIndex > -1 && i === 0) {
            // Maintain existing image/path if no new file was uploaded during edit
            entry.image = row.image || appData[editIndex].image;
            entry.savedPath = savedPath || appData[editIndex].savedPath;
            appData[editIndex] = entry;
        } else {
            appData.push(entry);
        }
    }
    // Show success alert before saving to ensure user sees confirmation
    showToast(t[currentLang].btn_save, "success");
    save();
    await save();
    exportCSV(false); // Trigger sync during user-activated save
    render();
    closeModal();
}

// ===== EXPENSES LOGIC =====
function openExpenseModal(expenseId = null) {
    const modal = document.getElementById("expenseModal");
    const title = document.getElementById("expenseModalTitle");
    const saveBtn = document.getElementById("btnSaveExpense");

    currentExpenseId = expenseId;

    if (expenseId) {
        const expense = appExpenses.find(exp => exp.id === expenseId);
        if (!expense) {
            console.warn("Expense not found for ID:", expenseId);
            return;
        }
        document.getElementById("expDate").value = expense.date;
        document.getElementById("expName").value = expense.name;
        document.getElementById("expAmount").value = expense.amount;
        document.getElementById("expCategory").value = expense.category;
        title.textContent = t[currentLang].sidebar_expenses + " (Edit)";
        saveBtn.textContent = t[currentLang].btn_update;
    } else {
        document.getElementById("expDate").value = new Date().toISOString().split('T')[0];
        document.getElementById("expName").value = "";
        document.getElementById("expAmount").value = "";
        document.getElementById("expCategory").value = "Software/Tools"; // Default category
        title.textContent = t[currentLang].sidebar_expenses;
        saveBtn.textContent = t[currentLang].btn_save;
    }
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeExpenseModal() {
    const modal = document.getElementById("expenseModal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function saveExpense() {
    const date = document.getElementById("expDate").value;
    const name = document.getElementById("expName").value.trim();
    const amount = document.getElementById("expAmount").value;
    const category = document.getElementById("expCategory").value;

    if (!date || !name || !amount) {
        showToast(t[currentLang].alert_fill, "error");
        return;
    }

    if (currentExpenseId) {
        // Update existing expense
        const expenseIndex = appExpenses.findIndex(exp => exp.id === currentExpenseId);
        if (expenseIndex > -1) {
            appExpenses[expenseIndex] = {
                ...appExpenses[expenseIndex],
                date, name, amount: parseFloat(amount), category
            };
        }
        showToast("Expense updated!", "success");
    } else {
        // Add new expense
        appExpenses.push({ id: "exp_" + Date.now(), date, name, amount: parseFloat(amount), category });
        showToast("Expense saved!", "success");
    }
    
    saveExpenses();
    renderExpenses();
    closeExpenseModal();
}

function deleteExpense(expenseId) {
    if (confirm(t[currentLang].alert_clear)) {
        appExpenses = appExpenses.filter(exp => exp.id !== expenseId);
        saveExpenses();
        renderExpenses();
        showToast("Expense deleted", "info");
    }
}

function renderExpenses() {
    const tableBody = document.getElementById("expenseTableBody");
    const totalMonthlyEl = document.getElementById("totalMonthlyExpenses");
    
    if (!tableBody) return;

    const cur = appPrefs.currency || "$";
    const totalExpenses = appExpenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getUTCMonth() === viewMonth && d.getUTCFullYear() === viewYear;
    }).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    totalMonthlyEl.textContent = `${cur}${totalExpenses.toLocaleString()}`;

    const sortedExpenses = [...appExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    tableBody.innerHTML = sortedExpenses.map((exp) => `
        <tr class="animate-stagger">
            <td>${formatDisplayDate(exp.date)}</td>
            <td style="font-weight:600">${exp.name}</td>
            <td><span class="badge ${badgeFor(exp.category)}">${getExpenseCatLabel(exp.category)}</span></td>
            <td style="font-weight:700; color: #ef4444">${cur}${parseFloat(exp.amount).toLocaleString()}</td>
            <td style="display:flex;gap:4px">
                <button class="del-btn" onclick="openExpenseModal('${exp.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="del-btn" onclick="deleteExpense('${exp.id}')">✕</button>
            </td>
        </tr>
    `).join('');
}

// ===== DELETE =====
function delItem(idx) {
    appData.splice(idx, 1);
    save();
    exportCSV(false); // Trigger sync during user-activated delete (for dashboard data)
    render();
}

// ===== CLEAR =====
function clearAll() {
    if (confirm(t[currentLang].alert_clear)) {
        appData = [];
        save();
        exportCSV(false); // Trigger sync during user-activated clear (for dashboard data)
        render();
    }
}

// This function is called from renderDashboard, so it should use dashboard's month/year
function updateToolSummaries() {
    // 1. Notes Count
    const sn = document.getElementById('summaryNotes');
    if (sn) sn.textContent = `${appNotes.length} ${getTranslation('summary_items')}`;
    const hsn = document.getElementById('homeStatNotes');
    if (hsn) hsn.textContent = appNotes.length;

    // 2. Pending To-Do
    const st = document.getElementById('summaryTodo');
    if (st) {
        const pending = appTodos.filter(t => !t.completed).length;
        st.textContent = `${pending} ${getTranslation('summary_pending')}`;
        const hst = document.getElementById('homeStatTodo');
        if (hst) hst.textContent = pending;
    }

    // 3. Kanban In-Progress
    const sk = document.getElementById('summaryKanban');
    if (sk) {
        const active = appTodos.filter(t => t.status === 'in-progress').length;
        sk.textContent = `${active} ${getTranslation('summary_active')}`;
    }

    // 4. Earliest Loan Due
    const sl = document.getElementById('summaryLoan');
    if (sl) {
        let earliest = null;
        const today = new Date();
        today.setHours(0,0,0,0);
        appLoans.forEach(loan => {
            const schedule = generateAmortizationSchedule(loan);
            const next = schedule.find(p => !p.isPaid && new Date(p.dueDate) >= today);
            if (next && (!earliest || new Date(next.dueDate) < new Date(earliest))) earliest = next.dueDate;
        });
        sl.textContent = earliest ? `${getTranslation('summary_due')}: ${formatDisplayDate(earliest)}` : (currentLang === 'kh' ? 'គ្មានជំពាក់' : 'No dues');
    }

    
    // 5. Monthly Income Total
    const si = document.getElementById('summaryIncome');
    if (si) {
        const cur = appPrefs.currency || "$";
        const totalOverallIncome = appIncomes
            .filter(inc => inc.status === 'Received')
            .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

        const currentMonthLoanObligations = appLoans.reduce((sum, loan) => {
            const loanStartDate = new Date(loan.startDate);
            const loanEndDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + loan.termMonths, 0); // Last day of the last payment month

            const currentPeriodStart = new Date(viewYear, viewMonth, 1);
            const currentPeriodEnd = new Date(viewYear, viewMonth + 1, 0);

            if (loanStartDate <= currentPeriodEnd && loanEndDate >= currentPeriodStart) {
                return sum + (parseFloat(loan.monthlyPayment) || 0);
            }
            return sum;
        }, 0);

    
        const monthlyIncome = appIncomes.filter(inc => {
            const d = new Date(inc.date);
            return d.getUTCMonth() === viewMonth && d.getUTCFullYear() === viewYear && inc.status === 'Received';
        }).reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

        const summaryNetProfit = monthlyIncome - currentMonthLoanObligations;
        si.textContent = `${getTranslation('summary_total')}: ${cur}${monthlyIncome.toLocaleString()} (Profit: ${cur}${summaryNetProfit.toLocaleString()})`;
    }
    // 7. Total Monthly Expenses
    const sexp = document.getElementById('summaryExpenses');
    if (sexp) {
        const cur = appPrefs.currency || "$";
        const totalExpenses = appExpenses.filter(exp => {
            const d = new Date(exp.date);
            return d.getUTCMonth() === viewMonth && d.getUTCFullYear() === viewYear;
        }).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        sexp.textContent = `${getTranslation('summary_total')}: ${cur}${totalExpenses.toLocaleString()}`;
    }

    // 8. Home Stats Reports (Current Month Count)
    const hsr = document.getElementById('homeStatReports');
    if (hsr) {
        hsr.textContent = appData.filter(d => { if (!d.date) return false; const p = d.date.split('-'); return parseInt(p[1]) - 1 === viewMonth && parseInt(p[0]) === viewYear; }).length;
    }

    if (typeof updateTodayWorkSummary === 'function') updateTodayWorkSummary();

    // 9. Voice Assistant Tool (Khmer Only)
    const voiceTool = document.getElementById('summaryVoice');
    if (voiceTool) {
        voiceTool.textContent = currentLang === 'kh' ? "រួចរាល់" : "Ready";
    }
}

// ===== RENDER =====
// ===== RENDER DISPATCHER =====
function render() {
    if (currentView === 'dashboard') renderDashboard();
    else if (currentView === 'income') renderIncomes();
    else if (currentView === 'expense') renderExpenses();
    else if (currentView === 'notes') renderNotes();
    else if (currentView === 'todo') renderTodos();
    else if (currentView === 'kanban') renderKanbanBoard();
    else if (currentView === 'loan') renderLoans();
    else if (currentView === 'eagleGallery') renderEagleGallery();
    // Calendar is rendered separately
    updateMonthDisplay(); // Ensure header month is updated for the current view
}

function renderDashboard() {
    const viewingDate = new Date(viewYear, viewMonth, 1);
    if (document.getElementById("currentViewLabel")) updateMonthDisplay();

    // Optimization: Perform filtering in a single pass
    const activeMonthData = [];
    const tableData = [];

    for (const d of appData) {
        if (!d.date) continue;
        const parts = String(d.date).split(/[-/]/);
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const matchesWorkspace = String(d.workspaceId || "default") === String(activeWorkspaceId);

        if (m === viewMonth && y === viewYear && matchesWorkspace) {
            activeMonthData.push(d);
            
            const q = searchQuery.toLowerCase();
            if (!q || d.task.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || getCatLabel(d.category).toLowerCase().includes(q) || d.date.includes(q)) {
                tableData.push(d);
            }
        }
    }

    // Count posters for selected month
    const posterCategories = ["poster", "promotion", "campaign", "contents", "facebook cover"];
    var posters = activeMonthData.reduce(function(acc, d) {
        const cat = String(d.category || "").toLowerCase();
        const task = (d.task || "").toLowerCase();
        
        const isPoster = posterCategories.some(c => cat.includes(c) || task.includes(c));
        if (isPoster) {
            return acc + (Number(d.quantity) || 1);
        }
        return acc;
    }, 0);

    // Count hours for selected month
    var totalHrs = activeMonthData.reduce(function(a, b) { return a + (parseFloat(b.hours) || 0); }, 0);
    
    const monthName = viewingDate.toLocaleString(currentLang === 'kh' ? 'km-KH' : 'en-US', { month: 'long' });
    document.querySelectorAll("[data-i18n='card_posters_sub']").forEach(el => el.textContent = `Target: ${currentWorkspace.posterTarget} ${monthName}`);

    // ===== NEW KPI CALCULATION (120pt System) =====
    const ptsDetail = KPI_POINTS.DETAIL_FILE;
    const ptsAttitude = KPI_POINTS.ATTITUDE;
    const ptsOnTime = KPI_POINTS.ON_TIME;
    const ptsQuality = KPI_POINTS.QUALITY;
    const ptsSupport = KPI_POINTS.SUPPORT;
    const ptsPerformance = KPI_POINTS.PERFORMANCE;
    const ptsCreative = Math.min(KPI_POINTS.CREATIVE_MAX, posters * KPI_POINTS.CREATIVE_PER_POSTER);
    const ptsOvertime = totalHrs >= currentWorkspace.hoursTarget ? KPI_POINTS.OVERTIME : 0; 
    
    const ptsPosterGoal = Math.min(KPI_POINTS.POSTER_GOAL_MAX, Math.round((posters / (currentWorkspace.posterTarget || 1)) * KPI_POINTS.POSTER_GOAL_MAX));
    const totalKPI = ptsDetail + ptsAttitude + ptsOnTime + ptsQuality + ptsSupport + ptsPerformance + ptsCreative + ptsOvertime + ptsPosterGoal;

    // Smart Projections & Pace
    const now = new Date();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const currentDay = (viewMonth === now.getMonth() && viewYear === now.getFullYear()) ? now.getDate() : daysInMonth;
    const avgPerDay = posters / (currentDay || 1);
    const projectedPosters = Math.round(avgPerDay * daysInMonth);
    
    const expectedProgress = (currentWorkspace.posterTarget / daysInMonth) * currentDay;
    const isAhead = posters >= expectedProgress;
    const paceStatus = posters >= expectedProgress * 1.1 ? 'ahead' : (posters < expectedProgress * 0.9 ? 'behind' : 'on-track');
    const paceLabel = getTranslation(`smart_pace_${paceStatus.replace('-', '_')}`);

    var pPct = Math.min(100, Math.round(posters / (currentWorkspace.posterTarget || 1) * 100));
    var hPct = Math.min(100, Math.round(totalHrs / (currentWorkspace.hoursTarget || 1) * 100));
    
    // Calculate KPI Percentage for visual feedback
    const kpiPct = Math.min(100, Math.round((totalKPI / 120) * 100));
    const kpiBarHtml = `
        <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; margin-top: 8px; overflow: hidden;">
            <div style="width: ${kpiPct}%; height: 100%; background: var(--primary); transition: width 1s ease;"></div>
        </div>
    `;

    const kpiBreakdown = `
        <div style="font-size: 9px; color: var(--text-muted); margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <span>Target: ${ptsPosterGoal}pt</span>
            <span>Creative: ${ptsCreative}pt</span>
            <span>Standards: ${ptsOnTime + ptsQuality + ptsPerformance}pt</span>
            <span>Bonus: ${ptsOvertime}pt</span>
        </div>
    `;

    const kpiTitle = currentLang === 'kh' ? 'ពិន្ទុ KPI សរុប' : 'Total KPI Score';

    if (document.getElementById("poster")) document.getElementById("poster").textContent = posters || 0;
    if (document.getElementById("hours")) document.getElementById("hours").textContent = totalHrs.toFixed(1);

    if (document.getElementById("ringPosterPct")) document.getElementById("ringPosterPct").textContent = pPct + "%";
    if (document.getElementById("ringPosterDesc")) {
        document.getElementById("ringPosterDesc").innerHTML = `
            ${posters} / ${currentWorkspace.posterTarget} 
            <span class="smart-pace-badge pace-${paceStatus}">${paceLabel}</span>
            <div style="font-size: 10px; margin-top: 4px; color: var(--text-muted);">
                ${getTranslation('smart_projected')}: <strong>${projectedPosters}</strong>
            </div>
        `;
    }
    if (document.getElementById("barPoster")) document.getElementById("barPoster").style.width = pPct + "%";
    if (document.querySelector(".card-blue .card-sub")) document.querySelector(".card-blue .card-sub").innerHTML = `<strong>${totalKPI}/120</strong> ${kpiBarHtml} ${kpiBreakdown}`;

    if (document.getElementById("ringHoursPct")) document.getElementById("ringHoursPct").textContent = hPct + "%";
    if (document.getElementById("ringHoursDesc")) document.getElementById("ringHoursDesc").textContent = totalHrs.toFixed(1) + " / " + currentWorkspace.hoursTarget;
    if (document.getElementById("barHours")) document.getElementById("barHours").style.width = hPct + "%";

    const insight = getSmartPerformanceInsight(posters, totalHrs);
    const insightEl = document.getElementById("smartPerformanceText");
    if (insightEl) {
        insightEl.innerHTML = `${insight}`;
    }

    try {
        renderTable(tableData);
        updateGreeting();
        updateSortUI();
        updateToolSummaries();

        const chartData = searchQuery ? tableData : activeMonthData;
        renderRings(pPct, hPct);
        renderCharts(chartData);
        renderCalendar();
        if (currentView === 'notes') renderNotes();
        if (currentView === 'loan') renderLoans(); // New: Render loans
        if (currentView === 'income') renderIncomes();
        if (currentView === 'expense') renderExpenses(); // New: Render expenses
        if (currentView === 'todo') renderTodos();
        if (currentView === 'kanban') renderKanbanBoard();
    } catch (e) { console.error("Error in sub-renderers:", e); }

    updateSidebarBadges();

    // Smart Ticker: Hide if today's report is submitted for the ACTIVE project
    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const hasReportToday = appData.some(d => 
        d.date === todayStr && (d.workspaceId || "default") === activeWorkspaceId
    );

    let tickerLabelText = getTranslation('ticker_label_reminder') || "REMINDER";
    const todayHoliday = khmerHolidays[todayStr];
    const todayDayOfWeek = todayObj.getDay();
    const isTodayWeekend = todayDayOfWeek === 0 || todayDayOfWeek === 6;
    let dayTypeMsg = "";
    let holidayAdvice = "";

    if (todayHoliday) {
        const holidayName = todayHoliday[currentLang];
        dayTypeMsg = ` ✦ ${getTranslation('ticker_msg_today_holiday_prefix')} ${holidayName}! `;
        holidayAdvice = getTranslation('ticker_msg_holiday_enjoy');
        tickerLabelText = getTranslation('ticker_label_holiday');
    } else if (isTodayWeekend) {
        dayTypeMsg = ` ✦ ${getTranslation('ticker_msg_today_weekend')} `;
        if (tickerLabelText === getTranslation('ticker_label_reminder')) {
            tickerLabelText = getTranslation('ticker_label_weekend');
        }
    } else {
        dayTypeMsg = ` ✦ ${getTranslation('ticker_msg_today_workday')} `;
        if (tickerLabelText === getTranslation('ticker_label_reminder')) {
            tickerLabelText = getTranslation('ticker_label_workday');
        }
    }

    // 1. Smart Deadline Countdown
    let deadlineMsg = "";
    if (!hasReportToday) {
        const deadline = new Date();
        deadline.setHours(17, 30, 0, 0); // 5:30 PM
        
        if (now < deadline) {
            const diffMs = deadline - now;
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            deadlineMsg = ` ✦ ${getTranslation('ticker_deadline_prefix')} ${diffHrs}h ${diffMins}m! `;
            tickerLabelText = getTranslation('ticker_label_deadline');
        }
    }

    // 2. Smart Daily Pace Advice
    let paceAdvice = "";
    if (viewMonth === now.getMonth() && viewYear === now.getFullYear()) {
        if (posters < expectedProgress) {
            const gap = Math.ceil(expectedProgress - posters);
            paceAdvice = currentLang === 'kh' 
                ? ` ✦ បងខ្វះប្រហែល ${gap} ផ្ទាំងទៀតដើម្បីតាមផែនការថ្ងៃនេះ! `
                : ` ✦ You're about ${gap} posters away from today's ideal pace. `;
            if (tickerLabelText === "REMINDER") tickerLabelText = currentLang === 'kh' ? "ដំបូន្មាន" : "ADVICE";
        }
    }

    // 3. Security Awareness (Protocol Check)
    let securityMsg = "";
    if (window.location.protocol === 'file:') {
        securityMsg = ` ✦ [${getTranslation('ticker_label_security')}] ${getTranslation('ticker_msg_security')} `;
        if (tickerLabelText === "REMINDER") {
            tickerLabelText = getTranslation('ticker_label_security');
        }
    }

    // Loan Reminders for Ticker
    let loanTickerMsg = "";
    const loanTodayObj = new Date();
    loanTodayObj.setHours(0,0,0,0);
    const parseD = (s) => { const p = s.split('-'); return new Date(p[0], p[1]-1, p[2]); };
    
    appLoans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        const next = schedule.find(p => !p.isPaid && parseD(p.dueDate) >= loanTodayObj);
        if (next) {
            const dDate = parseD(next.dueDate);
            const diff = Math.ceil((dDate - loanTodayObj) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff <= 5) {
                const timeStr = diff === 0 ? (currentLang === 'kh' ? "ថ្ងៃនេះ" : "TODAY") : (currentLang === 'kh' ? `នៅសល់ ${diff} ថ្ងៃ` : `${diff} days left`);
                loanTickerMsg += ` ✦ [LOAN] ${loan.name}: ${timeStr} (${formatDisplayDate(next.dueDate)})! `;
                tickerLabelText = currentLang === 'kh' ? "ហិរញ្ញវត្ថុ" : "FINANCE";
            }
        }
    });

    // Holiday Reminders for Ticker
    let holidayTickerMsg = "";
    for (let i = 0; i <= 7; i++) {
        const d = new Date();
        d.setDate(new Date().getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        if (khmerHolidays[dateStr]) {
            const hName = khmerHolidays[dateStr][currentLang];
            const timeStr = i === 0 ? (currentLang === 'kh' ? "ថ្ងៃនេះ" : "TODAY") : (currentLang === 'kh' ? `នៅសល់ ${i} ថ្ងៃ` : `${i} days left`);
            holidayTickerMsg += ` ✦ [FESTIVAL] ${hName}: ${timeStr}! `;
            if (i === 0) tickerLabelText = currentLang === 'kh' ? "ថ្ងៃឈប់សម្រាក" : "HOLIDAY";
        }
    }

    // Productivity Nudges
    let productivityMsg = "";
    if (posters < currentWorkspace.posterTarget) {
        const remaining = currentWorkspace.posterTarget - posters;
        if (remaining <= 5 && remaining > 0) {
            productivityMsg = currentLang === 'kh' 
                ? ` ✦ ជិតដល់ហើយ! នៅសល់តែ ${remaining} ផ្ទាំងទៀតប៉ុណ្ណោះដើម្បីសម្រេចគោលដៅខែនេះ! ` 
                : ` ✦ Almost there! Only ${remaining} posters left to reach your monthly goal! `;
            tickerLabelText = currentLang === 'kh' ? "គោលដៅ" : "PROGRESS";
        }
    }

    // Task Reminders
    let taskMsg = "";
    const pendingUrgent = appTodos.filter(t => !t.completed && (t.labels?.includes('Urgent') || t.title?.startsWith('!'))).length;
    if (pendingUrgent > 0) {
        taskMsg = currentLang === 'kh'
            ? ` ✦ អ្នកមានការងារបន្ទាន់ចំនួន ${pendingUrgent} ដែលមិនទាន់បានបញ្ចប់! `
            : ` ✦ You have ${pendingUrgent} urgent tasks pending! `;
        if (tickerLabelText === "REMINDER" || tickerLabelText === "PROGRESS") {
            tickerLabelText = currentLang === 'kh' ? "ការងារ" : "TASKS";
        }
    }

    const ticker = document.querySelector(".ticker-wrap");
    const tickerText = document.getElementById("newsTicker");
    const tickerLabel = document.querySelector(".ticker-label");

    if (ticker && tickerText && tickerLabel) {
        const toolMsg = (appPrefs.toolMessages && currentView && appPrefs.toolMessages[currentView]) ? appPrefs.toolMessages[currentView] : "";
        const defaultMsg = t[currentLang].news_ticker;
        let baseMsg = toolMsg !== "" ? toolMsg : defaultMsg;
        
        let finalMsg;
        if (todayHoliday) {
            finalMsg = `${dayTypeMsg}${holidayAdvice}`;
        } else {
            finalMsg = `${dayTypeMsg}${securityMsg}${deadlineMsg}${paceAdvice}${holidayTickerMsg}${loanTickerMsg}${productivityMsg}${taskMsg}`;
            if (finalMsg.trim() !== "") {
                finalMsg = `${finalMsg} — ${baseMsg}`;
            } else {
                finalMsg = baseMsg;
            }
        }
            
        tickerLabel.innerHTML = `${tickerLabelText}`;

        tickerText.textContent = finalMsg;

        if (todayHoliday) {
            ticker.style.cursor = 'pointer';
            ticker.onclick = () => {
                if (typeof toggleCalendar === 'function') toggleCalendar();
            };
        } else {
            ticker.style.cursor = 'default';
            ticker.onclick = null;
        }

        // Visibility: Enabled AND (Loan alert OR Tool message OR Missing report on dashboard)
        const isFocusHidden = appPrefs.focusMode && hasReportToday;
        const shouldShow = appPrefs.showTicker && !isFocusHidden && (
            todayHoliday ||
            (toolMsg !== "") ||
            (productivityMsg !== "") ||
            (securityMsg !== "") ||
            (taskMsg !== "") ||
            ((currentView === 'dashboard' || currentView === 'reports') && (!hasReportToday || loanTickerMsg !== ""))
        );
        ticker.style.display = shouldShow ? "flex" : "none";
    }

    // Update Actions visibility based on view
    const isWorkView = (currentView === 'dashboard');
    const reportActions = ["sideActionReport", "syncCSV", "sideActionExcel", "sideActionClear"];
    
    reportActions.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isWorkView ? 'flex' : 'none';
    });
    
    // Re-trigger staggered animation if this is the first render for a view
    if (!document.querySelector('.animate-stagger')) {
        triggerStagger();
    }
}

// Function to render all views that might be visible (e.g., after data load)
function renderAllViews() {
    renderDashboard();
    renderIncomes();
    renderExpenses();
    renderNotes();
    renderTodos();
    renderKanbanBoard();
    renderLoans();
    renderEagleGallery();
    renderCalendar();
}
function updateMonthDisplay() {
    const el = document.getElementById("currentViewLabel");
    if (!el) return;
    const d = new Date(viewYear, viewMonth, 1);
    el.textContent = d.toLocaleString(currentLang === 'kh' ? 'km-KH' : 'en-US', { month: 'long', year: 'numeric' });
}

function changeMonth(dir) {
    viewMonth += dir;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    clearSearchInput(); // Clear search query on month change
    render();
}

function goToday() {
    viewMonth = new Date().getMonth();
    viewYear = new Date().getFullYear();
    clearSearchInput(); // Clear search query on going to today
    render();
}

function changeCalendarMonth(dir) {
    viewMonth += dir;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    clearSearchInput(); // Clear search query on calendar month change
    renderCalendar(); // Re-render the calendar for the new month
}

function toggleCalendar() {
    const modal = document.getElementById("calendarModal");
    if (!modal) return;
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
    renderCalendar();
}

function closeCalendarModal() {
    const modal = document.getElementById("calendarModal");
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const missingEl = document.getElementById("missingDaysInfo");
    const calendarMonthYearDisplay = document.getElementById("calendarMonthYearDisplay");
    const eventsSummaryEl = document.getElementById("calendarEventsSummary");

    if (calendarMonthYearDisplay) {
        const d = new Date(viewYear, viewMonth, 1);
        calendarMonthYearDisplay.textContent = `(${d.toLocaleString(currentLang === 'kh' ? 'km-KH' : 'en-US', { month: 'long', year: 'numeric' })})`;
    }
    if (!grid) return;
    grid.innerHTML = "";
    if (missingEl) missingEl.innerHTML = "";
    if (eventsSummaryEl) eventsSummaryEl.innerHTML = "";

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();

    const daysOfWeek = currentLang === 'kh' 
        ? ["អា", "ច", "អ", "ពុ", "ព្រ", "សុ", "ស"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    daysOfWeek.forEach(d => {
        const h = document.createElement("div");
        h.className = "calendar-header";
        h.textContent = d;
        grid.appendChild(h);
    });

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement("div"));
    }

    let missingDays = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    // Collect loan due dates for the current month
    const loanDueDatesMap = new Map(); // Map<dateStr, Array<loanName>>
    appLoans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        schedule.forEach(payment => {
            const paymentDate = new Date(payment.dueDate);
            if (paymentDate.getFullYear() === viewYear && paymentDate.getMonth() === viewMonth) {
                const dateStr = payment.dueDate; // Already YYYY-MM-DD
                if (!loanDueDatesMap.has(dateStr)) loanDueDatesMap.set(dateStr, []);
                loanDueDatesMap.get(dateStr).push(loan.name);
            }
        });
    });

    // Array to collect events for summary
    const monthlyEventsList = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(viewYear, viewMonth, d);
        // Corrected: Manually construct date string to avoid timezone issues
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday = dateStr === todayStr;
        const hasLoanPayment = loanDueDatesMap.has(dateStr);
        const holiday = khmerHolidays[dateStr];
        const hasReport = appData.some(item => 
            item.date === dateStr &&
            String(item.workspaceId || "default") === String(activeWorkspaceId)
        );
        const dayEvents = appEvents.filter(e => e.date === dateStr);
        const hasCustomEvent = dayEvents.length > 0;

        const cell = document.createElement("div");
        cell.className = "calendar-day";
        cell.textContent = d;
        
        if (isWeekend) cell.classList.add("weekend");
        if (holiday) {
            cell.classList.add("holiday");
            cell.title = holiday[currentLang];
        }
        if (hasReport) cell.classList.add("has-report");
        if (hasLoanPayment) {
            cell.classList.add("has-loan-payment");
            const loanNames = loanDueDatesMap.get(dateStr).join(', ');
            cell.title = (cell.title ? cell.title + '\n' : '') + `${getTranslation('loan_due_date')}: ${loanNames}`;
        }
        if (hasCustomEvent) {
            cell.classList.add("has-custom-event");
            const eventTitles = dayEvents.map(ev => ev.title).join(', ');
            cell.title = (cell.title ? cell.title + '\n' : '') + `Events: ${eventTitles}`;
        }

        if (hasCustomEvent || holiday) {
            monthlyEventsList.push({ 
                date: dateStr, 
                events: dayEvents,
                holidayName: holiday ? holiday[currentLang] : null
            });
        }
        if (isToday) cell.classList.add("current-day");
        
        if (!isWeekend && !holiday && dateObj <= today && !hasReport) { // Only mark missing if it's not a weekend, holiday, and it's today or in the past
            cell.classList.add("missing-report");
            missingDays.push(d);
        }

        cell.onclick = () => openDayEventsModal(dateStr);

        grid.appendChild(cell);
    }

    if (missingDays.length > 0 && missingEl) {
        missingEl.innerHTML = `<span style="color:#ef4444; font-weight:700">
            ${t[currentLang].missing_reports} 
            ${missingDays.join(', ')}</span>`;
    }

    // Render the monthly events summary list below the calendar
    if (eventsSummaryEl) {
        if (monthlyEventsList.length === 0) {
            eventsSummaryEl.innerHTML = `<div style="font-size:10px; color:var(--text-muted); text-align:center; padding:10px; border: 1px dashed var(--border-color); border-radius: 8px;">${currentLang === 'kh' ? 'មិនទាន់មានព្រឹត្តិការណ៍សម្រាប់ខែនេះ' : 'No events scheduled for this month.'}</div>`;
        } else {
            eventsSummaryEl.innerHTML = `
                <div style="font-size:10px; font-weight:800; color:var(--primary); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    ${currentLang === 'kh' ? 'បញ្ជីព្រឹត្តិការណ៍ប្រចាំខែ' : 'Monthly Events Summary'}
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
                    ${monthlyEventsList.map(item => `
                        <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; border-left: 3px solid ${item.holidayName ? '#ef4444' : '#f59e0b'};">
                            <div style="font-size: 9px; font-weight: 800; color: var(--text-muted); margin-bottom: 2px;">${formatDisplayDate(item.date)}</div>
                            ${item.holidayName ? `
                                <div style="font-size: 11px; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                                    <span style="font-size: 12px;">🇰🇭</span> ${item.holidayName}
                                </div>
                            ` : ''}
                            ${item.events.map(ev => `
                                <div style="font-size: 11px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                                    <span style="color:#f59e0b">•</span> ${ev.title}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
}

// ===== SORTING =====
function toggleSort(key) {
    if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.dir = 'asc';
    }
    render();
}

function setDateSort(dir) {
    currentSort.key = 'date';
    currentSort.dir = dir;
    render();
}

function updateSortUI() {
    const btnAsc = document.getElementById("btnSortAsc");
    const btnDesc = document.getElementById("btnSortDesc");
    if (btnAsc && btnDesc) {
        const isAsc = currentSort.key === 'date' && currentSort.dir === 'asc';
        const isDesc = currentSort.key === 'date' && currentSort.dir === 'desc';
        btnAsc.classList.toggle("active", isAsc);
        btnDesc.classList.toggle("active", isDesc);
    }
}

// ===== TABLE =====
function renderTable(dataToRender) {
    var tb = document.getElementById("tableBody");
    const data = dataToRender || appData;

    if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" class="empty">' + t[currentLang].empty_msg + 
            '<br><button class="btn btn-outline" style="margin-top:12px; font-size: 11px;" onclick="openHelpModal(\'guide\')">' + 
            (currentLang === 'kh' ? 'មើលការណែនាំរហ័ស ✦' : 'View Quick Guide ✦') + '</button></td></tr>';
        return;
    }

    var html = "";
    var sorted = [].concat(data).sort(function(a, b) {
        const valA = a[currentSort.key] ?? "";
        const valB = b[currentSort.key] ?? "";
        let res;

        if (currentSort.key === 'date') {
            // Safe string comparison for YYYY-MM-DD format (timezone independent)
            res = String(valA).localeCompare(String(valB));
        } else if (typeof valA === 'number' && typeof valB === 'number') {
            res = valA - valB;
        } else {
            // Use numeric sorting for strings (e.g., "10" comes after "2")
            res = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        }
        
        // Secondary sort by date if primary keys are identical
        if (res === 0 && currentSort.key !== 'date') {
            res = String(a.date).localeCompare(String(b.date));
        }
        return currentSort.dir === 'asc' ? res : -res;
    });
    var lastDate = "";

    sorted.forEach(function(d) {
        var ri = appData.indexOf(d);
        var isNewDate = d.date !== lastDate;
        
        // Calculate daily total hours for the "Smart" group header
        let dailyTotal = 0;
        if (isNewDate) {
            const actualDailyHours = sorted.filter(item => item.date === d.date).reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0);
            dailyTotal = parseFloat(Math.min(actualDailyHours, DAILY_HOUR_LIMIT).toFixed(1));
        }

        const imgHint = d.savedPath ? `title="File saved as: ${d.savedPath}"` : '';
        const hourLabel = currentLang === 'kh' ? 'ម៉ោងសរុប' : 'total';
        const hUnit = currentLang === 'kh' ? 'ម' : 'h';

        html += '<tr>' +
            '<td class="date-col">' + (isNewDate ? `<div class="date-main">${formatDisplayDate(d.date)}</div><div class="date-total">${dailyTotal}${hUnit} ${hourLabel}</div>` : '') + '</td>' +
            '<td style="font-weight:500;color:var(--text-main)">' +
                (d.image ? `<img src="${d.image}" ${imgHint} onclick="showPreview('${d.image}')" style="width:24px;height:24px;border-radius:4px;vertical-align:middle;margin-right:8px;object-fit:cover;cursor:pointer">` : '') +
                (!isNewDate ? '<span class="sub-indicator">└</span> ' : '') + 
                highlightText(d.task, searchQuery) + '</td>' +
            '<td><span class="badge ' + badgeFor(d.category) + '">' + highlightText(getCatLabel(d.category), searchQuery) + '</span></td>' +
            '<td style="font-weight:600">' + (d.quantity || 1) + '</td>' +
            '<td style="font-weight:600">' + Number(d.hours).toFixed(1) + 'h</td>' +
            '<td style="display:flex;gap:4px"><button class="del-btn" onclick="openModal(' + ri + ')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="del-btn" onclick="delItem(' + ri + ')">✕</button></td>' +
            '</tr>';
        lastDate = d.date;
    });
    tb.innerHTML = html;
}

function drawRing(canvasId, pct, color) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var size = 50, cx = size / 2, cy = size / 2, r = 18, lw = 4;
    canvas.width = size * 2; canvas.height = size * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = lw;
    ctx.stroke();
    var angle = Math.PI * 2 * (pct / 100);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.strokeStyle = color === "#3b82f6" ? "#6366f1" : color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();
}

function renderRings(pPct, hPct) {
    drawRing("ringPoster", pPct, "#6366f1");
    drawRing("ringHours", hPct, "#10b981");

    const rpPct = document.getElementById("ringPosterPct");
    const rhPct = document.getElementById("ringHoursPct");

    // Animate the percentage text only if it's not already at the target
    if (rpPct) {
        const currentPosterPct = parseInt(rpPct.textContent) || 0;
        if (currentPosterPct !== pPct) {
            animateValue("ringPosterPct", currentPosterPct, pPct, 600);
        } else {
            rpPct.textContent = pPct + "%";
        }
    }
    if (rhPct) {
        const currentHoursPct = parseInt(rhPct.textContent) || 0;
        if (currentHoursPct !== hPct) {
            animateValue("ringHoursPct", currentHoursPct, hPct, 600);
        } else {
            rhPct.textContent = hPct + "%";
        }
    }
}

function renderCharts(data) {
    const ctxLine = document.getElementById('lineChart');
    const ctxBar = document.getElementById('barChart');
    
    if (typeof Chart === 'undefined' || !ctxLine || !ctxBar) return;

    // 1. Activity Over Time: Quantity per day
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const dailyData = new Array(daysInMonth).fill(0);
    
    (data || []).forEach(d => {
        if (!d.date || typeof d.date !== 'string') return;
        const parts = d.date.split(/[-/]/); // More robust splitting
        const day = parts.length === 3 ? parseInt(parts[2]) : NaN;
        if (day >= 1 && day <= daysInMonth) {
            dailyData[day - 1] += (Number(d.quantity) || 1);
        }
    });

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: getTranslation('chart_hours_sub'),
                data: dailyData,
                borderColor: appPrefs.accentColor || '#6366f1',
                backgroundColor: (appPrefs.accentColor || '#6366f1') + '20',
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: appPrefs.accentColor || '#6366f1',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const day = labels[index];
                    // Construct YYYY-MM-DD format
                    const fullDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const searchInput = document.getElementById("searchInput");
                    if (searchInput) {
                        searchInput.value = fullDate;
                        handleSearch(fullDate);
                        showToast(`${getTranslation('th_date')}: ${formatDisplayDate(fullDate)}`, "info");
                    }
                }
            },
            onHover: (e, elements) => {
                e.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
            }
        }
    });

    // 2. By Category: Count per category
    const catMap = {};
    data.forEach(d => {
        const label = getCatLabel(d.category);
        catMap[label] = (catMap[label] || 0) + 1;
    });

    if (barChart) barChart.destroy();
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(catMap),
            datasets: [{
                label: getTranslation('chart_cat_sub'),
                data: Object.values(catMap),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const catLabels = Object.keys(catMap);
                    const searchInput = document.getElementById("searchInput");
                    if (searchInput) {
                        searchInput.value = catLabels[index];
                        handleSearch(catLabels[index]);
                    }
                }
            },
            onHover: (e, elements) => {
                e.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            plugins: { legend: { display: false } },
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function renderIncomePieChart(receivedAmount, pendingAmount) {
    const ctx = document.getElementById('incomePieChart');
    if (typeof Chart === 'undefined' || !ctx) return;

    const data = [receivedAmount, pendingAmount];
    const labels = ['Received', 'Pending'];
    const colors = ['#10b981', '#f59e0b'];

    if (incomePieChart) incomePieChart.destroy();
    incomePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 10 } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const cur = appPrefs.currency || '$';
                            return `${context.label}: ${cur}${Number(context.raw).toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

function exportExcel() {
    if (appData.length === 0) { showToast(t[currentLang].alert_no_export, "error"); return; }

    const wb = XLSX.utils.book_new();

    const workspaceData = appData.filter(d => (d.workspaceId || "default") === activeWorkspaceId);

    const groups = workspaceData.reduce((acc, item) => {
        const d = new Date(item.date);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const key = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));

    sortedKeys.forEach(key => {
        // Transform to clean, translated column headers
        const sheetData = groups[key].map(item => ({
            [t[currentLang].th_date]: formatDisplayDate(item.date),
            [t[currentLang].th_task]: item.task,
            [t[currentLang].th_type]: getCatLabel(item.category),
            [t[currentLang].th_qty]: item.quantity || 1,
            [t[currentLang].th_hours]: Number(item.hours).toFixed(1)
        }));

        const ws = XLSX.utils.json_to_sheet(sheetData);

        // Apply Professional Styling
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const addr = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[addr]) continue;

                const isHeader = R === 0;
                ws[addr].s = {
                    font: { 
                        name: "Arial", 
                        sz: isHeader ? 12 : 11, 
                        bold: isHeader,
                        color: { rgb: isHeader ? "FFFFFF" : "1E293B" }
                    },
                    fill: { 
                        fgColor: { rgb: isHeader ? "4F46E5" : "FFFFFF" } 
                    },
                    alignment: { 
                        vertical: "center", 
                        horizontal: (isHeader || C >= 3) ? "center" : "left",
                        wrapText: true 
                    },
                    border: {
                        top: { style: "thin", color: { rgb: "94A3B8" } },
                        bottom: { style: "thin", color: { rgb: "94A3B8" } },
                        left: { style: "thin", color: { rgb: "94A3B8" } },
                        right: { style: "thin", color: { rgb: "94A3B8" } }
                    }
                };
            }
        }

        // Set column widths for visibility
        ws['!cols'] = [
            { wch: 18 }, // Date
            { wch: 50 }, // Task
            { wch: 25 }, // Type
            { wch: 8 },  // Qty
            { wch: 8 }   // Hours
        ];

        XLSX.utils.book_append_sheet(wb, ws, key);
    });

    const now = new Date();
    const fileName = `${currentWorkspace.name.replace(/\s+/g, '_').toLowerCase()}_report_${now.getFullYear()}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function exportLoanExcel() {
    if (appLoans.length === 0) {
        showToast(t[currentLang].alert_no_export, "error");
        return;
    }

    const wb = XLSX.utils.book_new();
    const parseLD = (s) => { const p = s.split('-'); return new Date(p[0], p[1]-1, p[2]); };
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Prepare Summary Data
    const summaryData = appLoans.map(loan => {
        const schedule = generateAmortizationSchedule(loan);
        const totalPaid = schedule.filter(p => p.isPaid).reduce((sum, p) => sum + p.monthlyPayment, 0);
        const remainingBalance = schedule.length > 0 ? schedule[schedule.length - 1].remainingBalance : loan.amount;
        const nextPayment = schedule.find(p => !p.isPaid && parseLD(p.dueDate) >= today);

        return {
            [t[currentLang].loan_name]: loan.name,
            [t[currentLang].loan_amount]: loan.amount,
            [t[currentLang].loan_interest_rate]: loan.interestRate + "%",
            [t[currentLang].loan_term_months]: loan.termMonths,
            [t[currentLang].loan_monthly_payment_short]: loan.monthlyPayment,
            [t[currentLang].loan_total_paid]: totalPaid,
            [t[currentLang].loan_remaining_balance]: remainingBalance,
            [t[currentLang].loan_next_payment]: nextPayment ? formatDisplayDate(nextPayment.dueDate) : "N/A"
        };
    });

    const wsReport = XLSX.utils.json_to_sheet(summaryData);
    
    // 2. Append Detailed Payment History below the summary
    let rowOffset = summaryData.length + 3;
    XLSX.utils.sheet_add_aoa(wsReport, [[t[currentLang].loan_payment_history.toUpperCase()]], { origin: `A${rowOffset}` });
    
    const historyData = [];
    appLoans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        schedule.forEach(p => {
            historyData.push({
                [t[currentLang].loan_name]: loan.name,
                [t[currentLang].th_date]: p.month,
                [t[currentLang].loan_due_date]: formatDisplayDate(p.dueDate),
                [t[currentLang].loan_monthly_payment_short]: p.monthlyPayment,
                [t[currentLang].loan_paid_status]: p.isPaid ? (currentLang === 'kh' ? "បង់រួច" : "Paid") : (currentLang === 'kh' ? "មិនទាន់បង់" : "Unpaid"),
                [t[currentLang].loan_paid_on]: p.paidDate ? formatDisplayDate(p.paidDate) : ""
            });
        });
    });
    
    XLSX.utils.sheet_add_json(wsReport, historyData, { origin: `A${rowOffset + 1}`, skipHeader: false });
    
    // Apply Professional Styling (Matching main export)
    const range = XLSX.utils.decode_range(wsReport['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsReport[addr]) continue;

            // Header rows are the summary header (0) and the history header (rowOffset)
            const isHeader = R === 0 || R === rowOffset;
            const isTitle = R === rowOffset - 1;

            wsReport[addr].s = {
                font: { 
                    name: "Arial", 
                    sz: isHeader || isTitle ? 11 : 10, 
                    bold: isHeader || isTitle,
                    color: { rgb: isHeader ? "FFFFFF" : (isTitle ? "4F46E5" : "1E293B") }
                },
                fill: { 
                    fgColor: { rgb: isHeader ? "4F46E5" : "FFFFFF" } 
                },
                alignment: { 
                    vertical: "center", 
                    horizontal: (isHeader || C >= 3) ? "center" : "left",
                    wrapText: true 
                },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            };
        }
    }

    // Adjust column widths for better readability
    wsReport['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, wsReport, "Loan_Full_Report");

    const now = new Date();
    const fileName = `BridgeWork_Loan_Report_${now.getFullYear()}_${now.getMonth() + 1}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast("Loan report exported!", "success");
}

// ===== EVENTS =====
document.addEventListener("DOMContentLoaded", async function() {
    // Start live widgets immediately so they aren't blocked by async calls
    setInterval(updateClock, 1000);
    updateClock();
    setInterval(updateWeather, 300000);
    updateWeather();
    setInterval(checkDailyReminder, 60000);
    
    // INITIALIZE APPLICATION
    await initializeApp();
    updateWorkspaceUI();

    document.getElementById("modal").addEventListener("click", function(e) {
        if (e.target === document.getElementById("modal")) closeModal();
    });
    document.getElementById("settingsModal").addEventListener("click", function(e) {
        if (e.target === document.getElementById("settingsModal")) closeSettings();
    });
    document.getElementById("reportModal").addEventListener("click", function(e) {
        if (e.target === document.getElementById("reportModal")) closeReportModal();
    });
    document.getElementById("workspaceModal").addEventListener("click", function(e) {
        if (e.target === document.getElementById("workspaceModal")) closeWorkspaceModal();
    });
    document.getElementById("calendarModal").addEventListener("click", function(e) {
        if (e.target === document.getElementById("calendarModal")) closeCalendarModal();
    });
    document.getElementById("loanModal").addEventListener("click", function(e) { // New: Loan Modal close
        if (e.target === document.getElementById("loanModal")) closeLoanModal();
    });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            closeModal();
            closeSettings();
            closeCalendarModal();
            closeReportModal();
            closeWorkspaceModal();
            closeLoanModal(); // New: Loan Modal close
            closeIncomeModal();
            closeLoanPaymentsModal(); // New: Loan Payments Modal close
            closeExpenseModal(); // New: Expense Modal close
            closeDayEventsModal(); // New: Close day events modal
            closePreview();
            closeHelpModal(); // New: Close help modal
        }
    });
    document.getElementById("searchInput").addEventListener("input", (e) => handleSearch(e.target.value));

    const syncBtn = document.getElementById("syncCSV");
    if (syncBtn) syncBtn.addEventListener("click", linkCSV);

    changeAppLang(currentLang);
    
    // Init Dark Mode
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeUI();
    updateProfileUI();
    updateBrandingUI();
    applyModuleVisibility();
    
    // Initialize custom covers
    ['dashboardView', 'notesView', 'todoView', 'loanView', 'incomeView'].forEach(async (view) => {
        await updateCoverUI(view);
    });
});

// Expose functions to window for HTML onclick attributes
window.triggerLogoUpload = triggerLogoUpload;
window.handleLogoUpload = handleLogoUpload;
window.triggerProfileUpload = triggerProfileUpload;
window.handleProfileUpload = handleProfileUpload;
window.switchWorkspace = switchWorkspace;
window.triggerCoverUpload = triggerCoverUpload;
window.handleCoverUpload = handleCoverUpload;
window.startRepositioning = startRepositioning;
window.saveRepositioning = saveRepositioning;
window.openWorkspaceModal = openWorkspaceModal;
window.closeWorkspaceModal = closeWorkspaceModal;
window.saveNewWorkspace = saveNewWorkspace;
window.updateWorkspaceField = updateWorkspaceField;
window.deleteActiveWorkspace = deleteActiveWorkspace;
window.setLang = changeAppLang;
window.showView = showView;
window.toggleDarkMode = toggleDarkMode;
window.addNote = addNote;
window.togglePin = togglePin;
window.convertNoteToTodo = convertNoteToTodo;
window.deleteNote = deleteNote;
window.handleNoteSearch = handleNoteSearch;
window.addTodo = addTodo;
window.editTodo = editTodo;
window.toggleTodo = toggleTodo;
window.updateTodoWorkspaceSelector = updateTodoWorkspaceSelector;
window.cycleTodoStatus = cycleTodoStatus;
window.deleteTodo = deleteTodo;
window.openLoanModal = openLoanModal;
window.closeLoanModal = closeLoanModal;
window.saveLoan = saveLoan;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;

window.handleHelpSearch = handleHelpSearch;
window.deleteLoan = deleteLoan;
window.toggleIncomePrivacy = toggleIncomePrivacy;
window.openIncomeModal = openIncomeModal;
window.closeIncomeModal = closeIncomeModal;
window.saveIncome = saveIncome;
window.openExpenseModal = openExpenseModal; // New: Expose expense modal functions
window.closeExpenseModal = closeExpenseModal;
window.saveExpense = saveExpense;
window.deleteIncome = deleteIncome;
window.openLoanPaymentsModal = openLoanPaymentsModal;
window.closeLoanPaymentsModal = closeLoanPaymentsModal;
window.toggleLoanPaymentStatus = toggleLoanPaymentStatus;
window.editLoanPaidDate = editLoanPaidDate;
window.showPreview = showPreview;
window.closePreview = closePreview;
window.previewImageAt = previewImageAt;
window.removeImageAt = removeImageAt;
window.addTaskRow = addTaskRow;
window.removeTaskRow = removeTaskRow;
window.closeModal = closeModal;
window.switchSettingsTab = switchSettingsTab;
window.updateModuleVisibility = updateModuleVisibility;
window.openSettings = openSettings;
window.saveProfile = saveProfile;
window.toggleSocialLinks = toggleSocialLinks;
window.closeSettings = closeSettings;
window.addCategory = addCategory;
window.delCategory = delCategory;
window.updateLimit = updateLimit;
window.render = render; // Expose the dispatcher render
window.handleSearch = handleSearch;
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.generateReport = generateReport;
window.addData = addData;
window.delItem = delItem;
window.clearAll = clearAll;
window.changeMonth = changeMonth;
window.goToday = goToday;
window.changeCalendarMonth = changeCalendarMonth;
window.toggleCalendar = toggleCalendar;
window.openDayEventsModal = openDayEventsModal;
window.closeDayEventsModal = closeDayEventsModal;
window.saveCustomEvent = saveCustomEvent;
window.deleteCustomEvent = deleteCustomEvent;
window.filterTasksForSelectedDay = filterTasksForSelectedDay;
window.closeCalendarModal = closeCalendarModal;
window.exportExcel = exportExcel;
window.exportLoanExcel = exportLoanExcel;
window.linkCSV = linkCSV;
window.importProjectFromCSV = importProjectFromCSV;
window.exportCSV = exportCSV;
window.toggleSort = toggleSort;
window.setDateSort = setDateSort;
window.renderKanbanBoard = renderKanbanBoard;
window.refreshEagleAssets = refreshEagleAssets;
window.backupData = backupData;
window.deleteExpense = deleteExpense; // New: Expose delete expense
window.renderHelpContent = renderHelpContent;
window.restoreData = restoreData;
window.resetAllSettings = resetAllSettings;

// ===== AI CHATBOT FUNCTIONALITY =====

let chatMessages = [];
let isTyping = false;
let chatMode = 'ai';

function updateChatModeUI() {
    const modeButton = document.getElementById('chatModeButton');
    const modeLabel = document.getElementById('chatModeLabel');
    if (!modeButton || !modeLabel) return;

    if (chatMode === 'manual') {
        modeButton.textContent = 'Switch to AI';
        modeLabel.textContent = 'Currently using manual mode';
    } else {
        modeButton.textContent = 'Switch to manual';
        modeLabel.textContent = 'Currently using AI';
    }
}

function toggleChatMode() {
    chatMode = chatMode === 'ai' ? 'manual' : 'ai';
    updateChatModeUI();
    showToast(`Chat mode switched to ${chatMode === 'ai' ? 'AI' : 'manual'}.`, 'success');
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Add user message
    addMessageToChat('user', message);
    input.value = '';
    input.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        let response;
        if (chatMode === 'manual') {
            response = getManualAssistantResponse(message);
        } else {
            response = await getAIResponse(message);
        }
        hideTypingIndicator();
        addMessageToChat('bot', response);
    } catch (error) {
        hideTypingIndicator();
        const userFriendlyError = error.message.includes('OpenAI') ? error.message : 'Sorry, I encountered an error. Please try again.';
        addMessageToChat('bot', userFriendlyError);
        console.error('Chatbot error:', error);
    }
}

async function getAIResponse(userMessage) {
    // Prepare context data for the AI
    const contextData = prepareContextData();
    
    const systemPrompt = `You are an AI assistant for BridgeWork Pro, a project management and productivity dashboard. You have access to the user's data and can provide insights, analysis, and help with their workflow.

Available data context:
- User: ${userName} (${userRole})
- Current workspace: ${currentWorkspace.name}
- Total projects: ${appData.length}
- Total notes: ${appNotes.length}
- Total todos: ${appTodos.length}
- Total income entries: ${appIncomes.length}
- Total expenses: ${appExpenses.length}
- Current month: ${viewMonth + 1}/${viewYear}

Be helpful, professional, and provide actionable insights. Keep responses concise but informative.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];

    // Add conversation history (last 5 messages)
    const recentMessages = chatMessages.slice(-10);
    recentMessages.forEach(msg => {
        messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    });

    const config = window.OPENAI_CONFIG;
    if (!config) {
        throw new Error('OpenAI configuration is missing. Make sure config.js is loaded.');
    }
    
    if (window.location.protocol === 'file:') {
        throw new Error('AI requests cannot run from file://. Please run "node server.js" and open http://localhost:3000/.');
    }

    const useProxy = Boolean(config.API_PROXY_URL);
    const apiUrl = useProxy ? config.API_PROXY_URL : config.API_URL;
    const apiKey = (config.API_KEY || '').trim();

    if (!apiUrl) {
        throw new Error('OpenAI API URL is missing in config.js.');
    }

    if (!useProxy && (!apiKey || apiKey === 'sk-...')) {
        throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY on the server or configure API_PROXY_URL.');
    }

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (!useProxy) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers,
            body: JSON.stringify({
                model: config.MODEL,
                messages: messages,
                max_tokens: config.MAX_TOKENS,
                temperature: config.TEMPERATURE
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from OpenAI API');
        }
        
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API call failed:', error, { userMessage });
        if (error.message.includes('429')) {
            return 'OpenAI quota exceeded. Please check your OpenAI account plan and billing details, or use a valid API key with available quota.';
        }
        // Provide helpful fallback responses based on the query
        const fallbackResponse = getFallbackResponse(userMessage);
        return fallbackResponse || `I apologize, but I'm having trouble connecting to the AI service right now. Please check your internet connection and try again. (${error.message})`;
    }
}

function prepareContextData() {
    // This function prepares relevant context data for the AI
    // You can expand this to include more dashboard data
    return {
        userName,
        userRole,
        currentWorkspace,
        appData: appData.slice(-10), // Last 10 entries
        appTodos: appTodos.slice(-5), // Recent todos
        appIncomes: appIncomes.slice(-5), // Recent income
        currentMonth: viewMonth + 1,
        currentYear: viewYear
    };
}

function addMessageToChat(type, content) {
    const messagesContainer = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${type}-avatar`;
    avatarDiv.innerHTML = getChatAvatar(type);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<div class="message-text">${formatMessage(content)}</div>`;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store message for context
    chatMessages.push({ type, content });
}

function getChatAvatar(type) {
    if (type === 'user') {
        const avatarSrc = window.currentUserAvatar || 'assets/images/tra.jpg';
        return `<img class="chat-avatar-img" src="${avatarSrc}" alt="${userName}" />`;
    }
    return `
        <div class="chat-avatar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3C9.243 3 7 5.243 7 8v1.5C7 11.328 8.172 12.5 9.5 12.5h5c1.328 0 2.5-1.172 2.5-2.5V8c0-2.757-2.243-5-5-5z"/>
                <path d="M7 18c0-2.761 2.239-5 5-5s5 2.239 5 5v1H7v-1z"/>
                <path d="M9 18v2m6-2v2" stroke-linecap="round"/>
            </svg>
        </div>`;
}

function formatMessage(text) {
    // Basic markdown-like formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    isTyping = true;
    const messagesContainer = document.getElementById('chatMessages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
    
    // Auto-resize textarea
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function sendQuickMessage(message) {
    document.getElementById('chatInput').value = message;
    sendMessage();
}

function getFallbackResponse(userMessage) {
    return getManualAssistantResponse(userMessage);
}

function getManualAssistantResponse(userMessage) {
    const message = userMessage.toLowerCase();
    const totalProjects = appData.length;
    const totalHours = appData.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0);
    const totalIncome = appIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalExpenses = appExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const activeTasks = appTodos.filter(t => !t.completed);
    const completedTasks = appTodos.filter(t => t.completed);
    const monthlyGoal = currentWorkspace.incomeTarget || 1000;
    const incomeProgress = monthlyGoal > 0 ? (totalIncome / monthlyGoal * 100).toFixed(1) : '0.0';
    const findMatch = message.match(/(?:find|search for|look for|show me|show)\s+(.+)/);
    const searchTerm = findMatch ? findMatch[1].trim().replace(/[?\.!]$/, '') : '';

    if (message.includes('summarize') || message.includes('summary') || message.includes('overview') || message.includes('report')) {
        return `📊 **Manual Summary**\n\n• Total Projects: ${totalProjects}\n• Total Hours Worked: ${totalHours.toFixed(1)}\n• Total Income: $${totalIncome.toFixed(2)}\n• Total Expenses: $${totalExpenses.toFixed(2)}\n• Active Tasks: ${activeTasks.length}\n• Completed Tasks: ${completedTasks.length}\n\nAsk for a breakdown by project, income, expense, or tasks.`;
    }

    if (message.includes('income') || message.includes('revenue') || message.includes('money') || message.includes('goal') || message.includes('trend')) {
        return `💰 **Income Summary**\n\n• Total Income: $${totalIncome.toFixed(2)}\n• Monthly Goal: $${monthlyGoal}\n• Progress: ${incomeProgress}%\n• ${totalIncome >= monthlyGoal ? '🎉 Goal achieved!' : `${(monthlyGoal - totalIncome).toFixed(2)} more to reach goal.`}`;
    }

    if (message.includes('expense') || message.includes('cost') || message.includes('spend') || message.includes('debt') || message.includes('budget')) {
        return `💸 **Expense Summary**\n\n• Total Expenses: $${totalExpenses.toFixed(2)}\n• Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}\n\nUse your expense tracker for item-level details.`;
    }

    if (message.includes('task') || message.includes('todo') || message.includes('pending') || message.includes('active') || message.includes('deadline')) {
        const topTasks = activeTasks.slice(0, 5).map(task => `• ${task.title || task.text || 'Untitled task'} (${task.status || 'open'})`).join('\n');
        return `📝 **Task Summary**\n\n• Active Tasks: ${activeTasks.length}\n• Completed Tasks: ${completedTasks.length}\n\n${topTasks || 'No active tasks currently.'}`;
    }

    if (message.includes('project') || message.includes('work')) {
        const recentProjects = appData.slice(-5).map(item => `• ${item.project || item.task || 'Untitled'} — ${item.hours || 0}h`).join('\n');
        return `📁 **Recent Projects**\n\n${recentProjects || 'No recent projects found.'}`;
    }

    if (message.includes('recent reports') || message.includes('show me recent')) {
        const recentEntries = appData.slice(-10).map(item => `• ${item.date || 'No date'} - ${item.project || item.task || 'Untitled'} (${item.hours || 0}h)`).join('\n');
        return `🔍 **Recent Reports**\n\nHere are your last 10 work entries:\n${recentEntries || 'No recent entries found.'}`;
    }

    if (message.includes('materials') || message.includes('what materials')) {
        return `📋 **Material Needs**\n\nBased on your construction reports, common materials include:\n• Steel reinforcements\n• Concrete\n• Electrical components\n• Safety equipment\n\nCheck your sp_construction_material_report.csv for detailed inventory.`;
    }

    if (message.includes('optimize') || message.includes('workflow') || message.includes('productivity')) {
        return `⚡ **Workflow Optimization Tips**\n\n• Use the dashboard to track progress daily\n• Set income goals to stay motivated\n• Complete high-priority tasks first\n• Export reports regularly for backups\n• Review expenses weekly to control costs\n\nYour current efficiency: ${totalProjects > 0 ? (totalHours / totalProjects).toFixed(1) : 0} hours per project.`;
    }

    if (message.includes('plan') || message.includes('next project')) {
        const avgHours = totalProjects > 0 ? totalHours / totalProjects : 0;
        const avgIncome = totalProjects > 0 ? totalIncome / totalProjects : 0;
        return `📅 **Project Planning**\n\nBased on your history:\n• Average hours per project: ${avgHours.toFixed(1)}\n• Average income per project: $${avgIncome.toFixed(2)}\n• Suggested next steps:\n  1. Review pending tasks\n  2. Check material availability\n  3. Set realistic deadlines\n  4. Budget for expenses\n\nStart by adding a new project in the dashboard!`;
    }

    if (searchTerm) {
        const entries = [];
        const lowerSearch = searchTerm.toLowerCase();

        appData.forEach(item => {
            const query = `${item.project || ''} ${item.task || ''} ${item.notes || ''}`.toLowerCase();
            if (query.includes(lowerSearch)) {
                entries.push(`• ${item.project || item.task || 'Untitled'} (${item.hours || 0}h)`);
            }
        });
        appTodos.forEach(task => {
            const query = `${task.title || task.text || ''}`.toLowerCase();
            if (query.includes(lowerSearch)) {
                entries.push(`• TODO: ${task.title || task.text || 'Untitled task'} (${task.status || 'open'})`);
            }
        });

        if (entries.length) {
            return `🔎 **Search Results for '${searchTerm}'**\n\n${entries.join('\n')}`;
        }
        return `🔎 I couldn't find any matching records for '${searchTerm}'.`;
    }

    if (message.includes('find') || message.includes('search')) {
        return `🔎 I can help search your projects and tasks. Try asking "Find project ..." or "Search for task ...".`;
    }

    return `🤖 Manual mode is active. I can summarize your work, review income/expenses, list your tasks, or search your data. Try asking: "Summarize my work", "Income summary", or "Find project ...".`;
}
