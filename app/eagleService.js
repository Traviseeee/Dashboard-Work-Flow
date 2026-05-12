/**
 * Eagle App API Service
 */
const EAGLE_API_CONFIG = {
    BASE_URL: "http://localhost:41595/api",
    TOKEN: "3c3d9956-a1ff-4fc4-bdd9-98c85773eb81", // Move to a secure config in production
};

const EagleService = {
    config: EAGLE_API_CONFIG,
    /**
     * Fetches items from Eagle App with basic pagination support
     * @param {number} limit - Number of items to fetch
     * @param {number} offset - Starting point
     */
    async getAssets(limit = 50, offset = 0) {
        const url = `${EAGLE_API_CONFIG.BASE_URL}/item/list?token=${EAGLE_API_CONFIG.TOKEN}&limit=${limit}&offset=${offset}`;
        
        try {
            const response = await fetch(url).catch(() => null);
            
            if (!response || !response.ok) return [];
            
            const data = await response.json();
            
            if (data.status === "success") {
                return data.data; // Eagle returns items in the 'data' field
            } else {
                throw new Error(data.message || "Failed to fetch from Eagle");
            }
        } catch (error) {
            return []; // Fail silently to avoid console errors when Eagle is closed
        }
    }
};

window.EagleService = EagleService;