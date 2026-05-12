// e:\Test\Report\config.js

const APP_NAME = "BridgeWork Pro";
const APP_VERSION = "1.0.1"; // Increment this for new releases to trigger "What's New"

const DEFAULT_DAILY_HOUR_LIMIT = 7.5;
const DEFAULT_POSTER_TARGET = 30;
const DEFAULT_HOURS_TARGET = 100;

const LOCAL_STORAGE_KEYS = {
    DATA: "bwData",
    NOTES: "bwNotes",
    LOANS: "bwLoans",
    TODOS: "bwTodos",
    LANG: "bwLang",
    EVENTS: "bwEvents",
    DARK_MODE: "bwDarkMode",
    USER_NAME: "bwUserName",
    USER_ROLE: "bwUserRole",
    ACTIVE_WORKSPACE_ID: "bwActiveWorkspaceId",
    WORKSPACES: "bwWorkspaces",
    DAILY_LIMIT: "bwLimit",
    PREFS: "bwPrefs",
    CUSTOM_LOGO: "bwCustomLogo",
    USER_AVATAR: "bwUserAvatar",
    COVERS: "bwCovers",
};

const DB_CONFIG = {
    NAME: "BridgeWorkDB",
    STORE_NAME: "FileHandles",
};

// OpenAI Configuration
window.OPENAI_CONFIG = {
    API_KEY: "",
    API_URL: "https://api.openai.com/v1/chat/completions",
    API_PROXY_URL: "/api/openai",
    MODEL: "gpt-4o-mini",
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};



const REMINDER_TIMES = {
    START_HOUR: 16, // 4 PM
    END_HOUR: 17,   // 5 PM
    END_MINUTE: 30, // 5:30 PM
};

const KPI_POINTS = {
    DETAIL_FILE: 2.5,
    ATTITUDE: 5,
    ON_TIME: 20,
    QUALITY: 20,
    SUPPORT: 20,
    PERFORMANCE: 20,
    CREATIVE_PER_POSTER: 2.5,
    CREATIVE_MAX: 5,
    OVERTIME: 2.5,
    POSTER_GOAL_MAX: 25,
    TOTAL_MAX: 120,
};

const IMAGE_UPLOAD_MAX_SIZE_MB = 5;

// You can also define default categories here
const DEFAULT_CATEGORIES = ["Brand Promotion", "SHV Promotion", "BD Promotion", "Campaign and Contents"];
