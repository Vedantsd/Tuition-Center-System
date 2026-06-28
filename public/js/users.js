document.addEventListener("DOMContentLoaded", () => {
    loadUserTypes();
});

document.querySelector(".save-btn").addEventListener("click", saveUser);

let messageTimer;

function showMessage(message, type = "info") {

    const status = document.getElementById("statusMessage");

    clearTimeout(messageTimer);

    status.className = "status-message";

    status.classList.add(type, "show");
    status.textContent = message;

    messageTimer = setTimeout(() => {
        status.classList.remove("show");
        status.textContent = "";
    }, 10000);
}

async function saveUser() {

    const data = {
        user_id: document.getElementById("User ID").value,
        user_type: document.getElementById("User Type").value,
        first_name: document.getElementById("First Name").value,
        last_name: document.getElementById("Last Name").value,
        mobile_no: document.getElementById("Mobile No.").value,
        email: document.getElementById("Email").value,
        password: document.getElementById("Password").value,
        dob: document.getElementById("DOB").value,
        address: document.getElementById("Address").value,
        qualification: document.getElementById("Qualification").value,
        joining_date: document.getElementById("Joining Date").value,
        gender: document.getElementById("Gender").value
    };

    try {

        const result = await DatabaseAPI.post("/api/users", data);

        if (result.success) {
            showMessage(result.message, "success");
        } else {
            showMessage(result.message, "error");
        }

    } catch (err) {
        showMessage("Unable to save user. Please try again.", "error");
    }
}

async function loadUserTypes() {

    const select = document.getElementById("UserType");

    try {

        const userTypes = await DatabaseAPI.get("/api/user-types");

        userTypes.forEach(type => {

            const option = document.createElement("option");

            option.value = type.user_type_id;
            option.textContent = type.user_type;

            select.appendChild(option);
        });

    } catch (err) {
        console.error("Failed to load user types.", err);
    }

}