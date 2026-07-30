const AUDIT_API_BASE = "http://127.0.0.1:8000";

let editMode = false;
let auditLogs = [];
let currentIndex = -1;
let currentMode = "new";
let messageTimer = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadUserDropdown();
    await loadAuditList();

    await startNewMode();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveAuditLog);

    document
        .querySelector(".prevButton")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".nextButton")
        .addEventListener("click", nextRecord);

    document
        .querySelector(".exit-btn")
        .addEventListener("click", () => {
            window.history.back();
        });

    const requiredFields = [
        document.getElementById("UserID"),
        document.getElementById("Action"),
        document.getElementById("ActionDate")
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

    const auditIdField = document.getElementById("AuditID");

    auditIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showAuditIdRequiredError(this);
        }
        else {
            removeAuditIdRequiredError(this);
        }

    });

    auditIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeAuditIdRequiredError(this);
        }

    });

    auditIdField.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && currentMode === "find") {
            findAuditLog();
        }

    });

});

function setActiveMode(mode) {

    currentMode = mode;

    document
        .getElementById("newModeBtn")
        .classList.toggle("active", mode === "new");

    document
        .getElementById("findModeBtn")
        .classList.toggle("active", mode === "find");

}

function showMessage(message, type = "info") {

    const status = document.getElementById("statusMessage");

    clearTimeout(messageTimer);

    status.className = "status-message";
    status.classList.add(type);
    status.textContent = message;

    messageTimer = setTimeout(() => {
        status.className = "status-message";
        status.textContent = "";
    }, 4000);

}

function setFieldsDisabled(disabled) {

    const fields = [
        document.getElementById("UserID"),
        document.getElementById("Action"),
        document.getElementById("ActionDate")
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

function hasUnsavedNewData() {

    const fields = [
        document.getElementById("UserID"),
        document.getElementById("Action"),
        document.getElementById("ActionDate")
    ];

    for (let i = 0; i < fields.length; i++) {

        if (fields[i].value.trim() !== "") {
            return true;
        }

    }

    return false;

}

function clearForm() {

    document.getElementById("UserID").value = "";
    document.getElementById("Action").value = "";
    document.getElementById("ActionDate").value = "";

    removeRequiredError(document.getElementById("UserID"));
    removeRequiredError(document.getElementById("Action"));
    removeRequiredError(document.getElementById("ActionDate"));

    document.querySelector(".save-btn").textContent = "Save";

}

function setSelectValueCaseInsensitive(selectId, storedValue) {

    const select = document.getElementById(selectId);
    const target = String(storedValue ?? "").toLowerCase();

    let matched = false;

    for (const option of select.options) {

        if (option.value.toLowerCase() === target) {

            select.value = option.value;
            matched = true;
            break;

        }

    }

    if (!matched)
        select.value = "";

}

function showSaveConfirmModal(message) {

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
        btnContainer.style.gap = "10px";

        const yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.textContent = "Yes";
        yesBtn.style.padding = "8px 18px";
        yesBtn.style.border = "none";
        yesBtn.style.borderRadius = "6px";
        yesBtn.style.background = "#16a34a";
        yesBtn.style.color = "#fff";
        yesBtn.style.fontSize = "14px";
        yesBtn.style.cursor = "pointer";

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.textContent = "No";
        noBtn.style.padding = "8px 18px";
        noBtn.style.border = "none";
        noBtn.style.borderRadius = "6px";
        noBtn.style.background = "#dc2626";
        noBtn.style.color = "#fff";
        noBtn.style.fontSize = "14px";
        noBtn.style.cursor = "pointer";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "8px 18px";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "6px";
        cancelBtn.style.background = "#9ca3af";
        cancelBtn.style.color = "#fff";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.cursor = "pointer";

        yesBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("yes");
        });

        noBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("no");
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("cancel");
        });

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);
        btnContainer.appendChild(cancelBtn);

        box.appendChild(text);
        box.appendChild(btnContainer);
        overlay.appendChild(box);

        document.body.appendChild(overlay);

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

function toDatetimeLocalValue(value) {

    // FastAPI returns "2026-07-27T10:15:00" already - just trim
    // anything longer (e.g. microseconds) down to what
    // datetime-local expects.
    if (!value) return "";

    return value.length >= 19 ? value.substring(0, 19) : value;

}

function populateForm(auditLog) {

    const auditIdField = document.getElementById("AuditID");

    auditIdField.value = auditLog.audit_id;

    setSelectValueCaseInsensitive("UserID", auditLog.user_id);

    document.getElementById("Action").value = auditLog.action;
    document.getElementById("ActionDate").value =
        toDatetimeLocalValue(auditLog.action_date);

    removeAuditIdRequiredError(auditIdField);

    removeRequiredError(document.getElementById("UserID"));
    removeRequiredError(document.getElementById("Action"));
    removeRequiredError(document.getElementById("ActionDate"));

}

// NOTE: This still calls your Node.js server (relative path),
// since the /api/users list endpoint lives there, not in FastAPI.
async function loadUserDropdown() {

    const select = document.getElementById("UserID");

    select.innerHTML = '<option value="">Select User</option>';

    try {

        const users = await DatabaseAPI.get("/api/users");

        if (!Array.isArray(users)) {
            showMessage("Unable to load users.", "error");
            return;
        }

        users.forEach(u => {

            const option = document.createElement("option");

            option.value = u.user_id;
            option.textContent = u.first_name + " " + u.last_name;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load users.", "error");

    }

}

async function loadAuditList() {

    try {

        const result = await DatabaseAPI.get(AUDIT_API_BASE + "/audit-logs/");

        if (!result.success) {
            auditLogs = [];
            return false;
        }

        auditLogs = result.data;

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load audit logs.", "error");

        auditLogs = [];

        return false;

    }

}

async function generateAuditID() {

    try {

        const result = await DatabaseAPI.get(AUDIT_API_BASE + "/audit-logs/newid");

        document.getElementById("AuditID").value = result.audit_id;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Audit ID.", "error");

    }

}

async function startNewMode() {

    setFieldsDisabled(false);

    setActiveMode("new");

    editMode = false;
    currentIndex = -1;

    const auditIdField = document.getElementById("AuditID");

    removeAuditIdRequiredError(auditIdField);

    clearForm();

    auditIdField.readOnly = true;

    document.querySelector(".save-btn").textContent = "Save";

    await generateAuditID();

    removeAuditIdRequiredError(auditIdField);

    showMessage("Ready for new audit entry.", "success");

}

function startFindMode() {

    setActiveMode("find");

    editMode = false;
    currentIndex = -1;

    clearForm();

    const auditIdField = document.getElementById("AuditID");

    removeAuditIdRequiredError(auditIdField);

    auditIdField.value = "";
    auditIdField.readOnly = false;
    auditIdField.focus();

    document.querySelector(".save-btn").textContent = "Update";

    setFieldsDisabled(true);

    showMessage("Enter Audit ID and press Enter.", "info");

}

async function findAuditLog() {

    const auditIdField = document.getElementById("AuditID");

    const id = auditIdField.value.trim();

    if (id === "") {

        showMessage("Enter Audit ID.", "error");

        auditIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get(AUDIT_API_BASE + "/audit-logs/" + id);

        if (!result.success) {

            clearForm();

            auditIdField.value = id;

            showMessage("Not a valid Audit ID.", "error");

            setFieldsDisabled(true);

            auditIdField.focus();

            return;

        }

        setFieldsDisabled(false);

        populateForm(result.data);

        editMode = true;

        currentIndex = auditLogs.findIndex(
            a => Number(a.audit_id) === Number(result.data.audit_id)
        );

        auditIdField.readOnly = true;

        document.querySelector(".save-btn").textContent = "Update";

        setActiveMode("find");

        showMessage("Audit entry loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find audit entry.", "error");

    }

}

function showCurrentAuditLog() {

    if (currentIndex < 0 || currentIndex >= auditLogs.length)
        return;

    populateForm(auditLogs[currentIndex]);

    editMode = true;

    document.getElementById("AuditID").readOnly = true;

    document.querySelector(".save-btn").textContent = "Update";

    setActiveMode("find");

}

async function previousRecord() {

    if (auditLogs.length === 0) {

        showMessage("No audit records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        if (hasUnsavedNewData()) {

            const choice = await showSaveConfirmModal(
                "Do you want to save this audit entry before going back?"
            );

            if (choice === "cancel") {
                return;
            }

            if (choice === "yes") {

                const saved = await saveAuditLog();

                if (!saved) {
                    return;
                }

            }

        }

        currentIndex = auditLogs.length - 1;

        showCurrentAuditLog();

        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already on first record.", "info");

        return;

    }

    currentIndex--;

    showCurrentAuditLog();

}

function nextRecord() {

    if (auditLogs.length === 0) {

        showMessage("No audit records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        showMessage("Already on new record.", "info");

        return;

    }

    if (currentIndex >= auditLogs.length - 1) {

        showMessage("Already on last record.", "info");

        return;

    }

    currentIndex++;

    showCurrentAuditLog();

}

async function saveAuditLog() {

    if (!validateForm())
        return false;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < auditLogs.length) {
                populateForm(auditLogs[currentIndex]);
            }

            return false;

        }

    }

    const data = {

        audit_id: Number(document.getElementById("AuditID").value),
        user_id: Number(document.getElementById("UserID").value),
        action: document.getElementById("Action").value.trim(),
        action_date: document.getElementById("ActionDate").value

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                AUDIT_API_BASE + "/audit-logs/" + data.audit_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post(
                AUDIT_API_BASE + "/audit-logs/",
                data
            );

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await loadAuditList();

            if (editMode) {

                currentIndex = auditLogs.findIndex(
                    a => Number(a.audit_id) === Number(data.audit_id)
                );

            }
            else {

                await startNewMode();

            }

        }

        return result.success;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to save record.", "error");

        return false;

    }

}

function validateForm() {

    const userField = document.getElementById("UserID");
    const actionField = document.getElementById("Action");
    const dateField = document.getElementById("ActionDate");

    if (userField.value.trim() === "") {

        showMessage("Select a User.", "error");

        showRequiredError(userField);

        userField.focus();

        return false;

    }

    if (actionField.value.trim() === "") {

        showMessage("Enter an Action.", "error");

        showRequiredError(actionField);

        actionField.focus();

        return false;

    }

    if (dateField.value.trim() === "") {

        showMessage("Select an Action Date.", "error");

        showRequiredError(dateField);

        dateField.focus();

        return false;

    }

    return true;

}

const rightSideFields = ["UserID", "ActionDate"];

function showRequiredError(field) {

    field.classList.add("field-error");

    const grid = field.closest(".stackinputs");

    if (!grid) return;

    let errorMessage = grid.querySelector(
        ".field-error-message[data-for='" + field.id + "']"
    );

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "field-error-message";
        errorMessage.setAttribute("data-for", field.id);
        errorMessage.textContent = "This field is required";

        if (rightSideFields.includes(field.id)) {
            errorMessage.classList.add("error-right");
        }
        else {
            errorMessage.classList.add("error-left");
        }

        grid.appendChild(errorMessage);

    }

}

function removeRequiredError(field) {

    field.classList.remove("field-error");

    const grid = field.closest(".stackinputs");

    if (!grid) return;

    const errorMessage = grid.querySelector(
        ".field-error-message[data-for='" + field.id + "']"
    );

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showAuditIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".audit-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "audit-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeAuditIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".audit-id-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

document.querySelectorAll(".info-icon").forEach(icon => {

    icon.style.cursor = "pointer";

    icon.addEventListener("click", (e) => {

        e.stopPropagation();

        const tooltip = icon.querySelector(".tooltip");

        if (tooltip) {
            alert(tooltip.textContent.trim());
        }

    });

});