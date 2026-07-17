document.addEventListener("DOMContentLoaded", () => {

    loadCourses();
    prepareNewRecord();

    document.getElementById("findBtn")
        .addEventListener("click", () => {
            const feeIdInput = document.getElementById("FeeID");
            if (feeIdInput.readOnly) {
                unlockFeeId();
                clearDetailFields();
                enterFindLookupMode();
            } else {
                loadFee();
            }
        });

    document.getElementById("FeeID")
        .addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !this.readOnly) {
                event.preventDefault();
                loadFee();
            }
        });

    document.getElementById("newBtn")
        .addEventListener("click", prepareNewRecord);

    setupCourseDropdown();
    setupInfoIconPopups();
    setupConfirmModalButtons();

    document.querySelector(".save-btn")
        .addEventListener("click", saveFee);

    document.getElementById("prevBtn")
        .addEventListener("click", loadPreviousFee);

    document.getElementById("nextBtn")
        .addEventListener("click", loadNextFee);

    document.querySelector(".exit-btn")
        .addEventListener("click", () => {
            window.location.href = "index.html";
        });

    ["RegistrationFee", "TuitionFee", "ExamFee", "MaterialFee"].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener("input", calculateTotalFee);
        el.addEventListener("change", calculateTotalFee);
    });

    ["RegistrationFee", "TuitionFee"].forEach(id => {
        const el = document.getElementById(id);

        el.addEventListener("blur", function () {
            if (this.value.trim() === "") {
                showFeeFieldError(this);
            } else {
                removeFeeFieldError(this);
            }
        });

        el.addEventListener("input", function () {
            if (this.value.trim() !== "") {
                removeFeeFieldError(this);
            }
        });
    });

});

let messageTimer;
let isExistingFee = false;
let courseDropdownLocked = false;



function setupInfoIconPopups() {
    document.querySelectorAll(".fee-master-page .info-icon").forEach(icon => {
        const tooltip = icon.querySelector(".tooltip");
        const text = tooltip ? tooltip.textContent.trim() : "";

        icon.addEventListener("click", (e) => {
            e.stopPropagation();
            showInfoModal(text);
        });
    });

    document.getElementById("infoModalClose")
        .addEventListener("click", hideInfoModal);
}

function showInfoModal(text) {
    document.getElementById("infoModalText").textContent = text;
    document.getElementById("infoModalOverlay").classList.remove("hidden");
}

function hideInfoModal() {
    document.getElementById("infoModalOverlay").classList.add("hidden");
}

let confirmModalResolve = null;

function setupConfirmModalButtons() {
    document.getElementById("confirmYesBtn").addEventListener("click", () => {
        document.getElementById("confirmModalOverlay").classList.add("hidden");
        if (confirmModalResolve) confirmModalResolve(true);
    });

    document.getElementById("confirmNoBtn").addEventListener("click", () => {
        document.getElementById("confirmModalOverlay").classList.add("hidden");
        if (confirmModalResolve) confirmModalResolve(false);
    });
}

function showConfirmModal() {
    return new Promise(resolve => {
        confirmModalResolve = resolve;
        document.getElementById("confirmModalOverlay").classList.remove("hidden");
    });
}

function lockDetailFields() {
    document.getElementById("RegistrationFee").readOnly = true;
    document.getElementById("TuitionFee").readOnly = true;
    document.getElementById("ExamFee").readOnly = true;
    document.getElementById("MaterialFee").readOnly = true;

    document.getElementById("courseSelectDisplay").classList.add("course-select-locked");
    courseDropdownLocked = true;

    document.querySelector(".save-btn").disabled = true;
}

function unlockDetailFields() {
    document.getElementById("RegistrationFee").readOnly = false;
    document.getElementById("TuitionFee").readOnly = false;
    document.getElementById("ExamFee").readOnly = false;
    document.getElementById("MaterialFee").readOnly = false;

    document.getElementById("courseSelectDisplay").classList.remove("course-select-locked");
    courseDropdownLocked = false;

    document.querySelector(".save-btn").disabled = false;
}

function enterFindLookupMode() {
    setSaveButtonText("Update");
    setActiveSegment("findBtn");
    lockDetailFields();
}

function showFeeFieldError(field) {
    field.classList.add("fee-input-error");

    const wrapper = field.closest(".fee-field-wrapper");
    if (!wrapper) return;

    let msg = wrapper.querySelector(".fee-field-error-message");
    if (!msg) {
        msg = document.createElement("span");
        msg.className = "fee-field-error-message";
        msg.textContent = "This field is required";
        wrapper.appendChild(msg);
    }
}

function removeFeeFieldError(field) {
    field.classList.remove("fee-input-error");

    const wrapper = field.closest(".fee-field-wrapper");
    if (!wrapper) return;

    const msg = wrapper.querySelector(".fee-field-error-message");
    if (msg) msg.remove();
}

function checkCourseRequired() {
    const courseIdInput = document.getElementById("CourseID");
    const display = document.getElementById("courseSelectDisplay");
    const wrapper = document.getElementById("courseSelectWrapper");

    let msg = wrapper.querySelector(".fee-field-error-message");

    if (!courseIdInput.value) {
        display.classList.add("fee-input-error");
        if (!msg) {
            msg = document.createElement("span");
            msg.className = "fee-field-error-message";
            msg.textContent = "This field is required";
            wrapper.appendChild(msg);
        }
    } else {
        display.classList.remove("fee-input-error");
        if (msg) msg.remove();
    }
}

function lockFeeId() {
    document.getElementById("FeeID").readOnly = true;
}

function unlockFeeId() {
    const el = document.getElementById("FeeID");
    el.readOnly = false;
    el.focus();
    el.select();
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

let coursesCache = [];

async function loadCourses() {
    try {
        const courses = await DatabaseAPI.get("/api/courses");

        if (!Array.isArray(courses)) {
            showMessage("Error loading course list.", "error");
            return;
        }

        courses.sort((a, b) => Number(a.course_id) - Number(b.course_id));

        coursesCache = courses;

        const list = document.getElementById("courseSelectList");
        list.innerHTML = "";

        courses.forEach(course => {
            const row = document.createElement("div");
            row.className = "custom-select-option";
            row.innerHTML = `<span class="opt-id">${course.course_id}</span> (${course.course_name})`;

            row.addEventListener("click", () => selectCourse(course.course_id, course.course_name));

            list.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        showMessage("Error loading course list.", "error");
    }
}

function setupCourseDropdown() {

    const display = document.getElementById("courseSelectDisplay");
    const list = document.getElementById("courseSelectList");

    display.addEventListener("click", (e) => {
        if (courseDropdownLocked) return;
        e.stopPropagation();
        const isOpen = list.classList.contains("open");
        closeCourseDropdown();
        if (!isOpen) {
            list.classList.add("open");
            display.classList.add("open");
        }
    });

    document.addEventListener("click", closeCourseDropdown);
}

function closeCourseDropdown() {
    const list = document.getElementById("courseSelectList");
    const wasOpen = list.classList.contains("open");

    list.classList.remove("open");
    document.getElementById("courseSelectDisplay").classList.remove("open");

    if (wasOpen) {
        checkCourseRequired();
    }
}

function selectCourse(id, name) {

    document.getElementById("CourseID").value = id;

    const textEl = document.getElementById("courseSelectText");

    if (!id) {
        textEl.className = "placeholder-text";
        textEl.textContent = "-- Select Course --";
    } else {
        textEl.className = "";
        textEl.innerHTML = "";

        const idSpan = document.createElement("span");
        idSpan.className = "selected-id";
        idSpan.textContent = id;

        const nameSpan = document.createElement("span");
        nameSpan.className = "selected-text";
        nameSpan.textContent = " (" + name + ")";

        textEl.appendChild(idSpan);
        textEl.appendChild(nameSpan);
    }

    closeCourseDropdown();
}

function setCourseSelectionById(courseId) {

    if (!courseId) {
        selectCourse("", "");
        return;
    }

    const match = coursesCache.find(c => String(c.course_id) === String(courseId));

    if (match) {
        selectCourse(match.course_id, match.course_name);
    } else {
        document.getElementById("CourseID").value = courseId;
        const textEl = document.getElementById("courseSelectText");
        textEl.className = "";
        textEl.textContent = "Course ID " + courseId;
    }
}

function setActiveSegment(activeId) {
    document.getElementById("newBtn").classList.remove("active");
    document.getElementById("findBtn").classList.remove("active");
    document.getElementById(activeId).classList.add("active");
}

async function prepareNewRecord({ showReadyMessage = true } = {}) {

    clearForm();

    try {

        const result = await DatabaseAPI.get("/api/fee-master/newid");

        if (result && result.success) {
            document.getElementById("FeeID").value = result.fee_id;
        }

    } catch (err) {
        console.error(err);
    }

    isExistingFee = false;
    setSaveButtonText("Save");
    setActiveSegment("newBtn");
    lockFeeId();
    unlockDetailFields();

    if (showReadyMessage) {
        showMessage("Ready for new Fee record.", "info");
    }
}

function clearForm() {
    document.getElementById("FeeID").value = "";
    clearDetailFields();
}

function clearDetailFields() {

    selectCourse("", "");

    document.getElementById("RegistrationFee").value = "";
    document.getElementById("TuitionFee").value = "";
    document.getElementById("ExamFee").value = "";
    document.getElementById("MaterialFee").value = "";

    calculateTotalFee();

    removeFeeFieldError(document.getElementById("RegistrationFee"));
    removeFeeFieldError(document.getElementById("TuitionFee"));
    document.getElementById("courseSelectDisplay").classList.remove("fee-input-error");
    const courseWrapperMsg = document
        .getElementById("courseSelectWrapper")
        .querySelector(".fee-field-error-message");
    if (courseWrapperMsg) courseWrapperMsg.remove();
}

function populateForm(fee) {

    document.getElementById("FeeID").value = fee.fee_id;
    setCourseSelectionById(fee.course_id);

    document.getElementById("RegistrationFee").value = fee.registration_fee ?? "";
    document.getElementById("TuitionFee").value = fee.tuition_fee ?? "";
    document.getElementById("ExamFee").value = fee.exam_fee ?? "";
    document.getElementById("MaterialFee").value = fee.material_fee ?? "";

    calculateTotalFee();

    removeFeeFieldError(document.getElementById("RegistrationFee"));
    removeFeeFieldError(document.getElementById("TuitionFee"));
    checkCourseRequired();

    isExistingFee = true;
    setSaveButtonText("Update");
    setActiveSegment("findBtn");
    lockFeeId();
    unlockDetailFields();
}

async function loadFee(id, { suppressMessage = false } = {}) {

    const feeId = id || document.getElementById("FeeID").value;

    if (!feeId) {
        showMessage("Please enter a Fee ID.", "error");
        return;
    }

    if (id) {
        document.getElementById("FeeID").value = id;
    }

    const isManualFind = !id;

    if (isManualFind) {
        enterFindLookupMode();
    } else {
        setSaveButtonText("Update");
        setActiveSegment("findBtn");
    }

    try {

        const result = await DatabaseAPI.get("/api/fee-master/" + feeId);

  if (!result.success) {

    if (!isManualFind) {

        clearDetailFields();

        document.getElementById("FeeID").value = feeId;

        isExistingFee = false;

        setSaveButtonText("Save");
        setActiveSegment("newBtn");

        lockFeeId();
        unlockDetailFields();

        showMessage("Ready for new Fee record.", "info");

    } else {

        clearDetailFields();

        isExistingFee = false;

        lockDetailFields();

        showMessage("Fee ID doesn't exist.", "error");
    }

    return;
}

        populateForm(result.data);

        if (!suppressMessage) {
            showMessage("Fee record loaded.", "success");
        }

    } catch (err) {
        console.error(err);
        if (!isManualFind) lockDetailFields();
        showMessage("Error loading fee record.", "error");
    }
}

function getFormData() {

    const num = (id) => {
        const v = document.getElementById(id).value;
        if (v === "") return 0;
        const n = Number(v);
        return isNaN(n) ? 0 : n;
    };

    return {
        course_id: num("CourseID"),
        registration_fee: num("RegistrationFee"),
        tuition_fee: num("TuitionFee"),
        exam_fee: num("ExamFee"),
        material_fee: num("MaterialFee"),
        total_fee: num("TotalFee")
    };
}

function validateForm(data) {

    let isValid = true;

    const courseIdInput = document.getElementById("CourseID");
    const registrationFeeInput = document.getElementById("RegistrationFee");
    const tuitionFeeInput = document.getElementById("TuitionFee");

    if (!courseIdInput.value) {
        checkCourseRequired();
        isValid = false;
    }

    if (registrationFeeInput.value.trim() === "") {
        showFeeFieldError(registrationFeeInput);
        isValid = false;
    }

    if (tuitionFeeInput.value.trim() === "") {
        showFeeFieldError(tuitionFeeInput);
        isValid = false;
    }

    if (!isValid) {
        return showError("Please fill in all required fields.");
    }

    if (data.registration_fee < 0) return showError("Invalid Registration Fee.");
    if (data.tuition_fee < 0) return showError("Invalid Tuition Fee.");
    if (data.total_fee < 0) return showError("Invalid Total Fee.");

    return true;
}

function showError(msg) {
    showMessage(msg, "error");
    return false;
}

async function saveFee() {

    const data = getFormData();

    if (!validateForm(data)) return;

    const wasExistingRecord = isExistingFee;
    const feeId = document.getElementById("FeeID").value;

    if (wasExistingRecord) {
        const confirmed = await showConfirmModal();

        if (!confirmed) {
            await loadFee(feeId, { suppressMessage: true });
            showMessage("Changes discarded.", "info");
            return;
        }
    }

    try {

        let result;

        if (wasExistingRecord) {
            result = await DatabaseAPI.put("/api/fee-master/" + feeId, data);
        } else {
            result = await DatabaseAPI.post("/api/fee-master", data);
        }

        if (!result.success) {
            showMessage(result.message || "Save failed.", "error");
            return;
        }

        await prepareNewRecord({ showReadyMessage: false });

        showMessage(
            wasExistingRecord
                ? "Record updated successfully."
                : (result.message || "Saved successfully."),
            "success"
        );

    } catch (err) {
        console.error(err);
        showMessage("Error saving fee record.", "error");
    }
}

async function loadPreviousFee() {

    const currentId = parseInt(document.getElementById("FeeID").value, 10);

    if (!currentId || currentId <= 1) {
        showMessage("No previous record.", "info");
        return;
    }

    await loadFee(currentId - 1);
}

async function loadNextFee() {

    const currentId = parseInt(document.getElementById("FeeID").value, 10);

    if (!currentId) {
        showMessage("Load a record first.", "info");
        return;
    }

    await loadFee(currentId + 1);
}

function setSaveButtonText(text) {
    document.querySelector(".save-btn").textContent = text;
}

function calculateTotalFee() {

    const regVal = document.getElementById("RegistrationFee").value;
    const tuitionVal = document.getElementById("TuitionFee").value;
    const examVal = document.getElementById("ExamFee").value;
    const materialVal = document.getElementById("MaterialFee").value;

    if (regVal === "" && tuitionVal === "" && examVal === "" && materialVal === "") {
        document.getElementById("TotalFee").value = "";
        return;
    }

    const reg = Number(regVal) || 0;
    const tuition = Number(tuitionVal) || 0;
    const exam = Number(examVal) || 0;
    const material = Number(materialVal) || 0;

    document.getElementById("TotalFee").value = reg + tuition + exam + material;
}

