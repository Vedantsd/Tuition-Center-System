let messageTimer = null;
let isExistingMessage = false;
let messageList = [];
let currentIndex = -1;
let originalMessageData = null;

const PYTHON_API_BASE = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {

    loadUsers();
    loadNewMessageId();
    loadMessageList();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .getElementById("MessageID")
        .addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !this.readOnly) {
                findMessage();
            }
        });

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveMessage);

    document
        .getElementById("confirmYesBtn")
        .addEventListener("click", async () => {
            hideConfirmModal();
            await performSaveMessage();
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

    document
        .querySelector(".exit-btn")
        .addEventListener("click", () => {
            window.history.back();
        });

    const requiredFields = [
        document.getElementById("SenderID"),
        document.getElementById("ReceiverID"),
        document.getElementById("MessageText"),
        document.getElementById("SentDate")
    ];

    requiredFields.forEach(field => {

        field.addEventListener("blur", function () {
            if (this.value.trim() === "") {
                showRequiredError(this);
            } else {
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

    const messageIdField = document.getElementById("MessageID");

    messageIdField.addEventListener("blur", function () {
        if (!this.readOnly && this.value.trim() === "") {
            showUserIdRequiredError(this);
        } else {
            removeUserIdRequiredError(this);
        }
    });

    messageIdField.addEventListener("input", function () {
        if (this.value.trim() !== "") {
            removeUserIdRequiredError(this);
        }
    });

});

document.addEventListener("DOMContentLoaded", () => {

    const infoModalOverlay = document.getElementById("infoModalOverlay");
    const infoModalText    = document.getElementById("infoModalText");
    const infoModalClose   = document.getElementById("infoModalClose");

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
    if (mode === "new")  document.getElementById("newModeBtn").classList.add("active");
    if (mode === "find") document.getElementById("findModeBtn").classList.add("active");
}

const FORM_FIELD_IDS = [
    "SenderID",
    "ReceiverID",
    "MessageText",
    "SentDate"
];

function setFormFieldsDisabled(disabled) {
    FORM_FIELD_IDS.forEach(id => {
        document.getElementById(id).disabled = disabled;
    });
}

function setSaveButtonDisabled(disabled) {
    document.querySelector(".save-btn").disabled = disabled;
}

function setSaveButtonText(text) {
    document.querySelector(".save-btn").textContent = text;
}

function showConfirmModal() {
    document.getElementById("confirmModal").classList.add("show");
}

function hideConfirmModal() {
    document.getElementById("confirmModal").classList.remove("show");
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

function restoreOriginalValues() {
    if (!originalMessageData) return;
    populateForm(originalMessageData);
    showMessage("Changes discarded.", "info");
}


async function pyGet(path) {
    const response = await fetch(PYTHON_API_BASE + path);
    return response.json();
}

async function pyPost(path, data) {
    const response = await fetch(PYTHON_API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function pyPut(path, data) {
    const response = await fetch(PYTHON_API_BASE + path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response.json();
}


async function loadUsers() {

    const senderSelect   = document.getElementById("SenderID");
    const receiverSelect = document.getElementById("ReceiverID");

    senderSelect.innerHTML   = '<option value="">--Select Sender--</option>';
    receiverSelect.innerHTML = '<option value="">--Select Receiver--</option>';

    try {
        const result = await DatabaseAPI.get("/api/users");
        const rows = Array.isArray(result) ? result : result.data || result.users || [];

        rows.forEach(item => {

            const label = `${item.user_id} - ${item.first_name} ${item.last_name}`;

            const senderOption = document.createElement("option");
            senderOption.value = item.user_id;
            senderOption.textContent = label;
            senderSelect.appendChild(senderOption);

            const receiverOption = document.createElement("option");
            receiverOption.value = item.user_id;
            receiverOption.textContent = label;
            receiverSelect.appendChild(receiverOption);

        });

    } catch (err) {
        console.error(err);
        showMessage("Unable to load users.", "error");
    }
}

async function loadNewMessageId() {
    try {
        const result = await pyGet("/messages/newid");

        if (!result.success) {
            showMessage(result.message, "error");
            return;
        }

        document.getElementById("MessageID").value   = result.message_id;
        document.getElementById("MessageID").readOnly = true;

        const now = new Date();
        now.setSeconds(0, 0);
        document.getElementById("SentDate").value =
            now.toISOString().slice(0, 16);

        isExistingMessage = false;
        setSaveButtonText("Save");
        setActiveMode("new");
        setFormFieldsDisabled(false);
        setSaveButtonDisabled(false);

    } catch (err) {
        console.error(err);
        showMessage("Unable to generate Message ID.", "error");
    }
}


function clearForm() {
    originalMessageData = null;
    document.getElementById("SenderID").value    = "";
    document.getElementById("ReceiverID").value  = "";
    document.getElementById("MessageText").value = "";
    document.getElementById("SentDate").value    = "";
    isExistingMessage = false;
    setSaveButtonText("Save");

    document.querySelectorAll(".user-field-wrapper").forEach(wrapper => {
        const field = wrapper.querySelector("input, select, textarea");
        if (field) {
            field.classList.remove("field-error");
            const errorMsg = wrapper.querySelector(".field-error-message");
            if (errorMsg) errorMsg.remove();
        }
    });
}

function populateForm(msg) {
    originalMessageData = JSON.parse(JSON.stringify(msg));

    document.getElementById("MessageID").value   = msg.message_id   ?? "";
    document.getElementById("SenderID").value    = msg.sender_id    ?? "";
    document.getElementById("ReceiverID").value  = msg.receiver_id  ?? "";
    document.getElementById("MessageText").value = msg.message_text ?? "";

    if (msg.sent_date) {
        document.getElementById("SentDate").value =
            msg.sent_date.length > 16
                ? msg.sent_date.slice(0, 16)
                : msg.sent_date;
    } else {
        document.getElementById("SentDate").value = "";
    }

    isExistingMessage = true;
    setSaveButtonText("Update");

    const requiredFields = [
        document.getElementById("SenderID"),
        document.getElementById("ReceiverID"),
        document.getElementById("MessageText"),
        document.getElementById("SentDate")
    ];
    requiredFields.forEach(field => removeRequiredError(field));
    removeUserIdRequiredError(document.getElementById("MessageID"));

    setFormFieldsDisabled(false);
    setSaveButtonDisabled(false);
}

function getFormData() {
    return {
        message_id:   document.getElementById("MessageID").value,
        sender_id:    document.getElementById("SenderID").value,
        receiver_id:  document.getElementById("ReceiverID").value,
        message_text: document.getElementById("MessageText").value.trim(),
        sent_date:    document.getElementById("SentDate").value
    };
}

function validateForm(data) {

    if (!data.message_id) {
        showMessage("Message ID is required.", "error");
        return false;
    }

    if (!data.sender_id) {
        showMessage("Sender is required.", "error");
        return false;
    }

    if (!data.receiver_id) {
        showMessage("Receiver is required.", "error");
        return false;
    }

    if (data.sender_id === data.receiver_id) {
        showMessage("Sender and Receiver cannot be the same user.", "error");
        return false;
    }

    if (!data.message_text) {
        showMessage("Message text is required.", "error");
        return false;
    }

    if (!data.sent_date) {
        showMessage("Sent Date is required.", "error");
        return false;
    }

    return true;
}


function startNewMode() {
    clearForm();
    isExistingMessage = false;
    const idInput = document.getElementById("MessageID");
    removeUserIdRequiredError(idInput);
    idInput.readOnly = true;
    setSaveButtonText("Save");
    setActiveMode("new");
    loadNewMessageId();
}

function startFindMode() {
    clearForm();
    isExistingMessage = false;
    const idInput = document.getElementById("MessageID");
    idInput.value    = "";
    idInput.readOnly = false;
    idInput.focus();
    setSaveButtonText("Update");
    setActiveMode("find");
    setFormFieldsDisabled(true);
    setSaveButtonDisabled(true);
    showMessage("Enter Message ID and press Enter.", "info");
}

async function findMessage() {
    const idInput = document.getElementById("MessageID");
    const id = idInput.value.trim();

    if (id === "") {
        showMessage("Enter Message ID.", "error");
        idInput.focus();
        return;
    }

    try {
        const result = await pyGet("/messages/" + id);

        if (!result.success) {
            clearForm();
            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);
            showMessage("Message not found.", "error");
            idInput.focus();
            return;
        }

        populateForm(result.data);
        setActiveMode("find");
        showMessage("Message loaded successfully.", "success");

    } catch (err) {
        console.error(err);
        showMessage("Unable to find message.", "error");
    }
}

async function loadMessageList() {
    try {
        const result = await pyGet("/messages");
        const rows = Array.isArray(result) ? result : result.data || [];

        messageList = rows
            .map(r => Number(r.message_id))
            .sort((a, b) => a - b);

        return true;

    } catch (err) {
        console.error(err);
        showMessage("Unable to load messages.", "error");
        return false;
    }
}

async function loadAndPopulateMessage(id) {
    try {
        const result = await pyGet("/messages/" + id);

        if (!result.success) {
            clearForm();
            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);
            showMessage("Message not found.", "error");
            return;
        }

        populateForm(result.data);
        setActiveMode("find");
        document.getElementById("MessageID").readOnly = true;
        showMessage("Existing record loaded.", "success");

    } catch (err) {
        console.error(err);
        showMessage("Unable to load message.", "error");
    }
}

async function previousRecord() {
    if (messageList.length === 0) {
        showMessage("No message records found.", "info");
        return;
    }

    const currentId = Number(document.getElementById("MessageID").value);
    currentIndex = messageList.indexOf(currentId);

    if (currentIndex === -1) {
        currentIndex = messageList.length - 1;
    } else if (currentIndex <= 0) {
        showMessage("First Record", "info");
        return;
    } else {
        currentIndex--;
    }

    await loadAndPopulateMessage(messageList[currentIndex]);
}

async function nextRecord() {
    if (!isExistingMessage) {
        showMessage("Already at new data entry.", "info");
        return;
    }

    if (messageList.length === 0) {
        showMessage("No message records found.", "info");
        return;
    }

    const currentId = Number(document.getElementById("MessageID").value);
    currentIndex = messageList.indexOf(currentId);

    if (currentIndex === -1) {
        currentIndex = 0;
    } else if (currentIndex >= messageList.length - 1) {
        clearForm();
        currentIndex = -1;
        setSaveButtonText("Save");
        document.getElementById("MessageID").readOnly = true;
        loadNewMessageId();
        showMessage("New message record.", "info");
        return;
    } else {
        currentIndex++;
    }

    await loadAndPopulateMessage(messageList[currentIndex]);
}

async function saveMessage() {
    const data = getFormData();
    if (!validateForm(data)) return;

    if (isExistingMessage) {
        showConfirmModal();
        return;
    }

    await performSaveMessage();
}

async function performSaveMessage() {
    const data = getFormData();
    if (!validateForm(data)) return;

    try {
        let result;

        if (isExistingMessage) {
            result = await pyPut("/messages/" + data.message_id, data);
        } else {
            result = await pyPost("/messages", data);
        }

        if (!result.success) {
            showMessage(result.message || "Unable to save message.", "error");
            return;
        }

        showMessage(result.message || "Message saved successfully.", "success");

        clearForm();
        document.getElementById("MessageID").readOnly = true;

        await loadNewMessageId();
        await loadMessageList();

    } catch (err) {
        console.error(err);
        showMessage("Error saving message.", "error");
    }
}

function showRequiredError(field) {
    field.classList.add("field-error");
    const wrapper = field.closest(".user-field-wrapper");
    if (!wrapper) return;
    let errorMsg = wrapper.querySelector(".field-error-message");
    if (!errorMsg) {
        errorMsg = document.createElement("span");
        errorMsg.className = "field-error-message";
        errorMsg.textContent = "This field is required";
        wrapper.appendChild(errorMsg);
    }
}

function removeRequiredError(field) {
    field.classList.remove("field-error");
    const wrapper = field.closest(".user-field-wrapper");
    if (!wrapper) return;
    const errorMsg = wrapper.querySelector(".field-error-message");
    if (errorMsg) errorMsg.remove();
}

function showUserIdRequiredError(field) {
    field.classList.add("field-error");
    const group = field.closest(".id-find-group");
    if (!group) return;
    let errorMsg = group.querySelector(".user-id-error-message");
    if (!errorMsg) {
        errorMsg = document.createElement("span");
        errorMsg.className = "user-id-error-message";
        errorMsg.textContent = "This field is required";
        group.appendChild(errorMsg);
    }
}

function removeUserIdRequiredError(field) {
    field.classList.remove("field-error");
    const group = field.closest(".id-find-group");
    if (!group) return;
    const errorMsg = group.querySelector(".user-id-error-message");
    if (errorMsg) errorMsg.remove();
}