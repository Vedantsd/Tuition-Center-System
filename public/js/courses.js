let messageTimer = null;
let isExistingCourse = false;
let courseList = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {

    loadNewCourseId();
    loadCourseList();

    document
        .getElementById("findBtn")
        .addEventListener("click", handleFindNew);

    document
        .getElementById("CourseID")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter" && !this.readOnly) {
                findCourse();
            }

        });

    document
        .getElementById("previousBtn")
        .addEventListener("click", previousRecord);

    document
        .getElementById("nextBtn")
        .addEventListener("click", nextRecord);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveCourse);

});

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

function clearForm() {

    document.getElementById("CourseName").value = "";
    document.getElementById("ClassName").value = "";
    document.getElementById("DivisionName").value = "";
    document.getElementById("Subject").value = "";
    document.getElementById("Duration").value = "";
    document.getElementById("StartDate").value = "";
    document.getElementById("EndDate").value = "";
    document.getElementById("FeeAmount").value = "";

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

        document.getElementById("findBtn").textContent = "Find";

        isExistingCourse = false;

        setSaveButtonText("Save");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Course ID", "error");

    }

}

function handleFindNew() {

    const button = document.getElementById("findBtn");
    const courseIdInput = document.getElementById("CourseID");

    if (button.textContent === "Find") {

        clearForm();

        courseIdInput.value = "";
        courseIdInput.readOnly = false;
        courseIdInput.focus();

        button.textContent = "New";

        isExistingCourse = false;

        setSaveButtonText("Save");

        showMessage("Enter Course ID and press Enter.", "info");

    }
    else {

        clearForm();

        courseIdInput.readOnly = true;

        button.textContent = "Find";

        loadNewCourseId();

    }

}

async function findCourse() {

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

            showMessage("Course not found.", "error");

            courseIdInput.focus();

            return;

        }

        populateForm(result);

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

        document.getElementById("findBtn").textContent = "New";

        document.getElementById("CourseID").readOnly = true;

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

        currentIndex = 0;

    }
    else if (currentIndex >= courseList.length - 1) {

        clearForm();

        currentIndex = -1;

        setSaveButtonText("Save");

        document.getElementById("findBtn").textContent = "Find";

        document.getElementById("CourseID").readOnly = true;

        loadNewCourseId();

        showMessage("New course record.", "info");

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
        duration_months: document.getElementById("Duration").value,
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

async function saveCourse() {

    const data = getFormData();

    if (!validateForm(data))
        return;

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