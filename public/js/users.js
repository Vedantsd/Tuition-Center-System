let messageTimer = null;
let isExistingUser = false;
let userList = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {

    loadUserTypes();
    loadGenderOptions();
    loadNewUserId();
    loadUserList();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .getElementById("UserID")
        .addEventListener("keydown", function (event) {

            if (event.key === "Enter" && !this.readOnly) {
                findUser();
            }

        });

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveUser);

    document
        .querySelector(".prevButton")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".nextButton")
        .addEventListener("click", nextRecord);

    const requiredFields = [
    document.getElementById("UserType"),
    document.getElementById("FirstName"),
    document.getElementById("LastName"),
    document.getElementById("Email"),
    document.getElementById("Password"),
    document.getElementById("DOB")
];

requiredFields.forEach(field => {

    field.addEventListener("blur", function () {

        if (
    this.id === "Password" &&
    isExistingUser
) {
    removeRequiredError(this);
    return;
}

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
const userIdField = document.getElementById("UserID");

userIdField.addEventListener("blur", function () {

    if (
        !this.readOnly &&
        this.value.trim() === ""
    ) {

        showUserIdRequiredError(this);

    }
    else {

        removeUserIdRequiredError(this);

    }

});

userIdField.addEventListener("input", function () {

    if (this.value.trim() !== "") {

        removeUserIdRequiredError(this);

    }

});

});

document.addEventListener("DOMContentLoaded", () => {

    const infoModalOverlay = document.getElementById("infoModalOverlay");
    const infoModalText = document.getElementById("infoModalText");
    const infoModalClose = document.getElementById("infoModalClose");

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

    if (mode === "new") {
        document.getElementById("newModeBtn").classList.add("active");
    }
    else if (mode === "find") {
        document.getElementById("findModeBtn").classList.add("active");
    }

}

const FORM_FIELD_IDS = [
    "UserType",
    "FirstName",
    "LastName",
    "MobileNo",
    "Email",
    "Password",
    "DOB",
    "Address",
    "Qualification",
    "JoiningDate",
    "Gender"
];

function setFormFieldsDisabled(disabled) {

    FORM_FIELD_IDS.forEach(id => {

        document.getElementById(id).disabled = disabled;

    });

}

function setSaveButtonDisabled(disabled) {

    document.querySelector(".save-btn").disabled = disabled;

}

async function loadNewUserId() {

    try {

        const result = await DatabaseAPI.get("/api/users/newid");

        if (!result.success) {

            showMessage(result.message, "error");
            return;

        }

        document.getElementById("UserID").value = result.user_id;
        document.getElementById("UserID").readOnly = true;

        isExistingUser = false;

        setSaveButtonText("Save");
        setActiveMode("new");

        setFormFieldsDisabled(false);
        setSaveButtonDisabled(false);

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate User ID", "error");

    }

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

function setSaveButtonText(text) {

    document.querySelector(".save-btn").textContent = text;

}

function clearForm() {

    document.getElementById("UserType").value = "";
    document.getElementById("FirstName").value = "";
    document.getElementById("LastName").value = "";
    document.getElementById("MobileNo").value = "";
    document.getElementById("Email").value = "";
    document.getElementById("Password").value = "";
    document.getElementById("DOB").value = "";
    document.getElementById("Address").value = "";
    document.getElementById("Qualification").value = "";
    document.getElementById("JoiningDate").value = "";
    document.getElementById("Gender").value = "";

    isExistingUser = false;
    setSaveButtonText("Save");
    document
    .querySelectorAll(".user-field-wrapper")
    .forEach(wrapper => {

        const field = wrapper.querySelector("input, select");

        field.classList.remove("field-error");

        const errorMessage =
            wrapper.querySelector(".field-error-message");

        if (errorMessage) {
            errorMessage.remove();
        }

    });

}

function setSelectValueCaseInsensitive(selectId, storedValue) {

    const select = document.getElementById(selectId);
    const target = (storedValue || "").toLowerCase();

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

function populateForm(user) {

    document.getElementById("UserID").value = user.user_id ?? "";
    document.getElementById("FirstName").value = user.first_name ?? "";
    document.getElementById("LastName").value = user.last_name ?? "";
    document.getElementById("MobileNo").value = user.mobile_no ?? "";
    document.getElementById("Email").value = user.email ?? "";

    document.getElementById("Password").value = "";

    document.getElementById("DOB").value = user.dob ?? "";
    document.getElementById("Address").value = user.address ?? "";
    document.getElementById("Qualification").value = user.qualification ?? "";
    document.getElementById("JoiningDate").value = user.joining_date ?? "";

    setSelectValueCaseInsensitive("UserType", user.user_type);
    setSelectValueCaseInsensitive("Gender", user.gender);

    isExistingUser = true;
    setSaveButtonText("Update");
    const requiredFields = [
    document.getElementById("UserType"),
    document.getElementById("FirstName"),
    document.getElementById("LastName"),
    document.getElementById("Email"),
    document.getElementById("Password"),
    document.getElementById("DOB")
];

requiredFields.forEach(field => {
    removeRequiredError(field);
});

removeUserIdRequiredError(
    document.getElementById("UserID")
);

setFormFieldsDisabled(false);
setSaveButtonDisabled(false);

}

function startNewMode() {

    clearForm();

    isExistingUser = false;

    const userIdInput = document.getElementById("UserID");
    removeUserIdRequiredError(userIdInput);

    userIdInput.readOnly = true;

    setSaveButtonText("Save");

    setActiveMode("new");

    loadNewUserId();

}

function startFindMode() {

    clearForm();

    isExistingUser = false;

    const userIdInput = document.getElementById("UserID");

    userIdInput.value = "";
    userIdInput.readOnly = false;
    userIdInput.focus();

    setSaveButtonText("Update");

    setActiveMode("find");

    setFormFieldsDisabled(true);
    setSaveButtonDisabled(true);

    showMessage("Enter User ID and press Enter.", "info");

}

async function findUser() {

    const userIdInput = document.getElementById("UserID");

    const userId = userIdInput.value.trim();

    if (userId === "") {

        showMessage("Enter User ID.", "error");

        userIdInput.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/users/" + userId);

        if (!result.success) {

            clearForm();

            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);

            showMessage("User not found.", "error");

            userIdInput.focus();

            return;

        }

        populateForm(result);
        setActiveMode("find");

        showMessage("User loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find user.", "error");

    }

}

async function loadUserList() {

    try {

        const response = await DatabaseAPI.get("/api/users");

        const users = Array.isArray(response)
            ? response
            : response.data || response.users || [];

        userList = users
            .map(u => Number(u.user_id))
            .sort((a, b) => a - b);

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load users.", "error");

        return false;

    }

}

async function loadAndPopulateUser(userId) {

    try {

        const result = await DatabaseAPI.get("/api/users/" + userId);

        if (!result.success) {

            clearForm();

            setSaveButtonText("Update");
            setFormFieldsDisabled(true);
            setSaveButtonDisabled(true);

            showMessage("User not found.", "error");
            return;

        }

        populateForm(result);
        setActiveMode("find");

        document.getElementById("UserID").readOnly = true;

        showMessage("Existing record loaded.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load user.", "error");

    }

}

async function previousRecord() {

    if (userList.length === 0) {

        showMessage("No user records found.", "info");

        return;

    }

    const currentId = Number(
        document.getElementById("UserID").value
    );

    currentIndex = userList.indexOf(currentId);

    if (currentIndex === -1) {

        currentIndex = userList.length - 1;

    }
    else if (currentIndex <= 0) {

        showMessage("First Record", "info");

        return;

    }
    else {

        currentIndex--;

    }

    await loadAndPopulateUser(userList[currentIndex]);

}

async function nextRecord() {

    if (!isExistingUser) {

        showMessage("Already at new data entry.", "info");

        return;

    }

    if (userList.length === 0) {

        showMessage("No user records found.", "info");

        return;

    }

    const currentId = Number(
        document.getElementById("UserID").value
    );

    currentIndex = userList.indexOf(currentId);

    if (currentIndex === -1) {

        currentIndex = 0;

    }
    else if (currentIndex >= userList.length - 1) {

        clearForm();

        currentIndex = -1;

        setSaveButtonText("Save");

        document.getElementById("UserID").readOnly = true;

        loadNewUserId();

        showMessage("New user record.", "info");

        return;

    }
    else {

        currentIndex++;

    }

    await loadAndPopulateUser(userList[currentIndex]);

}

async function loadUserTypes() {

    const select = document.getElementById("UserType");

    select.innerHTML = '<option value="">--Select User Type--</option>';

    try {

        const result = await DatabaseAPI.get(
            "/api/lookup-values/active?type=user_type"
        );

        if (!result.success) {

            showMessage("Unable to load user types.", "error");
            return;

        }

        result.data.forEach(item => {

            const option = document.createElement("option");

            option.value = item.lookup_value;
            option.textContent =
                item.lookup_value.charAt(0).toUpperCase() +
                item.lookup_value.slice(1);

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load user types.", "error");

    }

}

async function loadGenderOptions() {

    const select = document.getElementById("Gender");

    select.innerHTML = '<option value="">--Select--</option>';

    try {

        const result = await DatabaseAPI.get(
            "/api/lookup-values/active?type=gender"
        );

        console.log("Gender lookup response:", result);

        if (!result || !result.success) {

            showMessage("Unable to load gender options.", "error");
            return;

        }

        if (!Array.isArray(result.data) || result.data.length === 0) {

            console.warn(
                "Gender lookup returned no rows. Check that " +
                "/api/lookup-values/active?type=gender has active " +
                "records with lookup_type = 'gender' in the database."
            );

            showMessage("No gender options configured.", "info");
            return;

        }

        result.data.forEach(item => {

            const option = document.createElement("option");

            option.value = item.lookup_value;
            option.textContent =
                item.lookup_value.charAt(0).toUpperCase() +
                item.lookup_value.slice(1);

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load gender options.", "error");

    }

}

function getFormData() {

    return {

        user_id: document.getElementById("UserID").value,
        user_type: document.getElementById("UserType").value,
        first_name: document.getElementById("FirstName").value.trim(),
        last_name: document.getElementById("LastName").value.trim(),
        mobile_no: document.getElementById("MobileNo").value,
        email: document.getElementById("Email").value.trim(),
        password: document.getElementById("Password").value,
        dob: document.getElementById("DOB").value,
        address: document.getElementById("Address").value.trim(),
        qualification: document.getElementById("Qualification").value.trim(),
        joining_date: document.getElementById("JoiningDate").value,
        gender: document.getElementById("Gender").value

    };

}
function showRequiredError(field) {

    field.classList.add("field-error");

    const wrapper = field.closest(".user-field-wrapper");

    let errorMessage =
        wrapper.querySelector(".field-error-message");

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

    const errorMessage =
        wrapper.querySelector(".field-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showUserIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    let errorMessage =
        group.querySelector(".user-id-error-message");

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

    const errorMessage =
        group.querySelector(".user-id-error-message");

    if (errorMessage) {

        errorMessage.remove();

    }

}

function validateForm(data) {

    if (!data.user_id) {
        showMessage("User ID is required.", "error");
        return false;
    }

    if (!data.user_type) {
        showMessage("User Type is required.", "error");
        return false;
    }

    if (!data.first_name) {
        showMessage("First Name is required.", "error");
        return false;
    }

    if (!data.last_name) {
        showMessage("Last Name is required.", "error");
        return false;
    }

    if (!data.email) {
        showMessage("Email is required.", "error");
        return false;
    }

    if (!data.dob) {
        showMessage("DOB is required.", "error");
        return false;
    }

    if (!isExistingUser) {

        if (!data.password) {
            showMessage("Password is required.", "error");
            return false;
        }

        if (data.password.length < 8) {
            showMessage("Password must be at least 8 characters.", "error");
            return false;
        }

    }

    return true;

}

async function saveUser() {

    const data = getFormData();

    if (!validateForm(data))
        return;

    try {

        let result;

        if (isExistingUser) {

            result = await DatabaseAPI.put("/api/users/" + data.user_id, data);

        }
        else {

            result = await DatabaseAPI.post("/api/users", data);

        }

        if (!result.success) {

            showMessage(result.message || "Unable to save user.", "error");
            return;

        }

        showMessage(result.message || "User saved successfully.", "success");

        clearForm();

        document.getElementById("UserID").readOnly = true;

        await loadNewUserId();
        await loadUserList();

    }
    catch (err) {

        console.error(err);
        showMessage("Error saving user.", "error");

    }

}