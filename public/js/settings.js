document.addEventListener("DOMContentLoaded", async () => {

    await loadSettings();

    await generateSettingID();

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveSetting);

    document
        .querySelector(".prevButton")
        .addEventListener("click", previousSetting);

    document
        .querySelector(".nextButton")
        .addEventListener("click", nextSetting);

    document
        .getElementById("newModeBtn")
        .addEventListener("click", newSetting);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", findMode);

    document
        .getElementById("SettingID")
        .addEventListener("keydown", async function (e) {

            if (e.key === "Enter" && findEnabled) {

                await loadSetting();

            }

        });

    // --- Required field validation ---
    const requiredFields = [
        document.getElementById("SettingName"),
        document.getElementById("SettingValue")
    ];

    requiredFields.forEach(field => {

        field.addEventListener("blur", function () {

            if (this.value.trim() === "") {
                showRequiredError(this);
            }
            else {
                removeRequiredError(this);
            }

        });

        field.addEventListener("input", function () {

            if (this.value.trim() !== "") {
                removeRequiredError(this);
            }

        });

        field.addEventListener("change", function () {

            if (this.value.trim() !== "") {
                removeRequiredError(this);
            }

        });

    });

    const settingIdField = document.getElementById("SettingID");

    settingIdField.addEventListener("blur", function () {

        if (
            findEnabled &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showSettingIdRequiredError(this);
        }
        else {
            removeSettingIdRequiredError(this);
        }

    });

    settingIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeSettingIdRequiredError(this);
        }

    });

});

let settings = [];

let currentIndex = -1;

let editMode = false;

let findEnabled = false;

let messageTimer;


function showMessage(message, type = "info") {

    const status = document.getElementById("statusMessage");

    clearTimeout(messageTimer);

    status.className = "status-message";

    status.classList.add(type);

    status.textContent = message;

    messageTimer = setTimeout(() => {

        status.className = "status-message";

        status.textContent = "";

    }, 5000);

}

// Disables/enables SettingName, SettingValue, Save, Previous, Next.
// SettingID, New, and Find are intentionally excluded so the user can
// always retry a different ID or switch modes.
// Also applies/removes a grey background to match the read-only look
// of SettingID in New mode.
function setFieldsDisabled(disabled) {

    const fields = [
        document.getElementById("SettingName"),
        document.getElementById("SettingValue")
    ];

    fields.forEach(field => {

        if (field) {

            field.disabled = disabled;

            field.style.backgroundColor = disabled ? "#e9e9e9" : "";
            field.style.color = disabled ? "#888" : "";
            field.style.cursor = disabled ? "not-allowed" : "";

        }

    });

    const saveBtn = document.querySelector(".save-btn");
    const prevBtn = document.querySelector(".prevButton");
    const nextBtn = document.querySelector(".nextButton");

    [saveBtn, prevBtn, nextBtn].forEach(btn => {

        if (btn) {

            btn.disabled = disabled;

            btn.style.opacity = disabled ? "0.5" : "";
            btn.style.cursor = disabled ? "not-allowed" : "";

        }

    });

}

function showConfirmModal(message) {

    return new Promise(resolve => {

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0, 0, 0, 0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "24px 32px";
        box.style.borderRadius = "10px";
        box.style.textAlign = "center";
        box.style.maxWidth = "340px";
        box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
        box.style.fontFamily = "inherit";

        const text = document.createElement("p");
        text.textContent = message;
        text.style.marginBottom = "20px";
        text.style.fontSize = "16px";
        text.style.color = "#222";

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";
        btnContainer.style.gap = "12px";

        const yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.textContent = "Yes";
        yesBtn.style.padding = "8px 22px";
        yesBtn.style.border = "none";
        yesBtn.style.borderRadius = "6px";
        yesBtn.style.background = "#16a34a";
        yesBtn.style.color = "#fff";
        yesBtn.style.fontSize = "14px";
        yesBtn.style.cursor = "pointer";

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.textContent = "No";
        noBtn.style.padding = "8px 22px";
        noBtn.style.border = "none";
        noBtn.style.borderRadius = "6px";
        noBtn.style.background = "#dc2626";
        noBtn.style.color = "#fff";
        noBtn.style.fontSize = "14px";
        noBtn.style.cursor = "pointer";

        yesBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        noBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);

        box.appendChild(text);
        box.appendChild(btnContainer);
        overlay.appendChild(box);

        document.body.appendChild(overlay);

    });

}


async function clearForm() {

    document.getElementById("SettingName").value = "";

    document.getElementById("SettingValue").value = "";

    [
        document.getElementById("SettingName"),
        document.getElementById("SettingValue")
    ].forEach(removeRequiredError);

}


function populateForm(setting) {

    document.getElementById("SettingID").value = setting.setting_id;

    document.getElementById("SettingName").value = setting.setting_name;

    document.getElementById("SettingValue").value = setting.setting_value;

    removeSettingIdRequiredError(document.getElementById("SettingID"));

    [
        document.getElementById("SettingName"),
        document.getElementById("SettingValue")
    ].forEach(removeRequiredError);

}

async function loadSettings() {

    try {

        settings = await DatabaseAPI.get("/api/settings");

        if (!Array.isArray(settings)) {

            settings = [];

        }

    }

    catch (err) {

        console.error(err);

        showMessage("Unable to load settings.", "error");

    }

}

async function generateSettingID() {

    try {

        const result = await DatabaseAPI.get("/api/settings/new-id");

        document.getElementById("SettingID").value = result.setting_id;

        document.getElementById("SettingID").readOnly = true;

    }

    catch (err) {

        console.error(err);

    }

}


async function findMode() {

    findEnabled = true;

    editMode = false;

    const settingIdField = document.getElementById("SettingID");

    removeSettingIdRequiredError(settingIdField);

    settingIdField.readOnly = false;
    settingIdField.value = "";
    settingIdField.focus();

    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");

    // Strictly enforce: Find mode always shows "Update".
    document.querySelector(".save-btn").innerText = "Update";

    // Disable + grey out fields and Save/Previous/Next as soon as
    // Find mode starts. SettingID, New, and Find stay usable.
    setFieldsDisabled(true);

    showMessage("Enter Setting ID and press Enter.", "info");

}



async function newSetting() {

    // Always clear any leftover disabled/greyed state first.
    setFieldsDisabled(false);

    await clearForm();

    await generateSettingID();

    editMode = false;

    findEnabled = false;

    currentIndex = settings.length;

    const settingIdField = document.getElementById("SettingID");

    removeSettingIdRequiredError(settingIdField);

    settingIdField.readOnly = true;

    document.getElementById("findModeBtn").classList.remove("active");
    document.getElementById("newModeBtn").classList.add("active");

    // Strictly enforce: New mode always shows "Save".
    document.querySelector(".save-btn").innerText = "Save";

    showMessage("Enter new setting details.", "info");

}


async function loadSetting() {

    const settingIdField = document.getElementById("SettingID");

    const id = settingIdField.value.trim();

    if (!id) {

        showMessage("Enter Setting ID.", "error");

        settingIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/settings/" + id);

        if (!result.success) {

            showMessage("Not a valid Setting ID.", "error");

            // Keep fields/buttons disabled and greyed — user must retry.
            setFieldsDisabled(true);

            return;

        }

        // Valid record found — re-enable and un-grey everything.
        setFieldsDisabled(false);

        populateForm(result);

        editMode = true;

        findEnabled = false;

        currentIndex = settings.findIndex(s => s.setting_id == id);

        document.querySelector(".save-btn").innerText = "Update";

        document.getElementById("findModeBtn").classList.add("active");
        document.getElementById("newModeBtn").classList.remove("active");

        settingIdField.readOnly = true;

        showMessage("Setting loaded successfully.", "success");

    }

    catch (err) {

        console.error(err);

        showMessage(err.message, "error");

    }

}


function previousSetting() {

    if (settings.length === 0) {

        showMessage("No records available.", "error");

        return;

    }

    if (currentIndex > 0) {

        currentIndex--;

    }

    else {

        showMessage("Already on first record.", "info");

        return;

    }

    populateForm(settings[currentIndex]);

    editMode = true;

    document.querySelector(".save-btn").innerText = "Update";

    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");

}


function nextSetting() {

    if (settings.length === 0) {

        showMessage("No records available.", "error");

        return;

    }

    if (currentIndex < settings.length - 1) {

        currentIndex++;

    }

    else {

        showMessage("Already on last record.", "info");

        return;

    }

    populateForm(settings[currentIndex]);

    editMode = true;

    document.querySelector(".save-btn").innerText = "Update";

    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");

}


function validateForm() {

    if (document.getElementById("SettingName").value.trim() === "") {

        showMessage("Enter Setting Name", "error");

        document.getElementById("SettingName").focus();

        return false;

    }

    if (document.getElementById("SettingValue").value.trim() === "") {

        showMessage("Enter Setting Value", "error");

        document.getElementById("SettingValue").focus();

        return false;

    }

    return true;

}


async function saveSetting() {

    if (!validateForm())
        return;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            // Restore the original, unedited values.
            if (currentIndex >= 0 && currentIndex < settings.length) {
                populateForm(settings[currentIndex]);
            }

            return;

        }

    }

    const setting = {

        setting_id: document.getElementById("SettingID").value,
        setting_name: document.getElementById("SettingName").value.trim(),
        setting_value: document.getElementById("SettingValue").value.trim()

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                "/api/settings/" + setting.setting_id,
                setting
            );

        }

        else {

            result = await DatabaseAPI.post(
                "/api/settings",
                setting
            );

        }

        showMessage(
            result.message,
            result.success ? "success" : "error"
        );

        if (result.success) {

            await loadSettings();

            await newSetting();

        }

    }

    catch (err) {

        console.error(err);

        showMessage(err.message, "error");

    }

}


function showRequiredError(field) {

    field.classList.add("field-error");

    const wrapper = field.closest(".assignment-field-wrapper");

    if (!wrapper) return;

    let errorMessage = wrapper.querySelector(".field-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "field-error-message";
        errorMessage.textContent = "This field is required";

        wrapper.appendChild(errorMessage);

    }

}

function removeRequiredError(field) {

    field.classList.remove("field-error");

    const wrapper = field.closest(".assignment-field-wrapper");

    if (!wrapper) return;

    const errorMessage = wrapper.querySelector(".field-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showSettingIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".setting-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "setting-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeSettingIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".setting-id-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}


document
    .querySelector(".exit-btn")
    .addEventListener("click", () => {

        window.history.back();

    });


function showInfoModal(message) {

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "32px 40px";          // Increased padding
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";
    box.style.maxWidth = "420px";             // Increased width
    box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
    box.style.fontFamily = "inherit";

    const text = document.createElement("p");
    text.textContent = message;
    text.style.marginBottom = "20px";
    text.style.fontSize = "18px";             // Increased text size
    text.style.color = "#222";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "10px 32px";     // Bigger button
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.background = "#5535d6";
    closeBtn.style.color = "#fff";
    closeBtn.style.fontSize = "16px";         // Bigger button text
    closeBtn.style.cursor = "pointer";

    closeBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    box.appendChild(text);
    box.appendChild(closeBtn);
    overlay.appendChild(box);

    document.body.appendChild(overlay);

}

document.querySelectorAll(".info-icon").forEach(icon => {

    icon.style.cursor = "pointer";

    icon.addEventListener("click", (e) => {

        e.stopPropagation();

        const tooltip = icon.querySelector(".tooltip");

        if (tooltip) {
            showInfoModal(tooltip.textContent.trim());
        }

    });

});