document.addEventListener("DOMContentLoaded", () => {

    loadUserTypes();

    document
        .getElementById("findBtn")
        .addEventListener("click", loadUser);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveUser);

});

let messageTimer;
let isExistingUser = false;

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

    // Password is never pre-filled; leave blank so a blank value
    // on update means "keep existing password" (per the PUT route).
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

async function loadUser() {

    const id = document.getElementById("UserID").value;

    if (!id) {

        showMessage("Please enter a User ID to search.", "error");
        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/users/" + id);

        if (!result.success) {

            clearForm();
            showMessage("No existing user found. You can create a new one.", "info");
            return;

        }

        populateForm(result);

        showMessage("Existing user loaded.", "success");

    }
    catch (err) {

        console.error(err);
        showMessage("Error searching for user.", "error");

    }

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

    // Password only required when creating a brand-new user.
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

    }
    catch (err) {

        console.error(err);
        showMessage("Error saving user.", "error");

    }

}