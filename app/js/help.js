// ===== HELP & GUIDE LOGIC =====
let helpSearchQuery = "";
let helpModalFilter = "all";

const appHelpTopics = [
    {
        id: "whats_new_1_0_1",
        title: {
            en: "What's New in v1.0.1",
            kh: "មានអ្វីថ្មីក្នុងជំនាន់ v1.0.1"
        },
        content: {
            en: `
                <p>Welcome to BridgeWork Pro v1.0.1! We've focused on making your experience smoother and smarter:</p>
                <ul>
                    <li><strong>Smart Help Feature:</strong> This new section! Get guides and see what's new.</li>
                    <li><strong>Smart Income Total Fix:</strong> Resolved the 'undefined' currency issue on the dashboard.</li>
                    <li><strong>Smart Preference Merging:</strong> Your settings are now more robust against new updates.</li>
                    <li><strong>Smart Note Parsing:</strong> URLs are now clickable, and prices ($50) are highlighted.</li>
                    <li><strong>Smart Modal Auto-Distribution:</strong> Hours in the 'Add Report' modal now auto-distribute.</li>
                    <li><strong>Smart Task Alerts:</strong> Overdue tasks in the To-Do list are now clearly marked.</li>
                    <li><strong>Enhanced Category Logic:</strong> Improved keyword-based category suggestions.</li>
                    <li><strong>Smart Performance Engine:</strong> Dashboard now gives motivational insights based on your goals.</li>
                </ul>
                <p>We're continuously working to improve BridgeWork Pro. Thank you for your support!</p>
            `,
            kh: `
                <p>សូមស្វាគមន៍មកកាន់ BridgeWork Pro v1.0.1! យើងបានផ្តោតលើការធ្វើឱ្យបទពិសោធន៍របស់អ្នកកាន់តែរលូន និងឆ្លាតវៃជាងមុន៖</p>
                <ul>
                    <li><strong>មុខងារជំនួយឆ្លាតវៃ៖</strong> ផ្នែកថ្មីនេះ! ទទួលបានការណែនាំ និងមើលអ្វីដែលថ្មី។</li>
                    <li><strong>ការកែសម្រួលផលបូកចំណូលឆ្លាតវៃ៖</strong> ដោះស្រាយបញ្ហា 'undefined' នៃរូបិយប័ណ្ណនៅលើផ្ទាំងគ្រប់គ្រង។</li>
                    <li><strong>ការបញ្ចូលចំណូលចិត្តឆ្លាតវៃ៖</strong> ការកំណត់របស់អ្នកឥឡូវនេះកាន់តែរឹងមាំចំពោះការអាប់ដេតថ្មីៗ។</li>
                    <li><strong>ការវិភាគកំណត់ត្រាឆ្លាតវៃ៖</strong> តំណភ្ជាប់ URL ឥឡូវនេះអាចចុចបាន ហើយតម្លៃ ($50) ត្រូវបានរំលេចពណ៌។</li>
                    <li><strong>ការបែងចែកម៉ោងស្វ័យប្រវត្តិ៖</strong> ម៉ោងនៅក្នុងផ្ទាំង 'ថែមការងារ' ឥឡូវនេះបែងចែកដោយស្វ័យប្រវត្តិ។</li>
                    <li><strong>ការជូនដំណឹងការងារឆ្លាតវៃ៖</strong> ការងារដែលហួសកំណត់ក្នុងបញ្ជីត្រូវធ្វើ ត្រូវបានបង្ហាញយ៉ាងច្បាស់។</li>
                    <li><strong>តក្កវិជ្ជាប្រភេទការងារកែលម្អ៖</strong> ការផ្តល់យោបល់ប្រភេទការងារផ្អែកលើពាក្យគន្លឹះកាន់តែប្រសើរ។</li>
                    <li><strong>ម៉ាស៊ីនផលិតភាពឆ្លាតវៃ៖</strong> ផ្ទាំងគ្រប់គ្រងឥឡូវនេះផ្តល់ការយល់ដឹងអំពីការលើកទឹកចិត្តផ្អែកលើគោលដៅរបស់អ្នក។</li>
                </ul>
                <p>យើងកំពុងបន្តធ្វើការដើម្បីកែលម្អ BridgeWork Pro។ សូមអរគុណសម្រាប់ការគាំទ្ររបស់អ្នក!</p>
            `
        },
        tags: ["new", "all"],
        version: "1.0.1",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "dashboard_overview",
        title: {
            en: "Dashboard Overview",
            kh: "ទិដ្ឋភាពទូទៅនៃផ្ទាំងដើម"
        },
        content: {
            en: `<p>The Dashboard is your central hub for tracking monthly progress.</p>`,
            kh: `<p>ផ្ទាំងដើមគឺជាមជ្ឈមណ្ឌលកណ្តាលរបស់អ្នក។</p>`
        },
        tags: ["dashboard", "guide", "all"],
        image: "https://images.unsplash.com/photo-1551288049-bbda4865cda1?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "notes_feature",
        title: {
            en: "Using Smart Notes",
            kh: "ការប្រើប្រាស់កំណត់ត្រាឆ្លាតវៃ"
        },
        content: {
            en: `<p>The Notes section is a powerful scratchpad.</p>`,
            kh: `<p>ផ្នែកកំណត់ត្រាគឺជាកន្លែងសរសេរដ៏មានប្រសិទ្ធភាព។</p>`
        },
        tags: ["notes", "guide", "all"],
        image: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "todo_list",
        title: {
            en: "Managing Your To-Do List",
            kh: "ការគ្រប់គ្រងបញ្ជីការងារត្រូវធ្វើ"
        },
        content: {
            en: `<p>Keep track of your tasks with the To-Do List.</p>`,
            kh: `<p>តាមដានការងាររបស់អ្នក។</p>`
        },
        tags: ["todo", "kanban", "guide", "all"],
        image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "loan_tracking",
        title: {
            en: "Loan Payment Tracker",
            kh: "ការតាមដានការបង់ប្រាក់កម្ចី"
        },
        content: {
            en: `<p>The Loan Report helps you stay on top of your obligations.</p>`,
            kh: `<p>របាយការណ៍ប្រាក់កម្ចីជួយអ្នក។</p>`
        },
        tags: ["loan", "guide", "all"],
        image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "income_tracker",
        title: {
            en: "Income & Profit Tracking",
            kh: "ការតាមដានចំណូល និងប្រាក់ចំណេញ"
        },
        content: {
            en: `<p>Track your earnings and calculate net profit.</p>`,
            kh: `<p>តាមដានប្រាក់ចំណូលរបស់អ្នក។</p>`
        },
        tags: ["income", "guide", "all"],
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600&auto=format&fit=crop"
    }
];

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
    if (!contentArea || !sidebarBtns) return;

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
        contentArea.innerHTML = html + `<div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <p style="font-size: 14px; font-weight: 600;">${currentLang === 'kh' ? 'រកមិនឃើញប្រធានបទដែលត្រូវគ្នាទេ' : 'No matching help topics found.'}</p>
            <button class="btn btn-outline" style="margin-top: 10px;" onclick="handleHelpSearch('', '${filterTag}')">Clear Search</button>
        </div>`;
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
            <div style="font-size: 13px; line-height: 1.6; color: var(--text-main);">
                ${highlightText(topic.content[currentLang] || topic.content.en, helpSearchQuery)}
            </div>
            ${topic.tags && topic.tags.length > 0 ? `
                <div style="margin-top: 15px; display: flex; gap: 8px; flex-wrap: wrap;">
                    ${topic.tags.map(tag => `<span class="badge" style="font-size: 9px; text-transform: uppercase; background: var(--bg-page); color: var(--text-muted); border: 1px solid var(--border-color);">${tag}</span>`).join('')}
                </div>
            ` : ''}
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
