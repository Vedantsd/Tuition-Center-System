let messageTimer = null;
let isExistingSubmission = false;
let submissionList = [];
let currentIndex = -1;
let originalSubmissionData = null;

const PYTHON_API_BASE = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {

    loadAssignments();
    loadStudents();
    loadNewSubmissionId();
    loadSubmissionList();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .getElementById("SubmissionID")
        .addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !this.readOnly) {
                findSubmission();
            }
        });

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveSubmission);

    document
        .getElementById("confirmYesBtn")
        .addEventListener("click", async () => {
            hideConfirmModal();
            await performSaveSubmission();
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
        document.getElementById("AssignmentID"),
        document.getElementById("StudentID"),
        document.getElementById("SubmittedDate")
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

    const submissionIdField = document.getElementById("SubmissionID");

    submissionIdField.addEventListener("blur", function () {
        if (!this.readOnly && this.value.trim() === "") {
            showUserIdRequiredError(this);
        } else {
            removeUserIdRequiredError(this);
        }
    });

    submissionIdField.addEventListener("input", function () {
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
    "AssignmentID",
    "StudentID",
    "SubmittedDate",
    "Marks"
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
    if (!originalSubmissionData) return;
    populateForm(originalSubmissionData);
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

async function loadAssignments() {
    const select = document.getElementById("AssignmentID");
    select.innerHTML = '<option value="">--Select Assignment--</option>';

    try {
        const result = await DatabaseAPI.get("/api/assignments");
        const rows = Array.isArray(result) ? result : result.data || [];

        rows.forEach(item => {
            const option = document.createElement("option");
            option.value = item.assignment_id ?? item[0];
            option.textContent = `${option.value} - ${item.title ?? item[1]}`;
            select.appendChild(option);
        });

    } catch (err) {
        console.error(err);
        showMessage("Unable to load assignments.", "error");
    }
}

async function loadStudents() {
    const select = document.getElementById("StudentID");
    select.innerHTML = '<option value="">--Select Student--</option>';

    try {
        const result = await DatabaseAPI.get("/api/users");
        const rows = Array.isArray(result) ? result : result.data || result.users || [];

        rows.forEach(item => {
            const option = document.createElement("option");
            option.value = item.user_id;
            option.textContent = `${item.user_id} - ${item.first_name} ${item.last_name}`;
            select.appendChild(option);
        });

    } catch (err) {
        console.error(err);
        showMessage("Unable to load students.", "error");
    }
}

async function loadNewSubmissionId() {
    try {
        const result = await pyGet("/submissions/newid");

        if (!result.success) {
            showMessage(result.message, "error");
            return;
        }

        document.getElementById("SubmissionID").value = result.submission_id;
        document.getElementById("SubmissionID").readOnly = true;

        isExistingSubmission = false;
        setSaveButtonText("Save");
        setActiveMode("new");
        setFormFieldsDisabled(false);
        setSaveButtonDisabled(false);

    } catch (err) {
        console.error(err);
        showMessage("Unable to generate Submission ID.", "error");
    }
}

function clearForm() {
    originalSubmissionData = null;
    document.getElementById("AssignmentID").value  = "";
    document.getElementById("StudentID").value     = "";
    document.getElementById("SubmittedDate").value = "";
    document.getElementById("Marks").value         = "";
    isExistingSubmission = false;
    setSaveButtonText("Save");

    document.querySelectorAll(".user-field-wrapper").forEach(wrapper => {
        const field = wrapper.querySelector("input, select");
        field.classList.remove("field-error");
        const errorMessage = wrapper.querySelector(".field-error-message");
        if (errorMessage) errorMessage.remove();
    });
}

function populateForm(sub) {
    originalSubmissionData = JSON.parse(JSON.stringify(sub));

    document.getElementById("SubmissionID").value  = sub.submission_id ?? "";
    document.getElementById("AssignmentID").value  = sub.assignment_id ?? "";
    document.getElementById("StudentID").value     = sub.student_id    ?? "";
    document.getElementById("SubmittedDate").value = sub.submitted_date ?? "";
    document.getElementById("Marks").value         = sub.marks != null ? sub.marks : "";

    isExistingSubmission = true;
    setSaveButtonText("Update");

    const requiredFields = [
        document.getElementById("AssignmentID"),
        document.getElementById("StudentID"),
        document.getElementById("SubmittedDate")
    ];
    requiredFields.forEach(field => removeRequiredError(field));
    removeUserIdRequiredError(document.getElementById("SubmissionID"));

    setFormFieldsDisabled(false);
    setSaveButtonDisabled(false);
}

function getFormData() {
    return {
        submission_id:  document.getElementById("SubmissionID").value,
        assignment_id:  document.getElementById("AssignmentID").value,
        student_id:     document.getElementById("StudentID").value,
        submitted_date: document.getElementById("SubmittedDate").value,
        marks:          document.getElementById("Marks").value
    };
}

function validateForm(data) {
    if (!data.submission_id) {
        showMessage("Submission ID is required.", "error");
        return false;
    }
    if (!data.assignment_id) {
        showMessage("Assignment is required.", "error");
        return false;
    }
    if (!data.student_id) {
        showMessage("Student is required.", "error");
        return false;
    }
    if (!data.submitted_date) {
        showMessage("Submitted Date is required.", "error");
        return false;
    }
    if (data.marks !== "" && data.marks != null) {
        const m = parseFloat(data.marks);
        if (isNaN(m) || m < 0 || m > 999.99) {
            showMessage("Marks must be between 0 and 999.99.", "error");
            return false;
        }
    }
    return true;
}

function startNewMode() {
    clearForm();
    isExistingSubmission = false;
    const idInput = document.getElementById("SubmissionID");
    removeUserIdRequiredError(idInput);
    idInput.readOnly = true;
    setSaveButtonText("Save");
    setActiveMode("new");
    loadNewSubmissionId();
}

function startFindMode() {
    clearForm();
    isExistingSubmission = false;
    const idInput = document.getElementById("SubmissionID");
    idInput.value    = "";
    idInput.readOnly = false;
    idInput.focus();
    setSaveButtonText("Update");
    setActiveMode("find");
    setFormFieldsDisabled(true);
    setSaveButtonDisabled(true);
    showMessage("Enter Submission ID and press Enter.", "info");
}

async function findSubmission() {
    const idInput = document.getElementById("SubmissionID");
    const id = idInput.value.trim();

    if (id === "") {
        showMessage("Enter Submission ID.", "error");
        idInput.focus();
        return;
    }

    try {
        const result = await pyGet("/submissions/" + id);

        if (!result.success) {
            clearForm();
            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);
            showMessage("Submission not found.", "error");
            idInput.focus();
            return;
        }

        populateForm(result.data);
        setActiveMode("find");
        showMessage("Submission loaded successfully.", "success");

    } catch (err) {
        console.error(err);
        showMessage("Unable to find submission.", "error");
    }
}

async function loadSubmissionList() {
    try {
        const result = await pyGet("/submissions");
        const rows = Array.isArray(result) ? result : result.data || [];

        submissionList = rows
            .map(r => Number(r.submission_id))
            .sort((a, b) => a - b);

        return true;

    } catch (err) {
        console.error(err);
        showMessage("Unable to load submissions.", "error");
        return false;
    }
}

async function loadAndPopulateSubmission(id) {
    try {
        const result = await pyGet("/submissions/" + id);

        if (!result.success) {
            clearForm();
            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);
            showMessage("Submission not found.", "error");
            return;
        }

        populateForm(result.data);
        setActiveMode("find");
        document.getElementById("SubmissionID").readOnly = true;
        showMessage("Existing record loaded.", "success");

    } catch (err) {
        console.error(err);
        showMessage("Unable to load submission.", "error");
    }
}

async function previousRecord() {
    if (submissionList.length === 0) {
        showMessage("No submission records found.", "info");
        return;
    }

    const currentId = Number(document.getElementById("SubmissionID").value);
    currentIndex = submissionList.indexOf(currentId);

    if (currentIndex === -1) {
        currentIndex = submissionList.length - 1;
    } else if (currentIndex <= 0) {
        showMessage("First Record", "info");
        return;
    } else {
        currentIndex--;
    }

    await loadAndPopulateSubmission(submissionList[currentIndex]);
}

async function nextRecord() {
    if (!isExistingSubmission) {
        showMessage("Already at new data entry.", "info");
        return;
    }

    if (submissionList.length === 0) {
        showMessage("No submission records found.", "info");
        return;
    }

    const currentId = Number(document.getElementById("SubmissionID").value);
    currentIndex = submissionList.indexOf(currentId);

    if (currentIndex === -1) {
        currentIndex = 0;
    } else if (currentIndex >= submissionList.length - 1) {
        clearForm();
        currentIndex = -1;
        setSaveButtonText("Save");
        document.getElementById("SubmissionID").readOnly = true;
        loadNewSubmissionId();
        showMessage("New submission record.", "info");
        return;
    } else {
        currentIndex++;
    }

    await loadAndPopulateSubmission(submissionList[currentIndex]);
}

async function saveSubmission() {
    const data = getFormData();
    if (!validateForm(data)) return;

    if (isExistingSubmission) {
        showConfirmModal();
        return;
    }

    await performSaveSubmission();
}

async function performSaveSubmission() {
    const data = getFormData();
    if (!validateForm(data)) return;

    try {
        let result;

        if (isExistingSubmission) {
            result = await pyPut("/submissions/" + data.submission_id, data);
        } else {
            result = await pyPost("/submissions", data);
        }

        if (!result.success) {
            showMessage(result.message || "Unable to save submission.", "error");
            return;
        }

        showMessage(result.message || "Submission saved successfully.", "success");

        clearForm();
        document.getElementById("SubmissionID").readOnly = true;

        await loadNewSubmissionId();
        await loadSubmissionList();

    } catch (err) {
        console.error(err);
        showMessage("Error saving submission.", "error");
    }
}

function showRequiredError(field) {
    field.classList.add("field-error");
    const wrapper = field.closest(".user-field-wrapper");
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
    const wrapper = field.closest(".user-field-wrapper");
    const errorMessage = wrapper ? wrapper.querySelector(".field-error-message") : null;
    if (errorMessage) errorMessage.remove();
}

function showUserIdRequiredError(field) {
    field.classList.add("field-error");
    const group = field.closest(".id-find-group");
    let errorMessage = group.querySelector(".user-id-error-message");
    if (!errorMessage) {
        errorMessage = document.createElement("span");
        errorMessage.className = "user-id-error-message";
        errorMessage.textContent = "This field is required";
        group.appendChild(errorMessage);
    }
}

function removeUserIdRequiredError(field) {
    field.classList.remove("field-error");
    const group = field.closest(".id-find-group");
    const errorMessage = group ? group.querySelector(".user-id-error-message") : null;
    if (errorMessage) errorMessage.remove();
}