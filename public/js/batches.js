document.addEventListener("DOMContentLoaded", async ()=>{
    await loadCourses();

    await loadFaculty();

    await loadBatches();

    await generateBatchID();

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveBatch);

    document
        .querySelector(".prev-btn")
        .addEventListener("click", previousBatch);

    document
        .querySelector(".next-btn")
        .addEventListener("click", nextBatch);

    
    document
        .getElementById("FindBtn")
        .addEventListener("click", enableFindMode);

    document
        .getElementById("NewBtn")
        .addEventListener("click", enableNewMode);

    document
        .getElementById("BatchID")
        .addEventListener("keydown", function (event) {

        if (event.key === "Enter" && !this.readOnly) {
            findBatch();
        }

    });
    
});


let messageTimer;

let batches = [];

let currentIndex = -1;

let editMode = false;



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



async function clearForm() {

    document.getElementById("BatchName").value = "";

    document.getElementById("CourseID").value = "";

    document.getElementById("Classroom").value = "";

    document.getElementById("StartTime").value = "";

    document.getElementById("EndTime").value = "";

    document.getElementById("DaysOfWeek").value = "";

    document.getElementById("FacultyID").value = "";

    document.getElementById("StartDate").value = "";

    document.getElementById("EndDate").value = "";

    document.getElementById("BatchID").readOnly = true;


    await generateBatchID();

}


function setActiveMode(mode){

    const findBtn=document.getElementById("FindBtn");

    const newBtn=document.getElementById("NewBtn");

    if(mode==="find"){

        findBtn.classList.add("active");
        newBtn.classList.remove("active");

    }
    else{

        newBtn.classList.add("active");
        findBtn.classList.remove("active");

    }

}

function enableFindMode(){

    editMode=false;

    document.getElementById("BatchID").value="";

    document.getElementById("BatchID").readOnly=false;

    document.getElementById("BatchID").focus();

    setActiveMode("find");

    showMessage(
        "Enter Batch ID and press Enter.",
        "info"
    );

}


function populateForm(batch) {

    document.getElementById("BatchID").value = batch.batch_id;

    document.getElementById("BatchName").value = batch.batch_name;

    document.getElementById("CourseID").value = batch.course_id;

    document.getElementById("Classroom").value = batch.classroom;

    document.getElementById("StartTime").value = batch.start_time;

    document.getElementById("EndTime").value = batch.end_time;

    document.getElementById("DaysOfWeek").value = batch.days_of_week;

    document.getElementById("FacultyID").value = batch.faculty_id;

    document.getElementById("StartDate").value = batch.start_date;

    document.getElementById("EndDate").value = batch.end_date;

    

}



async function loadCourses() {

    const select = document.getElementById("CourseID");

    select.innerHTML = '<option value="">--Select Course--</option>';

    try {

        const courses = await DatabaseAPI.get("/api/courses");

        courses.forEach(course => {

            const option = document.createElement("option");

            option.value = course.course_id;

            option.textContent = course.course_name;

            select.appendChild(option);

        });

    }

    catch (err) {

        console.error(err);

        showMessage("Unable to load courses.", "error");

    }

}



async function loadFaculty() {

    const select = document.getElementById("FacultyID");

    select.innerHTML = '<option value="">--Select Faculty--</option>';

    try {

        const faculty = await DatabaseAPI.get("/api/faculty");

        faculty.forEach(f => {

            const option = document.createElement("option");

            option.value = f.user_id;

            option.textContent = f.faculty_name;

            select.appendChild(option);

        });

    }

    catch (err) {

        console.error(err);

        showMessage("Unable to load faculty.", "error");

    }

}



async function loadBatches() {

    try {

        batches = await DatabaseAPI.get("/api/batches");

        if (!Array.isArray(batches)) {

            batches = [];

        }

    }

    catch (err) {

        console.error(err);

        showMessage("Unable to load batches.", "error");

    }

}



async function loadBatch() {

    const id = document.getElementById("BatchID").value;

    if (!id)
        return;

    try {

        const result = await DatabaseAPI.get("/api/batches/" + id);

        if (!result.success) {

            clearForm();

            document.getElementById("BatchID").value = id;

            showMessage("Batch not found.", "error");

            return;

        }

        populateForm(result);

        currentIndex = batches.findIndex(batch => batch.batch_id == id);

        showMessage("Batch loaded successfully.", "success");

    }

    catch (err) {

        console.error(err);

        showMessage(err.message, "error");

    }

}



function showCurrentBatch() {

    if (currentIndex < 0 || currentIndex >= batches.length)
        return;

    populateForm(batches[currentIndex]);

}


function nextBatch() {

    if (batches.length === 0) {

        showMessage("No records available.", "error");

        return;

    }

    if (currentIndex < batches.length - 1) {

        currentIndex++;

        showCurrentBatch();editMode=true;

document.getElementById("SaveBtn").innerText="Update";

setActiveMode("find");



    }

    else {

        showMessage("No next record.", "error");

    }

}


function previousBatch() {

    if (batches.length === 0) {

        showMessage("No records available.", "error");

        return;

    }

    if (currentIndex > 0) {

        currentIndex--;

        showCurrentBatch();

        editMode=true;

document.getElementById("SaveBtn").innerText="Update";

setActiveMode("find");

    }

    else {

        showMessage("No previous record.", "error");

    }

}






async function findBatch() {

    const id = document.getElementById("BatchID").value.trim();

    if (id === "") {

        showMessage("Enter Batch ID.", "error");
        return;

    }

    try {

        const batch = await DatabaseAPI.get("/api/batches/" + id);

        if (!batch.success) {

            showMessage("Batch not found.", "error");
            return;

        }

        populateForm(batch);

        editMode=true;

document.getElementById("BatchID").readOnly=true;

document.getElementById("SaveBtn").innerText="Update";

setActiveMode("find");

        currentIndex = batches.findIndex(
            b => b.batch_id == batch.batch_id
        );

       

        showMessage("Batch loaded successfully.", "success");

    }

    catch (err) {

        console.error(err);

        showMessage(err.message, "error");

    }

}

async function enableNewMode(){

    editMode=false;

    await clearForm();

    await generateBatchID();

    document.getElementById("BatchID").readOnly=true;

    document.getElementById("SaveBtn").innerText="Save";

    setActiveMode("new");

    showMessage(
        "Ready for new batch.",
        "success"
    );

}


async function saveBatch() {

    const batch = {

        batch_id: document.getElementById("BatchID").value,
        batch_name: document.getElementById("BatchName").value,
        course_id: document.getElementById("CourseID").value,
        classroom: document.getElementById("Classroom").value,
        start_time: document.getElementById("StartTime").value,
        end_time: document.getElementById("EndTime").value,
        days_of_week: document.getElementById("DaysOfWeek").value,
        faculty_id: document.getElementById("FacultyID").value,
        start_date: document.getElementById("StartDate").value,
        end_date: document.getElementById("EndDate").value

    };

    try {

        let result;

        if(editMode){

            result = await DatabaseAPI.put("/api/batches/" + batch.batch_id, batch);

        }
        else{

            result = await DatabaseAPI.post("/api/batches", batch);

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await clearForm();

await generateBatchID();

editMode=false;

document.getElementById("SaveBtn").innerText="Save";

setActiveMode("new");
         

        }

    }

    catch (err) {

        console.error(err);

        showMessage(err.message, "error");

        }

}

async function generateBatchID(){

    try{

        const result =
        await DatabaseAPI.get("/api/batches/new-id");

        document.getElementById("BatchID").value = result.batch_id;
        document.getElementById("BatchID").readOnly = true;

    }

    catch(err){

        console.log(err);

    }

}

document
    .querySelector(".exit-btn")
    .addEventListener("click", () => {

        window.history.back();

    });