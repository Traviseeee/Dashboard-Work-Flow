// ===== CUSTOM BRANDING =====
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
        document.getElementById('logoIconContainer').innerHTML = `<img src="${logo}">`;
        const favicon = document.getElementById('favicon');
        if (favicon) favicon.href = logo;
    }
}

// ===== CUSTOM COVERS =====

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
    
    if (imgEl && wrapper) {
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
    wrapper.classList.remove('repositioning-mode');
    
    showToast("Position saved!", "success");
}
