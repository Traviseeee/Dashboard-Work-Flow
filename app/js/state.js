// js/state.js
// Global state and shared application variables

const t = translations;
let appCurrentLang = currentLang;

let appData = [];
let userName = "Chin Chetra";
let userRole = "Graphic Designer";
let isDarkMode = false;
let appCoverPositions = {};
let workspaces = [{ id: "default", name: "Main Project", posterTarget: 30, hoursTarget: 100, incomeTarget: 1000, categories: ["Brand Promotion", "SHV Promotion", "BD Promotion", "Campaign and Contents"] }];
let activeWorkspaceId = "default";
let currentWorkspace = workspaces[0];
let appCategories = currentWorkspace.categories;
let DAILY_HOUR_LIMIT = DEFAULT_DAILY_HOUR_LIMIT;
let appNotes = [];
let appLoans = [];
let appIncomes = [];
let appExpenses = [];
let currentExpenseId = null;
let appTodos = [];
let appEvents = [];
let eagleAssets = [];
let currentTodoId = null;
let appPrefs = {
    showLoan: true,
    showTodo: true,
    showExpenses: true,
    showIncome: true,
    incomePrivacy: false,
    uiScale: 100,
    currency: "$",
    compactSidebar: false,
    animations: true,
    dateFormat: 'DD/MM/YYYY',
    accentColor: '#6366f1',
    backgroundImage: 'none',
    focusMode: false,
    showTicker: true,
    toolMessages: { dashboard: "", notes: "", todo: "", loan: "", income: "", expenses: "" },
    lastSeenAppVersion: "0.0.0",
    behanceUrl: "https://www.behance.net/chinchetra",
    facebookUrl: "https://www.facebook.com/chetrac/",
    tiktokUrl: "https://www.tiktok.com/@chinchetra?is_from_webapp=1&sender_device=pc"
};

let viewMonth = new Date().getMonth();
let viewYear = new Date().getFullYear();
let noteSearchQuery = "";

window.OPENAI_CONFIG = window.OPENAI_CONFIG || {
    API_KEY: "", 
    API_URL: "https://api.openai.com/v1/chat/completions",
    API_PROXY_URL: "/api/openai",
    MODEL: "gpt-3.5-turbo",
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};
