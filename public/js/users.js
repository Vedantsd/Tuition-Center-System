document.querySelector(".save-btn").addEventListener("click", saveUser);

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

    const result = await DatabaseAPI.post("/api/users", data);

    alert(result.message);

}