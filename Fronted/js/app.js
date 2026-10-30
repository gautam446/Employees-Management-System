// ==========================================
// EMPLOYEE MANAGEMENT SYSTEM
// FRONTEND JAVASCRIPT
// ==========================================


// Backend API URL
const API_BASE = "http://127.0.0.1:8000";


// Application State
let accessToken = localStorage.getItem("access_token");
let currentUser = localStorage.getItem("username");
let currentRole = localStorage.getItem("role");

let selectedLoginRole = "user";


// ==========================================
// DOM ELEMENTS
// ==========================================

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const employeeTable = document.getElementById("employeeTable");
const recentEmployeeTable = document.getElementById("recentEmployeeTable");


// ==========================================
// LOGIN ROLE SWITCH
// ==========================================

function switchLogin(role) {

    selectedLoginRole = role;

    document.getElementById("userTab").classList.toggle(
        "active",
        role === "user"
    );

    document.getElementById("adminTab").classList.toggle(
        "active",
        role === "admin"
    );

    loginError.textContent = "";
}


// ==========================================
// LOGIN API
// ==========================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginError.textContent = "";

    if (!username || !password) {

        loginError.textContent = "Please enter username and password.";
        return;
    }

    const formData = new URLSearchParams();

    formData.append("username", username);
    formData.append("password", password);

    try {

        const response = await fetch(`${API_BASE}/auth/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: formData

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail || "Invalid username or password"
            );

        }


        // Check selected login role
        if (data.role !== selectedLoginRole) {

            throw new Error(
                `Please use ${selectedLoginRole} login.`
            );

        }


        // Save Authentication Details
        accessToken = data.access_token;

        currentUser = data.username;

        currentRole = data.role;


        localStorage.setItem("access_token", accessToken);

        localStorage.setItem("username", currentUser);

        localStorage.setItem("role", currentRole);


        // Open Dashboard
        openDashboard();

    }

    catch (error) {

        loginError.textContent = error.message;

    }

});


// ==========================================
// AUTHENTICATED API REQUEST
// ==========================================

async function apiRequest(endpoint, options = {}) {

    const headers = {

        "Authorization": `Bearer ${accessToken}`,

        ...(options.headers || {})

    };


    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    if (response.status === 401) {

        logout();

        throw new Error("Session expired. Please login again.");

    }


    const data = await response.json().catch(() => ({}));


    if (!response.ok) {

        throw new Error(
            data.detail ||
            data.message ||
            "Something went wrong."
        );

    }


    return data;

}


// ==========================================
// OPEN DASHBOARD
// ==========================================

function openDashboard() {

    loginSection.classList.add("hidden");

    dashboardSection.classList.remove("hidden");


    document.getElementById("profileName").textContent = currentUser;

    document.getElementById("profileRole").textContent =
        currentRole.toUpperCase();

    document.getElementById("profileAvatar").textContent =
        currentUser.charAt(0).toUpperCase();

    document.getElementById("dashboardRole").textContent =
        currentRole.toUpperCase();


    // Admin / User Permissions
    applyRolePermissions();


    showPage("dashboard");

    loadDashboard();

}


// ==========================================
// ROLE BASED PERMISSIONS
// ==========================================

function applyRolePermissions() {

    const adminElements = document.querySelectorAll(".admin-only");


    adminElements.forEach(element => {

        if (currentRole === "admin") {

            element.classList.remove("hidden");

        }

        else {

            element.classList.add("hidden");

        }

    });

}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(page) {

    const pages = {

        dashboard: "dashboardPage",

        employees: "employeesPage",

        addEmployee: "addEmployeePage"

    };


    if (!pages[page]) {
        return;
    }


    // Prevent User from opening Admin page
    if (
        page === "addEmployee" &&
        currentRole !== "admin"
    ) {

        alert("Admin access required.");

        return;

    }


    document.querySelectorAll(".page").forEach(element => {

        element.classList.add("hidden");

    });


    document.getElementById(pages[page]).classList.remove("hidden");


    document.querySelectorAll(".menu-btn").forEach(button => {

        button.classList.remove("active");

    });


    const clickedButton = [...document.querySelectorAll(".menu-btn")]
        .find(button => button.getAttribute("onclick")?.includes(page));

    if (clickedButton) {

        clickedButton.classList.add("active");

    }


    const titles = {

        dashboard: "Dashboard",

        employees: "Employees",

        addEmployee: "Add Employee"

    };


    document.getElementById("pageTitle").textContent = titles[page];


    if (page === "employees") {

        loadEmployees();

    }

    if (page === "dashboard") {

        loadDashboard();

    }

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const employees = await apiRequest("/employees/");


        document.getElementById("totalEmployees").textContent =
            employees.length;


        if (employees.length === 0) {

            recentEmployeeTable.innerHTML = `
                <tr>
                    <td colspan="5">No employees found</td>
                </tr>
            `;

            return;

        }


        const recentEmployees = employees.slice(-5).reverse();


        recentEmployeeTable.innerHTML = recentEmployees.map(employee => `

            <tr>

                <td>${employee.id}</td>

                <td>${escapeHTML(employee.name)}</td>

                <td>${escapeHTML(employee.dep)}</td>

                <td>${formatSalary(employee.salary)}</td>

                <td>${employee.age}</td>

            </tr>

        `).join("");


    }

    catch (error) {

        showError(error.message);

    }

}


// ==========================================
// LOAD ALL EMPLOYEES
// ==========================================

async function loadEmployees() {

    employeeTable.innerHTML = `
        <tr>
            <td colspan="6">Loading employees...</td>
        </tr>
    `;


    try {

        const employees = await apiRequest("/employees/");


        renderEmployees(employees);

    }

    catch (error) {

        employeeTable.innerHTML = `
            <tr>
                <td colspan="6">${escapeHTML(error.message)}</td>
            </tr>
        `;

    }

}


// ==========================================
// RENDER EMPLOYEE TABLE
// ==========================================

function renderEmployees(employees) {

    if (!employees || employees.length === 0) {

        employeeTable.innerHTML = `
            <tr>
                <td colspan="6">No employees found.</td>
            </tr>
        `;

        return;

    }


    employeeTable.innerHTML = employees.map(employee => {

        let actionButtons = "";


        if (currentRole === "admin") {

            actionButtons = `

                <td>

                    <div class="action-buttons">

                        <button
                            class="edit-btn"
                            onclick="openUpdateModal(${employee.id})">

                            Edit

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteEmployee(${employee.id})">

                            Delete

                        </button>

                    </div>

                </td>

            `;

        }


        return `

            <tr>

                <td>${employee.id}</td>

                <td>${escapeHTML(employee.name)}</td>

                <td>${escapeHTML(employee.dep)}</td>

                <td>${formatSalary(employee.salary)}</td>

                <td>${employee.age}</td>

                ${actionButtons}

            </tr>

        `;

    }).join("");

}


// ==========================================
// SEARCH EMPLOYEE
// ==========================================

async function searchEmployees() {

    const searchValue = document
        .getElementById("searchInput")
        .value.trim();


    if (!searchValue) {

        loadEmployees();

        return;

    }


    employeeTable.innerHTML = `
        <tr>
            <td colspan="6">Searching...</td>
        </tr>
    `;


    try {

        const employees = await apiRequest(
            `/employees/search/${encodeURIComponent(searchValue)}`
        );


        renderEmployees(employees);

    }

    catch (error) {

        employeeTable.innerHTML = `
            <tr>
                <td colspan="6">${escapeHTML(error.message)}</td>
            </tr>
        `;

    }

}


// ==========================================
// ADD EMPLOYEE
// ==========================================

document.getElementById("addEmployeeForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        if (currentRole !== "admin") {

            alert("Admin access required.");

            return;

        }


        const employee = {

            name: document.getElementById("empName").value.trim(),

            dep: document.getElementById("empDepartment").value.trim(),

            salary: Number(document.getElementById("empSalary").value),

            age: Number(document.getElementById("empAge").value)

        };


        const message = document.getElementById("addEmployeeMessage");


        try {

            const result = await apiRequest("/employees/", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(employee)

            });


            message.textContent = "Employee added successfully!";

            message.className = "message success-message";


            this.reset();


            alert(`Employee ${result.name} added successfully!`);


            loadDashboard();

        }

        catch (error) {

            message.textContent = error.message;

            message.className = "message error-text";

        }

    });


// ==========================================
// OPEN UPDATE MODAL
// ==========================================

async function openUpdateModal(employeeId) {

    if (currentRole !== "admin") {

        alert("Admin access required.");

        return;

    }


    try {

        const employee = await apiRequest(
            `/employees/${employeeId}`
        );


        document.getElementById("updateId").value = employee.id;

        document.getElementById("updateName").value = employee.name;

        document.getElementById("updateDepartment").value = employee.dep;

        document.getElementById("updateSalary").value = employee.salary;

        document.getElementById("updateAge").value = employee.age;


        document.getElementById("updateMessage").textContent = "";


        document.getElementById("updateModal").classList.remove("hidden");

    }

    catch (error) {

        alert(error.message);

    }

}


// ==========================================
// CLOSE UPDATE MODAL
// ==========================================

function closeUpdateModal() {

    document.getElementById("updateModal").classList.add("hidden");

}


// ==========================================
// UPDATE EMPLOYEE
// ==========================================

document.getElementById("updateEmployeeForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        if (currentRole !== "admin") {

            alert("Admin access required.");

            return;

        }


        const employeeId = document.getElementById("updateId").value;


        const employee = {

            name: document.getElementById("updateName").value.trim(),

            dep: document.getElementById("updateDepartment").value.trim(),

            salary: Number(document.getElementById("updateSalary").value),

            age: Number(document.getElementById("updateAge").value)

        };


        const message = document.getElementById("updateMessage");


        try {

            await apiRequest(`/employees/${employeeId}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(employee)

            });


            message.textContent = "Employee updated successfully!";

            message.className = "message success-message";


            await loadEmployees();

            await loadDashboard();


            setTimeout(() => {

                closeUpdateModal();

            }, 700);

        }

        catch (error) {

            message.textContent = error.message;

            message.className = "message error-text";

        }

    });


// ==========================================
// DELETE EMPLOYEE
// ==========================================

async function deleteEmployee(employeeId) {

    if (currentRole !== "admin") {

        alert("Admin access required.");

        return;

    }


    const confirmDelete = confirm(
        "Are you sure you want to delete this employee?"
    );


    if (!confirmDelete) {
        return;
    }


    try {

        await apiRequest(`/employees/${employeeId}`, {

            method: "DELETE"

        });


        alert("Employee deleted successfully!");


        await loadEmployees();

        await loadDashboard();

    }

    catch (error) {

        alert(error.message);

    }

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem("access_token");

    localStorage.removeItem("username");

    localStorage.removeItem("role");


    accessToken = null;

    currentUser = null;

    currentRole = null;


    dashboardSection.classList.add("hidden");

    loginSection.classList.remove("hidden");


    loginForm.reset();

    loginError.textContent = "";

    switchLogin("user");

}


// ==========================================
// SECURITY / HELPER FUNCTIONS
// ==========================================

// Escape HTML to prevent employee data from being
// interpreted as HTML markup.

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const entities = {

            "&": "&amp;",

            "<": "&lt;",

            ">": "&gt;",

            '"': "&quot;",

            "'": "&#39;"

        };

        return entities[character];

    });

}


// Format salary
function formatSalary(value) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 2

    }).format(value);

}


// Show general error
function showError(message) {

    alert(message);

}


// ==========================================
// AUTO LOGIN SESSION
// ==========================================

async function checkLoginSession() {

    if (accessToken && currentUser && currentRole) {

        try {

            // Verify token by requesting protected endpoint
            await apiRequest("/employees/");

            openDashboard();

        }

        catch (error) {

            logout();

        }

    }

    else {

        logout();

    }

}


// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    checkLoginSession();

});