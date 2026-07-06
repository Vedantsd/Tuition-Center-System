let editMode = false;
let currentAssignmentId = null;
let messageTimer = null;
let assignmentList = [];
let currentIndex = -1;
document.addEventListener("DOMContentLoaded", () => {

    loadAssignmentList();
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

            if (event.key === "Enter" && !this.readOnly) {
                findAssignment();
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

        document.querySelector(".save-btn").textContent = "Save";

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

    document.querySelector(".save-btn").textContent = "Save";

}

function populateForm(row) {

    document.getElementById("AssignmentID").value = row[0];

    document.getElementById("Title").value = row[1];

    document.getElementById("BatchID").value = row[2];

    document.getElementById("DueDate").value = row[3];

}
function startNewMode() {

    clearForm();

    editMode = false;
    currentAssignmentId = null;

    document.getElementById("AssignmentID").readOnly = true;

    document.querySelector(".save-btn").textContent = "Save";

    hideModeToggle();

    generateNextAssignmentID();

}
function startFindMode() {

    clearForm();

    editMode = false;
    currentAssignmentId = null;

    const assignmentInput =
        document.getElementById("AssignmentID");

    assignmentInput.value = "";

    assignmentInput.readOnly = false;

    document.querySelector(".save-btn").textContent = "Save";

    hideModeToggle();

    assignmentInput.focus();

    showMessage(
        "Enter Assignment ID and press Enter.",
        "info"
    );

}
function hideModeToggle() {

    document.getElementById("modeToggle").style.display = "none";

}
function showModeToggle() {

    document.getElementById("modeToggle").style.display = "flex";

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

            showMessage("Assignment not found.", "error");

            assignmentInput.focus();

            return;

        }

        assignmentInput.value = result.assignment_id;

        document.getElementById("Title").value = result.title;

        document.getElementById("BatchID").value = result.batch_id;

        document.getElementById("DueDate").value = result.due_date;

        editMode = true;

        currentAssignmentId = result.assignment_id;

        document.querySelector(".save-btn").textContent = "Update";

        showMessage("Assignment loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find assignment.", "error");

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

    editMode = true;

    currentAssignmentId = assignmentList[currentIndex][0];

    document.querySelector(".save-btn").textContent = "Update";
    showModeToggle();

    document.getElementById("AssignmentID").readOnly = true;

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

    const currentId = Number(
        document.getElementById("AssignmentID").value
    );

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

    document.querySelector(".save-btn").textContent = "Save";


    document.getElementById("AssignmentID").readOnly = true;

    generateNextAssignmentID();

    showMessage("New assignment record.", "info");

    return;

}
    else {

        currentIndex++;

    }

    populateForm(assignmentList[currentIndex]);

    editMode = true;

    currentAssignmentId = assignmentList[currentIndex][0];

    document.querySelector(".save-btn").textContent = "Update";
    showModeToggle();

    document.getElementById("AssignmentID").readOnly = true;

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

        editMode = false;

        currentAssignmentId = null;

        document.querySelector(".save-btn").textContent = "Save";

        showModeToggle();

        await loadAssignmentList();

    }

    catch (err) {

        console.error(err);

        showMessage("Unable to save record.", "error");

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
document.addEventListener("click", function(e) {

    if (
        !e.target.closest("#batchPopup") &&
        !e.target.closest("#BatchID")
    ) {

        closeBatchPopup();

    }

});