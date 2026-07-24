let editMode = false;
let roomsList = [];
let currentIndex = -1;
let currentMode = "new";
let messageTimer = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadBuildingDropdown();
    await loadStaffDropdown();
    await loadStatusDropdown();
    await loadRoomList();

    await startNewMode();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveRoom);

    document
        .querySelector(".prevButton")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".nextButton")
        .addEventListener("click", nextRecord);

    document
        .querySelector(".exit-btn")
        .addEventListener("click", () => {
            window.history.back();
        });

    const requiredFields = [
        document.getElementById("BuildingID"),
        document.getElementById("RoomCode"),
        document.getElementById("RoomName"),
        document.getElementById("RoomType"),
        document.getElementById("FloorNo"),
        document.getElementById("Capacity"),
        document.getElementById("Status")
    ];

    requiredFields.forEach(field => {

        field.addEventListener("blur", function () {

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

    const roomIdField = document.getElementById("RoomID");

    roomIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showRoomIdRequiredError(this);
        }
        else {
            removeRoomIdRequiredError(this);
        }

    });

    roomIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeRoomIdRequiredError(this);
        }

    });

    roomIdField.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && currentMode === "find") {
            findRoom();
        }

    });

});

function setActiveMode(mode) {

    currentMode = mode;

    document
        .getElementById("newModeBtn")
        .classList.toggle("active", mode === "new");

    document
        .getElementById("findModeBtn")
        .classList.toggle("active", mode === "find");

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

function setFieldsDisabled(disabled) {

    const fields = [
        document.getElementById("BuildingID"),
        document.getElementById("RoomCode"),
        document.getElementById("RoomName"),
        document.getElementById("RoomType"),
        document.getElementById("FloorNo"),
        document.getElementById("Capacity"),
        document.getElementById("AreaSqft"),
        document.getElementById("Status"),
        document.getElementById("Description"),
        document.getElementById("CreatedBy"),
        document.getElementById("CreatedAt"),
        document.getElementById("UpdatedBy"),
        document.getElementById("UpdatedAt")
    ];

    fields.forEach(field => {

        if (field) {

            field.disabled = disabled;

            field.style.backgroundColor = disabled ? "#e9e9e9" : "";
            field.style.color = disabled ? "#888" : "";
            field.style.cursor = disabled ? "not-allowed" : "";

        }

    });

    const saveBtn = document.querySelector(".save-btn");
    const prevBtn = document.querySelector(".prevButton");
    const nextBtn = document.querySelector(".nextButton");

    [saveBtn, prevBtn, nextBtn].forEach(btn => {

        if (btn) {

            btn.disabled = disabled;

            btn.style.opacity = disabled ? "0.5" : "";
            btn.style.cursor = disabled ? "not-allowed" : "";

        }

    });

}

function setRoomIdGrey(grey) {

    const roomIdField = document.getElementById("RoomID");

    roomIdField.style.backgroundColor = grey ? "#e9e9e9" : "";
    roomIdField.style.color = grey ? "#888" : "";
    roomIdField.style.cursor = grey ? "not-allowed" : "";

}

function showConfirmModal(message) {

    return new Promise(resolve => {

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0, 0, 0, 0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "24px 32px";
        box.style.borderRadius = "10px";
        box.style.textAlign = "center";
        box.style.maxWidth = "340px";
        box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
        box.style.fontFamily = "inherit";

        const text = document.createElement("p");
        text.textContent = message;
        text.style.marginBottom = "20px";
        text.style.fontSize = "16px";
        text.style.color = "#222";

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";
        btnContainer.style.gap = "12px";

        const yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.textContent = "Yes";
        yesBtn.style.padding = "8px 22px";
        yesBtn.style.border = "none";
        yesBtn.style.borderRadius = "6px";
        yesBtn.style.background = "#16a34a";
        yesBtn.style.color = "#fff";
        yesBtn.style.fontSize = "14px";
        yesBtn.style.cursor = "pointer";

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.textContent = "No";
        noBtn.style.padding = "8px 22px";
        noBtn.style.border = "none";
        noBtn.style.borderRadius = "6px";
        noBtn.style.background = "#dc2626";
        noBtn.style.color = "#fff";
        noBtn.style.fontSize = "14px";
        noBtn.style.cursor = "pointer";

        yesBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        noBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);

        box.appendChild(text);
        box.appendChild(btnContainer);
        overlay.appendChild(box);

        document.body.appendChild(overlay);

    });

}

function showSaveConfirmModal(message) {

    return new Promise(resolve => {

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0, 0, 0, 0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "24px 32px";
        box.style.borderRadius = "10px";
        box.style.textAlign = "center";
        box.style.maxWidth = "340px";
        box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
        box.style.fontFamily = "inherit";

        const text = document.createElement("p");
        text.textContent = message;
        text.style.marginBottom = "20px";
        text.style.fontSize = "16px";
        text.style.color = "#222";

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";
        btnContainer.style.gap = "10px";

        const yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.textContent = "Yes";
        yesBtn.style.padding = "8px 18px";
        yesBtn.style.border = "none";
        yesBtn.style.borderRadius = "6px";
        yesBtn.style.background = "#16a34a";
        yesBtn.style.color = "#fff";
        yesBtn.style.fontSize = "14px";
        yesBtn.style.cursor = "pointer";

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.textContent = "No";
        noBtn.style.padding = "8px 18px";
        noBtn.style.border = "none";
        noBtn.style.borderRadius = "6px";
        noBtn.style.background = "#dc2626";
        noBtn.style.color = "#fff";
        noBtn.style.fontSize = "14px";
        noBtn.style.cursor = "pointer";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "8px 18px";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "6px";
        cancelBtn.style.background = "#9ca3af";
        cancelBtn.style.color = "#fff";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.cursor = "pointer";

        yesBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("yes");
        });

        noBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("no");
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve("cancel");
        });

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);
        btnContainer.appendChild(cancelBtn);

        box.appendChild(text);
        box.appendChild(btnContainer);
        overlay.appendChild(box);

        document.body.appendChild(overlay);

    });

}

function hasUnsavedNewData() {

    const fields = [
        document.getElementById("BuildingID"),
        document.getElementById("RoomCode"),
        document.getElementById("RoomName"),
        document.getElementById("RoomType"),
        document.getElementById("FloorNo"),
        document.getElementById("Capacity"),
        document.getElementById("AreaSqft"),
        document.getElementById("Status"),
        document.getElementById("Description")
    ];

    for (let i = 0; i < fields.length; i++) {

        if (fields[i].value.trim() !== "") {
            return true;
        }

    }

    return false;

}

function setUpdatedFieldsDisabled(disabled) {

    const updatedByField = document.getElementById("UpdatedBy");
    const updatedAtField = document.getElementById("UpdatedAt");

    updatedByField.disabled = disabled;
    updatedAtField.disabled = disabled;

    updatedByField.style.backgroundColor = disabled ? "#e9e9e9" : "";
    updatedByField.style.color = disabled ? "#888" : "";
    updatedByField.style.cursor = disabled ? "not-allowed" : "";

    updatedAtField.style.backgroundColor = disabled ? "#e9e9e9" : "";
    updatedAtField.style.color = disabled ? "#888" : "";
    updatedAtField.style.cursor = disabled ? "not-allowed" : "";

}

function clearForm() {

    document.getElementById("BuildingID").value = "";
    document.getElementById("RoomCode").value = "";
    document.getElementById("RoomName").value = "";
    document.getElementById("RoomType").value = "";
    document.getElementById("FloorNo").value = "";
    document.getElementById("Capacity").value = "";
    document.getElementById("AreaSqft").value = "";
    document.getElementById("Status").value = "";
    document.getElementById("Description").value = "";
    document.getElementById("CreatedBy").value = "";
    document.getElementById("CreatedAt").value = "";
    document.getElementById("UpdatedBy").value = "";
    document.getElementById("UpdatedAt").value = "";

    [
        document.getElementById("BuildingID"),
        document.getElementById("RoomCode"),
        document.getElementById("RoomName"),
        document.getElementById("RoomType"),
        document.getElementById("FloorNo"),
        document.getElementById("Capacity"),
        document.getElementById("Status")
    ].forEach(removeRequiredError);

    document.querySelector(".save-btn").textContent = "Save";

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

function populateForm(room) {

    const roomIdField = document.getElementById("RoomID");

    roomIdField.value = room.room_id;
    document.getElementById("BuildingID").value = room.building_id;
    document.getElementById("RoomCode").value = room.room_code;
    document.getElementById("RoomName").value = room.room_name;
    document.getElementById("RoomType").value = room.room_type;
    document.getElementById("FloorNo").value = room.floor_no;
    document.getElementById("Capacity").value = room.capacity;
    document.getElementById("AreaSqft").value = room.area_sqft;

    setSelectValueCaseInsensitive("Status", room.status);

    document.getElementById("Description").value = room.description;
    document.getElementById("CreatedBy").value = room.created_by;
    document.getElementById("CreatedAt").value = room.created_at;
    document.getElementById("UpdatedBy").value = room.updated_by;
    document.getElementById("UpdatedAt").value = room.updated_at;

    removeRoomIdRequiredError(roomIdField);

    [
        document.getElementById("BuildingID"),
        document.getElementById("RoomCode"),
        document.getElementById("RoomName"),
        document.getElementById("RoomType"),
        document.getElementById("FloorNo"),
        document.getElementById("Capacity"),
        document.getElementById("Status")
    ].forEach(removeRequiredError);

}

async function loadBuildingDropdown() {

    const select = document.getElementById("BuildingID");

    select.innerHTML = '<option value="">Select Building</option>';

    try {

        const buildings = await DatabaseAPI.get("/api/buildings/active");

        buildings.forEach(building => {

            const option = document.createElement("option");

            option.value = building.building_id;
            option.textContent = building.building_name;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load buildings.", "error");

    }

}

async function loadStaffDropdown() {

    const createdBySelect = document.getElementById("CreatedBy");
    const updatedBySelect = document.getElementById("UpdatedBy");

    createdBySelect.innerHTML = '<option value="">Select Staff</option>';
    updatedBySelect.innerHTML = '<option value="">Select Staff</option>';

    try {

        const staff = await DatabaseAPI.get("/api/staff");

        staff.forEach(person => {

            const option1 = document.createElement("option");

            option1.value = person.user_id;
            option1.textContent = person.name;

            createdBySelect.appendChild(option1);

            const option2 = document.createElement("option");

            option2.value = person.user_id;
            option2.textContent = person.name;

            updatedBySelect.appendChild(option2);

        });

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load staff list.", "error");

    }

}

async function loadStatusDropdown() {

    const select = document.getElementById("Status");

    select.innerHTML = '<option value="">--Select--</option>';

    try {

        const result = await DatabaseAPI.get(
            "/api/lookup-values/active?type=room_status"
        );

        if (!result.success) {

            showMessage("Unable to load status options.", "error");
            return;

        }

        result.data.forEach(item => {

            const option = document.createElement("option");

            option.value = item.lookup_value;
            option.textContent = item.lookup_value;

            select.appendChild(option);

        });

    }
    catch (err) {

        console.error(err);
        showMessage("Unable to load status options.", "error");

    }

}

async function loadRoomList() {

    try {

        roomsList = await DatabaseAPI.get("/api/rooms-full");

        if (!Array.isArray(roomsList)) {
            roomsList = [];
        }

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load rooms.", "error");

        roomsList = [];

        return false;

    }

}

async function generateRoomID() {

    try {

        const result = await DatabaseAPI.get("/api/rooms/new-id");

        document.getElementById("RoomID").value = result.room_id;
        document.getElementById("RoomID").readOnly = true;

        setRoomIdGrey(true);

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Room ID.", "error");

    }

}

async function startNewMode() {

    setFieldsDisabled(false);

    setActiveMode("new");

    editMode = false;
    currentIndex = -1;

    const roomIdField = document.getElementById("RoomID");

    removeRoomIdRequiredError(roomIdField);

    clearForm();

    roomIdField.readOnly = true;

    document.querySelector(".save-btn").textContent = "Save";

    await generateRoomID();

    removeRoomIdRequiredError(roomIdField);

    setSelectValueCaseInsensitive("Status", "Active");

    setUpdatedFieldsDisabled(true);

    showMessage("Ready for new room.", "success");

}

function startFindMode() {

    setActiveMode("find");

    editMode = false;
    currentIndex = -1;

    clearForm();

    const roomIdField = document.getElementById("RoomID");

    removeRoomIdRequiredError(roomIdField);

    roomIdField.value = "";
    roomIdField.readOnly = false;
    roomIdField.focus();

    setRoomIdGrey(false);

    document.querySelector(".save-btn").textContent = "Update";

    setFieldsDisabled(true);

    showMessage("Enter Room ID and press Enter.", "info");

}

async function findRoom() {

    const roomIdField = document.getElementById("RoomID");

    const id = roomIdField.value.trim();

    if (id === "") {

        showMessage("Enter Room ID.", "error");

        roomIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/rooms/" + id);

        if (!result.success) {

            clearForm();

            roomIdField.value = id;

            showMessage("Not a valid Room ID.", "error");

            setFieldsDisabled(true);

            roomIdField.focus();

            return;

        }

        setFieldsDisabled(false);

        populateForm(result);

        editMode = true;

        setUpdatedFieldsDisabled(false);

        currentIndex = roomsList.findIndex(
            r => Number(r.room_id) === Number(result.room_id)
        );

        roomIdField.readOnly = true;

        setRoomIdGrey(true);

        document.querySelector(".save-btn").textContent = "Update";

        setActiveMode("find");

        showMessage("Room loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find room.", "error");

    }

}

function showCurrentRoom() {

    if (currentIndex < 0 || currentIndex >= roomsList.length)
        return;

    populateForm(roomsList[currentIndex]);

    editMode = true;

    setUpdatedFieldsDisabled(false);

    document.getElementById("RoomID").readOnly = true;

    setRoomIdGrey(true);

    document.querySelector(".save-btn").textContent = "Update";

    setActiveMode("find");

}

async function previousRecord() {

    if (roomsList.length === 0) {

        showMessage("No room records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        if (hasUnsavedNewData()) {

            const choice = await showSaveConfirmModal(
                "Do you want to save this room before going back?"
            );

            if (choice === "cancel") {
                return;
            }

            if (choice === "yes") {

                const saved = await saveRoom();

                if (!saved) {
                    return;
                }

            }

        }

        currentIndex = roomsList.length - 1;

        showCurrentRoom();

        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already on first record.", "info");

        return;

    }

    currentIndex--;

    showCurrentRoom();

}

function nextRecord() {

    if (roomsList.length === 0) {

        showMessage("No room records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        showMessage("Already on new record.", "info");

        return;

    }

    if (currentIndex >= roomsList.length - 1) {

        showMessage("Already on last record.", "info");

        return;

    }

    currentIndex++;

    showCurrentRoom();

}

async function saveRoom() {

    if (!validateForm())
        return false;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < roomsList.length) {
                populateForm(roomsList[currentIndex]);
            }

            return false;

        }

    }

    const data = {

        room_id: document.getElementById("RoomID").value,
        building_id: document.getElementById("BuildingID").value,
        room_code: document.getElementById("RoomCode").value.trim(),
        room_name: document.getElementById("RoomName").value.trim(),
        room_type: document.getElementById("RoomType").value.trim(),
        floor_no: document.getElementById("FloorNo").value,
        capacity: document.getElementById("Capacity").value,
        area_sqft: document.getElementById("AreaSqft").value,
        status: document.getElementById("Status").value.trim(),
        description: document.getElementById("Description").value.trim(),
        created_by: document.getElementById("CreatedBy").value,
        created_at: document.getElementById("CreatedAt").value,
        updated_by: document.getElementById("UpdatedBy").value,
        updated_at: document.getElementById("UpdatedAt").value

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                "/api/rooms/" + data.room_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post("/api/rooms", data);

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await loadRoomList();

            if (editMode) {

                currentIndex = roomsList.findIndex(
                    r => Number(r.room_id) === Number(data.room_id)
                );

            }
            else {

                await startNewMode();

            }

        }

        return result.success;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to save record.", "error");

        return false;

    }

}

function validateForm() {

    const buildingField = document.getElementById("BuildingID");
    const roomCodeField = document.getElementById("RoomCode");
    const roomNameField = document.getElementById("RoomName");
    const roomTypeField = document.getElementById("RoomType");
    const floorNoField = document.getElementById("FloorNo");
    const capacityField = document.getElementById("Capacity");
    const statusField = document.getElementById("Status");

    if (buildingField.value.trim() === "") {

        showMessage("Select Building", "error");

        showRequiredError(buildingField);

        buildingField.focus();

        return false;

    }

    if (roomCodeField.value.trim() === "") {

        showMessage("Enter Room Code", "error");

        showRequiredError(roomCodeField);

        roomCodeField.focus();

        return false;

    }

    if (roomNameField.value.trim() === "") {

        showMessage("Enter Room Name", "error");

        showRequiredError(roomNameField);

        roomNameField.focus();

        return false;

    }

    if (roomTypeField.value.trim() === "") {

        showMessage("Enter Room Type", "error");

        showRequiredError(roomTypeField);

        roomTypeField.focus();

        return false;

    }

    if (floorNoField.value.trim() === "") {

        showMessage("Enter Floor No.", "error");

        showRequiredError(floorNoField);

        floorNoField.focus();

        return false;

    }

    if (capacityField.value.trim() === "") {

        showMessage("Enter Capacity", "error");

        showRequiredError(capacityField);

        capacityField.focus();

        return false;

    }

    const statusValue = statusField.value.trim();

    if (statusValue === "") {

        showMessage("Select Status", "error");

        showRequiredError(statusField);

        statusField.focus();

        return false;

    }

    return true;

}

const rightSideFields = ["BuildingID", "RoomName", "FloorNo"];

function showRequiredError(field) {

    field.classList.add("field-error");

    const grid = field.closest(".stackinputs");

    if (!grid) return;

    let errorMessage = grid.querySelector(
        ".field-error-message[data-for='" + field.id + "']"
    );

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "field-error-message";
        errorMessage.setAttribute("data-for", field.id);
        errorMessage.textContent = "This field is required";

        if (rightSideFields.includes(field.id)) {
            errorMessage.classList.add("error-right");
        }
        else {
            errorMessage.classList.add("error-left");
        }

        grid.appendChild(errorMessage);

    }

}

function removeRequiredError(field) {

    field.classList.remove("field-error");

    const grid = field.closest(".stackinputs");

    if (!grid) return;

    const errorMessage = grid.querySelector(
        ".field-error-message[data-for='" + field.id + "']"
    );

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showRoomIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".room-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "room-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeRoomIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".room-id-error-message");

    if (errorMessage) {
        errorMessage.remove();
    }

}

function showInfoModal(message) {

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "32px 40px";
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";
    box.style.maxWidth = "420px";
    box.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
    box.style.fontFamily = "inherit";

    const text = document.createElement("p");
    text.textContent = message;
    text.style.marginBottom = "20px";
    text.style.fontSize = "18px";
    text.style.color = "#222";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "10px 32px";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.background = "#5535d6";
    closeBtn.style.color = "#fff";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.cursor = "pointer";

    closeBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    box.appendChild(text);
    box.appendChild(closeBtn);
    overlay.appendChild(box);

    document.body.appendChild(overlay);

}

document.querySelectorAll(".info-icon").forEach(icon => {

    icon.style.cursor = "pointer";

    icon.addEventListener("click", (e) => {

        e.stopPropagation();

        const tooltip = icon.querySelector(".tooltip");

        if (tooltip) {
            showInfoModal(tooltip.textContent.trim());
        }

    });

});