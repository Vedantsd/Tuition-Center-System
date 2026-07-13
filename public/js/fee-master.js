document.addEventListener("DOMContentLoaded", () => {

    loadCourses();
    prepareNewRecord();

    document.getElementById("findBtn")
        .addEventListener("click", () => {
            const feeIdInput = document.getElementById("FeeID");
            if (feeIdInput.readOnly) {
                // first click: unlock the field so the user can type an id,
                // and switch the toggle to Find right away
                unlockFeeId();
                setActiveSegment("findBtn");
            } else {
                // already unlocked: this click means "search now"
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

    document.querySelector(".save-btn")
        .addEventListener("click", saveFee);

    document.getElementById("prevBtn")
        .addEventListener("click", loadPreviousFee);

    document.getElementById("nextBtn")
        .addEventListener("click", loadNextFee);

    document.querySelector(".exit-btn")
        .addEventListener("click", () => {
            // change this to wherever your dashboard / home page lives
            window.location.href = "index.html";
        });

    // Auto total calculation - fires on typing AND on spinner/blur changes
    ["RegistrationFee", "TuitionFee", "ExamFee", "MaterialFee"].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener("input", calculateTotalFee);
        el.addEventListener("change", calculateTotalFee);
    });

    // Required-field red-line validation (Registration Fee, Tuition Fee)
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

/* ==========================
   REQUIRED FIELD VALIDATION (red line under empty required fields)
========================== */
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

// Course dropdown isn't a normal input, so it gets its own check:
// flags the visible display box (not the hidden value input) and
// checks the hidden #CourseID value to decide if it's empty.
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

/* ==========================
   LOCK / UNLOCK FEE ID
   Locked (readonly + grey) by default — shows the auto id preview
   or a loaded record. Unlocked only while the user is actively
   typing an id to search for via Find.
========================== */
function lockFeeId() {
    document.getElementById("FeeID").readOnly = true;
}

function unlockFeeId() {
    const el = document.getElementById("FeeID");
    el.readOnly = false;
    el.focus();
    el.select();
}

/* ==========================
   MESSAGE
========================== */
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

/* ==========================
   LOAD COURSES (custom dropdown)
   NOTE: GET /api/courses returns a plain array (see api.js),
   NOT a { success, data } object — so we must not check result.success here.
========================== */
let coursesCache = [];

async function loadCourses() {
    try {
        const courses = await DatabaseAPI.get("/api/courses");

        if (!Array.isArray(courses)) {
            showMessage("Error loading course list.", "error");
            return;
        }

        // sort by course_id ascending so the list always shows 1,2,3...
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

/* ==========================
   CUSTOM COURSE DROPDOWN — open/close + selection
========================== */
function setupCourseDropdown() {

    const display = document.getElementById("courseSelectDisplay");
    const list = document.getElementById("courseSelectList");

    display.addEventListener("click", (e) => {
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

    // only validate if the dropdown was genuinely opened and is now
    // closing (via selection or clicking away) — not on every
    // unrelated click elsewhere on the page
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

// Sets the dropdown's displayed selection from a course_id alone
// (used when loading an existing record where we only have the id)
function setCourseSelectionById(courseId) {

    if (!courseId) {
        selectCourse("", "");
        return;
    }

    const match = coursesCache.find(c => String(c.course_id) === String(courseId));

    if (match) {
        selectCourse(match.course_id, match.course_name);
    } else {
        // course exists in the fee record but wasn't found in the cached
        // list (e.g. deleted course) — still show the id so nothing's lost
        document.getElementById("CourseID").value = courseId;
        const textEl = document.getElementById("courseSelectText");
        textEl.className = "";
        textEl.textContent = "Course ID " + courseId;
    }
}

/* ==========================
   SEGMENTED TOGGLE (New / Find)
========================== */
function setActiveSegment(activeId) {
    document.getElementById("newBtn").classList.remove("active");
    document.getElementById("findBtn").classList.remove("active");
    document.getElementById(activeId).classList.add("active");
}

/* ==========================
   PREPARE A NEW RECORD
   Clears the form and previews the next auto-generated Fee ID.
   (The previewed ID is informational only — the INSERT itself
   relies on the database's RETURNING FEE_ID INTO clause, so it
   always gets the real next value even if two people click New
   around the same time.)
========================== */
async function prepareNewRecord() {

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

    showMessage("Ready for new Fee record.", "info");
}

/* ==========================
   CLEAR FORM
========================== */
function clearForm() {

    document.getElementById("FeeID").value = "";
    selectCourse("", "");

    document.getElementById("RegistrationFee").value = "";
    document.getElementById("TuitionFee").value = "";
    document.getElementById("ExamFee").value = "";
    document.getElementById("MaterialFee").value = "";

    calculateTotalFee(); // resets Total to blank

    // reset any leftover required-field error indicators
    removeFeeFieldError(document.getElementById("RegistrationFee"));
    removeFeeFieldError(document.getElementById("TuitionFee"));
    document.getElementById("courseSelectDisplay").classList.remove("fee-input-error");
    const courseWrapperMsg = document
        .getElementById("courseSelectWrapper")
        .querySelector(".fee-field-error-message");
    if (courseWrapperMsg) courseWrapperMsg.remove();
}

/* ==========================
   POPULATE FORM
========================== */
function populateForm(fee) {

    document.getElementById("FeeID").value = fee.fee_id;
    setCourseSelectionById(fee.course_id);

    document.getElementById("RegistrationFee").value = fee.registration_fee ?? "";
    document.getElementById("TuitionFee").value = fee.tuition_fee ?? "";
    document.getElementById("ExamFee").value = fee.exam_fee ?? "";
    document.getElementById("MaterialFee").value = fee.material_fee ?? "";

    calculateTotalFee(); // recalc from the four fields

    // a loaded record has real values — clear any stale error indicators
    removeFeeFieldError(document.getElementById("RegistrationFee"));
    removeFeeFieldError(document.getElementById("TuitionFee"));
    checkCourseRequired();

    isExistingFee = true;
    setSaveButtonText("Update");
    setActiveSegment("findBtn");
    lockFeeId();
}

/* ==========================
   LOAD FEE
   Pass an explicit id (used by Prev/Next); otherwise reads the
   FeeID input (used by the Find button / Enter key).
========================== */
async function loadFee(id) {

    const feeId = id || document.getElementById("FeeID").value;

    if (!feeId) {
        showMessage("Please enter a Fee ID.", "error");
        return;
    }

    // keep the field in sync when Prev/Next drive the lookup
    if (id) {
        document.getElementById("FeeID").value = id;
    }

    try {

        const result = await DatabaseAPI.get("/api/fee-master/" + feeId);

        if (!result.success) {

            // no record at this id — clear the detail fields but
            // keep the Fee ID visible so Prev/Next can keep moving
            selectCourse("", "");
            document.getElementById("RegistrationFee").value = "";
            document.getElementById("TuitionFee").value = "";
            document.getElementById("ExamFee").value = "";
            document.getElementById("MaterialFee").value = "";
            calculateTotalFee();

            isExistingFee = false;
            setSaveButtonText("Save");
            setActiveSegment("newBtn");

            showMessage("Fee record not found.", "info");
            return;
        }

        populateForm(result.data);

        document.getElementById("findBtn").textContent = "Find";

        showMessage("Fee record loaded.", "success");

    } catch (err) {
        console.error(err);
        showMessage("Error loading fee record.", "error");
    }
}

/* ==========================
   GET DATA (SAFE NUMBERS)
========================== */
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

/* ==========================
   VALIDATION
========================== */
function validateForm(data) {

    let isValid = true;

    const courseIdInput = document.getElementById("CourseID");
    const registrationFeeInput = document.getElementById("RegistrationFee");
    const tuitionFeeInput = document.getElementById("TuitionFee");

    if (!courseIdInput.value) {
        checkCourseRequired(); // flags the dropdown box in red
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

/* ==========================
   SAVE / UPDATE
========================== */
async function saveFee() {

    const data = getFormData();

    if (!validateForm(data)) return;

    const wasExistingRecord = isExistingFee; // remember the mode BEFORE this save

    try {

        let result;

        if (wasExistingRecord) {
            result = await DatabaseAPI.put("/api/fee-master/" + document.getElementById("FeeID").value, data);
        } else {
            result = await DatabaseAPI.post("/api/fee-master", data);
        }

        if (!result.success) {
            showMessage(result.message || "Save failed.", "error");
            return;
        }

        showMessage(
            result.message || (wasExistingRecord ? "Updated successfully." : "Saved successfully."),
            "success"
        );

        // whether this was a fresh insert or an update to an existing
        // record, always jump straight into a fresh New record afterward,
        // ready for the next entry with the next auto-incremented id
        await prepareNewRecord();

    } catch (err) {
        console.error(err);
        showMessage("Error saving fee record.", "error");
    }
}

/* ==========================
   PREVIOUS
========================== */
async function loadPreviousFee() {

    const currentId = parseInt(document.getElementById("FeeID").value, 10);

    if (!currentId || currentId <= 1) {
        showMessage("No previous record.", "info");
        return;
    }

    await loadFee(currentId - 1);
}

/* ==========================
   NEXT
========================== */
async function loadNextFee() {

    const currentId = parseInt(document.getElementById("FeeID").value, 10);

    if (!currentId) {
        showMessage("Load a record first.", "info");
        return;
    }

    await loadFee(currentId + 1);
}

/* ==========================
   SAVE BUTTON TEXT
========================== */
function setSaveButtonText(text) {
    document.querySelector(".save-btn").textContent = text;
}

/* ==========================
   AUTO TOTAL FEE
   Shows a BLANK field until at least one fee is entered,
   instead of showing "0".
========================== */
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