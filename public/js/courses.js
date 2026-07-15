let messageTimer = null;
let isExistingCourse = false;
let courseList = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {

    loadNewCourseId();
    loadCourseList();

    setupRequiredValidation([
        { id: "CourseName", label: "Course Name" },
        { id: "ClassName",  label: "Class Name" },
        { id: "Subject",    label: "Subject" },
        { id: "Duration",   label: "Duration" },
        { id: "StartDate",  label: "Start Date" },
        { id: "EndDate",    label: "End Date" },
        { id: "FeeAmount",  label: "Fee Amount" }
    ]);

    document
        .getElementById("newBtn")
        .addEventListener("click", enterNewMode);

    document
        .getElementById("findBtn")
        .addEventListener("click", enterFindMode);

    document
        .getElementById("CourseID")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter" && !this.readOnly) {
                performFind();
            }

        });

    document
        .getElementById("previousBtn")
        .addEventListener("click", previousRecord);

    document
        .getElementById("nextBtn")
        .addEventListener("click", nextRecord);

    // document
    //     .querySelector(".save-btn")
    //     .addEventListener("click", saveCourse);

    document
        .querySelector(".save-btn")
        .addEventListener("click", handleSaveClick);

});

document.addEventListener("DOMContentLoaded", () => {

    const overlay = document.getElementById("infoModalOverlay");
    const modalText = document.getElementById("infoModalText");
    const closeBtn = document.getElementById("infoModalClose");

    document.querySelectorAll(".info-icon").forEach(icon => {

        icon.addEventListener("click", () => {
            modalText.textContent = icon.dataset.info;
            overlay.classList.add("show");
        });

    });

    closeBtn.addEventListener("click", () => {
        overlay.classList.remove("show");
    });

    // Click outside the box also closes it
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.classList.remove("show");
        }
    });

});

function setupRequiredValidation(fields) {

    fields.forEach(({ id, label }) => {

        const input = document.getElementById(id);

        if (!input) return;

        // Wrap the input in a positioned container
        const wrapper = document.createElement("div");
        wrapper.className = "field-wrapper";

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Error message goes inside the wrapper, absolutely positioned under the input
        const errorEl = document.createElement("div");
        errorEl.className = "field-error-text";
        errorEl.id = id + "ErrorMsg";
        wrapper.appendChild(errorEl);

        input.addEventListener("blur", () => {

            if (!input.value || !input.value.toString().trim()) {

                input.classList.add("input-error");
                errorEl.textContent = label + " is required.";
                errorEl.classList.add("show");

            }

        });

        input.addEventListener("input", () => {

            input.classList.remove("input-error");
            errorEl.classList.remove("show");
            errorEl.textContent = "";

        });

    });

}

function clearAllValidationErrors() {

    document.querySelectorAll(".field-error-text").forEach(errorEl => {

        errorEl.textContent = "";
        errorEl.classList.remove("show");

    });

    document.querySelectorAll(".input-error").forEach(input => {

        input.classList.remove("input-error");

    });

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

    }, 5000);

}

function setSaveButtonText(text) {

    document.querySelector(".save-btn").textContent = text;

}


function setActiveToggle(mode) {

    document.getElementById("newBtn").classList.toggle("active", mode === "new");
    document.getElementById("findBtn").classList.toggle("active", mode === "find");

}

function clearForm() {

    document.getElementById("CourseName").value = "";
    document.getElementById("ClassName").value = "";
    document.getElementById("DivisionName").value = "";
    document.getElementById("Subject").value = "";
    document.getElementById("Duration").value = "";
    document.getElementById("StartDate").value = "";
    document.getElementById("EndDate").value = "";
    document.getElementById("FeeAmount").value = "";

    clearAllValidationErrors();

    isExistingCourse = false;
    setSaveButtonText("Save");

}

function populateForm(course) {

    document.getElementById("CourseID").value = course.course_id ?? "";
    document.getElementById("CourseName").value = course.course_name ?? "";
    document.getElementById("ClassName").value = course.class_name ?? "";
    document.getElementById("DivisionName").value = course.division_name ?? "";

    document.getElementById("Subject").value = course.subjects ?? "";
    document.getElementById("Duration").value = course.duration_months ?? "";

    document.getElementById("StartDate").value = course.start_date ?? "";
    document.getElementById("EndDate").value = course.end_date ?? "";
    document.getElementById("FeeAmount").value = course.fee_amount ?? "";

    clearAllValidationErrors();

    isExistingCourse = true;
    setSaveButtonText("Update");

}

async function loadNewCourseId() {

    try {

        const result = await DatabaseAPI.get("/api/courses/newid");

        if (!result.success) {

            showMessage(result.message, "error");
            return;

        }

        document.getElementById("CourseID").value = result.course_id;
        document.getElementById("CourseID").readOnly = true;

        setActiveToggle("new");

        isExistingCourse = false;

        setSaveButtonText("Save");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Course ID", "error");

    }

}

// "New" button clicked
async function enterNewMode() {

    clearForm();

    await loadNewCourseId();

    document.getElementById("CourseID").readOnly = true;

    setActiveToggle("new");

    setSaveButtonText("Save");

}

// "Find" button clicked — just switches to search mode, does NOT search yet
function enterFindMode() {

    clearForm();

    const courseIdInput = document.getElementById("CourseID");

    courseIdInput.value = "";
    courseIdInput.readOnly = false;
    courseIdInput.focus();

    setActiveToggle("find");

    isExistingCourse = false;

    setSaveButtonText("Save");

    showMessage("Enter Course ID and press Enter.", "info");

}

// Runs the actual search — triggered by pressing Enter while the
// CourseID field is unlocked (i.e. after clicking "Find").
async function performFind() {

    const courseIdInput = document.getElementById("CourseID");

    const courseId = courseIdInput.value.trim();

    if (courseId === "") {

        showMessage("Enter Course ID.", "error");

        courseIdInput.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/courses/" + courseId);

        if (!result.success) {

            clearForm();

            document.getElementById("CourseID").value = courseId;

            showMessage("Course not found.", "error");

            courseIdInput.focus();

            return;

        }

        populateForm(result);

        document.getElementById("CourseID").readOnly = true;

        setActiveToggle("find");

        showMessage("Course loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find course.", "error");

    }

}

async function loadCourseList() {

    try {

        const response = await DatabaseAPI.get("/api/courses");

        const courses = Array.isArray(response)
            ? response
            : response.data || response.courses || [];

        courseList = courses
            .map(c => Number(c.course_id))
            .sort((a, b) => a - b);

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load courses.", "error");

        return false;

    }

}

async function loadAndPopulateCourse(courseId) {

    try {

        const result = await DatabaseAPI.get("/api/courses/" + courseId);

        if (!result.success) {

            showMessage("Course not found.", "error");
            return;

        }

        populateForm(result);

        document.getElementById("CourseID").readOnly = true;

        setActiveToggle("find");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load course.", "error");

    }

}

async function previousRecord() {

    if (courseList.length === 0) {

        showMessage("No course records found.", "info");

        return;

    }

    const currentId = Number(
        document.getElementById("CourseID").value
    );

    currentIndex = courseList.indexOf(currentId);

    if (currentIndex === -1) {

        currentIndex = courseList.length - 1;

    }
    else if (currentIndex <= 0) {

        showMessage("First Record", "info");

        return;

    }
    else {

        currentIndex--;

    }

    await loadAndPopulateCourse(courseList[currentIndex]);

}

async function nextRecord() {

    if (courseList.length === 0) {

        showMessage("No course records found.", "info");

        return;

    }

    const currentId = Number(
        document.getElementById("CourseID").value
    );

    currentIndex = courseList.indexOf(currentId);

    if (currentIndex === -1) {

        const lastId = courseList[courseList.length - 1];

        if (currentId > lastId) {

            showMessage("Already at new record.", "info");
            return;

        }

        currentIndex = 0;

    }
    else if (currentIndex >= courseList.length - 1) {

        clearForm();

        currentIndex = -1;

        await loadNewCourseId();

        showMessage("New Course Record.", "success");

        return;

    }
    else {

        currentIndex++;

    }

    await loadAndPopulateCourse(courseList[currentIndex]);

}

function getFormData() {

    return {

        course_id: document.getElementById("CourseID").value,
        course_name: document.getElementById("CourseName").value.trim(),
        class_name: document.getElementById("ClassName").value.trim(),
        division_name: document.getElementById("DivisionName").value.trim(),

        subjects: document.getElementById("Subject").value.trim(),
        duration_months: Number(document.getElementById("Duration").value),

        start_date: document.getElementById("StartDate").value,
        end_date: document.getElementById("EndDate").value,
        fee_amount: document.getElementById("FeeAmount").value

    };

}

function validateForm(data) {

    if (!data.course_id) {
        showMessage("Course ID is required.", "error");
        return false;
    }

    if (!data.course_name) {
        showMessage("Course Name is required.", "error");
        return false;
    }

    if (!data.class_name) {
        showMessage("Class Name is required.", "error");
        return false;
    }

    if (!data.subjects) {
        showMessage("Subject is required.", "error");
        return false;
    }

    if (!data.duration_months) {
        showMessage("Duration is required.", "error");
        return false;
    }

    if (!data.start_date) {
        showMessage("Start Date is required.", "error");
        return false;
    }

    if (!data.end_date) {
        showMessage("End Date is required.", "error");
        return false;
    }

    if (data.start_date && data.end_date && data.end_date < data.start_date) {
        showMessage("End Date cannot be before Start Date.", "error");
        return false;
    }

    if (!data.fee_amount) {
        showMessage("Fee Amount is required.", "error");
        return false;
    }

    return true;

}

function handleSaveClick() {

    const data = getFormData();

    if (!validateForm(data))
        return;

    // If updating an existing course, ask for confirmation first
    if (isExistingCourse) {

        showConfirmModal();

    }
    else {

        saveCourse();

    }

}

function showConfirmModal() {

    document.getElementById("confirmMessage").textContent =
        "Are you sure you want to update this record?";

    document.getElementById("confirmModal").classList.add("show");

}

function hideConfirmModal() {

    document.getElementById("confirmModal").classList.remove("show");

}

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("confirmYesBtn")
        .addEventListener("click", () => {

            hideConfirmModal();
            saveCourse();

        });

    document
        .getElementById("confirmNoBtn")
        .addEventListener("click", () => {

            hideConfirmModal();

        });

});

async function saveCourse() {

    const data = getFormData();

    // if (!validateForm(data))
    //     return;

    try {

        let result;

        if (isExistingCourse) {

            result = await DatabaseAPI.put("/api/courses/" + data.course_id, data);

        }
        else {

            result = await DatabaseAPI.post("/api/courses", data);

        }

        if (!result.success) {

            showMessage(result.message || "Unable to save course.", "error");
            return;

        }

        showMessage(result.message || "Course saved successfully.", "success");

        clearForm();

        await loadNewCourseId();
        await loadCourseList();

    }
    catch (err) {

        console.error(err);
        showMessage("Error saving course.", "error");

    }

}