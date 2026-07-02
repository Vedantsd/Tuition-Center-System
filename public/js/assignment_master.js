let editMode = false;
let currentAssignmentId = null;
let messageTimer = null;
let assignmentList = [];
let currentIndex = -1;
document.addEventListener("DOMContentLoaded", () => {
    generateNextAssignmentID();
    document
        .getElementById("AssignmentID")
        .addEventListener("click", openAssignmentPopup);
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

async function openAssignmentPopup() {

    try {

        const popup = document.getElementById("assignmentPopup");

        const input = document.getElementById("AssignmentID");

        popup.style.display = "block";

        popup.style.width = "600px";

        popup.style.left = input.offsetLeft + "px";

        popup.style.top = (input.offsetTop + input.offsetHeight + 2) + "px";

        const tbody = document.querySelector("#assignmentTable tbody");

        tbody.innerHTML = "";

        const assignments = await DatabaseAPI.get("/api/assignments");
        assignmentList = assignments;

        assignments.forEach(row => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td>${row[2]}</td>
                <td>${row[3]}</td>
            `;

            tr.onclick = function () {

                selectAssignment(row);

            };

            tbody.appendChild(tr);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load assignments", "error");

    }

}

function closeAssignmentPopup() {

    document.getElementById("assignmentPopup").style.display = "none";

}


function selectAssignment(row) {

    populateForm(row);

    editMode = true;

    currentAssignmentId = row[0];

    document.querySelector(".save-btn").textContent = "Update";

    closeAssignmentPopup();

    showMessage("Assignment loaded successfully.", "success");
    currentIndex = assignmentList.findIndex(
        item => item[0] == row[0]
    );
}
function previousRecord() {

    if (assignmentList.length == 0)
        return;

    if (currentIndex <= 0) {

        showMessage("First Record", "info");
        return;

    }

    currentIndex--;

    populateForm(assignmentList[currentIndex]);

    editMode = true;

    document.querySelector(".save-btn").textContent = "Update";

}
function nextRecord() {

    if (assignmentList.length == 0)
        return;

    if (currentIndex >= assignmentList.length - 1) {

        showMessage("Last Record", "info");
        return;

    }

    currentIndex++;

    populateForm(assignmentList[currentIndex]);

    editMode = true;

    document.querySelector(".save-btn").textContent = "Update";

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

    return true;

}
document.addEventListener("click", function(e){

    if(!e.target.closest("#assignmentPopup") &&
       !e.target.closest("#AssignmentID")){

        closeAssignmentPopup();

    }

    if(!e.target.closest("#batchPopup") &&
       !e.target.closest("#BatchID")){

        closeBatchPopup();

    }

});