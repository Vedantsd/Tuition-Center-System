let messageTimer = null;
let isExistingUser = false;
let userList = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {

    loadUserTypes();
    loadNewUserId();
    loadUserList();

    document
        .getElementById("findBtn")
        .addEventListener("click", handleFindNew);

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

});

async function loadNewUserId() {

    try {

        const result = await DatabaseAPI.get("/api/users/newid");

        if (!result.success) {

            showMessage(result.message, "error");
            return;

        }

        document.getElementById("UserID").value = result.user_id;

        document.getElementById("UserID").readOnly = true;

        document.getElementById("findBtn").textContent = "Find";

        isExistingUser = false;

        setSaveButtonText("Save");

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

}

function populateForm(user) {

    document.getElementById("UserID").value = user.user_id ?? "";
    document.getElementById("UserType").value = user.user_type ?? "";
    document.getElementById("FirstName").value = user.first_name ?? "";
    document.getElementById("LastName").value = user.last_name ?? "";
    document.getElementById("MobileNo").value = user.mobile_no ?? "";
    document.getElementById("Email").value = user.email ?? "";

    document.getElementById("Password").value = "";

    document.getElementById("DOB").value = user.dob ?? "";
    document.getElementById("Address").value = user.address ?? "";
    document.getElementById("Qualification").value = user.qualification ?? "";
    document.getElementById("JoiningDate").value = user.joining_date ?? "";

    if (user.gender === "M")
        document.getElementById("Gender").value = "Male";
    else if (user.gender === "F")
        document.getElementById("Gender").value = "Female";
    else
        document.getElementById("Gender").value = "Other";

    isExistingUser = true;
    setSaveButtonText("Update");

}

function handleFindNew() {

    const button = document.getElementById("findBtn");
    const userIdInput = document.getElementById("UserID");

    if (button.textContent === "Find") {

        clearForm();

        userIdInput.value = "";
        userIdInput.readOnly = false;
        userIdInput.focus();

        button.textContent = "New";

        isExistingUser = false;

        setSaveButtonText("Save");

        showMessage("Enter User ID and press Enter.", "info");

    }
    else {

        clearForm();

        userIdInput.readOnly = true;

        button.textContent = "Find";

        loadNewUserId();

    }

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

            showMessage("User not found.", "error");

            userIdInput.focus();

            return;

        }

        populateForm(result);

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

            showMessage("User not found.", "error");
            return;

        }

        populateForm(result);

        document.getElementById("findBtn").textContent = "New";

        document.getElementById("UserID").readOnly = true;

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

        document.getElementById("findBtn").textContent = "Find";

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

        const userTypes = await DatabaseAPI.get("/api/user-types");

        userTypes.forEach(type => {

            const option = document.createElement("option");

            option.value = type.user_type_id;
            option.textContent = type.user_type;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load user types.", "error");

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

        await loadNewUserId();
        await loadUserList();

    }
    catch (err) {

        console.error(err);
        showMessage("Error saving user.", "error");

    }

}