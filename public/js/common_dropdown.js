let messageTimer = null;
let isExistingRecord = false;
let currentRecordId = null;
let lookupList = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("fieldName")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                find_data();
            }

        });

});

function showMessage(message, type = "info") {

    const status = document.getElementById("msg");

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

    document.getElementById("saveBtn").textContent = text;

}

function clearValueFields() {

    document.getElementById("optionValue").value = "";
    document.getElementById("status").value = "";

    isExistingRecord = false;
    currentRecordId = null;

    setSaveButtonText("Save");

}

function clearForm() {

    document.getElementById("fieldName").value = "";

    clearValueFields();

    lookupList = [];
    currentIndex = -1;

}

function populateRecord(record) {

    currentRecordId = record.id;

    document.getElementById("optionValue").value = record.lookup_value;
    document.getElementById("status").value =
        record.is_active ? "Active" : "Inactive";

    isExistingRecord = true;

    setSaveButtonText("Update");

}

function mode_change() {

    const button = document.getElementById("modeButton");
    const fieldNameInput = document.getElementById("fieldName");

    if (button.textContent.trim() === "Find") {

        clearValueFields();

        fieldNameInput.readOnly = false;

        document.getElementById("optionValue").focus();

        button.textContent = "New";

        showMessage(
            "Enter Field Name, Option Value & Status, then Save.",
            "info"
        );

    }
    else {

        clearForm();

        fieldNameInput.readOnly = false;
        fieldNameInput.focus();

        button.textContent = "Find";

        showMessage("Enter a Field Name and press Enter to search.", "info");

    }

}

async function find_data() {

    const fieldNameInput = document.getElementById("fieldName");
    const type = fieldNameInput.value.trim();

    if (type === "") {

        showMessage("Enter Field Name.", "error");
        fieldNameInput.focus();
        return;

    }

    try {

        const result = await DatabaseAPI.get(
            "/api/lookup-values?type=" + encodeURIComponent(type)
        );

        if (!result.success) {

            showMessage(result.message || "Unable to search.", "error");
            return;

        }

        lookupList = result.data;

        if (lookupList.length === 0) {

            clearValueFields();

            currentIndex = -1;

            document.getElementById("modeButton").textContent = "New";

            document.getElementById("optionValue").focus();

            showMessage(
                "No values found for this Field Name. You can add one.",
                "info"
            );

            return;

        }

        currentIndex = 0;

        populateRecord(lookupList[currentIndex]);

        document.getElementById("modeButton").textContent = "New";

        showMessage(
            "Loaded " + lookupList.length + " value(s) for '" + type + "'.",
            "success"
        );

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to search values.", "error");

    }

}

function previous_data() {

    if (lookupList.length === 0) {

        showMessage("Search a Field Name first.", "info");
        return;

    }

    if (currentIndex <= 0) {

        showMessage("First Record", "info");
        return;

    }

    currentIndex--;

    populateRecord(lookupList[currentIndex]);

    document.getElementById("modeButton").textContent = "New";

}

function next_data() {

    if (lookupList.length === 0) {

        showMessage("Search a Field Name first.", "info");
        return;

    }

    if (currentIndex >= lookupList.length - 1) {

        showMessage("Last Record", "info");
        return;

    }

    currentIndex++;

    populateRecord(lookupList[currentIndex]);

    document.getElementById("modeButton").textContent = "New";

}

function validateForm(data) {

    if (!data.lookup_type) {

        showMessage("Field Name is required.", "error");
        document.getElementById("fieldName").focus();
        return false;

    }

    if (!data.lookup_value) {

        showMessage("Option Value is required.", "error");
        document.getElementById("optionValue").focus();
        return false;

    }

    if (data.statusText === "") {

        showMessage("Status is required.", "error");
        document.getElementById("status").focus();
        return false;

    }

    const normalized = data.statusText.toLowerCase();

    if (normalized !== "active" && normalized !== "inactive") {

        showMessage(
            "Status must be 'Active' or 'Inactive'.",
            "error"
        );

        document.getElementById("status").focus();

        return false;

    }

    return true;

}

async function save_data() {

    const lookup_type = document.getElementById("fieldName").value.trim();
    const lookup_value = document.getElementById("optionValue").value.trim();
    const statusText = document.getElementById("status").value.trim();

    const formData = { lookup_type, lookup_value, statusText };

    if (!validateForm(formData))
        return;

    const is_active = statusText.toLowerCase() === "active";

    try {

        let result;

        if (isExistingRecord) {

            result = await DatabaseAPI.put(
                "/api/lookup-values/" + currentRecordId,
                { lookup_value, is_active }
            );

        }
        else {

            result = await DatabaseAPI.post(
                "/api/lookup-values",
                { lookup_type, lookup_value, is_active }
            );

        }

        if (!result.success) {

            showMessage(result.message || "Unable to save value.", "error");
            return;

        }

        showMessage(result.message || "Value saved successfully.", "success");

        const refreshed = await DatabaseAPI.get(
            "/api/lookup-values?type=" + encodeURIComponent(lookup_type)
        );

        if (refreshed.success) {

            lookupList = refreshed.data;

            const savedId = isExistingRecord
                ? currentRecordId
                : result.id;

            currentIndex = lookupList.findIndex(
                row => Number(row.id) === Number(savedId)
            );

            if (currentIndex !== -1) {

                populateRecord(lookupList[currentIndex]);

            }

        }

        document.getElementById("modeButton").textContent = "New";

    }
    catch (err) {

        console.error(err);

        showMessage("Error saving value.", "error");

    }

}

function exit_page() {

    window.location.href = "index.html";

}