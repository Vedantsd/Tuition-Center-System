let editMode = false;
let buildings = [];
let currentIndex = -1;
let currentMode = "new";
let messageTimer = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadStatusDropdown();
    await loadBuildingList();

    await startNewMode();

    document
        .getElementById("newModeBtn")
        .addEventListener("click", startNewMode);

    document
        .getElementById("findModeBtn")
        .addEventListener("click", startFindMode);

    document
        .querySelector(".save-btn")
        .addEventListener("click", saveBuilding);

    document
        .querySelector(".previous-btn")
        .addEventListener("click", previousRecord);

    document
        .querySelector(".next-btn")
        .addEventListener("click", nextRecord);

    document
        .querySelector(".exit-btn")
        .addEventListener("click", () => {
            window.history.back();
        });

    const requiredFields = [
        document.getElementById("BuildingName"),
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

    const buildingIdField = document.getElementById("BuildingID");

    buildingIdField.addEventListener("blur", function () {

        if (
            currentMode === "find" &&
            !this.readOnly &&
            this.value.trim() === ""
        ) {
            showBuildingIdRequiredError(this);
        }
        else {
            removeBuildingIdRequiredError(this);
        }

    });

    buildingIdField.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            removeBuildingIdRequiredError(this);
        }

    });

    buildingIdField.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && currentMode === "find") {
            findBuilding();
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
        document.getElementById("BuildingName"),
        document.getElementById("NoOfFloors"),
        document.getElementById("Status"),
        document.getElementById("Description")
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
    const prevBtn = document.querySelector(".previous-btn");
    const nextBtn = document.querySelector(".next-btn");

    [saveBtn, prevBtn, nextBtn].forEach(btn => {

        if (btn) {

            btn.disabled = disabled;

            btn.style.opacity = disabled ? "0.5" : "";
            btn.style.cursor = disabled ? "not-allowed" : "";

        }

    });

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
        document.getElementById("BuildingName"),
        document.getElementById("NoOfFloors"),
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

function clearForm() {

    document.getElementById("BuildingName").value = "";
    document.getElementById("NoOfFloors").value = "";
    document.getElementById("Status").value = "";
    document.getElementById("Description").value = "";

    removeRequiredError(document.getElementById("BuildingName"));
    removeRequiredError(document.getElementById("Status"));

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

function populateForm(building) {

    const buildingIdField = document.getElementById("BuildingID");

    buildingIdField.value = building.building_id;
    document.getElementById("BuildingName").value = building.building_name;
    document.getElementById("NoOfFloors").value = building.no_of_floors;

    setSelectValueCaseInsensitive("Status", building.status);

    document.getElementById("Description").value = building.description;

    removeBuildingIdRequiredError(buildingIdField);

    removeRequiredError(document.getElementById("BuildingName"));
    removeRequiredError(document.getElementById("Status"));

}

async function loadStatusDropdown() {

    const select = document.getElementById("Status");

    select.innerHTML = '<option value="">--Select--</option>';

    try {

        const result = await DatabaseAPI.get(
            "/api/lookup-values/active?type=building_status"
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

async function loadBuildingList() {

    try {

        buildings = await DatabaseAPI.get("/api/buildings-full");

        if (!Array.isArray(buildings)) {
            buildings = [];
        }

        return true;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to load buildings.", "error");

        buildings = [];

        return false;

    }

}

async function generateBuildingID() {

    try {

        const result = await DatabaseAPI.get("/api/buildings/new-id");

        document.getElementById("BuildingID").value = result.building_id;

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to generate Building ID.", "error");

    }

}

async function startNewMode() {

    setFieldsDisabled(false);

    setActiveMode("new");

    editMode = false;
    currentIndex = -1;

    const buildingIdField = document.getElementById("BuildingID");

    removeBuildingIdRequiredError(buildingIdField);

    clearForm();

    buildingIdField.readOnly = true;

    document.querySelector(".save-btn").textContent = "Save";

    await generateBuildingID();

    setSelectValueCaseInsensitive("Status", "Active");

    removeBuildingIdRequiredError(buildingIdField);

    showMessage("Ready for new building.", "success");

}

function startFindMode() {

    setActiveMode("find");

    editMode = false;
    currentIndex = -1;

    clearForm();

    const buildingIdField = document.getElementById("BuildingID");

    removeBuildingIdRequiredError(buildingIdField);

    buildingIdField.value = "";
    buildingIdField.readOnly = false;
    buildingIdField.focus();

    document.querySelector(".save-btn").textContent = "Update";

    setFieldsDisabled(true);

    showMessage("Enter Building ID and press Enter.", "info");

}

async function findBuilding() {

    const buildingIdField = document.getElementById("BuildingID");

    const id = buildingIdField.value.trim();

    if (id === "") {

        showMessage("Enter Building ID.", "error");

        buildingIdField.focus();

        return;

    }

    try {

        const result = await DatabaseAPI.get("/api/buildings/" + id);

        if (!result.success) {

            clearForm();

            buildingIdField.value = id;

            showMessage("Not a valid Building ID.", "error");

            setFieldsDisabled(true);

            buildingIdField.focus();

            return;

        }

        setFieldsDisabled(false);

        populateForm(result);

        editMode = true;

        currentIndex = buildings.findIndex(
            b => Number(b.building_id) === Number(result.building_id)
        );

        buildingIdField.readOnly = true;

        document.querySelector(".save-btn").textContent = "Update";

        setActiveMode("find");

        showMessage("Building loaded successfully.", "success");

    }
    catch (err) {

        console.error(err);

        showMessage("Unable to find building.", "error");

    }

}

function showCurrentBuilding() {

    if (currentIndex < 0 || currentIndex >= buildings.length)
        return;

    populateForm(buildings[currentIndex]);

    editMode = true;

    document.getElementById("BuildingID").readOnly = true;

    document.querySelector(".save-btn").textContent = "Update";

    setActiveMode("find");

}

async function previousRecord() {

    if (buildings.length === 0) {

        showMessage("No building records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        if (hasUnsavedNewData()) {

            const choice = await showSaveConfirmModal(
                "Do you want to save this building before going back?"
            );

            if (choice === "cancel") {
                return;
            }

            if (choice === "yes") {

                const saved = await saveBuilding();

                if (!saved) {
                    return;
                }

            }

        }

        currentIndex = buildings.length - 1;

        showCurrentBuilding();

        return;

    }

    if (currentIndex <= 0) {

        showMessage("Already on first record.", "info");

        return;

    }

    currentIndex--;

    showCurrentBuilding();

}

function nextRecord() {

    if (buildings.length === 0) {

        showMessage("No building records found.", "info");

        return;

    }

    if (currentIndex === -1) {

        showMessage("Already on new record.", "info");

        return;

    }

    if (currentIndex >= buildings.length - 1) {

        showMessage("Already on last record.", "info");

        return;

    }

    currentIndex++;

    showCurrentBuilding();

}

async function saveBuilding() {

    if (!validateForm())
        return false;

    if (editMode) {

        const confirmed = await showConfirmModal(
            "Do you want to update the changes?"
        );

        if (!confirmed) {

            if (currentIndex >= 0 && currentIndex < buildings.length) {
                populateForm(buildings[currentIndex]);
            }

            return false;

        }

    }

    const data = {

        building_id: document.getElementById("BuildingID").value,
        building_name: document.getElementById("BuildingName").value.trim(),
        no_of_floors: document.getElementById("NoOfFloors").value,
        status: document.getElementById("Status").value.trim(),
        description: document.getElementById("Description").value.trim()

    };

    try {

        let result;

        if (editMode) {

            result = await DatabaseAPI.put(
                "/api/buildings/" + data.building_id,
                data
            );

        }
        else {

            result = await DatabaseAPI.post("/api/buildings", data);

        }

        showMessage(result.message, result.success ? "success" : "error");

        if (result.success) {

            await loadBuildingList();

            if (editMode) {

                currentIndex = buildings.findIndex(
                    b => Number(b.building_id) === Number(data.building_id)
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

    const nameField = document.getElementById("BuildingName");
    const statusField = document.getElementById("Status");

    if (nameField.value.trim() === "") {

        showMessage("Enter Building Name", "error");

        showRequiredError(nameField);

        nameField.focus();

        return false;

    }

    if (statusField.value.trim() === "") {

        showMessage("Select Status", "error");

        showRequiredError(statusField);

        statusField.focus();

        return false;

    }

    return true;

}

const rightSideFields = ["BuildingName", "Status"];

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

function showBuildingIdRequiredError(field) {

    field.classList.add("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    let errorMessage = group.querySelector(".building-id-error-message");

    if (!errorMessage) {

        errorMessage = document.createElement("span");

        errorMessage.className = "building-id-error-message";
        errorMessage.textContent = "This field is required";

        group.appendChild(errorMessage);

    }

}

function removeBuildingIdRequiredError(field) {

    field.classList.remove("field-error");

    const group = field.closest(".id-find-group");

    if (!group) return;

    const errorMessage = group.querySelector(".building-id-error-message");

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