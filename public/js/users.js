document.addEventListener("DOMContentLoaded", () => {

    loadUserTypes();
    loadUserIds();
    loadNewUserId();

    document
        .getElementById("findBtn")
        .addEventListener("click", loadUser);

    document
        .querySelector(".prevButton")
        .addEventListener("click", goToPrevUser);

    document
        .querySelector(".nextButton")
        .addEventListener("click", goToNextUser);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveUser);

});

let messageTimer;
let isExistingUser = false;

let allUserIds = [];
let currentIndex = -1;

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

    document.getElementById("UserType").value = user.user_type;
    document.getElementById("FirstName").value = user.first_name;
    document.getElementById("LastName").value = user.last_name;
    document.getElementById("MobileNo").value = user.mobile_no;
    document.getElementById("Email").value = user.email;

    document.getElementById("Password").value = "";

    document.getElementById("DOB").value = user.dob;
    document.getElementById("Address").value = user.address;
    document.getElementById("Qualification").value = user.qualification;
    document.getElementById("JoiningDate").value = user.joining_date;

    if (user.gender === "M")
        document.getElementById("Gender").value = "Male";
    else if (user.gender === "F")
        document.getElementById("Gender").value = "Female";
    else
        document.getElementById("Gender").value = "Other";

    isExistingUser = true;
    setSaveButtonText("Update");

}

async function loadUserIds() {

    try {

        const response = await DatabaseAPI.get("/api/users");

        const users = Array.isArray(response)
            ? response
            : response.data || response.users || [];

        if (!Array.isArray(users) || users.length === 0) {

            console.warn("loadUserIds: no users returned from /api/users", response);
            allUserIds = [];
            return;

        }

        allUserIds = users
            .map(u => Number(u.user_id))
            .sort((a, b) => a - b);

    }
    catch (err) {

        console.error("loadUserIds failed:", err);
        showMessage("Unable to load user list for navigation.", "error");

    }

}

async function loadNewUserId() {

    try {

        const result = await DatabaseAPI.get("/api/users/newid");

        if (!result.success) {

            console.warn("loadNewUserId: unable to fetch next id", result);
            return;

        }

        document.getElementById("UserID").value = result.user_id;

    }
    catch (err) {

        console.error("loadNewUserId failed:", err);

    }

}

async function loadUserById(id) {

    try {

        const result = await DatabaseAPI.get("/api/users/" + id);

        if (!result.success) {

            clearForm();
            document.getElementById("UserID").value = id;
            showMessage("No existing user found. You can create a new one.", "info");
            return;

        }

        document.getElementById("UserID").value = id;
        populateForm(result);

        showMessage("Existing user loaded.", "success");

    }
    catch (err) {

        console.error(err);
        showMessage("Error loading user.", "error");

    }

}

async function loadUser() {

    const id = document.getElementById("UserID").value;

    if (!id) {

        showMessage("Please enter a User ID to search.", "error");
        return;

    }

    await loadUserById(id);

    currentIndex = allUserIds.indexOf(Number(id));

}

async function goToPrevUser() {

    if (allUserIds.length === 0) {

        showMessage("No users to navigate.", "info");
        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already at the first user.", "info");
        return;

    }

    currentIndex--;
    await loadUserById(allUserIds[currentIndex]);

}

async function goToNextUser() {

    if (allUserIds.length === 0) {

        showMessage("No users to navigate.", "info");
        return;

    }

    if (currentIndex >= allUserIds.length - 1) {

        showMessage("Already at the last user.", "info");
        return;

    }

    currentIndex++;
    await loadUserById(allUserIds[currentIndex]);

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

        isExistingUser = true;
        setSaveButtonText("Update");

        showMessage(result.message || "User saved successfully.", "success");

        clearForm();

        await loadUserIds();
        await loadNewUserId();

    }
    catch (err) {

        console.error(err);
        showMessage("Error saving user.", "error");

    }

}