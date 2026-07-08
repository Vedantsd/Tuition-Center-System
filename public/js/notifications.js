let messageTimer = null;
let isExistingNotification = false;
let notificationList = [];
let currentIndex = -1;

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
        .querySelector(".prevButton")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".nextButton")
        .addEventListener("click", nextRecord);

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

        setSaveButtonText("Save");
        setActiveMode("new");

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

    document.getElementById("TargetRole").value = "";
    document.getElementById("Title").value = "";
    document.getElementById("Message").value = "";

    isExistingNotification = false;
    setSaveButtonText("Save");

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

    document.getElementById("NotificationID").value = notification.notification_id ?? "";
    document.getElementById("Title").value = notification.title ?? "";
    document.getElementById("Message").value = notification.message ?? "";

    setSelectValueCaseInsensitive("TargetRole", notification.target_role);

    isExistingNotification = true;
    setSaveButtonText("Update");

}

function startNewMode() {

    clearForm();

    isExistingNotification = false;

    const notificationIdInput = document.getElementById("NotificationID");

    notificationIdInput.readOnly = true;

    setSaveButtonText("Save");

    setActiveMode("new");

    loadNewNotificationId();

}

function startFindMode() {

    clearForm();

    isExistingNotification = false;

    const notificationIdInput = document.getElementById("NotificationID");

    notificationIdInput.value = "";
    notificationIdInput.readOnly = false;
    notificationIdInput.focus();

    setSaveButtonText("Save");

    setActiveMode("find");

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

            showMessage("Notification not found.", "error");

            notificationIdInput.focus();

            return;

        }

        await populateForm(result);
        setActiveMode("find");

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

    const currentId = Number(
        document.getElementById("NotificationID").value
    );

    currentIndex = notificationList.indexOf(currentId);

    if (currentIndex === -1) {

        currentIndex = notificationList.length - 1;

    }
    else if (currentIndex <= 0) {

        showMessage("First Record", "info");

        return;

    }
    else {

        currentIndex--;

    }

    await loadAndPopulateNotification(notificationList[currentIndex]);

}

async function nextRecord() {

    if (!isExistingNotification) {

        showMessage("Already at new data entry.", "info");

        return;

    }

    if (notificationList.length === 0) {

        showMessage("No notification records found.", "info");

        return;

    }

    const currentId = Number(
        document.getElementById("NotificationID").value
    );

    currentIndex = notificationList.indexOf(currentId);

    if (currentIndex === -1) {

        currentIndex = 0;

    }
    else if (currentIndex >= notificationList.length - 1) {

        clearForm();

        currentIndex = -1;

        setSaveButtonText("Save");

        document.getElementById("NotificationID").readOnly = true;

        loadNewNotificationId();

        showMessage("New notification record.", "info");

        return;

    }
    else {

        currentIndex++;

    }

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