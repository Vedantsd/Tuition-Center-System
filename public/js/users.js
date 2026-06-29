document.addEventListener("DOMContentLoaded", () => {

    loadUserTypes();

    document
        .getElementById("UserID")
        .addEventListener("blur", loadUser);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveUser);

});

let messageTimer;

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

    if(user.gender==="M")
        document.getElementById("Gender").value="Male";

    else if(user.gender==="F")
        document.getElementById("Gender").value="Female";

    else
        document.getElementById("Gender").value="Other";

}

async function loadUser() {

    const id = document.getElementById("UserID").value;

    if (!id)
        return;

    try {

        const result = await DatabaseAPI.get("/api/users/" + id);

        if (!result.success) {

            clearForm();
            return;

        }

        populateForm(result);

        showMessage("Existing user loaded.", "success");

    }

    catch (err) {

        console.error(err);

    }

}

async function loadUser() {

    const id = document.getElementById("UserID").value;

    if (!id)
        return;

    try {

        const result = await DatabaseAPI.get("/api/users/" + id);

        if (!result.success) {

            clearForm();
            return;

        }

        populateForm(result);

        showMessage("Existing user loaded.", "success");

    }

    catch (err) {

        console.error(err);

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

if (result.success && !existing.success) {

    clearForm();

    document.getElementById("UserID").value = "";

}
showMessage(result.message, "success");

