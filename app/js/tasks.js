// js/tasks.js
// Notes, To-Do, and Kanban board logic.

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
    const highlight = (str) => {
        if (!str) return "";
        return str
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="note-link">$1</a>')
            .replace(/\b(KPI|\d+(?:\.\d+)?pt|\d+\/month|\d+%)\b/gi, '<span class="highlight-val">$1</span>')
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
    showView('todo');
    showToast("Converted from note!", "success");
}

function renderNotes() {
    const grid = document.getElementById("notesGrid");
    if (!grid) return;
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
    `;
    }).join('');
}

function addTodo() {
    const input = document.getElementById("todoInput");
    const wsSelect = document.getElementById("todoWorkspaceSelect");
    const catSelect = document.getElementById("todoCategorySelect");
    const btn = document.querySelector("#todoView .todo-input-group .btn-primary");
    const val = input.value.trim();
    if (!val) return;
    const chosenCategory = catSelect ? catSelect.value : (appCategories[0] || 'General');
    if (currentTodoId) {
        const todo = appTodos.find(t => t.id === currentTodoId);
        if (todo) {
            todo.title = val;
            todo.text = val;
            todo.workspaceId = wsSelect ? wsSelect.value : activeWorkspaceId;
            todo.category = chosenCategory;
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
            text: val,
            completed: false,
            status: 'backlog',
            date: new Date().toISOString().split('T')[0],
            labels: val.startsWith('!') ? ['Urgent'] : [],
            workspaceId: wsSelect ? wsSelect.value : activeWorkspaceId,
            category: chosenCategory,
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
    const catSelect = document.getElementById("todoCategorySelect");
    const btn = document.querySelector("#todoView .todo-input-group .btn-primary");
    input.value = todo.title || todo.text;
    if (wsSelect) wsSelect.value = todo.workspaceId;
    if (catSelect) catSelect.value = todo.category || appCategories[0] || '';
    if (btn) btn.textContent = t[currentLang].btn_update;
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function cycleTodoStatus(id) {
    const todo = appTodos.find(t => t.id === id);
    if (!todo) return;
    const sequence = ['backlog', 'in-progress', 'review', 'done'];
    let currentIndex = sequence.indexOf(todo.status || 'backlog');
    let nextIndex = (currentIndex + 1) % sequence.length;
    todo.status = sequence[nextIndex];
    todo.completed = (todo.status === 'done');
    if (todo.status === 'done') {
        const confirmLog = confirm(currentLang === 'kh' 
            ? `ការងារនេះរួចរាល់ហើយ! ចង់បញ្ជូនទៅកាន់ Dashboard របស់គម្រោង ${getWorkspaceName(todo.workspaceId)} ដែរឬទេ?`
            : `Task finished! Would you like to log this as a completed item in the ${getWorkspaceName(todo.workspaceId)} Dashboard?`);
        if (confirmLog) await logTodoToWork(todo);
    }
    saveTodos();
    renderTodos();
}

async function logTodoToWork(todo) {
    const entry = {
        date: new Date().toISOString().split('T')[0],
        task: todo.title || todo.text,
        category: todo.category || appCategories[0],
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
    if (!todo) return;
    todo.completed = !todo.completed;
    todo.status = todo.completed ? 'done' : 'backlog';
    saveTodos();
    renderTodos();
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
    const filteredTodos = appTodos.filter(t => String(t.workspaceId || "default") === String(activeWorkspaceId));
    const total = filteredTodos.length;
    const completed = filteredTodos.filter(t => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    const today = new Date();
    const upcomingHolidays = [];
    for (let i = 0; i <= 10; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        if (khmerHolidays[dateStr]) {
            const hName = khmerHolidays[dateStr][currentLang];
            const alreadyDone = appData.some(item =>
                String(item.workspaceId || "default") === String(activeWorkspaceId) &&
                String(item.task || "").toLowerCase().includes(hName.toLowerCase())
            );
            if (!alreadyDone) upcomingHolidays.push({ name: hName, date: dateStr, daysLeft: i });
        }
    }

    const renderHolidaySuggestion = h => `
        <div class="todo-item todo-suggestion">
            <div class="icon-box" style="margin-right: 10px;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
            <div style="flex:1"><div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${h.name} Poster</div><div style="font-size: 10px; color: #f59e0b; font-weight: 700;">${h.daysLeft === 0 ? 'TODAY' : h.daysLeft + ' days remaining'}</div></div>
            <button class="btn btn-primary" style="font-size: 9px; padding: 4px 8px;" onclick="document.getElementById('todoInput').value='Design ${h.name} Poster'; addTodo();">Add Task</button>
        </div>
    `;

    if (filteredTodos.length === 0) {
        list.innerHTML = `
            ${upcomingHolidays.map(renderHolidaySuggestion).join('')}
            <div class="empty-state">${t[currentLang].todo_empty}</div>
        `;
    } else {
        const todayCheck = new Date();
        todayCheck.setHours(0, 0, 0, 0);
        const todayStr = todayCheck.toISOString().split('T')[0];
        const statuses = [
            { id: 'backlog', label: { en: 'Backlog', kh: 'ព្រាង' }, class: '' },
            { id: 'in-progress', label: { en: 'In Progress', kh: 'កំពុងធ្វើ' }, class: 'badge-orange' },
            { id: 'review', label: { en: 'Review', kh: 'ពិនិត្យ' }, class: 'badge-purple' },
            { id: 'done', label: { en: 'Done', kh: 'រួចរាល់' }, class: 'badge-blue' }
        ];

        const grouped = statuses.reduce((acc, status) => {
            acc[status.id] = [];
            return acc;
        }, {});

        const sortedTodos = [...filteredTodos].sort((a, b) => b.id - a.id);
        sortedTodos.forEach(task => {
            const key = task.status || (task.completed ? 'done' : 'backlog');
            grouped[key] = grouped[key] || [];
            grouped[key].push(task);
        });

        const renderCard = (task) => {
            const cleanText = (task.text || task.title || '').replace(/^!\s*/, '');
            const taskDate = new Date(task.date);
            const isOverdue = !task.completed && taskDate < todayCheck && task.date !== todayStr;
            const taskStatus = task.status || (task.completed ? 'done' : 'backlog');
            const statusLabel = statuses.find(s => s.id === taskStatus) || statuses[0];
            const category = task.category || appCategories[0] || 'General';
            const categoryClass = typeof badgeFor === 'function' ? badgeFor(category) : '';
            return `
                <div class="todo-card ${task.completed ? 'done' : ''} ${task.labels?.includes('Urgent') || task.text.startsWith('!') ? 'priority-high' : ''}">
                    <div class="todo-card-header">
                        <div class="todo-card-title">${cleanText}</div>
                        <button class="todo-status-pill ${statusLabel.class}" onclick="cycleTodoStatus(${task.id})" title="Change status">${statusLabel.label[currentLang]}</button>
                    </div>
                    <div class="todo-card-meta">
                        <span class="todo-category-badge ${categoryClass}">${getCatLabel(category)}</span>
                        <span>${getWorkspaceName(task.workspaceId)}</span>
                        <span>${task.date || ''}</span>
                    </div>
                    <div class="todo-card-footer">
                        <div class="todo-card-badges">
                            ${task.labels?.includes('Urgent') ? `<span class="priority-badge">${currentLang === 'kh' ? 'បន្ទាន់' : 'URGENT'}</span>` : ''}
                            ${isOverdue ? `<span class="priority-badge" style="background:#f59e0b">${currentLang === 'kh' ? 'ហួសកំណត់' : 'OVERDUE'}</span>` : ''}
                        </div>
                        <div class="todo-card-actions">
                            <button class="del-btn" onclick="editTodo(${task.id})" title="Edit task">✎</button>
                            <button class="todo-del" onclick="deleteTodo(${task.id})" title="Delete task">✕</button>
                        </div>
                    </div>
                </div>
            `;
        };

        let html = `
            <div class="todo-header-area">
                <div class="todo-title-row">
                    <div>
                        <h2>${currentLang === 'kh' ? 'បញ្ជីការងារត្រូវធ្វើ' : 'To-Do List'}</h2>
                        <p style="font-size:11px; color:var(--text-muted); margin:4px 0 0 0">✦ ${currentLang === 'kh' ? 'ផលិតភាព និងអាទិភាពប្រចាំថ្ងៃ' : 'Productivity & Daily Priorities'}</p>
                    </div>
                    <div class="todo-stats-text">${completed}/${total} ${currentLang === 'kh' ? 'រួចរាល់' : 'completed'} (${pct}%)</div>
                </div>
                <div class="todo-progress-bg"><div class="todo-progress-fill" style="width: ${pct}%"></div></div>
            </div>
        `;

        if (upcomingHolidays.length) {
            html += `<div class="todo-board-suggestions">${upcomingHolidays.map(h => `
                ${renderHolidaySuggestion(h)}
            `).join('')}</div>`;
        }

        html += `<div class="todo-board">${statuses.map(status => {
            const tasks = grouped[status.id] || [];
            return `
                <div class="todo-column">
                    <div class="todo-column-header">
                        <span>${status.label[currentLang]}</span>
                        <span class="todo-column-count">${tasks.length}</span>
                    </div>
                    <div class="todo-column-list">
                        ${tasks.length ? tasks.map(renderCard).join('') : `<div class="todo-column-empty">${currentLang === 'kh' ? 'មិនមានបញ្ជី' : 'No tasks'}</div>`}
                    </div>
                </div>
            `;
        }).join('')}</div>`;

        list.innerHTML = html;
    }
    updateSidebarBadges();
}

async function refreshEagleAssets() {
    showToast('Eagle Assets feature is coming soon!', 'info');
}

function renderEagleGallery() {
    const grid = document.getElementById("eagleGalleryGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 20px;">🚀</div><h3 style="margin-bottom: 10px; color: var(--primary);">Coming Soon</h3><p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">The Eagle Assets integration feature is currently under development. Stay tuned for updates!</p></div>`;
}

async function renderKanbanBoard() {
    const board = document.getElementById("kanbanBoard");
    if (!board) return;
    const statuses = [
        { id: 'backlog', label: 'BACKLOG' },
        { id: 'in-progress', label: 'IN PROGRESS' },
        { id: 'review', label: 'REVIEW' },
        { id: 'done', label: 'DONE' }
    ];
    board.innerHTML = statuses.map(status => {
        const tasks = appTodos.filter(t => {
            const taskStatus = t.status || (t.completed ? 'done' : 'backlog');
            return t.workspaceId === activeWorkspaceId && taskStatus === status.id;
        });
        return `
            <div class="kanban-column" data-status="${status.id}">
                <div class="kanban-column-header"><h3>${status.label}</h3><span class="kanban-column-count">${tasks.length}</span></div>
                <div class="kanban-cards">${tasks.map(task => renderKanbanCard(task)).sort((a,b) => b.id - a.id).join('')}</div>
            </div>
        `;
    }).join('');
    initDragAndDrop();
}

function renderKanbanCard(task) {
    const title = task.title || task.text || "Untitled Task";
    const date = task.date || "No Date";
    const labels = task.labels || (task.text && task.text.startsWith('!') ? ['Urgent'] : ['Feature']);
    const initials = task.initials || (userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : '??');
    const displayDate = date.includes('-') ? formatDisplayDate(date) : date;
    return `
        <div class="kanban-card" draggable="true" id="todo-${task.id}">
            <div class="kanban-card-labels">${labels.map(l => `<span class="kanban-label label-${l.toLowerCase()}">${l}</span>`).join('')}</div>
            <div class="kanban-card-title">${title}<span class="kanban-project-name">${getWorkspaceName(task.workspaceId)}</span></div>
            <div class="kanban-card-footer"><div class="kanban-card-date"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${displayDate}</span></div><div class="kanban-card-avatar" title="${userName}">${initials}</div></div>
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
        column.addEventListener("dragover", e => { e.preventDefault(); column.classList.add("drag-over"); });
        column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
        column.addEventListener("drop", async (e) => {
            e.preventDefault();
            column.classList.remove("drag-over");
            const cardId = e.dataTransfer.getData("text/plain");
            const id = parseInt(cardId.replace('todo-', ''));
            const newStatus = column.getAttribute("data-status");
            const todoIdx = appTodos.findIndex(t => t.id === id);
            if (todoIdx !== -1) {
                appTodos[todoIdx].status = newStatus;
                appTodos[todoIdx].completed = (newStatus === 'done');
                await BridgeWorkDB.set("todos", "main", appTodos);
                renderKanbanBoard();
            }
        });
    });
}

function updateAppSetting(key, val) {
    appPrefs[key] = val;
    savePrefs();
    if (['uiScale', 'compactSidebar', 'animations', 'accentColor', 'backgroundImage'].includes(key)) applyAppPrefs();
    if (key === 'currency') render();
}
