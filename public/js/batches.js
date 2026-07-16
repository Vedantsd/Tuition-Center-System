
// let editMode = false;
// let batches = [];
// let currentIndex = -1;
// let currentMode = "new";
// let messageTimer = null;

// document.addEventListener("DOMContentLoaded", async () => {

//     await loadCourseDropdown();
//     await loadFacultyDropdown();
//     await loadBatchList();

//     await startNewMode();

//     document
//         .getElementById("newModeBtn")
//         .addEventListener("click", startNewMode);

//     document
//         .getElementById("findModeBtn")
//         .addEventListener("click", startFindMode);

//     document
//         .querySelector(".save-btn")
//         .addEventListener("click", saveBatch);

//     document
//         .querySelector(".previous-btn")
//         .addEventListener("click", previousRecord);

//     document
//         .querySelector(".next-btn")
//         .addEventListener("click", nextRecord);

//     document
//         .querySelector(".exit-btn")
//         .addEventListener("click", () => {
//             window.history.back();
//         });

//     const requiredFields = [
//         document.getElementById("BatchName"),
//         document.getElementById("CourseID"),
//         document.getElementById("Classroom"),
//         document.getElementById("DaysOfWeek")
//     ];

//     requiredFields.forEach(field => {

//         field.addEventListener("blur", function () {

//             if (this.value.trim() === "") {
//                 showRequiredError(this);
//             }
//             else {
//                 removeRequiredError(this);
//             }

//         });

//         field.addEventListener("input", function () {

//             if (this.value.trim() !== "") {
//                 removeRequiredError(this);
//             }

//         });

//         field.addEventListener("change", function () {

//             if (this.value.trim() !== "") {
//                 removeRequiredError(this);
//             }

//         });

//     });

//     const batchIdField = document.getElementById("BatchID");

//     batchIdField.addEventListener("blur", function () {

//         if (
//             currentMode === "find" &&
//             !this.readOnly &&
//             this.value.trim() === ""
//         ) {
//             showBatchIdRequiredError(this);
//         }
//         else {
//             removeBatchIdRequiredError(this);
//         }

//     });

//     batchIdField.addEventListener("input", function () {

//         if (this.value.trim() !== "") {
//             removeBatchIdRequiredError(this);
//         }

//     });

//     batchIdField.addEventListener("keydown", function (event) {

//         if (event.key === "Enter" && currentMode === "find") {
//             findBatch();
//         }

//     });

//     const startDateInput = document.getElementById("StartDate");

//     const today = new Date();
//     const localToday = new Date(
//         today.getTime() - today.getTimezoneOffset() * 60000
//     )
//         .toISOString()
//         .split("T")[0];

//     startDateInput.min = localToday;

// });

// function setActiveMode(mode) {

//     currentMode = mode;

//     document
//         .getElementById("newModeBtn")
//         .classList.toggle("active", mode === "new");

//     document
//         .getElementById("findModeBtn")
//         .classList.toggle("active", mode === "find");

// }

// function showMessage(message, type = "info") {

//     const status = document.getElementById("statusMessage");

//     clearTimeout(messageTimer);

//     status.className = "status-message";
//     status.classList.add(type);
//     status.textContent = message;

//     messageTimer = setTimeout(() => {
//         status.className = "status-message";
//         status.textContent = "";
//     }, 4000);

// }

// function clearForm() {

//     document.getElementById("BatchName").value = "";
//     document.getElementById("CourseID").value = "";
//     document.getElementById("Classroom").value = "";
//     document.getElementById("StartTime").value = "";
//     document.getElementById("EndTime").value = "";
//     document.getElementById("DaysOfWeek").value = "";
//     document.getElementById("FacultyID").value = "";
//     document.getElementById("StartDate").value = "";
//     document.getElementById("EndDate").value = "";

//     [
//         document.getElementById("BatchName"),
//         document.getElementById("CourseID"),
//         document.getElementById("Classroom"),
//         document.getElementById("DaysOfWeek")
//     ].forEach(removeRequiredError);

//     document.querySelector(".save-btn").textContent = "Save";

// }

// function populateForm(batch) {

//     const batchIdField = document.getElementById("BatchID");

//     batchIdField.value = batch.batch_id;
//     document.getElementById("BatchName").value = batch.batch_name;
//     document.getElementById("CourseID").value = batch.course_id;
//     document.getElementById("Classroom").value = batch.classroom;
//     document.getElementById("StartTime").value = batch.start_time;
//     document.getElementById("EndTime").value = batch.end_time;
//     document.getElementById("DaysOfWeek").value = batch.days_of_week;
//     document.getElementById("FacultyID").value = batch.faculty_id;
//     document.getElementById("StartDate").value = batch.start_date;
//     document.getElementById("EndDate").value = batch.end_date;

//     removeBatchIdRequiredError(batchIdField);

//     [
//         document.getElementById("BatchName"),
//         document.getElementById("CourseID"),
//         document.getElementById("Classroom"),
//         document.getElementById("DaysOfWeek")
//     ].forEach(removeRequiredError);

// }

// async function loadCourseDropdown() {

//     const select = document.getElementById("CourseID");

//     select.innerHTML = '<option value="">Select Course</option>';

//     try {

//         const courses = await DatabaseAPI.get("/api/courses");

//         courses.forEach(course => {

//             const option = document.createElement("option");

//             option.value = course.course_id;
//             option.textContent = course.course_name;

//             select.appendChild(option);

//         });

//     }
//     catch (err) {

//         console.error(err);

//         showMessage("Unable to load courses.", "error");

//     }

// }

// async function loadFacultyDropdown() {

//     const select = document.getElementById("FacultyID");

//     select.innerHTML = '<option value="">Select Faculty</option>';

//     try {

//         const faculty = await DatabaseAPI.get("/api/faculty");

//         faculty.forEach(f => {

//             const option = document.createElement("option");

//             option.value = f.user_id;
//             option.textContent = f.faculty_name;

//             select.appendChild(option);

//         });

//     }
//     catch (err) {

//         console.error(err);

//         showMessage("Unable to load faculty.", "error");

//     }

// }

// async function loadBatchList() {

//     try {

//         batches = await DatabaseAPI.get("/api/batches-full");

//         if (!Array.isArray(batches)) {
//             batches = [];
//         }

//         return true;

//     }
//     catch (err) {

//         console.error(err);

//         showMessage("Unable to load batches.", "error");

//         batches = [];

//         return false;

//     }

// }

// async function generateBatchID() {

//     try {

//         const result = await DatabaseAPI.get("/api/batches/new-id");

//         document.getElementById("BatchID").value = result.batch_id;
//         document.getElementById("BatchID").readOnly = true;

//     }
//     catch (err) {

//         console.error(err);

//         showMessage("Unable to generate Batch ID.", "error");

//     }

// }

// async function startNewMode() {

//     setActiveMode("new");

//     editMode = false;
//     currentIndex = -1;

//     const batchIdField = document.getElementById("BatchID");

//     removeBatchIdRequiredError(batchIdField);

//     clearForm();

//     batchIdField.readOnly = true;

//     document.querySelector(".save-btn").textContent = "Save";

//     await generateBatchID();

//     removeBatchIdRequiredError(batchIdField);

//     showMessage("Ready for new batch.", "success");

// }

// function startFindMode() {

//     setActiveMode("find");

//     editMode = false;
//     currentIndex = -1;

//     clearForm();

//     const batchIdField = document.getElementById("BatchID");

//     removeBatchIdRequiredError(batchIdField);

//     batchIdField.value = "";
//     batchIdField.readOnly = false;
//     batchIdField.focus();

//     document.querySelector(".save-btn").textContent = "Save";

//     showMessage("Enter Batch ID and press Enter.", "info");

// }

// async function findBatch() {

//     const batchIdField = document.getElementById("BatchID");

//     const id = batchIdField.value.trim();

//     if (id === "") {

//         showMessage("Enter Batch ID.", "error");

//         batchIdField.focus();

//         return;

//     }

//     try {

//         const result = await DatabaseAPI.get("/api/batches/" + id);

//         if (!result.success) {

//             clearForm();

//             batchIdField.value = id;

//             showMessage("Batch not found.", "error");

//             batchIdField.focus();

//             return;

//         }

//         populateForm(result);

//         editMode = true;

//         currentIndex = batches.findIndex(
//             b => Number(b.batch_id) === Number(result.batch_id)
//         );

//         batchIdField.readOnly = true;

//         document.querySelector(".save-btn").textContent = "Update";

//         setActiveMode("find");

//         showMessage("Batch loaded successfully.", "success");

//     }
//     catch (err) {

//         console.error(err);

//         showMessage("Unable to find batch.", "error");

//     }

// }

// function showCurrentBatch() {

//     if (currentIndex < 0 || currentIndex >= batches.length)
//         return;

//     populateForm(batches[currentIndex]);

//     editMode = true;

//     document.getElementById("BatchID").readOnly = true;

//     document.querySelector(".save-btn").textContent = "Update";

//     setActiveMode("find");

// }

// function previousRecord() {

//     if (batches.length === 0) {

//         showMessage("No batch records found.", "info");

//         return;

//     }

//     if (currentIndex === -1) {

//         currentIndex = batches.length - 1;

//         showCurrentBatch();

//         return;

//     }

//     if (currentIndex <= 0) {

//         showMessage("Already on first record.", "info");

//         return;

//     }

//     currentIndex--;

//     showCurrentBatch();

// }

// function nextRecord() {

//     if (batches.length === 0) {

//         showMessage("No batch records found.", "info");

//         return;

//     }

//     if (currentIndex === -1) {

//         currentIndex = 0;

//         showCurrentBatch();

//         return;

//     }

//     if (currentIndex >= batches.length - 1) {

//         showMessage("Already on last record.", "info");

//         return;

//     }

//     currentIndex++;

//     showCurrentBatch();

// }

// async function saveBatch() {

//     if (!validateForm())
//         return;

//     const data = {

//         batch_id: document.getElementById("BatchID").value,
//         batch_name: document.getElementById("BatchName").value.trim(),
//         course_id: document.getElementById("CourseID").value,
//         classroom: document.getElementById("Classroom").value.trim(),
//         start_time: document.getElementById("StartTime").value,
//         end_time: document.getElementById("EndTime").value,
//         days_of_week: document.getElementById("DaysOfWeek").value.trim(),
//         faculty_id: document.getElementById("FacultyID").value,
//         start_date: document.getElementById("StartDate").value,
//         end_date: document.getElementById("EndDate").value

//     };

//     try {

//         let result;

//         if (editMode) {

//             result = await DatabaseAPI.put(
//                 "/api/batches/" + data.batch_id,
//                 data
//             );

//         }
//         else {

//             result = await DatabaseAPI.post("/api/batches", data);

//         }

//         showMessage(result.message, result.success ? "success" : "error");

//         if (result.success) {

//             await loadBatchList();

//             if (editMode) {

//                 currentIndex = batches.findIndex(
//                     b => Number(b.batch_id) === Number(data.batch_id)
//                 );

//             }
//             else {

//                 await startNewMode();

//             }

//         }

//     }
//     catch (err) {

//         console.error(err);

//         showMessage("Unable to save record.", "error");

//     }

// }

// function validateForm() {

//     if (document.getElementById("BatchName").value.trim() === "") {

//         showMessage("Enter Batch Name", "error");

//         document.getElementById("BatchName").focus();

//         return false;

//     }

//     if (document.getElementById("CourseID").value.trim() === "") {

//         showMessage("Select Course", "error");

//         document.getElementById("CourseID").focus();

//         return false;

//     }

//     if (document.getElementById("Classroom").value.trim() === "") {

//         showMessage("Enter Classroom", "error");

//         document.getElementById("Classroom").focus();

//         return false;

//     }

//     if (document.getElementById("DaysOfWeek").value.trim() === "") {

//         showMessage("Enter Days Of Week", "error");

//         document.getElementById("DaysOfWeek").focus();

//         return false;

//     }

//     return true;

// }

// function showRequiredError(field) {

//     field.classList.add("field-error");

//     const wrapper = field.closest(".assignment-field-wrapper");

//     if (!wrapper) return;

//     let errorMessage = wrapper.querySelector(".field-error-message");

//     if (!errorMessage) {

//         errorMessage = document.createElement("span");

//         errorMessage.className = "field-error-message";
//         errorMessage.textContent = "This field is required";

//         wrapper.appendChild(errorMessage);

//     }

// }

// function removeRequiredError(field) {

//     field.classList.remove("field-error");

//     const wrapper = field.closest(".assignment-field-wrapper");

//     if (!wrapper) return;

//     const errorMessage = wrapper.querySelector(".field-error-message");

//     if (errorMessage) {
//         errorMessage.remove();
//     }

// }

// function showBatchIdRequiredError(field) {

//     field.classList.add("field-error");

//     const group = field.closest(".id-find-group");

//     if (!group) return;

//     let errorMessage = group.querySelector(".batch-id-error-message");

//     if (!errorMessage) {

//         errorMessage = document.createElement("span");

//         errorMessage.className = "batch-id-error-message";
//         errorMessage.textContent = "This field is required";

//         group.appendChild(errorMessage);

//     }

// }

// function removeBatchIdRequiredError(field) {

//     field.classList.remove("field-error");

//     const group = field.closest(".id-find-group");

//     if (!group) return;

//     const errorMessage = group.querySelector(".batch-id-error-message");

//     if (errorMessage) {
//         errorMessage.remove();
//     }

// }



let editMode = false;
let batches = [];
let currentIndex = -1;
let currentMode = "new";
let messageTimer = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadCourseDropdown();
    await loadFacultyDropdown();
    await loadBatchList();

    await startNewMode();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveBatch);

    document
        .querySelector(".previous-btn")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".next-btn")
        .addEventListener("click", nextRecord);

    document
        .querySelector(".exit-btn")
        .addEventListener("click", () => {
            window.history.back();
        });

    const requiredFields = [
        document.getElementById("BatchName"),
        document.getElementById("CourseID"),
        document.getElementById("Classroom"),
        document.getElementById("DaysOfWeek")
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

    const batchIdField = document.getElementById("BatchID");

    batchIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showBatchIdRequiredError(this);
        }
        else {
            removeBatchIdRequiredError(this);
        }

    });

    batchIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeBatchIdRequiredError(this);
        }

    });

    batchIdField.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && currentMode === "find") {
            findBatch();
        }

    });

    const startDateInput = document.getElementById("StartDate");

    const today = new Date();
    const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    )
        .toISOString()
        .split("T")[0];

    startDateInput.min = localToday;

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

// Disables/enables all data fields + Update/Next/Previous buttons.
// BatchID, New, and Find are intentionally excluded so the user can
// always retry a different ID or switch modes.
// Also applies/removes a grey background to match the read-only look
// of BatchID in New mode.
function setFieldsDisabled(disabled) {

    const fields = [
        document.getElementById("BatchName"),
        document.getElementById("CourseID"),
        document.getElementById("Classroom"),
        document.getElementById("StartTime"),
        document.getElementById("EndTime"),
        document.getElementById("DaysOfWeek"),
        document.getElementById("FacultyID"),
        document.getElementById("StartDate"),
        document.getElementById("EndDate")
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

function clearForm() {

    document.getElementById("BatchName").value = "";
    document.getElementById("CourseID").value = "";
    document.getElementById("Classroom").value = "";
    document.getElementById("StartTime").value = "";
    document.getElementById("EndTime").value = "";
    document.getElementById("DaysOfWeek").value = "";
    document.getElementById("FacultyID").value = "";
    document.getElementById("StartDate").value = "";
    document.getElementById("EndDate").value = "";

    [
        document.getElementById("BatchName"),
        document.getElementById("CourseID"),
        document.getElementById("Classroom"),
        document.getElementById("DaysOfWeek")
    ].forEach(removeRequiredError);

    document.querySelector(".save-btn").textContent = "Save";

}

function populateForm(batch) {

    const batchIdField = document.getElementById("BatchID");

    batchIdField.value = batch.batch_id;
    document.getElementById("BatchName").value = batch.batch_name;
    document.getElementById("CourseID").value = batch.course_id;
    document.getElementById("Classroom").value = batch.classroom;
    document.getElementById("StartTime").value = batch.start_time;
    document.getElementById("EndTime").value = batch.end_time;
    document.getElementById("DaysOfWeek").value = batch.days_of_week;
    document.getElementById("FacultyID").value = batch.faculty_id;
    document.getElementById("StartDate").value = batch.start_date;
    document.getElementById("EndDate").value = batch.end_date;

    removeBatchIdRequiredError(batchIdField);

    [
        document.getElementById("BatchName"),
        document.getElementById("CourseID"),
        document.getElementById("Classroom"),
        document.getElementById("DaysOfWeek")
    ].forEach(removeRequiredError);

}

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

async function loadFacultyDropdown() {

    const select = document.getElementById("FacultyID");

    select.innerHTML = '<option value="">Select Faculty</option>';

    try {

        const faculty = await DatabaseAPI.get("/api/faculty");

        faculty.forEach(f => {

            const option = document.createElement("option");

            option.value = f.user_id;
            option.textContent = f.faculty_name;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load faculty.", "error");

    }

}

async function loadBatchList() {

    try {

        batches = await DatabaseAPI.get("/api/batches-full");

        if (!Array.isArray(batches)) {
            batches = [];
        }

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load batches.", "error");

        batches = [];

        return false;

    }

}

async function generateBatchID() {

    try {

        const result = await DatabaseAPI.get("/api/batches/new-id");

        document.getElementById("BatchID").value = result.batch_id;
        document.getElementById("BatchID").readOnly = true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Batch ID.", "error");

    }

}

async function startNewMode() {

    // Always clear any leftover disabled/greyed state first.
    setFieldsDisabled(false);

    setActiveMode("new");

    editMode = false;
    currentIndex = -1;

    const batchIdField = document.getElementById("BatchID");

    removeBatchIdRequiredError(batchIdField);

    clearForm();

    batchIdField.readOnly = true;

    // Strictly enforce: New mode always shows "Save".
    document.querySelector(".save-btn").textContent = "Save";

    await generateBatchID();

    removeBatchIdRequiredError(batchIdField);

    showMessage("Ready for new batch.", "success");

}

function startFindMode() {

    setActiveMode("find");

    editMode = false;
    currentIndex = -1;

    clearForm();

    const batchIdField = document.getElementById("BatchID");

    removeBatchIdRequiredError(batchIdField);

    batchIdField.value = "";
    batchIdField.readOnly = false;
    batchIdField.focus();

    // Strictly enforce: Find mode always shows "Update".
    document.querySelector(".save-btn").textContent = "Update";

    // Disable + grey out all fields and Update/Previous/Next as soon as
    // Find mode starts. BatchID, New, and Find stay usable.
    setFieldsDisabled(true);

    showMessage("Enter Batch ID and press Enter.", "info");

}

async function findBatch() {

    const batchIdField = document.getElementById("BatchID");

    const id = batchIdField.value.trim();

    if (id === "") {

        showMessage("Enter Batch ID.", "error");

        batchIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/batches/" + id);

        if (!result.success) {

            clearForm();

            batchIdField.value = id;

            showMessage("Not a valid Batch ID.", "error");

            // Keep fields/buttons disabled and greyed — user must retry.
            setFieldsDisabled(true);

            batchIdField.focus();

            return;

        }

        // Valid record found — re-enable and un-grey everything.
        setFieldsDisabled(false);

        populateForm(result);

        editMode = true;

        currentIndex = batches.findIndex(
            b => Number(b.batch_id) === Number(result.batch_id)
        );

        batchIdField.readOnly = true;

        document.querySelector(".save-btn").textContent = "Update";

        setActiveMode("find");

        showMessage("Batch loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find batch.", "error");

    }

}

function showCurrentBatch() {

    if (currentIndex < 0 || currentIndex >= batches.length)
        return;

    populateForm(batches[currentIndex]);

    editMode = true;

    document.getElementById("BatchID").readOnly = true;

    document.querySelector(".save-btn").textContent = "Update";

    setActiveMode("find");

}

function previousRecord() {

    if (batches.length === 0) {

        showMessage("No batch records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        currentIndex = batches.length - 1;

        showCurrentBatch();

        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already on first record.", "info");

        return;

    }

    currentIndex--;

    showCurrentBatch();

}

function nextRecord() {

    if (batches.length === 0) {

        showMessage("No batch records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        currentIndex = 0;

        showCurrentBatch();

        return;

    }

    if (currentIndex >= batches.length - 1) {

        showMessage("Already on last record.", "info");

        return;

    }

    currentIndex++;

    showCurrentBatch();

}

async function saveBatch() {

    if (!validateForm())
        return;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            // Restore the original, unedited values.
            if (currentIndex >= 0 && currentIndex < batches.length) {
                populateForm(batches[currentIndex]);
            }

            return;

        }

    }

    const data = {

        batch_id: document.getElementById("BatchID").value,
        batch_name: document.getElementById("BatchName").value.trim(),
        course_id: document.getElementById("CourseID").value,
        classroom: document.getElementById("Classroom").value.trim(),
        start_time: document.getElementById("StartTime").value,
        end_time: document.getElementById("EndTime").value,
        days_of_week: document.getElementById("DaysOfWeek").value.trim(),
        faculty_id: document.getElementById("FacultyID").value,
        start_date: document.getElementById("StartDate").value,
        end_date: document.getElementById("EndDate").value

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                "/api/batches/" + data.batch_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post("/api/batches", data);

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await loadBatchList();

            if (editMode) {

                currentIndex = batches.findIndex(
                    b => Number(b.batch_id) === Number(data.batch_id)
                );

            }
            else {

                await startNewMode();

            }

        }

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to save record.", "error");

    }

}

function validateForm() {

    if (document.getElementById("BatchName").value.trim() === "") {

        showMessage("Enter Batch Name", "error");

        document.getElementById("BatchName").focus();

        return false;

    }

    if (document.getElementById("CourseID").value.trim() === "") {

        showMessage("Select Course", "error");

        document.getElementById("CourseID").focus();

        return false;

    }

    if (document.getElementById("Classroom").value.trim() === "") {

        showMessage("Enter Classroom", "error");

        document.getElementById("Classroom").focus();

        return false;

    }

    if (document.getElementById("DaysOfWeek").value.trim() === "") {

        showMessage("Enter Days Of Week", "error");

        document.getElementById("DaysOfWeek").focus();

        return false;

    }

    return true;

}

function showRequiredError(field) {

    field.classList.add("field-error");

    const wrapper = field.closest(".assignment-field-wrapper");

    if (!wrapper) return;

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

    const wrapper = field.closest(".assignment-field-wrapper");

    if (!wrapper) return;

    const errorMessage = wrapper.querySelector(".field-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showBatchIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".batch-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "batch-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeBatchIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".batch-id-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}


// Popup version of the info tooltip text, centered on screen,
// with a single Close button styled in the form's accent color.
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
    box.style.padding = "32px 40px";          // Increased padding
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";
    box.style.maxWidth = "420px";             // Increased width
    box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
    box.style.fontFamily = "inherit";

    const text = document.createElement("p");
    text.textContent = message;
    text.style.marginBottom = "20px";
    text.style.fontSize = "18px";             // Increased text size
    text.style.color = "#222";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "10px 32px";     // Bigger button
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.background = "#5535d6";
    closeBtn.style.color = "#fff";
    closeBtn.style.fontSize = "16px";         // Bigger button text
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