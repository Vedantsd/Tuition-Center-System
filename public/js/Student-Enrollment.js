const ENROLLMENT_API_BASE = "http://127.0.0.1:8000";

let editMode = false;
let enrollmentLogs = [];
let currentIndex = -1;
let currentMode = "new";
let messageTimer = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadStudentDropdown();
    await loadCourseDropdown();
    await loadBatchDropdown();
    await loadEnrollmentList();

    await startNewMode();

    document
        .getElementById("newBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findBtn")
        .addEventListener("click", startFindMode);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveEnrollmentLog);

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
        document.getElementById("StudentID"),
        document.getElementById("CourseID"),
        document.getElementById("BatchID"),
        document.getElementById("AdmissionDate"),
        document.getElementById("Status")
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

    const enrollmentIdField = document.getElementById("EnrollmentID");

    enrollmentIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showEnrollmentIdRequiredError(this);
        }
        else {
            removeEnrollmentIdRequiredError(this);
        }

    });

    enrollmentIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeEnrollmentIdRequiredError(this);
        }

    });

    enrollmentIdField.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && currentMode === "find") {
            findEnrollmentLog();
        }

    });

});

function setActiveMode(mode) {

    currentMode = mode;

    document
        .getElementById("newBtn")
        .classList.toggle("active", mode === "new");

    document
        .getElementById("findBtn")
        .classList.toggle("active", mode === "find");

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

function setFieldsDisabled(disabled) {

    const fields = [
        document.getElementById("StudentID"),
        document.getElementById("CourseID"),
        document.getElementById("BatchID"),
        document.getElementById("AdmissionDate"),
        document.getElementById("Status")
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
    const prevBtn = document.querySelector(".prevButton");
    const nextBtn = document.querySelector(".nextButton");

    [saveBtn, prevBtn, nextBtn].forEach(btn => {

        if (btn) {

            btn.disabled = disabled;

            btn.style.opacity = disabled ? "0.5" : "";
            btn.style.cursor = disabled ? "not-allowed" : "";

        }

    });

}

function hasUnsavedNewData() {

    const fields = [
        document.getElementById("StudentID"),
        document.getElementById("CourseID"),
        document.getElementById("BatchID"),
        document.getElementById("AdmissionDate"),
        document.getElementById("Status")
    ];

    for (let i = 0; i < fields.length; i++) {

        if (fields[i].value.trim() !== "") {
            return true;
        }

    }

    return false;

}

function clearForm() {

    document.getElementById("StudentID").value = "";
    document.getElementById("CourseID").value = "";
    document.getElementById("BatchID").value = "";
    document.getElementById("AdmissionDate").value = "";
    document.getElementById("Status").value = "";

    removeRequiredError(document.getElementById("StudentID"));
    removeRequiredError(document.getElementById("CourseID"));
    removeRequiredError(document.getElementById("BatchID"));
    removeRequiredError(document.getElementById("AdmissionDate"));
    removeRequiredError(document.getElementById("Status"));

    document.querySelector(".save-btn").textContent = "Save";

}

function setSelectValueCaseInsensitive(selectId, storedValue) {

    const select = document.getElementById(selectId);
    const target = String(storedValue ?? "").toLowerCase();

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

function showSaveConfirmModal(message) {

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
        btnContainer.style.gap = "10px";

        const yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.textContent = "Yes";
        yesBtn.style.padding = "8px 18px";
        yesBtn.style.border = "none";
        yesBtn.style.borderRadius = "6px";
        yesBtn.style.background = "#16a34a";
        yesBtn.style.color = "#fff";
        yesBtn.style.fontSize = "14px";
        yesBtn.style.cursor = "pointer";

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.textContent = "No";
        noBtn.style.padding = "8px 18px";
        noBtn.style.border = "none";
        noBtn.style.borderRadius = "6px";
        noBtn.style.background = "#dc2626";
        noBtn.style.color = "#fff";
        noBtn.style.fontSize = "14px";
        noBtn.style.cursor = "pointer";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "8px 18px";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "6px";
        cancelBtn.style.background = "#9ca3af";
        cancelBtn.style.color = "#fff";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.cursor = "pointer";

        yesBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("yes");
        });

        noBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("no");
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("cancel");
        });

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);
        btnContainer.appendChild(cancelBtn);

        box.appendChild(text);
        box.appendChild(btnContainer);
        overlay.appendChild(box);

        document.body.appendChild(overlay);

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


function populateForm(enrollment) {

    const enrollmentIdField = document.getElementById("EnrollmentID");

    enrollmentIdField.value = enrollment.enrollment_id;

    document.getElementById("StudentID").value =
        enrollment.student_id ?? "";

    document.getElementById("CourseID").value =
        enrollment.course_id ?? "";

    document.getElementById("BatchID").value =
        enrollment.batch_id ?? "";

    document.getElementById("AdmissionDate").value =
        enrollment.admission_date ?? "";

    document.getElementById("Status").value =
        enrollment.status ?? "";

    removeEnrollmentIdRequiredError(enrollmentIdField);

    removeRequiredError(document.getElementById("StudentID"));
    removeRequiredError(document.getElementById("CourseID"));
    removeRequiredError(document.getElementById("BatchID"));
    removeRequiredError(document.getElementById("AdmissionDate"));
    removeRequiredError(document.getElementById("Status"));

}

async function loadStudentDropdown() {

    const select = document.getElementById("StudentID");

    select.innerHTML = '<option value="">Select Student</option>';

    try {

        const users = await DatabaseAPI.get("/api/users");

        if (!Array.isArray(users)) {
            showMessage("Unable to load students.", "error");
            return;
        }

        users.forEach(u => {

            const option = document.createElement("option");

            option.value = u.user_id;
            option.textContent = u.first_name + " " + u.last_name;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load students.", "error");

    }

}

async function loadCourseDropdown() {

    const select = document.getElementById("CourseID");

    select.innerHTML = '<option value="">Select Course</option>';

    try {

        const result = await DatabaseAPI.get("/api/courses");
        const rows = Array.isArray(result) ? result : result.data || [];

        rows.forEach(item => {

            const option = document.createElement("option");

            option.value = item.course_id ?? item[0];
            option.textContent = (item.course_id ?? item[0]) + " - " + (item.course_name ?? item.title ?? item[1]);

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load courses.", "error");

    }

}

async function loadBatchDropdown() {

    const select = document.getElementById("BatchID");

    select.innerHTML = '<option value="">Select Batch</option>';

    try {

        const result = await DatabaseAPI.get("/api/batches");
        const rows = Array.isArray(result) ? result : result.data || [];

        rows.forEach(item => {

            const option = document.createElement("option");

            option.value = item.batch_id ?? item[0];
            option.textContent = (item.batch_id ?? item[0]) + " - " + (item.batch_name ?? item[1]);

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load batches.", "error");

    }

}

async function loadEnrollmentList() {

    try {

        const result = await DatabaseAPI.get(ENROLLMENT_API_BASE + "/enrollments/");

        if (!result.success) {
            enrollmentLogs = [];
            return false;
        }

        enrollmentLogs = result.data;

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load enrollment records.", "error");

        enrollmentLogs = [];

        return false;

    }

}

async function generateEnrollmentID() {

    try {

        const result = await DatabaseAPI.get(ENROLLMENT_API_BASE + "/enrollments/newid");

        document.getElementById("EnrollmentID").value = result.enrollment_id;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Enrollment ID.", "error");

    }

}

async function startNewMode() {

    setFieldsDisabled(false);

    setActiveMode("new");

    editMode = false;
    currentIndex = -1;

    const enrollmentIdField = document.getElementById("EnrollmentID");

    removeEnrollmentIdRequiredError(enrollmentIdField);

    clearForm();

    enrollmentIdField.readOnly = true;

    document.querySelector(".save-btn").textContent = "Save";

    await generateEnrollmentID();

    removeEnrollmentIdRequiredError(enrollmentIdField);

    showMessage("Ready for new enrollment entry.", "success");

}

function startFindMode() {

    setActiveMode("find");

    editMode = false;
    currentIndex = -1;

    clearForm();

    const enrollmentIdField = document.getElementById("EnrollmentID");

    removeEnrollmentIdRequiredError(enrollmentIdField);

    enrollmentIdField.value = "";
    enrollmentIdField.readOnly = false;
    enrollmentIdField.focus();

    document.querySelector(".save-btn").textContent = "Update";

    setFieldsDisabled(true);

    showMessage("Enter Enrollment ID and press Enter.", "info");

}

async function findEnrollmentLog() {

    const enrollmentIdField = document.getElementById("EnrollmentID");

    const id = enrollmentIdField.value.trim();

    if (id === "") {

        showMessage("Enter Enrollment ID.", "error");

        enrollmentIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get(ENROLLMENT_API_BASE + "/enrollments/" + id);

        if (!result.success) {

            clearForm();

            enrollmentIdField.value = id;

            showMessage("Not a valid Enrollment ID.", "error");

            setFieldsDisabled(true);

            enrollmentIdField.focus();

            return;

        }

        setFieldsDisabled(false);

        populateForm(result.data);

        editMode = true;

        currentIndex = enrollmentLogs.findIndex(
            e => Number(e.enrollment_id) === Number(result.data.enrollment_id)
        );

        enrollmentIdField.readOnly = true;

        document.querySelector(".save-btn").textContent = "Update";

        setActiveMode("find");

        showMessage("Enrollment entry loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find enrollment entry.", "error");

    }

}

function showCurrentEnrollmentLog() {

    if (currentIndex < 0 || currentIndex >= enrollmentLogs.length)
        return;

    populateForm(enrollmentLogs[currentIndex]);

    editMode = true;

    document.getElementById("EnrollmentID").readOnly = true;

    document.querySelector(".save-btn").textContent = "Update";

    setActiveMode("find");

}

async function previousRecord() {

    if (enrollmentLogs.length === 0) {

        showMessage("No enrollment records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        if (hasUnsavedNewData()) {

            const choice = await showSaveConfirmModal(
                "Do you want to save this enrollment entry before going back?"
            );

            if (choice === "cancel") {
                return;
            }

            if (choice === "yes") {

                const saved = await saveEnrollmentLog();

                if (!saved) {
                    return;
                }

            }

        }

        currentIndex = enrollmentLogs.length - 1;

        showCurrentEnrollmentLog();

        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already on first record.", "info");

        return;

    }

    currentIndex--;

    showCurrentEnrollmentLog();

}

function nextRecord() {

    if (enrollmentLogs.length === 0) {

        showMessage("No enrollment records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        showMessage("Already on new record.", "info");

        return;

    }

    if (currentIndex >= enrollmentLogs.length - 1) {

        showMessage("Already on last record.", "info");

        return;

    }

    currentIndex++;

    showCurrentEnrollmentLog();

}

async function saveEnrollmentLog() {

    if (!validateForm())
        return false;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < enrollmentLogs.length) {
                populateForm(enrollmentLogs[currentIndex]);
            }

            return false;

        }

    }

    const data = {

        enrollment_id: Number(document.getElementById("EnrollmentID").value),
        student_id: Number(document.getElementById("StudentID").value),
        course_id: Number(document.getElementById("CourseID").value),
        batch_id: Number(document.getElementById("BatchID").value),
        admission_date: document.getElementById("AdmissionDate").value,
        status: document.getElementById("Status").value.trim()

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                ENROLLMENT_API_BASE + "/enrollments/" + data.enrollment_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post(
                ENROLLMENT_API_BASE + "/enrollments/",
                data
            );

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await loadEnrollmentList();

            if (editMode) {

                currentIndex = enrollmentLogs.findIndex(
                    e => Number(e.enrollment_id) === Number(data.enrollment_id)
                );

            }
            else {

                await startNewMode();

            }

        }

        return result.success;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to save record.", "error");

        return false;

    }

}

function validateForm() {

    const studentField = document.getElementById("StudentID");
    const courseField = document.getElementById("CourseID");
    const batchField = document.getElementById("BatchID");
    const dateField = document.getElementById("AdmissionDate");
    const statusField = document.getElementById("Status");

    if (studentField.value.trim() === "") {

        showMessage("Select a Student.", "error");

        showRequiredError(studentField);

        studentField.focus();

        return false;

    }

    if (courseField.value.trim() === "") {

        showMessage("Select a Course.", "error");

        showRequiredError(courseField);

        courseField.focus();

        return false;

    }

    if (batchField.value.trim() === "") {

        showMessage("Select a Batch.", "error");

        showRequiredError(batchField);

        batchField.focus();

        return false;

    }

    if (dateField.value.trim() === "") {

        showMessage("Select an Admission Date.", "error");

        showRequiredError(dateField);

        dateField.focus();

        return false;

    }

    if (statusField.value.trim() === "") {

        showMessage("Enter a Status.", "error");

        showRequiredError(statusField);

        statusField.focus();

        return false;

    }

    return true;

}

const rightSideFields = ["CourseID", "Status"];

function showRequiredError(field) {

    field.classList.add("field-error");

    const grid = field.closest(".stackinputs");

    if (!grid) return;

    let errorMessage = grid.querySelector(
        ".field-error-message[data-for='" + field.id + "']"
    );

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "field-error-message";
        errorMessage.setAttribute("data-for", field.id);
        errorMessage.textContent = "This field is required";

        if (rightSideFields.includes(field.id)) {
            errorMessage.classList.add("error-right");
        }
        else {
            errorMessage.classList.add("error-left");
        }

        grid.appendChild(errorMessage);

    }

}

function removeRequiredError(field) {

    field.classList.remove("field-error");

    const grid = field.closest(".stackinputs");

    if (!grid) return;

    const errorMessage = grid.querySelector(
        ".field-error-message[data-for='" + field.id + "']"
    );

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showEnrollmentIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".enrollment-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "enrollment-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeEnrollmentIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".enrollment-id-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

document.querySelectorAll(".info-icon").forEach(icon => {

    icon.style.cursor = "pointer";

    icon.addEventListener("click", (e) => {

        e.stopPropagation();

        const tooltip = icon.querySelector(".tooltip");

        if (tooltip) {
            alert(tooltip.textContent.trim());
        }

    });

});






