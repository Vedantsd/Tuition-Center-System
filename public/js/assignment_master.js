let editMode = false;
let currentAssignmentId = null;
let messageTimer = null;
let assignmentList = [];
let currentIndex = -1;
document.addEventListener("DOMContentLoaded", () => {

    generateNextAssignmentID();
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
        .getElementById("findAssignmentBtn")
        .addEventListener("click", handleFindNew);

    document
        .getElementById("AssignmentID")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter" && !this.readOnly) {
                findAssignment();
            }

        });

    document
        .getElementById("BatchID")
        .addEventListener("click", openBatchPopup);

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
function handleFindNew() {

    const button = document.getElementById("findAssignmentBtn");
    const assignmentInput = document.getElementById("AssignmentID");

    if (button.textContent === "Find") {

        clearForm();

        assignmentInput.value = "";
        assignmentInput.readOnly = false;
        assignmentInput.focus();

        button.textContent = "New";

        editMode = false;

        document.querySelector(".save-btn").textContent = "Save";

        showMessage("Enter Assignment ID and press Enter.", "info");

    }
    else {

        clearForm();

        assignmentInput.readOnly = true;

        button.textContent = "Find";

        generateNextAssignmentID();

    }

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
    document.getElementById("findAssignmentBtn").textContent = "New";

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

        currentIndex = 0;

    }
    else if (currentIndex >= assignmentList.length - 1) {

    clearForm();

    editMode = false;
    currentAssignmentId = null;
    currentIndex = -1;

    document.querySelector(".save-btn").textContent = "Save";

    document.getElementById("findAssignmentBtn").textContent = "Find";

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
    document.getElementById("findAssignmentBtn").textContent = "New";

    document.getElementById("AssignmentID").readOnly = true;

}

async function openBatchPopup() {

    try {

        const popup = document.getElementById("batchPopup");

        const input = document.getElementById("BatchID");

        const parent = input.parentElement;

        popup.style.display = "block";

        popup.style.width = input.offsetWidth + "px";

        popup.style.left = input.offsetLeft + "px";

        popup.style.top = (input.offsetTop + input.offsetHeight + 2) + "px";

        const tbody = document.querySelector("#batchTable tbody");

        tbody.innerHTML = "";

        const batches = await DatabaseAPI.get("/api/batches");

        batches.forEach(row => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${row[0]}</td>
                <td>${row[1]}</td>
            `;

            tr.onclick = function () {

                selectBatch(row);

            };

            tbody.appendChild(tr);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load batches", "error");

    }

}

function closeBatchPopup() {

    document.getElementById("batchPopup").style.display = "none";

}

function selectBatch(row) {

    document.getElementById("BatchID").value = row[0];

    closeBatchPopup();

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

        await generateNextAssignmentID();

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