let editMode = false;
let currentAssignmentId = null;
let messageTimer = null;
let assignmentList = [];
let currentIndex = -1;
let currentMode = "new";

document.addEventListener("DOMContentLoaded", function () {

    startNewMode();
    loadAssignmentList();

    let titleField = document.getElementById("Title");
    let batchField = document.getElementById("BatchID");
    let dueDateField = document.getElementById("DueDate");

    titleField.addEventListener("blur", function () {
        checkRequiredField(this);
    });
    titleField.addEventListener("input", function () {
        checkRequiredField(this);
    });
    titleField.addEventListener("change", function () {
        checkRequiredField(this);
    });

    batchField.addEventListener("blur", function () {
        checkRequiredField(this);
    });
    batchField.addEventListener("input", function () {
        checkRequiredField(this);
    });
    batchField.addEventListener("change", function () {
        checkRequiredField(this);
    });

    dueDateField.addEventListener("blur", function () {
        checkRequiredField(this);
    });
    dueDateField.addEventListener("input", function () {
        checkRequiredField(this);
    });
    dueDateField.addEventListener("change", function () {
        checkRequiredField(this);
    });

    let assignmentIdField = document.getElementById("AssignmentID");

    assignmentIdField.addEventListener("blur", function () {
        if (currentMode === "find" && !this.readOnly && this.value.trim() === "") {
            showAssignmentIdRequiredError(this);
        } else {
            removeAssignmentIdRequiredError(this);
        }
    });

    assignmentIdField.addEventListener("input", function () {
        if (this.value.trim() !== "") {
            removeAssignmentIdRequiredError(this);
        }
    });

    let dueDateInput = document.getElementById("DueDate");

    let today = new Date();
    let localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

    dueDateInput.min = localToday;

    document.getElementById("newModeBtn").addEventListener("click", startNewMode);
    document.getElementById("findModeBtn").addEventListener("click", startFindMode);

    document.getElementById("AssignmentID").addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            if (currentMode === "find") {
                findAssignment();
            }

        }

    });

    loadBatchDropdown();

    document.querySelector(".save-btn").addEventListener("click", saveAssignment);
    document.querySelector(".previous-btn").addEventListener("click", previousRecord);
    document.querySelector(".next-btn").addEventListener("click", nextRecord);

    let infoIcons = document.querySelectorAll(".info-icon");

    for (let i = 0; i < infoIcons.length; i++) {
        let icon = infoIcons[i];
        icon.style.cursor = "pointer";
        icon.addEventListener("click", function (e) {
            e.stopPropagation();
            let tooltip = icon.querySelector(".tooltip");
            if (tooltip) {
                showInfoModal(tooltip.textContent.trim());
            }
        });
    }

});

function checkRequiredField(field) {
    if (field.value.trim() === "") {
        showRequiredError(field);
    } else {
        removeRequiredError(field);
    }
}

function setMode(mode) {

    currentMode = mode;

    document.getElementById("newModeBtn").classList.toggle("active", mode === "new");
    document.getElementById("findModeBtn").classList.toggle("active", mode === "find");

    document.querySelector(".save-btn").textContent = mode === "find" ? "Update" : "Save";
}

function setFieldsDisabled(disabled) {

    let titleField = document.getElementById("Title");
    let batchField = document.getElementById("BatchID");
    let dueDateField = document.getElementById("DueDate");

    let fields = [titleField, batchField, dueDateField];

    for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        if (field) {
            field.disabled = disabled;
            field.style.backgroundColor = disabled ? "#e9e9e9" : "";
            field.style.color = disabled ? "#888" : "";
            field.style.cursor = disabled ? "not-allowed" : "";
        }
    }

    let saveBtn = document.querySelector(".save-btn");
    let prevBtn = document.querySelector(".previous-btn");
    let nextBtn = document.querySelector(".next-btn");

    let buttons = [saveBtn, prevBtn, nextBtn];

    for (let i = 0; i < buttons.length; i++) {
        let btn = buttons[i];
        if (btn) {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? "0.5" : "";
            btn.style.cursor = disabled ? "not-allowed" : "";
        }
    }
}

function showConfirmModal(message) {

    return new Promise(function (resolve) {

        let overlay = document.createElement("div");
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

        let box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "24px 32px";
        box.style.borderRadius = "10px";
        box.style.textAlign = "center";
        box.style.maxWidth = "340px";
        box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
        box.style.fontFamily = "inherit";

        let text = document.createElement("p");
        text.textContent = message;
        text.style.marginBottom = "20px";
        text.style.fontSize = "16px";
        text.style.color = "#222";

        let btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";
        btnContainer.style.gap = "12px";

        let yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.textContent = "Yes";
        yesBtn.style.padding = "8px 22px";
        yesBtn.style.border = "none";
        yesBtn.style.borderRadius = "6px";
        yesBtn.style.background = "#16a34a";
        yesBtn.style.color = "#fff";
        yesBtn.style.fontSize = "14px";
        yesBtn.style.cursor = "pointer";

        let noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.textContent = "No";
        noBtn.style.padding = "8px 22px";
        noBtn.style.border = "none";
        noBtn.style.borderRadius = "6px";
        noBtn.style.background = "#dc2626";
        noBtn.style.color = "#fff";
        noBtn.style.fontSize = "14px";
        noBtn.style.cursor = "pointer";

        yesBtn.addEventListener("click", function () {
            document.body.removeChild(overlay);
            resolve(true);
        });

        noBtn.addEventListener("click", function () {
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

async function startNewMode() {

    setFieldsDisabled(false);

    setMode("new");

    let assignmentInput = document.getElementById("AssignmentID");

    removeAssignmentIdRequiredError(assignmentInput);

    clearForm();

    editMode = false;
    currentAssignmentId = null;
    currentIndex = -1;

    assignmentInput.readOnly = true;

    await generateNextAssignmentID();

    removeAssignmentIdRequiredError(assignmentInput);
}

function startFindMode() {

    setMode("find");

    clearForm();

    editMode = false;
    currentAssignmentId = null;
    currentIndex = -1;

    let assignmentInput = document.getElementById("AssignmentID");

    removeAssignmentIdRequiredError(assignmentInput);

    assignmentInput.value = "";
    assignmentInput.readOnly = false;

    assignmentInput.focus();

    setFieldsDisabled(true);

    showMessage("Enter Assignment ID and press Enter.", "info");
}

async function generateNextAssignmentID() {

    try {

        let result = await DatabaseAPI.get("/api/assignments/newid");

        if (!result.success) {
            showMessage(result.message, "error");
            return;
        }

        document.getElementById("AssignmentID").value = result.assignment_id;

        currentAssignmentId = result.assignment_id;

        editMode = false;

    } catch (err) {
        console.error(err);
        showMessage("Unable to generate Assignment ID", "error");
    }

}

function showMessage(message, type) {

    if (!type) type = "info";

    let status = document.getElementById("statusMessage");

    clearTimeout(messageTimer);

    status.className = "status-message";
    status.classList.add(type);
    status.textContent = message;

    messageTimer = setTimeout(function () {
        status.className = "status-message";
        status.textContent = "";
    }, 4000);

}

function clearForm() {
    document.getElementById("Title").value = "";
    document.getElementById("BatchID").value = "";
    document.getElementById("DueDate").value = "";

    editMode = false;
}

function populateForm(row) {

    let assignmentId = document.getElementById("AssignmentID");
    let title = document.getElementById("Title");
    let batchId = document.getElementById("BatchID");
    let dueDate = document.getElementById("DueDate");

    assignmentId.value = row[0];
    title.value = row[1];
    batchId.value = row[2];

    let date = new Date(row[3]);

    dueDate.value = date.toISOString().split("T")[0];

    removeAssignmentIdRequiredError(assignmentId);
    removeRequiredError(title);
    removeRequiredError(batchId);
    removeRequiredError(dueDate);
}

async function findAssignment() {

    let assignmentInput = document.getElementById("AssignmentID");
    let assignmentId = assignmentInput.value.trim();

    if (assignmentId === "") {
        showMessage("Enter Assignment ID.", "error");
        assignmentInput.focus();
        return;
    }

    try {

        let result = await DatabaseAPI.get("/api/assignments/" + assignmentId);

        if (!result.success) {

            clearForm();

            assignmentInput.value = assignmentId;

            showMessage("Not a valid Assignment ID.", "error");

            assignmentInput.focus();

            setFieldsDisabled(true);

            return;
        }

        setFieldsDisabled(false);

        assignmentInput.value = result.assignment_id;

        document.getElementById("Title").value = result.title;
        document.getElementById("BatchID").value = result.batch_id;
        document.getElementById("DueDate").value = result.due_date;

        editMode = true;

        currentAssignmentId = result.assignment_id;

        currentIndex = -1;
        for (let i = 0; i < assignmentList.length; i++) {
            if (Number(assignmentList[i][0]) === Number(result.assignment_id)) {
                currentIndex = i;
                break;
            }
        }

        showMessage("Assignment loaded successfully.", "success");

        removeAssignmentIdRequiredError(document.getElementById("AssignmentID"));

    } catch (err) {
        console.error(err);
        showMessage("Unable to find assignment.", "error");
        setFieldsDisabled(true);
    }

}

async function loadAssignmentList() {

    try {
        assignmentList = await DatabaseAPI.get("/api/assignments");
        return true;
    } catch (err) {
        console.error(err);
        showMessage("Unable to load assignments.", "error");
        return false;
    }

}

function findIndexById(id) {

    for (let i = 0; i < assignmentList.length; i++) {
        if (Number(assignmentList[i][0]) === id) {
            return i;
        }
    }

    return -1;
}

function previousRecord() {

    if (assignmentList.length === 0) {
        showMessage("No assignment records found.", "info");
        return;
    }

    let currentId = Number(document.getElementById("AssignmentID").value);

    currentIndex = findIndexById(currentId);

    if (currentIndex === -1) {
        currentIndex = assignmentList.length - 1;
    } else if (currentIndex <= 0) {
        showMessage("First Record", "info");
        return;
    } else {
        currentIndex--;
    }

    populateForm(assignmentList[currentIndex]);
    setMode("find");

    setFieldsDisabled(false);

    document.getElementById("AssignmentID").readOnly = true;

    editMode = true;

    currentAssignmentId = assignmentList[currentIndex][0];
}

function nextRecord() {

    if (assignmentList.length === 0) {
        showMessage("No assignment records found.", "info");
        return;
    }

    let currentId = Number(document.getElementById("AssignmentID").value);

    currentIndex = findIndexById(currentId);

    if (currentIndex === -1) {

        let lastId = Number(assignmentList[assignmentList.length - 1][0]);

        if (currentId > lastId) {
            showMessage("Already at new record.", "info");
            return;
        }

        currentIndex = 0;

    } else if (currentIndex >= assignmentList.length - 1) {

        clearForm();

        editMode = false;
        currentAssignmentId = null;
        currentIndex = -1;

        setMode("new");

        setFieldsDisabled(false);

        document.getElementById("AssignmentID").readOnly = true;

        generateNextAssignmentID();

        showMessage("New assignment record.", "info");

        return;

    } else {
        currentIndex++;
    }

    populateForm(assignmentList[currentIndex]);
    setMode("find");

    setFieldsDisabled(false);

    document.getElementById("AssignmentID").readOnly = true;

    editMode = true;

    currentAssignmentId = assignmentList[currentIndex][0];
}

async function loadBatchDropdown() {

    let batchDropdown = document.getElementById("BatchID");

    try {

        let batches = await DatabaseAPI.get("/api/batches");

        batchDropdown.innerHTML = "<option value=\"\">Select Batch</option>";

        for (let i = 0; i < batches.length; i++) {
            let batch = batches[i];
            let option = document.createElement("option");
            option.value = batch.batch_id;
            option.textContent = batch.batch_id + " - " + batch.batch_name;
            batchDropdown.appendChild(option);
        }

    } catch (err) {
        console.error(err);
        showMessage("Unable to load batches.", "error");
    }

}

async function saveAssignment() {

    if (!validateForm()) {
        return;
    }

    if (editMode) {

        let confirmed = await showConfirmModal("Do you want to update the changes?");

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < assignmentList.length) {
                populateForm(assignmentList[currentIndex]);
            }
            return;
        }

    }

    let data = {
        assignment_id: Number(document.getElementById("AssignmentID").value),
        title: document.getElementById("Title").value.trim(),
        batch_id: Number(document.getElementById("BatchID").value),
        due_date: document.getElementById("DueDate").value
    };

    try {

        let result;

        if (editMode) {
            result = await DatabaseAPI.put("/api/assignments/" + data.assignment_id, data);
        } else {
            result = await DatabaseAPI.post("/api/assignments", data);
        }

        if (!result.success) {
            showMessage(result.message, "error");
            return;
        }

        showMessage(result.message, "success");

        await loadAssignmentList();

        await startNewMode();

    } catch (err) {
        console.error(err);
        showMessage("Unable to save record.", "error");
    }

}

function showAssignmentIdRequiredError(field) {

    field.classList.add("field-error");

    let group = field.closest(".id-find-group");

    let errorMessage = group.querySelector(".assignment-id-error-message");

    if (!errorMessage) {
        errorMessage = document.createElement("span");
        errorMessage.className = "assignment-id-error-message";
        errorMessage.textContent = "This field is required";
        group.appendChild(errorMessage);
    }
}

function removeAssignmentIdRequiredError(field) {

    field.classList.remove("field-error");

    let group = field.closest(".id-find-group");

    let errorMessage = group.querySelector(".assignment-id-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }
}

function validateForm() {

    if (document.getElementById("Title").value.trim() == "") {
        showMessage("Enter Assignment Title", "error");
        document.getElementById("Title").focus();
        return false;
    }

    if (document.getElementById("BatchID").value.trim() == "") {
        showMessage("Select Batch", "error");
        document.getElementById("BatchID").focus();
        return false;
    }

    if (document.getElementById("DueDate").value == "") {
        showMessage("Select Due Date", "error");
        document.getElementById("DueDate").focus();
        return false;
    }

    let selectedDate = document.getElementById("DueDate").value;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueDate = new Date(selectedDate + "T00:00:00");

    if (dueDate < today) {
        showMessage("Due Date cannot be before today's date.", "error");
        document.getElementById("DueDate").focus();
        return false;
    }

    return true;
}

function showRequiredError(field) {

    field.classList.add("field-error");

    let wrapper = field.closest(".assignment-field-wrapper");

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

    let wrapper = field.closest(".assignment-field-wrapper");

    let errorMessage = wrapper.querySelector(".field-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }
}

function showInfoModal(message) {

    let overlay = document.createElement("div");
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

    let box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "32px 40px";
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";
    box.style.maxWidth = "420px";
    box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
    box.style.fontFamily = "inherit";

    let text = document.createElement("p");
    text.textContent = message;
    text.style.marginBottom = "20px";
    text.style.fontSize = "18px";
    text.style.color = "#222";

    let closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "10px 32px";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.background = "#5535d6";
    closeBtn.style.color = "#fff";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.cursor = "pointer";

    closeBtn.addEventListener("click", function () {
        document.body.removeChild(overlay);
    });

    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    box.appendChild(text);
    box.appendChild(closeBtn);
    overlay.appendChild(box);

    document.body.appendChild(overlay);

}