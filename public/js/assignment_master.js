let editMode = false;
let currentAssignmentId = null;
let messageTimer = null;
let assignmentList = [];
let currentIndex = -1;
let currentMode = "new";
document.addEventListener("DOMContentLoaded", () => {
    startNewMode();
    loadAssignmentList();

    const requiredFields = [
        document.getElementById("Title"),
        document.getElementById("BatchID"),
        document.getElementById("DueDate")
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

    const assignmentIdField = document.getElementById("AssignmentID");

    assignmentIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showAssignmentIdRequiredError(this);
        }
        else {
            removeAssignmentIdRequiredError(this);
        }

    });

    assignmentIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeAssignmentIdRequiredError(this);
        }

    });

    const dueDateInput = document.getElementById("DueDate");

    const today = new Date();
    const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    )
        .toISOString()
        .split("T")[0];

    dueDateInput.min = localToday;

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .getElementById("AssignmentID")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                // Stop the native form submit / page reload so the
                // fetch below actually gets a chance to run.
                event.preventDefault();

                if (currentMode === "find") {

                    findAssignment();

                }

            }

        });

    loadBatchDropdown();

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveAssignment);

    document
        .querySelector(".previous-btn")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".next-btn")
        .addEventListener("click", nextRecord);

});

function setMode(mode) {

    currentMode = mode;

    document
        .getElementById("newModeBtn")
        .classList.toggle("active", mode === "new");

    document
        .getElementById("findModeBtn")
        .classList.toggle("active", mode === "find");

  
    document.querySelector(".save-btn").textContent =
        mode === "find" ? "Update" : "Save";

}


function setFieldsDisabled(disabled) {

    const fields = [
        document.getElementById("Title"),
        document.getElementById("BatchID"),
        document.getElementById("DueDate")
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
    const prevBtn = document.querySelector(".previous-btn");
    const nextBtn = document.querySelector(".next-btn");

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

async function startNewMode() {

    
    setFieldsDisabled(false);

    setMode("new");

    const assignmentInput =
        document.getElementById("AssignmentID");

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

    const assignmentInput =
        document.getElementById("AssignmentID");
    removeAssignmentIdRequiredError(assignmentInput);

    assignmentInput.value = "";
    assignmentInput.readOnly = false;

    assignmentInput.focus();

   
    setFieldsDisabled(true);

    showMessage(
        "Enter Assignment ID and press Enter.",
        "info"
    );

}

async function generateNextAssignmentID() {

    try {

        const result = await DatabaseAPI.get("/api/assignments/newid");

        if (!result.success) {

            showMessage(result.message, "error");
            return;

        }

        document.getElementById("AssignmentID").value =
            result.assignment_id;

        currentAssignmentId = result.assignment_id;

        editMode = false;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Assignment ID", "error");

    }

}

function showMessage(message, type = "info") {

    const status =
        document.getElementById("statusMessage");

    clearTimeout(messageTimer);

    status.className = "status-message";

    status.classList.add(type);

    status.textContent = message;

    messageTimer = setTimeout(() => {

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

    const assignmentId =
        document.getElementById("AssignmentID");

    const title =
        document.getElementById("Title");

    const batchId =
        document.getElementById("BatchID");

    const dueDate =
        document.getElementById("DueDate");


    assignmentId.value = row[0];
    title.value = row[1];
    batchId.value = row[2];

    const date = new Date(row[3]);

    dueDate.value =
        date.toISOString().split("T")[0];
    removeAssignmentIdRequiredError(assignmentId);

    removeRequiredError(title);
    removeRequiredError(batchId);
    removeRequiredError(dueDate);

}

async function findAssignment() {

    const assignmentInput = document.getElementById("AssignmentID");

    const assignmentId = assignmentInput.value.trim();

    if (assignmentId === "") {

        showMessage("Enter Assignment ID.", "error");

        assignmentInput.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get(
            "/api/assignments/" + assignmentId
        );

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

        currentIndex = assignmentList.findIndex(
            row => Number(row[0]) === Number(result.assignment_id)
        );

        showMessage("Assignment loaded successfully.", "success");

        removeAssignmentIdRequiredError(
            document.getElementById("AssignmentID")
        );

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find assignment.", "error");

        setFieldsDisabled(true);

    }

}

async function loadAssignmentList() {

    try {

        assignmentList = await DatabaseAPI.get("/api/assignments");

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load assignments.", "error");

        return false;

    }

}

function previousRecord() {

    if (assignmentList.length === 0) {

        showMessage("No assignment records found.", "info");

        return;

    }

    const currentId = Number(
        document.getElementById("AssignmentID").value
    );

    currentIndex = assignmentList.findIndex(
        row => Number(row[0]) === currentId
    );

    if (currentIndex === -1) {

        currentIndex = assignmentList.length - 1;

    }
    else if (currentIndex <= 0) {

        showMessage("First Record", "info");

        return;

    }
    else {

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

    const currentId = Number(
        document.getElementById("AssignmentID").value
    );

    currentIndex = assignmentList.findIndex(
        row => Number(row[0]) === currentId
    );

    if (currentIndex === -1) {

        const lastId = Number(
            assignmentList[assignmentList.length - 1][0]
        );

        if (currentId > lastId) {

            showMessage("Already at new record.", "info");

            return;

        }

        currentIndex = 0;

    }
    else if (currentIndex >= assignmentList.length - 1) {

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

    }
    else {

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

    const batchDropdown = document.getElementById("BatchID");

    try {

        const batches = await DatabaseAPI.get("/api/batches");

        batchDropdown.innerHTML =
            `<option value="">Select Batch</option>`;

        batches.forEach(row => {

            const option = document.createElement("option");

            option.value = row[0];

            option.textContent = `${row[0]} - ${row[1]}`;

            batchDropdown.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load batches.", "error");

    }

}

async function saveAssignment() {

    if (!validateForm())
        return;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < assignmentList.length) {
                populateForm(assignmentList[currentIndex]);
            }

            return;

        }

    }

    const data = {

        assignment_id: Number(document.getElementById("AssignmentID").value),

        title: document.getElementById("Title").value.trim(),

        batch_id: Number(document.getElementById("BatchID").value),

        due_date: document.getElementById("DueDate").value

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                "/api/assignments/" + data.assignment_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post(
                "/api/assignments",
                data
            );

        }

        if (!result.success) {

            showMessage(result.message, "error");

            return;

        }

        showMessage(result.message, "success");

        clearForm();

        document.getElementById("AssignmentID").value = "";

        document.getElementById("AssignmentID").readOnly = true;

        currentAssignmentId = null;

        setMode("new");

        setFieldsDisabled(false);

        await loadAssignmentList();

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to save record.", "error");

    }

}

function showAssignmentIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    let errorMessage =
        group.querySelector(".assignment-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className =
            "assignment-id-error-message";

        errorMessage.textContent =
            "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeAssignmentIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    const errorMessage =
        group.querySelector(".assignment-id-error-message");

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
    const selectedDate = document.getElementById("DueDate").value;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(selectedDate + "T00:00:00");

    if (dueDate < today) {

        showMessage(
            "Due Date cannot be before today's date.",
            "error"
        );

        document.getElementById("DueDate").focus();

        return false;
    }

    return true;

}

function showRequiredError(field) {

    field.classList.add("field-error");

    const wrapper = field.closest(".assignment-field-wrapper");

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

    const wrapper = field.closest(".assignment-field-wrapper");

    const errorMessage =
        wrapper.querySelector(".field-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

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
    box.style.padding = "32px 40px";
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";
    box.style.maxWidth = "420px";
    box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
    box.style.fontFamily = "inherit";

    const text = document.createElement("p");
    text.textContent = message;
    text.style.marginBottom = "20px";
    text.style.fontSize = "18px";
    text.style.color = "#222";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "10px 32px";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.background = "#5535d6";
    closeBtn.style.color = "#fff";
    closeBtn.style.fontSize = "16px";
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