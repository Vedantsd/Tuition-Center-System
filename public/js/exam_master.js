let editMode = false;
let exams = [];
let currentIndex = -1;
let currentMode = "new";
let messageTimer = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadExamNameDropdown();
    await loadCourseDropdown();
    await loadExamList();

    await startNewMode();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveExam);

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
        document.getElementById("ExamName"),
        document.getElementById("CourseID"),
        document.getElementById("TotalMarks"),
        document.getElementById("ExamDate")
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

    const examIdField = document.getElementById("ExamID");

    examIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showExamIdRequiredError(this);
        }
        else {
            removeExamIdRequiredError(this);
        }

    });

    examIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeExamIdRequiredError(this);
        }

    });

    examIdField.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && currentMode === "find") {
            findExam();
        }

    });

});

function setActiveMode(mode) {

    currentMode = mode;

    document
        .getElementById("newModeBtn")
        .classList.toggle("active", mode === "new");

    document
        .getElementById("findModeBtn")
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
        document.getElementById("ExamName"),
        document.getElementById("CourseID"),
        document.getElementById("TotalMarks"),
        document.getElementById("ExamDate")
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

function hasUnsavedNewData() {

    const fields = [
        document.getElementById("ExamName"),
        document.getElementById("CourseID"),
        document.getElementById("TotalMarks"),
        document.getElementById("ExamDate")
    ];

    for (let i = 0; i < fields.length; i++) {

        if (fields[i].value.trim() !== "") {
            return true;
        }

    }

    return false;

}

function clearForm() {

    document.getElementById("ExamName").value = "";
    document.getElementById("CourseID").value = "";
    document.getElementById("TotalMarks").value = "";
    document.getElementById("ExamDate").value = "";

    [
        document.getElementById("ExamName"),
        document.getElementById("CourseID"),
        document.getElementById("TotalMarks"),
        document.getElementById("ExamDate")
    ].forEach(removeRequiredError);

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

function populateForm(exam) {

    const examIdField = document.getElementById("ExamID");

    examIdField.value = exam.exam_id;

    setSelectValueCaseInsensitive("ExamName", exam.exam_name);

    setSelectValueCaseInsensitive("CourseID", exam.course_id);

    document.getElementById("TotalMarks").value = exam.total_marks;

    document.getElementById("ExamDate").value = exam.exam_date;

    removeExamIdRequiredError(examIdField);

    [
        document.getElementById("ExamName"),
        document.getElementById("CourseID"),
        document.getElementById("TotalMarks"),
        document.getElementById("ExamDate")
    ].forEach(removeRequiredError);

}

// Exam Name LOV - same pattern as Status dropdown in building.js
async function loadExamNameDropdown() {

    const select = document.getElementById("ExamName");

    select.innerHTML = '<option value="">--Select--</option>';

    try {

        const result = await DatabaseAPI.get(
            "/api/lookup-values/active?type=exam_name"
        );

        if (!result.success) {

            showMessage("Unable to load exam names.", "error");
            return;

        }

        result.data.forEach(item => {

            const option = document.createElement("option");

            option.value = item.lookup_value;
            option.textContent = item.lookup_value;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load exam names.", "error");

    }

}

// Course dropdown - same pattern/endpoint as CourseID in batches.js
async function loadCourseDropdown() {

    const select = document.getElementById("CourseID");

    select.innerHTML = '<option value="">Select Course</option>';

    try {

        const courses = await DatabaseAPI.get("/api/courses");

        courses.forEach(course => {

            const option = document.createElement("option");

            option.value = course.course_id;
            option.textContent = course.course_name;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load courses.", "error");

    }

}

async function loadExamList() {

    try {

        exams = await DatabaseAPI.get("/api/exams-full");

        if (!Array.isArray(exams)) {
            exams = [];
        }

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load exams.", "error");

        exams = [];

        return false;

    }

}

async function generateExamID() {

    try {

        const result = await DatabaseAPI.get("/api/exams/new-id");

        document.getElementById("ExamID").value = result.exam_id;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Exam ID.", "error");

    }

}

async function startNewMode() {

    setFieldsDisabled(false);

    setActiveMode("new");

    editMode = false;
    currentIndex = -1;

    const examIdField = document.getElementById("ExamID");

    removeExamIdRequiredError(examIdField);

    clearForm();

    examIdField.readOnly = true;

    document.querySelector(".save-btn").textContent = "Save";

    await generateExamID();

    removeExamIdRequiredError(examIdField);

    showMessage("Ready for new exam.", "success");

}

function startFindMode() {

    setActiveMode("find");

    editMode = false;
    currentIndex = -1;

    clearForm();

    const examIdField = document.getElementById("ExamID");

    removeExamIdRequiredError(examIdField);

    examIdField.value = "";
    examIdField.readOnly = false;
    examIdField.focus();

    document.querySelector(".save-btn").textContent = "Update";

    setFieldsDisabled(true);

    showMessage("Enter Exam ID and press Enter.", "info");

}

async function findExam() {

    const examIdField = document.getElementById("ExamID");

    const id = examIdField.value.trim();

    if (id === "") {

        showMessage("Enter Exam ID.", "error");

        examIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/exams/" + id);

        if (!result.success) {

            clearForm();

            examIdField.value = id;

            showMessage("Not a valid Exam ID.", "error");

            setFieldsDisabled(true);

            examIdField.focus();

            return;

        }

        setFieldsDisabled(false);

        populateForm(result);

        editMode = true;

        currentIndex = exams.findIndex(
            e => Number(e.exam_id) === Number(result.exam_id)
        );

        examIdField.readOnly = true;

        document.querySelector(".save-btn").textContent = "Update";

        setActiveMode("find");

        showMessage("Exam loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find exam.", "error");

    }

}

function showCurrentExam() {

    if (currentIndex < 0 || currentIndex >= exams.length)
        return;

    populateForm(exams[currentIndex]);

    editMode = true;

    document.getElementById("ExamID").readOnly = true;

    document.querySelector(".save-btn").textContent = "Update";

    setActiveMode("find");

}

async function previousRecord() {

    if (exams.length === 0) {

        showMessage("No exam records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        if (hasUnsavedNewData()) {

            const choice = await showSaveConfirmModal(
                "Do you want to save this exam before going back?"
            );

            if (choice === "cancel") {
                return;
            }

            if (choice === "yes") {

                const saved = await saveExam();

                if (!saved) {
                    return;
                }

            }

        }

        currentIndex = exams.length - 1;

        showCurrentExam();

        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already on first record.", "info");

        return;

    }

    currentIndex--;

    showCurrentExam();

}

function nextRecord() {

    if (exams.length === 0) {

        showMessage("No exam records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        showMessage("Already on new record.", "info");

        return;

    }

    if (currentIndex >= exams.length - 1) {

        showMessage("Already on last record.", "info");

        return;

    }

    currentIndex++;

    showCurrentExam();

}

async function saveExam() {

    if (!validateForm())
        return false;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < exams.length) {
                populateForm(exams[currentIndex]);
            }

            return false;

        }

    }

    const data = {

        exam_id: document.getElementById("ExamID").value,
        exam_name: document.getElementById("ExamName").value.trim(),
        course_id: document.getElementById("CourseID").value,
        total_marks: document.getElementById("TotalMarks").value,
        exam_date: document.getElementById("ExamDate").value

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                "/api/exams/" + data.exam_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post("/api/exams", data);

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await loadExamList();

            if (editMode) {

                currentIndex = exams.findIndex(
                    e => Number(e.exam_id) === Number(data.exam_id)
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

    const nameField = document.getElementById("ExamName");
    const courseField = document.getElementById("CourseID");
    const marksField = document.getElementById("TotalMarks");
    const dateField = document.getElementById("ExamDate");

    if (nameField.value.trim() === "") {

        showMessage("Select Exam Name", "error");

        showRequiredError(nameField);

        nameField.focus();

        return false;

    }

    if (courseField.value.trim() === "") {

        showMessage("Select Course", "error");

        showRequiredError(courseField);

        courseField.focus();

        return false;

    }

    if (marksField.value.trim() === "") {

        showMessage("Enter Total Marks", "error");

        showRequiredError(marksField);

        marksField.focus();

        return false;

    }

    if (dateField.value.trim() === "") {

        showMessage("Select Exam Date", "error");

        showRequiredError(dateField);

        dateField.focus();

        return false;

    }

    return true;

}

const rightSideFields = ["TotalMarks", "ExamDate"];

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

function showExamIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".exam-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "exam-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeExamIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".exam-id-error-message");

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