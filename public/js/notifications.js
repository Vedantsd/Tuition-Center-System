let messageTimer = null;
let isExistingNotification = false;
let notificationList = [];
let currentIndex = -1;
let originalNotificationData = null;

document.addEventListener("DOMContentLoaded", () => {

    loadTargetRoles();
    loadNewNotificationId();
    loadNotificationList();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .getElementById("NotificationID")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter" && !this.readOnly) {
                findNotification();
            }

        });

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveNotification);

    document
        .getElementById("confirmYesBtn")
        .addEventListener("click", async () => {

            hideConfirmModal();
            await performSaveNotification();

        });

    document
        .getElementById("confirmNoBtn")
        .addEventListener("click", () => {

            hideConfirmModal();
            restoreOriginalValues();

        });

    document
        .querySelector(".prevButton")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".nextButton")
        .addEventListener("click", nextRecord);

    const requiredFields = [
        document.getElementById("TargetRole"),
        document.getElementById("Title"),
        document.getElementById("Message")
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

    const notificationIdField = document.getElementById("NotificationID");

    notificationIdField.addEventListener("blur", function () {

        if (
            !this.readOnly &&
            this.value.trim() === ""
        ) {

            showNotificationIdRequiredError(this);

        }
        else {

            removeNotificationIdRequiredError(this);

        }

    });

    notificationIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {

            removeNotificationIdRequiredError(this);

        }

    });

});

document.addEventListener("DOMContentLoaded", () => {

    const infoModalOverlay = document.getElementById("infoModalOverlay");
    const infoModalText = document.getElementById("infoModalText");
    const infoModalClose = document.getElementById("infoModalClose");

    document.querySelectorAll(".info-icon[data-info]").forEach(icon => {

        icon.addEventListener("click", () => {

            infoModalText.textContent = icon.getAttribute("data-info");
            infoModalOverlay.classList.add("show");

        });

    });

    infoModalClose.addEventListener("click", () => {

        infoModalOverlay.classList.remove("show");

    });

    infoModalOverlay.addEventListener("click", (event) => {

        if (event.target === infoModalOverlay) {

            infoModalOverlay.classList.remove("show");

        }

    });

});

function setActiveMode(mode) {

    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("findModeBtn").classList.remove("active");

    if (mode === "new") {
        document.getElementById("newModeBtn").classList.add("active");
    }
    else if (mode === "find") {
        document.getElementById("findModeBtn").classList.add("active");
    }

}

const FORM_FIELD_IDS = [
    "TargetRole",
    "Title",
    "Message"
];

function setFormFieldsDisabled(disabled) {

    FORM_FIELD_IDS.forEach(id => {

        document.getElementById(id).disabled = disabled;

    });

}

function setSaveButtonDisabled(disabled) {

    document.querySelector(".save-btn").disabled = disabled;

}

function showConfirmModal() {

    document.getElementById("confirmModal").classList.add("show");

}

function hideConfirmModal() {

    document.getElementById("confirmModal").classList.remove("show");

}

function restoreOriginalValues() {

    if (!originalNotificationData)
        return;

    populateForm(originalNotificationData);

    showMessage("Changes discarded.", "info");

}

async function loadNewNotificationId() {

    try {

        const result = await DatabaseAPI.get("/api/notifications/newid");

        if (!result.success) {

            showMessage(result.message, "error");
            return;

        }

        document.getElementById("NotificationID").value = result.notification_id;
        document.getElementById("NotificationID").readOnly = true;

        isExistingNotification = false;
        currentIndex = -1;

        setSaveButtonText("Save");
        setActiveMode("new");

        setFormFieldsDisabled(false);
        setSaveButtonDisabled(false);

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Notification ID", "error");

    }

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

function setSaveButtonText(text) {

    document.querySelector(".save-btn").textContent = text;

}

function clearForm() {

    originalNotificationData = null;

    document.getElementById("TargetRole").value = "";
    document.getElementById("Title").value = "";
    document.getElementById("Message").value = "";

    isExistingNotification = false;
    setSaveButtonText("Save");

    document
        .querySelectorAll(".user-field-wrapper")
        .forEach(wrapper => {

            const field = wrapper.querySelector("input, select, textarea");

            field.classList.remove("field-error");

            const errorMessage =
                wrapper.querySelector(".field-error-message");

            if (errorMessage) {
                errorMessage.remove();
            }

        });

    removeNotificationIdRequiredError(
        document.getElementById("NotificationID")
    );

}

function setSelectValueCaseInsensitive(selectId, storedValue) {

    const select = document.getElementById(selectId);
    const target = (storedValue || "").toLowerCase();

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

async function populateForm(notification) {

    await targetRolesReady;

    originalNotificationData = JSON.parse(JSON.stringify(notification));

    document.getElementById("NotificationID").value = notification.notification_id ?? "";
    document.getElementById("Title").value = notification.title ?? "";
    document.getElementById("Message").value = notification.message ?? "";

    setSelectValueCaseInsensitive("TargetRole", notification.target_role);

    isExistingNotification = true;
    setSaveButtonText("Update");

    const requiredFields = [
        document.getElementById("TargetRole"),
        document.getElementById("Title"),
        document.getElementById("Message")
    ];

    requiredFields.forEach(field => {
        removeRequiredError(field);
    });

    removeNotificationIdRequiredError(
        document.getElementById("NotificationID")
    );

    setFormFieldsDisabled(false);
    setSaveButtonDisabled(false);

}

function startNewMode() {

    clearForm();

    isExistingNotification = false;
    currentIndex = -1;

    const notificationIdInput = document.getElementById("NotificationID");
    removeNotificationIdRequiredError(notificationIdInput);

    notificationIdInput.readOnly = true;

    setSaveButtonText("Save");

    setActiveMode("new");

    loadNewNotificationId();

}

function startFindMode() {

    clearForm();

    isExistingNotification = false;
    currentIndex = -1;

    const notificationIdInput = document.getElementById("NotificationID");

    notificationIdInput.value = "";
    notificationIdInput.readOnly = false;
    notificationIdInput.focus();

    setSaveButtonText("Update");

    setActiveMode("find");

    setFormFieldsDisabled(true);
    setSaveButtonDisabled(true);

    showMessage("Enter Notification ID and press Enter.", "info");

}

async function findNotification() {

    const notificationIdInput = document.getElementById("NotificationID");

    const notificationId = notificationIdInput.value.trim();

    if (notificationId === "") {

        showMessage("Enter Notification ID.", "error");

        notificationIdInput.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/notifications/" + notificationId);

        if (!result.success) {

            clearForm();

            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);

            showMessage("Notification not found.", "error");

            notificationIdInput.focus();

            return;

        }

        await populateForm(result);
        setActiveMode("find");

        notificationIdInput.readOnly = true;

        currentIndex = notificationList.indexOf(Number(notificationId));

        showMessage("Notification loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find notification.", "error");

    }

}

async function loadNotificationList() {

    try {

        const response = await DatabaseAPI.get("/api/notifications");

        const notifications = Array.isArray(response)
            ? response
            : response.data || response.notifications || [];

        notificationList = notifications
            .map(n => Number(n.notification_id))
            .sort((a, b) => a - b);

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load notifications.", "error");

        return false;

    }

}

async function loadAndPopulateNotification(notificationId) {

    try {

        const result = await DatabaseAPI.get("/api/notifications/" + notificationId);

        if (!result.success) {

            clearForm();

            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);

            showMessage("Notification not found.", "error");
            return;

        }

        await populateForm(result);
        setActiveMode("find");

        document.getElementById("NotificationID").readOnly = true;

        showMessage("Existing record loaded.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load notification.", "error");

    }

}

async function previousRecord() {

    if (notificationList.length === 0) {

        showMessage("No notification records found.", "info");

        return;

    }

    if (!isExistingNotification) {

        currentIndex = notificationList.length - 1;
        await loadAndPopulateNotification(notificationList[currentIndex]);
        return;

    }

    const currentId = Number(
        document.getElementById("NotificationID").value
    );

    const idx = notificationList.indexOf(currentId);

    if (idx === -1) {

        currentIndex = notificationList.length - 1;

    }
    else if (idx <= 0) {

        showMessage("First Record", "info");
        return;

    }
    else {

        currentIndex = idx - 1;

    }

    await loadAndPopulateNotification(notificationList[currentIndex]);

}

async function nextRecord() {

    if (notificationList.length === 0) {

        showMessage("No notification records found.", "info");

        return;

    }

    if (!isExistingNotification) {

        showMessage("Already at new data entry.", "info");
        return;

    }

    const currentId = Number(
        document.getElementById("NotificationID").value
    );

    const idx = notificationList.indexOf(currentId);

    if (idx === -1) {

        currentIndex = 0;
        await loadAndPopulateNotification(notificationList[currentIndex]);
        return;

    }

    if (idx >= notificationList.length - 1) {

        clearForm();

        currentIndex = -1;

        document.getElementById("NotificationID").readOnly = true;

        await loadNewNotificationId();

        showMessage("New notification record.", "info");

        return;

    }

    currentIndex = idx + 1;

    await loadAndPopulateNotification(notificationList[currentIndex]);

}

let targetRolesReady = null;

async function loadTargetRoles() {

    const select = document.getElementById("TargetRole");

    select.innerHTML = '<option value="">--Select Role--</option>';

    targetRolesReady = (async () => {

        try {

            const result = await DatabaseAPI.get(
                "/api/lookup-values/active?type=target_role"
            );

            if (!result || !result.success) {

                showMessage("Unable to load target roles.", "error");
                return;

            }

            if (!Array.isArray(result.data) || result.data.length === 0) {

                console.warn(
                    "Target role lookup returned no rows. Check that " +
                    "/api/lookup-values/active?type=target_role has active " +
                    "records with lookup_type = 'target_role' in the database."
                );

                showMessage("No target roles configured.", "info");
                return;

            }

            result.data.forEach(item => {

                const option = document.createElement("option");

                option.value = item.lookup_value;
                option.textContent =
                    item.lookup_value.charAt(0).toUpperCase() +
                    item.lookup_value.slice(1);

                select.appendChild(option);

            });

        }
        catch (err) {

            console.error(err);
            showMessage("Unable to load target roles.", "error");

        }

    })();

    return targetRolesReady;

}

function getFormData() {

    return {

        notification_id: document.getElementById("NotificationID").value,
        target_role: document.getElementById("TargetRole").value,
        title: document.getElementById("Title").value.trim(),
        message: document.getElementById("Message").value.trim()

    };

}

function showRequiredError(field) {

    field.classList.add("field-error");

    const wrapper = field.closest(".user-field-wrapper");

    let errorMessage =
        wrapper.querySelector(".field-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "field-error-message";

        errorMessage.textContent = "This field is required";

        wrapper.appendChild(errorMessage);

    }

}

function removeRequiredError(field) {

    field.classList.remove("field-error");

    const wrapper = field.closest(".user-field-wrapper");

    const errorMessage =
        wrapper.querySelector(".field-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showNotificationIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    let errorMessage =
        group.querySelector(".user-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "user-id-error-message";

        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeNotificationIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    const errorMessage =
        group.querySelector(".user-id-error-message");

    if (errorMessage) {

        errorMessage.remove();

    }

}

function validateForm(data) {

    if (!data.notification_id) {
        showMessage("Notification ID is required.", "error");
        return false;
    }

    if (!data.target_role) {
        showMessage("Target Role is required.", "error");
        return false;
    }

    if (!data.title) {
        showMessage("Title is required.", "error");
        return false;
    }

    if (!data.message) {
        showMessage("Message is required.", "error");
        return false;
    }

    return true;

}

async function saveNotification() {

    const data = getFormData();

    if (!validateForm(data))
        return;

    if (isExistingNotification) {

        showConfirmModal();
        return;

    }

    await performSaveNotification();

}

async function performSaveNotification() {

    const data = getFormData();

    if (!validateForm(data))
        return;

    try {

        let result;

        if (isExistingNotification) {

            result = await DatabaseAPI.put("/api/notifications/" + data.notification_id, data);

        }
        else {

            result = await DatabaseAPI.post("/api/notifications", data);

        }

        if (!result.success) {

            showMessage(result.message || "Unable to save notification.", "error");
            return;

        }

        showMessage(result.message || "Notification saved successfully.", "success");

        clearForm();

        document.getElementById("NotificationID").readOnly = true;

        await loadNewNotificationId();
        await loadNotificationList();

    }
    catch (err) {

        console.error(err);
        showMessage("Error saving notification.", "error");

    }

}