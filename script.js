// script.js - Clean Blood Donation Website JavaScript

// User data storage
let users = JSON.parse(localStorage.getItem('bloodDonationUsers')) || [];
let bloodBanks = JSON.parse(localStorage.getItem('bloodBanks')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Valid hospital codes
const validHospitalCodes = [
    '08230101', '08230102', '08230103', '08230104', '08230105'
];

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing app');
    
    // Clear any problematic user data on homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (storedUser && (!storedUser.id || !storedUser.type)) {
            console.log('Clearing invalid user data');
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
    }
    
    initializeEventListeners();
    checkUserLoginStatus();
    updateTime();
    setInterval(updateTime, 1000);
    
    // Check if we need to redirect to login (if on protected page without auth)
    const protectedPages = ['dashboard.html', 'bdashboard.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !currentUser) {
        console.log('Not logged in, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize dashboard if we're on dashboard page
    if (document.querySelector('.dashboard-section')) {
        initDashboard();
    }
    
    // Initialize hospital staff dashboard if we're on bdashboard page
    if (document.querySelector('.dashboard-container')) {
        initBDashboard();
    }
    
    // Initialize blood request form if we're on request page
    if (document.getElementById('bloodRequestForm')) {
        initBloodRequestForm();
    }
    
    // Initialize success stories slider if we're on success-stories page
    if (document.querySelector('.story-slider')) {
        initSuccessStoriesSlider();
    }
    
    // Initialize top donors page if we're on topdonors page
    if (document.querySelector('.top-donors-header')) {
        initTopDonorsPage();
    }
});

// Initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners');
    
    // Modal buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const donateNowBtn = document.getElementById('donateNowBtn');
    const appointmentLink = document.getElementById('appointmentLink');
    
    // Add event listeners if elements exist
    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('loginModal'));
        console.log('Login button listener added');
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            openModal('registerModal');
            updateHospitalRegistrationForm();
        });
        console.log('Register button listener added');
    }
    
    if (donateNowBtn) donateNowBtn.addEventListener('click', handleDonateNow);
    if (appointmentLink) appointmentLink.addEventListener('click', handleAppointment);

    // Modal close buttons
    const closeLogin = document.getElementById('closeLogin');
    const closeRegister = document.getElementById('closeRegister');
    const closeForgot = document.getElementById('closeForgot');
    
    if (closeLogin) closeLogin.addEventListener('click', () => closeModal('loginModal'));
    if (closeRegister) closeRegister.addEventListener('click', () => closeModal('registerModal'));
    if (closeForgot) closeForgot.addEventListener('click', () => closeModal('forgotModal'));
    
    // Modal links
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const createAccountLink = document.getElementById('createAccountLink');
    const backToLogin = document.getElementById('backToLogin');
    const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');
    
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', () => {
        closeModal('loginModal');
        openModal('forgotModal');
    });
    
    if (createAccountLink) createAccountLink.addEventListener('click', () => {
        closeModal('loginModal');
        openModal('registerModal');
        updateHospitalRegistrationForm();
    });
    
    if (backToLogin) backToLogin.addEventListener('click', () => {
        closeModal('registerModal');
        openModal('loginModal');
    });
    
    if (backToLoginFromForgot) backToLoginFromForgot.addEventListener('click', () => {
        closeModal('forgotModal');
        openModal('loginModal');
    });
    
    // Forms
    const loginForm = document.getElementById('loginForm');
    const donorRegisterForm = document.getElementById('donorRegisterForm');
    const bankRegisterForm = document.getElementById('bankRegisterForm');
    const forgotForm = document.getElementById('forgotForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (donorRegisterForm) donorRegisterForm.addEventListener('submit', handleDonorRegister);
    if (bankRegisterForm) bankRegisterForm.addEventListener('submit', handleBankRegister);
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);

    // Other buttons
    const dashboardBtn = document.getElementById('dashboardBtn');
    const donorTypeBtn = document.getElementById('donorTypeBtn');
    const bankTypeBtn = document.getElementById('bankTypeBtn');

    if (dashboardBtn) dashboardBtn.addEventListener('click', goToDashboard);

    // User type selector
    if (donorTypeBtn && bankTypeBtn) {
        donorTypeBtn.addEventListener('click', () => {
            donorTypeBtn.classList.add('active');
            bankTypeBtn.classList.remove('active');
            document.getElementById('donorRegisterForm').style.display = 'block';
            document.getElementById('bankRegisterForm').style.display = 'none';
        });

        bankTypeBtn.addEventListener('click', () => {
            bankTypeBtn.classList.add('active');
            donorTypeBtn.classList.remove('active');
            document.getElementById('bankRegisterForm').style.display = 'block';
            document.getElementById('donorRegisterForm').style.display = 'none';
            updateHospitalRegistrationForm();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('loginModal')) closeModal('loginModal');
        if (e.target === document.getElementById('registerModal')) closeModal('registerModal');
        if (e.target === document.getElementById('forgotModal')) closeModal('forgotModal');
    });

    // Set max date for date of birth (must be at least 18 years old)
    const dobInput = document.getElementById('dateOfBirth');
    if (dobInput) {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
}

// Check user login status and update UI
function checkUserLoginStatus() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    console.log('Checking login status:', currentUser);

    if (currentUser && currentUser.id && currentUser.type) {
        // User is properly logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        
        if (userAvatar && userName) {
            const initials = currentUser.firstName ? 
                (currentUser.firstName.charAt(0) + (currentUser.lastName ? currentUser.lastName.charAt(0) : '')).toUpperCase() : 
                'US';
            userAvatar.textContent = initials;
            userName.textContent = currentUser.firstName ? currentUser.firstName + ' ' + (currentUser.lastName || '') : 'User';
        }
    } else {
        // No user or invalid user data - show login/register buttons
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        
        // Clear any invalid user data
        if (currentUser) {
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Form Handlers
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    // Check if user exists in donors
    let user = users.find(u => (u.email === email || u.phone === email) && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showAlert('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        return;
    }
    
    // Check if user exists in blood banks (by email, phone, or bank code)
    user = bloodBanks.find(b => 
        (b.email === email || b.phone === email || b.bankCode === email) && 
        b.password === password
    );
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showAlert('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'bdashboard.html';
        }, 1000);
        return;
    }
    
    showAlert('Invalid email/phone/code or password. Please try again.', 'error');
}

function handleDonorRegister(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !dateOfBirth) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showAlert('You must agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showAlert('An account with this email already exists', 'error');
        return;
    }
    
    if (users.find(u => u.phone === phone)) {
        showAlert('An account with this phone number already exists', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        type: 'donor',
        firstName,
        lastName,
        email,
        phone,
        password,
        dateOfBirth,
        joinDate: new Date().toISOString(),
        bloodType: '',
        donations: [],
        appointments: []
    };
    
    users.push(newUser);
    localStorage.setItem('bloodDonationUsers', JSON.stringify(users));
    
    const registerSuccess = document.getElementById('registerSuccess');
    if (registerSuccess) {
        registerSuccess.style.display = 'block';
        registerSuccess.innerHTML = `<i class="fas fa-check-circle"></i><span>Account created successfully! You can now login.</span>`;
    }
    
    document.getElementById('donorRegisterForm').reset();
    
    setTimeout(() => {
        closeModal('registerModal');
        openModal('loginModal');
        if (registerSuccess) registerSuccess.style.display = 'none';
    }, 3000);
}

function handleBankRegister(e) {
    e.preventDefault();
    const bankCode = document.getElementById('bankCode').value;
    const email = document.getElementById('bankEmail').value;
    const phone = document.getElementById('bankPhone').value;
    const password = document.getElementById('bankPassword').value;
    const confirmPassword = document.getElementById('bankConfirmPassword').value;
    const agreeTerms = document.getElementById('bankAgreeTerms').checked;
    
    // Validate hospital code
    if (!validHospitalCodes.includes(bankCode)) {
        showAlert('Invalid hospital code. Please check with your administrator.', 'error');
        return;
    }
    
    if (isHospitalCodeRegistered(bankCode)) {
        showAlert('This hospital code is already registered. Please contact administrator.', 'error');
        return;
    }
    
    if (!isHospitalRegistrationAvailable()) {
        showAlert('Hospital staff registration is full. Maximum 5 accounts allowed.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showAlert('You must agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    const newBank = {
        id: Date.now().toString(),
        type: 'bloodBank',
        bankCode,
        email,
        phone,
        password,
        joinDate: new Date().toISOString(),
        appointments: [],
        donors: []
    };
    
    bloodBanks.push(newBank);
    localStorage.setItem('bloodBanks', JSON.stringify(bloodBanks));
    
    const registerSuccess = document.getElementById('registerSuccess');
    if (registerSuccess) {
        registerSuccess.style.display = 'block';
        registerSuccess.innerHTML = `<i class="fas fa-check-circle"></i><span>Hospital staff account registered successfully! You can now login.</span>`;
    }
    
    document.getElementById('bankRegisterForm').reset();
    
    setTimeout(() => {
        currentUser = newBank;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        closeModal('registerModal');
        window.location.href = 'bdashboard.html';
    }, 3000);
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        showAlert('Please enter your email address', 'error');
        return;
    }
    
    let userExists = users.find(u => u.email === email);
    
    if (!userExists) {
        userExists = bloodBanks.find(b => b.email === email);
    }
    
    if (userExists) {
        const forgotSuccess = document.getElementById('forgotSuccess');
        if (forgotSuccess) {
            forgotSuccess.style.display = 'block';
            setTimeout(() => {
                closeModal('forgotModal');
                openModal('loginModal');
                forgotSuccess.style.display = 'none';
            }, 3000);
        }
    } else {
        showAlert('No account found with this email address.', 'error');
    }
}

// Handle "Book an appointment today" button
function handleAppointment() {
    if (currentUser) {
        window.location.href = 'dashboard.html';
    } else {
        localStorage.setItem('redirectToDashboard', 'true');
        openModal('loginModal');
    }
}

// Handle "Donate Now" button
function handleDonateNow() {
    if (currentUser) {
        window.location.href = 'dashboard.html';
    } else {
        openModal('loginModal');
    }
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// Check if hospital code is already registered
function isHospitalCodeRegistered(code) {
    return bloodBanks.some(bank => bank.bankCode === code);
}

// Check if hospital registration is available
function isHospitalRegistrationAvailable() {
    return bloodBanks.length < 5;
}

// Update hospital registration form based on availability
function updateHospitalRegistrationForm() {
    const limitMessage = document.getElementById('limitMessage');
    const bankRegisterBtn = document.getElementById('bankRegisterBtn');
    
    if (!limitMessage || !bankRegisterBtn) return;
    
    const isAvailable = isHospitalRegistrationAvailable();
    
    if (!isAvailable) {
        limitMessage.style.display = 'block';
        bankRegisterBtn.disabled = true;
        bankRegisterBtn.style.backgroundColor = '#6c757d';
        bankRegisterBtn.style.cursor = 'not-allowed';
        bankRegisterBtn.textContent = 'Registration Full';
    } else {
        limitMessage.style.display = 'none';
        bankRegisterBtn.disabled = false;
        bankRegisterBtn.style.backgroundColor = '#c8102e';
        bankRegisterBtn.style.cursor = 'pointer';
        bankRegisterBtn.textContent = 'Register Hospital Staff';
    }
}

// Function to update the time display
function updateTime() {
    const timeTooltip = document.getElementById('timeTooltip');
    if (!timeTooltip) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const timeString = now.toLocaleDateString('en-US', options);
    timeTooltip.innerHTML = 
        `Hospital Hours: 9:00 AM - 4:00 PM<br>
         Open Monday to Saturday (9:00 AM - 11 AM)<br>
         Current Time: ${timeString}`;
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    alert(message);
}

// ==================== DASHBOARD FUNCTIONALITY ====================

function initDashboard() {
    console.log('Initializing dashboard...');
    
    // Check if user is logged in
    if (!currentUser) {
        console.log('No user logged in, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }
    
    // Validate user data
    if (!currentUser.id || !currentUser.type) {
        console.log('Invalid user data, clearing and redirecting');
        localStorage.removeItem('currentUser');
        currentUser = null;
        window.location.href = 'index.html';
        return;
    }
    
    console.log('User validated:', currentUser);
    
    // Load user data
    loadUserData();
    
    // Initialize dashboard event listeners
    initDashboardEventListeners();
    
    // Load dashboard data
    loadDashboardData();
}

function loadUserData() {
    if (!currentUser) return;
    
    console.log('Loading user data:', currentUser);
    
    // Update welcome message
    const welcomeTitle = document.getElementById('welcomeTitle');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome, ${currentUser.firstName || 'Donor'}!`;
    }
    
    if (userDisplayName) {
        userDisplayName.textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Donor';
    }
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || 'No email provided';
    }
    
    if (userAvatar) {
        const initials = (currentUser.firstName ? currentUser.firstName.charAt(0) : 'D') + 
                        (currentUser.lastName ? currentUser.lastName.charAt(0) : '');
        userAvatar.textContent = initials || 'D';
    }
    
    // Pre-fill personal information form
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const bloodTypeSelect = document.getElementById('bloodType');
    const addressInput = document.getElementById('address');
    
    if (fullNameInput) {
        fullNameInput.value = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    }
    
    if (emailInput) {
        emailInput.value = currentUser.email || '';
    }
    
    if (phoneInput) {
        phoneInput.value = currentUser.phone || '';
    }
    
    if (bloodTypeSelect && currentUser.bloodType) {
        bloodTypeSelect.value = currentUser.bloodType;
    }
    
    if (addressInput && currentUser.address) {
        addressInput.value = currentUser.address || '';
    }
}

function initDashboardEventListeners() {
    console.log('Initializing dashboard event listeners...');
    
    // Enhanced logout button handling
    const logoutSelectors = [
        '#logoutBtn',
        '#logoutBtn2', 
        '.logout-btn',
        '.logout',
        '[onclick*="logout"]',
        '[href*="logout"]'
    ];
    
    let logoutButtonFound = false;
    
    logoutSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            console.log('Found logout element:', selector);
            // Remove any existing listeners and add new one
            element.removeEventListener('click', handleLogout);
            element.addEventListener('click', handleLogout);
            logoutButtonFound = true;
        });
    });
    
    // Fallback: search by text content
    if (!logoutButtonFound) {
        const allButtons = document.querySelectorAll('button, a');
        allButtons.forEach(element => {
            if (element.textContent && element.textContent.toLowerCase().includes('logout') || 
                element.textContent.toLowerCase().includes('sign out')) {
                console.log('Found logout button by text content:', element.textContent);
                element.removeEventListener('click', handleLogout);
                element.addEventListener('click', handleLogout);
                logoutButtonFound = true;
            }
        });
    }
    
    if (!logoutButtonFound) {
        console.error('No logout button found!');
        // Create emergency logout button
        const emergencyLogoutBtn = document.createElement('button');
        emergencyLogoutBtn.textContent = 'Emergency Logout';
        emergencyLogoutBtn.style.position = 'fixed';
        emergencyLogoutBtn.style.top = '10px';
        emergencyLogoutBtn.style.right = '10px';
        emergencyLogoutBtn.style.zIndex = '9999';
        emergencyLogoutBtn.style.background = '#dc3545';
        emergencyLogoutBtn.style.color = 'white';
        emergencyLogoutBtn.style.padding = '5px 10px';
        emergencyLogoutBtn.style.border = 'none';
        emergencyLogoutBtn.style.borderRadius = '3px';
        emergencyLogoutBtn.addEventListener('click', handleLogout);
        document.body.appendChild(emergencyLogoutBtn);
    }

    // User profile dropdown
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (userProfile && !userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }
    
    // Personal info form
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', handlePersonalInfoUpdate);
    }
    
    // Schedule form
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleDonation);
    }
    
    // Set minimum date for donation scheduling (tomorrow)
    const donationDateInput = document.getElementById('donationDate');
    if (donationDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        donationDateInput.min = tomorrow.toISOString().split('T')[0];
    }
    
    // Account management buttons
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => openModal('changePasswordModal'));
    }
    
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', () => openModal('deactivateModal'));
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => openModal('deleteModal'));
    }
    
    // Modal close buttons for dashboard modals
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Cancel buttons
    const cancelDeactivate = document.getElementById('cancelDeactivate');
    const cancelDelete = document.getElementById('cancelDelete');
    
    if (cancelDeactivate) {
        cancelDeactivate.addEventListener('click', () => closeModal('deactivateModal'));
    }
    
    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => closeModal('deleteModal'));
    }
    
    // Confirm actions
    const confirmDeactivate = document.getElementById('confirmDeactivate');
    const confirmDelete = document.getElementById('confirmDelete');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    if (confirmDeactivate) {
        confirmDeactivate.addEventListener('click', handleDeactivateAccount);
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', handleDeleteAccount);
    }
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// SIMPLE LOGOUT FUNCTION - FIXED
function handleLogout(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('Logout function called');
    
    // Clear user data
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    console.log('User logged out, redirecting to index.html');
    
    // Force redirect to index.html
    window.location.href = 'index.html';
}

function handlePersonalInfoUpdate(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const bloodType = document.getElementById('bloodType').value;
    
    // Update current user data
    if (currentUser) {
        // Split full name into first and last name
        const nameParts = fullName.split(' ');
        currentUser.firstName = nameParts[0] || '';
        currentUser.lastName = nameParts.slice(1).join(' ') || '';
        currentUser.email = email;
        currentUser.phone = phone;
        currentUser.address = address;
        currentUser.bloodType = bloodType;
        
        // Update in users array
        const users = JSON.parse(localStorage.getItem('bloodDonationUsers')) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('bloodDonationUsers', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // Show success message
        const successMessage = document.getElementById('personalInfoSuccess');
        if (successMessage) {
            successMessage.style.display = 'flex';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
        
        // Update displayed user info
        loadUserData();
    }
}

function handleScheduleDonation(e) {
    e.preventDefault();
    
    const donationDate = document.getElementById('donationDate').value;
    const donationTime = document.getElementById('donationTime').value;
    const bloodAmount = document.getElementById('bloodAmount').value;
    
    if (!currentUser) return;
    
    // Create appointment
    const appointment = {
        id: 'apt_' + Date.now(),
        donorId: currentUser.id,
        donorName: `${currentUser.firstName} ${currentUser.lastName}`,
        donorEmail: currentUser.email,
        donorPhone: currentUser.phone,
        donorBloodType: currentUser.bloodType,
        date: donationDate,
        time: donationTime,
        amount: bloodAmount + ' ml',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Save to appointments
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    appointments.push(appointment);
    localStorage.setItem('bloodDonationAppointments', JSON.stringify(appointments));
    
    // Add to user's appointments if exists
    if (!currentUser.appointments) {
        currentUser.appointments = [];
    }
    currentUser.appointments.push(appointment.id);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Show success message
    const successMessage = document.getElementById('scheduleSuccess');
    if (successMessage) {
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }
    
    // Reset form
    document.getElementById('scheduleForm').reset();
    
    // Reload dashboard data to show new appointment
    loadDashboardData();
}

function loadDashboardData() {
    loadAppointments();
    loadDonationHistory();
    loadNotifications();
}

function loadAppointments() {
    const container = document.getElementById('appointmentStatusContainer');
    const noAppointmentMessage = document.getElementById('noAppointmentMessage');
    
    if (!container) return;
    
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    const userAppointments = appointments.filter(apt => apt.donorId === currentUser.id);
    
    if (userAppointments.length === 0) {
        if (noAppointmentMessage) noAppointmentMessage.style.display = 'block';
        return;
    }
    
    if (noAppointmentMessage) noAppointmentMessage.style.display = 'none';
    
    // Clear existing content except the no appointment message
    const existingAppointments = container.querySelectorAll('.appointment-item');
    existingAppointments.forEach(item => item.remove());
    
    // Add appointments
    userAppointments.forEach(apt => {
        const appointmentElement = document.createElement('div');
        appointmentElement.className = 'appointment-item';
        appointmentElement.innerHTML = `
            <div class="appointment-info">
                <div class="appointment-date">${apt.date} at ${apt.time}</div>
                <div class="appointment-amount">${apt.amount}</div>
            </div>
            <div class="appointment-status status-${apt.status}">${apt.status}</div>
        `;
        container.appendChild(appointmentElement);
    });
}

function loadDonationHistory() {
    const container = document.getElementById('donationHistoryContainer');
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    
    if (!container) return;
    
    // For now, we'll show a sample history
    // In a real app, this would come from the database
    const sampleHistory = [
        { date: '2025-01-15', amount: '450 ml', location: 'Samtse Hospital' },
        { date: '2024-11-20', amount: '450 ml', location: 'Samtse Hospital' }
    ];
    
    if (sampleHistory.length === 0) {
        if (noHistoryMessage) noHistoryMessage.style.display = 'block';
        return;
    }
    
    if (noHistoryMessage) noHistoryMessage.style.display = 'none';
    
    // Clear existing content
    const existingHistory = container.querySelectorAll('.history-item');
    existingHistory.forEach(item => item.remove());
    
    // Add history items
    sampleHistory.forEach(history => {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-item';
        historyElement.innerHTML = `
            <div class="history-date">${history.date}</div>
            <div class="history-details">
                <div class="history-amount">${history.amount}</div>
                <div class="history-location">${history.location}</div>
            </div>
        `;
        container.appendChild(historyElement);
    });
}

// ==================== NOTIFICATION SYSTEM ====================

// Function to send notification to donor
function sendDonationScheduleNotification(donorContact, scheduleData) {
    const notifications = JSON.parse(localStorage.getItem('bloodDonationNotifications')) || [];
    
    const notification = {
        id: 'notif_' + Date.now(),
        donorContact: donorContact,
        type: 'donation_schedule',
        title: 'Blood Donation Scheduled',
        message: `You have been scheduled for blood donation on ${scheduleData.date} at ${scheduleData.time}. Hospital: ${scheduleData.hospital}`,
        scheduleData: {
            date: scheduleData.date,
            time: scheduleData.time,
            hospital: scheduleData.hospital,
            requestId: scheduleData.requestId,
            message: scheduleData.message
        },
        status: 'pending', // pending, accepted, rejected
        createdAt: new Date().toISOString(),
        isRead: false
    };
    
    notifications.push(notification);
    localStorage.setItem('bloodDonationNotifications', JSON.stringify(notifications));
    
    console.log('Notification sent to donor:', donorContact);
    return notification.id;
}

// Function to get donor notifications
function getDonorNotifications(donorContact) {
    const notifications = JSON.parse(localStorage.getItem('bloodDonationNotifications')) || [];
    return notifications.filter(notif => 
        notif.donorContact === donorContact && notif.type === 'donation_schedule'
    );
}

// Function to update notification status
function updateNotificationStatus(notificationId, status) {
    const notifications = JSON.parse(localStorage.getItem('bloodDonationNotifications')) || [];
    const notificationIndex = notifications.findIndex(notif => notif.id === notificationId);
    
    if (notificationIndex !== -1) {
        notifications[notificationIndex].status = status;
        notifications[notificationIndex].respondedAt = new Date().toISOString();
        localStorage.setItem('bloodDonationNotifications', JSON.stringify(notifications));
        return true;
    }
    return false;
}

function loadNotifications() {
    const container = document.getElementById('notificationsContainer');
    const noNotificationsMessage = document.getElementById('noNotificationsMessage');
    const notificationBadge = document.getElementById('notificationBadge');
    
    if (!container || !currentUser) return;
    
    // Get notifications for current user
    const donorContact = currentUser.email || currentUser.phone;
    const notifications = getDonorNotifications(donorContact);
    
    // Filter for unresponded notifications
    const pendingNotifications = notifications.filter(notif => notif.status === 'pending');
    
    if (notifications.length === 0) {
        if (noNotificationsMessage) noNotificationsMessage.style.display = 'block';
        if (notificationBadge) notificationBadge.style.display = 'none';
        return;
    }
    
    if (noNotificationsMessage) noNotificationsMessage.style.display = 'none';
    
    // Update badge with pending notifications count
    if (notificationBadge) {
        notificationBadge.textContent = pendingNotifications.length;
        notificationBadge.style.display = pendingNotifications.length > 0 ? 'flex' : 'none';
    }
    
    // Clear existing content
    const existingNotifications = container.querySelectorAll('.notification-item');
    existingNotifications.forEach(item => item.remove());
    
    // Add notifications (show most recent first)
    notifications.reverse().forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.type} ${notification.status}`;
        notificationElement.setAttribute('data-notification-id', notification.id);
        
        let statusBadge = '';
        let actionButtons = '';
        
        if (notification.status === 'pending') {
            statusBadge = '<span class="notification-status pending">Pending Response</span>';
            actionButtons = `
                <div class="notification-actions">
                    <button class="btn btn-small btn-success" onclick="acceptDonationSchedule('${notification.id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn btn-small btn-danger" onclick="rejectDonationSchedule('${notification.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
        } else if (notification.status === 'accepted') {
            statusBadge = '<span class="notification-status accepted">Accepted</span>';
        } else if (notification.status === 'rejected') {
            statusBadge = '<span class="notification-status rejected">Rejected</span>';
        }
        
        notificationElement.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${notification.title}</div>
                ${statusBadge}
            </div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-details">
                <div class="notification-date">${new Date(notification.createdAt).toLocaleDateString()}</div>
                ${notification.scheduleData && notification.scheduleData.message ? 
                    `<div class="notification-note"><strong>Note:</strong> ${notification.scheduleData.message}</div>` : ''}
            </div>
            ${actionButtons}
        `;
        container.appendChild(notificationElement);
    });
}

// ==================== DONOR RESPONSE FUNCTIONS ====================

function acceptDonationSchedule(notificationId) {
    if (confirm('Are you sure you want to accept this donation schedule?')) {
        const success = updateNotificationStatus(notificationId, 'accepted');
        
        if (success) {
            // Update corresponding blood request status
            updateBloodRequestStatusFromNotification(notificationId, 'accepted');
            
            showAlert('Thank you for accepting the donation schedule!', 'success');
            loadNotifications(); // Reload notifications
            loadDashboardData(); // Reload dashboard data
        } else {
            showAlert('Error updating notification status.', 'error');
        }
    }
}

function rejectDonationSchedule(notificationId) {
    if (confirm('Are you sure you want to reject this donation schedule?')) {
        const success = updateNotificationStatus(notificationId, 'rejected');
        
        if (success) {
            // Update corresponding blood request status
            updateBloodRequestStatusFromNotification(notificationId, 'rejected');
            
            showAlert('You have rejected the donation schedule.', 'info');
            loadNotifications(); // Reload notifications
            loadDashboardData(); // Reload dashboard data
        } else {
            showAlert('Error updating notification status.', 'error');
        }
    }
}

function updateBloodRequestStatusFromNotification(notificationId, response) {
    const notifications = JSON.parse(localStorage.getItem('bloodDonationNotifications')) || [];
    const notification = notifications.find(notif => notif.id === notificationId);
    
    if (!notification || !notification.scheduleData) return;
    
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
    const requestIndex = bloodRequests.findIndex(req => req.id === notification.scheduleData.requestId);
    
    if (requestIndex !== -1) {
        if (response === 'accepted') {
            bloodRequests[requestIndex].status = 'accepted';
            bloodRequests[requestIndex].donorResponse = 'accepted';
            bloodRequests[requestIndex].responseDate = new Date().toISOString();
        } else if (response === 'rejected') {
            bloodRequests[requestIndex].status = 'pending'; // Back to pending so staff can schedule another donor
            bloodRequests[requestIndex].scheduledDonor = '';
            bloodRequests[requestIndex].scheduledDonorContact = '';
            bloodRequests[requestIndex].scheduledDate = '';
            bloodRequests[requestIndex].scheduledTime = '';
            bloodRequests[requestIndex].donorResponse = 'rejected';
            bloodRequests[requestIndex].responseDate = new Date().toISOString();
        }
        
        localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));
    }
}

function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showAlert('New passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('New password must be at least 6 characters long', 'error');
        return;
    }
    
    // In a real app, you would verify current password with the server
    // For this demo, we'll assume it's correct
    
    // Update password
    if (currentUser) {
        currentUser.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update in users array
        const users = JSON.parse(localStorage.getItem('bloodDonationUsers')) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            localStorage.setItem('bloodDonationUsers', JSON.stringify(users));
        }
        
        showAlert('Password updated successfully!', 'success');
        closeModal('changePasswordModal');
        document.getElementById('changePasswordForm').reset();
    }
}

function handleDeactivateAccount() {
    if (currentUser) {
        currentUser.status = 'inactive';
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showAlert('Account deactivated successfully. You can reactivate by logging in again.', 'success');
        closeModal('deactivateModal');
        
        // Log out after deactivation
        setTimeout(() => {
            handleLogout();
        }, 2000);
    }
}

function handleDeleteAccount() {
    if (currentUser) {
        // Remove user from users array
        const users = JSON.parse(localStorage.getItem('bloodDonationUsers')) || [];
        const updatedUsers = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('bloodDonationUsers', JSON.stringify(updatedUsers));
        
        // Remove current user
        localStorage.removeItem('currentUser');
        currentUser = null;
        
        showAlert('Account deleted successfully.', 'success');
        closeModal('deleteModal');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// ==================== HOSPITAL STAFF DASHBOARD FUNCTIONALITY ====================

function initBDashboard() {
    console.log('Initializing hospital staff dashboard...');
    
    // Check if user is logged in and is hospital staff
    if (!currentUser || currentUser.type !== 'bloodBank') {
        console.log('No hospital staff logged in, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }
    
    // Validate hospital staff data
    if (!currentUser.id || !currentUser.bankCode) {
        console.log('Invalid hospital staff data, clearing and redirecting');
        localStorage.removeItem('currentUser');
        currentUser = null;
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Hospital staff validated:', currentUser);
    
    // Load hospital staff data
    loadHospitalStaffData();
    
    // Initialize hospital dashboard event listeners
    initBDashboardEventListeners();
    
    // Load dashboard data
    loadBDashboardData();
    
    // Show main dashboard by default
    showMainDashboard();
}

function loadHospitalStaffData() {
    if (!currentUser) return;
    
    console.log('Loading hospital staff data:', currentUser);
    
    // Update user info in both sections
    const userAvatars = document.querySelectorAll('#userAvatar, #userAvatar2');
    const userNames = document.querySelectorAll('#userName, #userName2');
    const hospitalCodes = document.querySelectorAll('#hospitalCode, #hospitalCode2');
    
    userAvatars.forEach(avatar => {
        avatar.textContent = 'HS';
    });
    
    userNames.forEach(name => {
        name.textContent = 'Hospital Staff';
    });
    
    hospitalCodes.forEach(code => {
        code.textContent = `Code: ${currentUser.bankCode || 'N/A'}`;
    });
}

function initBDashboardEventListeners() {
    console.log('Initializing hospital dashboard event listeners...');
    
    // Enhanced logout button handling for hospital dashboard
    const logoutSelectors = [
        '#logoutBtn',
        '#logoutBtn2', 
        '.logout-btn',
        '.logout',
        '[onclick*="logout"]',
        '[href*="logout"]'
    ];
    
    let logoutButtonFound = false;
    
    logoutSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            console.log('Found hospital logout element:', selector);
            element.removeEventListener('click', handleLogout);
            element.addEventListener('click', handleLogout);
            logoutButtonFound = true;
        });
    });
    
    // Fallback: search by text content
    if (!logoutButtonFound) {
        const allButtons = document.querySelectorAll('button, a');
        allButtons.forEach(element => {
            if (element.textContent && element.textContent.toLowerCase().includes('logout') || 
                element.textContent.toLowerCase().includes('sign out')) {
                console.log('Found hospital logout button by text content:', element.textContent);
                element.removeEventListener('click', handleLogout);
                element.addEventListener('click', handleLogout);
                logoutButtonFound = true;
            }
        });
    }
    
    if (!logoutButtonFound) {
        console.error('No hospital logout button found!');
        // Create emergency logout button
        const emergencyLogoutBtn = document.createElement('button');
        emergencyLogoutBtn.textContent = 'Emergency Logout';
        emergencyLogoutBtn.style.position = 'fixed';
        emergencyLogoutBtn.style.top = '10px';
        emergencyLogoutBtn.style.right = '10px';
        emergencyLogoutBtn.style.zIndex = '9999';
        emergencyLogoutBtn.style.background = '#dc3545';
        emergencyLogoutBtn.style.color = 'white';
        emergencyLogoutBtn.style.padding = '5px 10px';
        emergencyLogoutBtn.style.border = 'none';
        emergencyLogoutBtn.style.borderRadius = '3px';
        emergencyLogoutBtn.addEventListener('click', handleLogout);
        document.body.appendChild(emergencyLogoutBtn);
    }
    
    // Dashboard navigation
    const dashboardLink = document.getElementById('dashboardLink');
    const bloodRequestsLink = document.getElementById('bloodRequestsLink');
    
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            showMainDashboard();
        });
    }
    
    if (bloodRequestsLink) {
        bloodRequestsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showBloodRequestsDashboard();
        });
    }
    
    // Filter buttons for appointments
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            filterAppointments(filter);
        });
    });
    
    // Filter buttons for blood requests
    const requestFilterBtns = document.querySelectorAll('.filter-btn[data-filter-request]');
    requestFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            requestFilterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            const filter = this.getAttribute('data-filter-request');
            filterBloodRequests(filter);
        });
    });
    
    // Clear history buttons
    const clearDonationHistoryBtn = document.getElementById('clearDonationHistory');
    const clearRequestHistoryBtn = document.getElementById('clearRequestHistory');
    
    if (clearDonationHistoryBtn) {
        clearDonationHistoryBtn.addEventListener('click', clearDonationHistory);
    }
    
    if (clearRequestHistoryBtn) {
        clearRequestHistoryBtn.addEventListener('click', clearRequestHistory);
    }
    
    // Modal close buttons
    const closeScheduleModal = document.getElementById('closeScheduleModal');
    const closeDetailsModal = document.getElementById('closeDetailsModal');
    const cancelSchedule = document.getElementById('cancelSchedule');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    
    if (closeScheduleModal) closeScheduleModal.addEventListener('click', () => closeModal('scheduleModal'));
    if (closeDetailsModal) closeDetailsModal.addEventListener('click', () => closeModal('requestDetailsModal'));
    if (cancelSchedule) cancelSchedule.addEventListener('click', () => closeModal('scheduleModal'));
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', () => closeModal('requestDetailsModal'));
    
    // Schedule form
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleDonor);
    }
    
    // Set minimum date for scheduling (today)
    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        const today = new Date().toISOString().split('T')[0];
        appointmentDateInput.min = today;
    }
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

function showMainDashboard() {
    const mainDashboard = document.getElementById('mainDashboard');
    const bloodRequestsDashboard = document.getElementById('bloodRequestsDashboard');
    const dashboardLink = document.getElementById('dashboardLink');
    const bloodRequestsLink = document.getElementById('bloodRequestsLink');
    
    if (mainDashboard) mainDashboard.style.display = 'block';
    if (bloodRequestsDashboard) bloodRequestsDashboard.style.display = 'none';
    
    // Update active state in sidebar
    if (dashboardLink) dashboardLink.classList.add('active');
    if (bloodRequestsLink) bloodRequestsLink.classList.remove('active');
    
    // Reload dashboard data
    loadBDashboardData();
}

function showBloodRequestsDashboard() {
    const mainDashboard = document.getElementById('mainDashboard');
    const bloodRequestsDashboard = document.getElementById('bloodRequestsDashboard');
    const dashboardLink = document.getElementById('dashboardLink');
    const bloodRequestsLink = document.getElementById('bloodRequestsLink');
    
    if (mainDashboard) mainDashboard.style.display = 'none';
    if (bloodRequestsDashboard) bloodRequestsDashboard.style.display = 'block';
    
    // Update active state in sidebar
    if (dashboardLink) dashboardLink.classList.remove('active');
    if (bloodRequestsLink) bloodRequestsLink.classList.add('active');
    
    // Load blood requests data
    loadBloodRequestsData();
}

function loadBDashboardData() {
    loadAppointmentsData();
    loadConfirmedDonations();
    updateStats();
}

function loadAppointmentsData() {
    const appointmentsBody = document.getElementById('appointmentsBody');
    const noAppointments = document.getElementById('noAppointments');
    
    if (!appointmentsBody) return;
    
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    
    if (pendingAppointments.length === 0) {
        if (noAppointments) noAppointments.style.display = 'block';
        appointmentsBody.innerHTML = '';
        return;
    }
    
    if (noAppointments) noAppointments.style.display = 'none';
    
    // Clear existing content
    appointmentsBody.innerHTML = '';
    
    // Add appointments to table
    pendingAppointments.forEach(apt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${apt.donorName || 'Unknown Donor'}</td>
            <td>${apt.donorEmail || 'N/A'}</td>
            <td>${apt.donorPhone || 'N/A'}</td>
            <td>${apt.donorBloodType || 'Unknown'}</td>
            <td>${apt.date || 'N/A'}</td>
            <td>${apt.time || 'N/A'}</td>
            <td>${apt.amount || 'N/A'}</td>
            <td><span class="status-badge pending">${apt.status}</span></td>
            <td>
                <button class="action-btn small" onclick="confirmAppointment('${apt.id}')">Confirm</button>
                <button class="action-btn small secondary" onclick="rejectAppointment('${apt.id}')">Reject</button>
            </td>
        `;
        appointmentsBody.appendChild(row);
    });
}

function loadConfirmedDonations() {
    const confirmedBody = document.getElementById('confirmedBody');
    const noConfirmed = document.getElementById('noConfirmed');
    
    if (!confirmedBody) return;
    
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'completed');
    
    if (confirmedAppointments.length === 0) {
        if (noConfirmed) noConfirmed.style.display = 'block';
        confirmedBody.innerHTML = '';
        return;
    }
    
    if (noConfirmed) noConfirmed.style.display = 'none';
    
    // Clear existing content
    confirmedBody.innerHTML = '';
    
    // Add confirmed donations to table
    confirmedAppointments.forEach(apt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${apt.donorName || 'Unknown Donor'}</td>
            <td>${apt.donorEmail || 'N/A'}</td>
            <td>${apt.donorPhone || 'N/A'}</td>
            <td>${apt.donorBloodType || 'Unknown'}</td>
            <td>${apt.date || 'N/A'}</td>
            <td>${apt.time || 'N/A'}</td>
            <td>${apt.amount || 'N/A'}</td>
            <td><span class="status-badge ${apt.status}">${apt.status}</span></td>
            <td>
                <button class="action-btn small danger" onclick="deleteAppointment('${apt.id}')">Delete</button>
            </td>
        `;
        confirmedBody.appendChild(row);
    });
}

// ==================== UPDATED SCHEDULE DONOR FUNCTION ====================

function handleScheduleDonor(e) {
    e.preventDefault();
    
    const requestId = document.getElementById('requestId').value;
    const donorName = document.getElementById('donorName').value;
    const donorContact = document.getElementById('donorContact').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const message = document.getElementById('message').value;
    
    // Get blood request details
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
    const requestIndex = bloodRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
        showAlert('Blood request not found!', 'error');
        return;
    }
    
    const bloodRequest = bloodRequests[requestIndex];
    
    // Update blood request status
    bloodRequests[requestIndex].status = 'scheduled';
    bloodRequests[requestIndex].scheduledDonor = donorName;
    bloodRequests[requestIndex].scheduledDonorContact = donorContact;
    bloodRequests[requestIndex].scheduledDate = appointmentDate;
    bloodRequests[requestIndex].scheduledTime = appointmentTime;
    bloodRequests[requestIndex].hospital = 'Samtse Hospital'; // Default hospital
    localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));
    
    // Send notification to donor
    const scheduleData = {
        date: appointmentDate,
        time: appointmentTime,
        hospital: 'Samtse Hospital',
        requestId: requestId,
        message: message
    };
    
    sendDonationScheduleNotification(donorContact, scheduleData);
    
    showAlert(`Donor ${donorName} scheduled successfully! Notification sent.`, 'success');
    closeModal('scheduleModal');
    document.getElementById('scheduleForm').reset();
    
    // Reload blood requests data
    loadBloodRequestsData();
}

// ==================== UPDATED BLOOD REQUEST DISPLAY ====================

function loadBloodRequestsData() {
    const bloodRequestsBody = document.getElementById('bloodRequestsBody');
    const noBloodRequests = document.getElementById('noBloodRequests');
    const requestHistoryBody = document.getElementById('requestHistoryBody');
    const noRequestHistory = document.getElementById('noRequestHistory');
    
    if (!bloodRequestsBody) return;
    
    try {
        const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
        
        console.log('Loading blood requests from localStorage:', bloodRequests);
        
        // Update stats
        updateBloodRequestStats();
        
        // Filter for active requests (pending, scheduled, accepted)
        const activeRequests = bloodRequests.filter(req => 
            req.status === 'pending' || req.status === 'scheduled' || req.status === 'accepted'
        );
        
        // Filter for history (fulfilled, cancelled, rejected)
        const historyRequests = bloodRequests.filter(req => 
            req.status === 'fulfilled' || req.status === 'cancelled' || req.donorResponse === 'rejected'
        );
        
        // Display active requests
        if (activeRequests.length === 0) {
            if (noBloodRequests) noBloodRequests.style.display = 'block';
            bloodRequestsBody.innerHTML = '';
        } else {
            if (noBloodRequests) noBloodRequests.style.display = 'none';
            bloodRequestsBody.innerHTML = '';
            
            activeRequests.forEach(req => {
                const row = document.createElement('tr');
                
                let statusBadge = `<span class="status-badge ${req.status}">${req.status}</span>`;
                if (req.donorResponse === 'accepted') {
                    statusBadge = '<span class="status-badge accepted">Donor Accepted</span>';
                } else if (req.donorResponse === 'rejected') {
                    statusBadge = '<span class="status-badge rejected">Donor Rejected</span>';
                }
                
                let actionButtons = `
                    <button class="action-btn small" onclick="viewRequestDetails('${req.id}')">View</button>
                `;
                
                if (req.status === 'pending') {
                    actionButtons += `<button class="action-btn small secondary" onclick="scheduleDonor('${req.id}')">Schedule</button>`;
                } else if (req.status === 'scheduled' || req.status === 'accepted') {
                    actionButtons += `<button class="action-btn small success" onclick="markRequestFulfilled('${req.id}')">Mark Fulfilled</button>`;
                }
                
                actionButtons += `<button class="action-btn small danger" onclick="deleteBloodRequest('${req.id}')">Delete</button>`;
                
                row.innerHTML = `
                    <td>${req.patientName || 'Unknown'}</td>
                    <td>${req.phone || 'N/A'}</td>
                    <td>${req.bloodType || 'Unknown'}</td>
                    <td>${req.bloodNeeded || 'N/A'}</td>
                    <td>${req.hospital || 'N/A'}</td>
                    <td><span class="urgency-badge ${req.urgency ? req.urgency.toLowerCase() : 'medium'}">${req.urgency || 'Medium'}</span></td>
                    <td>${statusBadge}</td>
                    <td>${req.requiredDate || 'N/A'}</td>
                    <td>${req.requestDate || 'N/A'}</td>
                    <td>${actionButtons}</td>
                `;
                bloodRequestsBody.appendChild(row);
            });
        }
        
        // Display request history
        if (requestHistoryBody) {
            if (historyRequests.length === 0) {
                if (noRequestHistory) noRequestHistory.style.display = 'block';
                requestHistoryBody.innerHTML = '';
            } else {
                if (noRequestHistory) noRequestHistory.style.display = 'none';
                requestHistoryBody.innerHTML = '';
                
                historyRequests.forEach(req => {
                    const row = document.createElement('tr');
                    
                    let statusText = req.status;
                    if (req.donorResponse === 'rejected') {
                        statusText = 'Donor Rejected';
                    }
                    
                    row.innerHTML = `
                        <td>${req.patientName || 'Unknown'}</td>
                        <td>${req.phone || 'N/A'}</td>
                        <td>${req.bloodType || 'Unknown'}</td>
                        <td>${req.bloodNeeded || 'N/A'}</td>
                        <td>${req.hospital || 'N/A'}</td>
                        <td><span class="status-badge ${req.donorResponse === 'rejected' ? 'rejected' : req.status}">${statusText}</span></td>
                        <td>${req.requestDate || 'N/A'}</td>
                        <td>
                            <button class="action-btn small" onclick="viewRequestDetails('${req.id}')">View</button>
                            <button class="action-btn small danger" onclick="deleteBloodRequest('${req.id}')">Delete</button>
                        </td>
                    `;
                    requestHistoryBody.appendChild(row);
                });
            }
        }
        
    } catch (error) {
        console.error('Error loading blood requests:', error);
        if (noBloodRequests) noBloodRequests.style.display = 'block';
        if (noRequestHistory) noRequestHistory.style.display = 'block';
    }
}

function updateStats() {
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    
    // Pending appointments count
    const pendingCount = appointments.filter(apt => apt.status === 'pending').length;
    const pendingCountElement = document.getElementById('pendingCount');
    if (pendingCountElement) pendingCountElement.textContent = pendingCount;
    
    // Confirmed today count
    const today = new Date().toISOString().split('T')[0];
    const confirmedToday = appointments.filter(apt => 
        apt.status === 'confirmed' && apt.date === today
    ).length;
    const confirmedCountElement = document.getElementById('confirmedCount');
    if (confirmedCountElement) confirmedCountElement.textContent = confirmedToday;
    
    // Blood requests count
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
    const bloodRequestsCount = bloodRequests.length;
    const bloodRequestsCountElement = document.getElementById('bloodRequestsCount');
    if (bloodRequestsCountElement) bloodRequestsCountElement.textContent = bloodRequestsCount;
    
    // Active donors count (simplified - count unique donors with appointments)
    const activeDonors = new Set(appointments.map(apt => apt.donorId)).size;
    const activeDonorsElement = document.getElementById('activeDonors');
    if (activeDonorsElement) activeDonorsElement.textContent = activeDonors;
}

function updateBloodRequestStats() {
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
    
    const pendingRequests = bloodRequests.filter(req => req.status === 'pending').length;
    const urgentRequests = bloodRequests.filter(req => req.urgency === 'High' && req.status === 'pending').length;
    const scheduledRequests = bloodRequests.filter(req => req.status === 'scheduled').length;
    const fulfilledRequests = bloodRequests.filter(req => req.status === 'fulfilled').length;
    
    const pendingElement = document.getElementById('pendingRequestsCount');
    const urgentElement = document.getElementById('urgentRequestsCount');
    const scheduledElement = document.getElementById('scheduledRequestsCount');
    const fulfilledElement = document.getElementById('fulfilledRequestsCount');
    
    if (pendingElement) pendingElement.textContent = pendingRequests;
    if (urgentElement) urgentElement.textContent = urgentRequests;
    if (scheduledElement) scheduledElement.textContent = scheduledRequests;
    if (fulfilledElement) fulfilledElement.textContent = fulfilledRequests;
}

function filterAppointments(filter) {
    // This would filter appointments based on the selected filter
    // For now, we'll just reload all appointments
    loadAppointmentsData();
}

function filterBloodRequests(filter) {
    const bloodRequestsBody = document.getElementById('bloodRequestsBody');
    const noBloodRequests = document.getElementById('noBloodRequests');
    
    if (!bloodRequestsBody) return;
    
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
    
    let filteredRequests = bloodRequests;
    
    if (filter !== 'all') {
        filteredRequests = bloodRequests.filter(req => req.status === filter);
    }
    
    if (filteredRequests.length === 0) {
        if (noBloodRequests) noBloodRequests.style.display = 'block';
        bloodRequestsBody.innerHTML = '';
        return;
    }
    
    if (noBloodRequests) noBloodRequests.style.display = 'none';
    
    // Clear existing content
    bloodRequestsBody.innerHTML = '';
    
    // Add blood requests to table
    filteredRequests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.patientName}</td>
            <td>${req.phone}</td>
            <td>${req.bloodType}</td>
            <td>${req.bloodNeeded}</td>
            <td>${req.hospital}</td>
            <td><span class="urgency-badge ${req.urgency.toLowerCase()}">${req.urgency}</span></td>
            <td><span class="status-badge ${req.status}">${req.status}</span></td>
            <td>${req.requiredDate}</td>
            <td>${req.requestDate}</td>
            <td>
                <button class="action-btn small" onclick="viewRequestDetails('${req.id}')">View</button>
                ${req.status === 'pending' ? `<button class="action-btn small secondary" onclick="scheduleDonor('${req.id}')">Schedule</button>` : ''}
                <button class="action-btn small danger" onclick="deleteBloodRequest('${req.id}')">Delete</button>
            </td>
        `;
        bloodRequestsBody.appendChild(row);
    });
}

// ==================== TOP DONORS LEADERBOARD FUNCTIONALITY ====================

// Function to track donations and update leaderboard
function trackDonation(donorInfo, donationDate) {
    const topDonors = JSON.parse(localStorage.getItem('bloodDonationTopDonors')) || [];
    
    // Find if donor already exists
    const existingDonorIndex = topDonors.findIndex(donor => 
        donor.email === donorInfo.email || donor.phone === donorInfo.phone
    );
    
    if (existingDonorIndex !== -1) {
        // Update existing donor
        topDonors[existingDonorIndex].donationCount++;
        topDonors[existingDonorIndex].totalDonations = topDonors[existingDonorIndex].donationCount;
        topDonors[existingDonorIndex].lastDonation = donationDate;
    } else {
        // Add new donor
        const newDonor = {
            id: donorInfo.id || 'donor_' + Date.now(),
            name: donorInfo.donorName || 'Anonymous Donor',
            email: donorInfo.email || '',
            phone: donorInfo.phone || '',
            bloodType: donorInfo.bloodType || 'Unknown',
            donationCount: 1,
            totalDonations: 1,
            firstDonation: donationDate,
            lastDonation: donationDate,
            joinDate: new Date().toISOString()
        };
        topDonors.push(newDonor);
    }
    
    // Sort by donation count (descending) and keep only top 50
    topDonors.sort((a, b) => b.donationCount - a.donationCount);
    const limitedDonors = topDonors.slice(0, 50);
    
    localStorage.setItem('bloodDonationTopDonors', JSON.stringify(limitedDonors));
    console.log('Donation tracked for:', donorInfo.donorName);
}

// Function to get top donors for leaderboard
function getTopDonors(limit = 5) {
    const topDonors = JSON.parse(localStorage.getItem('bloodDonationTopDonors')) || [];
    
    // Sort by donation count (descending)
    const sortedDonors = topDonors.sort((a, b) => b.donationCount - a.donationCount);
    
    // Return top donors
    return sortedDonors.slice(0, limit);
}

// Function to initialize top donors page
function initTopDonorsPage() {
    console.log('Initializing top donors page...');
    
    // Load leaderboard data
    loadLeaderboardData();
    
    // Load featured donor
    loadFeaturedDonor();
    
    // Initialize event listeners
    initTopDonorsEventListeners();
}

// Function to load leaderboard data
function loadLeaderboardData() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;
    
    const topDonors = getTopDonors(10); // Get top 10 donors
    
    if (topDonors.length === 0) {
        // Show sample data if no real data exists
        showSampleLeaderboardData();
        return;
    }
    
    // Clear existing content
    leaderboardBody.innerHTML = '';
    
    // Add donors to leaderboard
    topDonors.forEach((donor, index) => {
        const row = document.createElement('tr');
        const rank = index + 1;
        
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        row.innerHTML = `
            <td><span class="rank ${rankClass}">${rank}</span></td>
            <td>
                <div class="donor-info-small">
                    <div class="donor-name">${donor.name}</div>
                    <div class="donor-contact">${donor.email || donor.phone || 'Contact not available'}</div>
                </div>
            </td>
            <td><span class="donation-count">${donor.donationCount}</span></td>
            <td><span class="blood-type ${donor.bloodType.toLowerCase().replace('+', 'positive').replace('-', 'negative')}">${donor.bloodType}</span></td>
            <td>${formatDate(donor.lastDonation)}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Function to load featured donor
function loadFeaturedDonor() {
    const topDonors = getTopDonors(1);
    
    if (topDonors.length === 0) {
        // Show default featured donor
        showDefaultFeaturedDonor();
        return;
    }
    
    const featuredDonor = topDonors[0];
    
    // Update featured donor elements
    const featuredName = document.getElementById('featuredName');
    const featuredStats = document.getElementById('featuredStats');
    const featuredDescription = document.getElementById('featuredDescription');
    const featuredBadge = document.getElementById('featuredBadge');
    const featuredGender = document.getElementById('featuredGender');
    
    if (featuredName) featuredName.textContent = featuredDonor.name;
    if (featuredStats) featuredStats.textContent = `Donated ${featuredDonor.donationCount} Times - Saving countless lives`;
    if (featuredDescription) featuredDescription.textContent = `${featuredDonor.name.split(' ')[0]} is a true hero in our community, having donated blood ${featuredDonor.donationCount} times and saving countless lives. Their dedication is an inspiration to us all.`;
    if (featuredBadge) featuredBadge.textContent = 'TOP DONOR';
    
    // Set random gender for avatar (just for visual variety)
    if (featuredGender) {
        const isFemale = Math.random() > 0.5;
        featuredGender.className = `featured-gender ${isFemale ? 'female' : 'male'}`;
        featuredGender.innerHTML = isFemale ? '<i class="fas fa-venus"></i>' : '<i class="fas fa-mars"></i>';
    }
}

// Function to show sample data when no real data exists
function showSampleLeaderboardData() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;
    
    const sampleData = [
        { name: 'Jamyang Yangzom', donations: 7, bloodType: 'O+', lastDonation: '2025-01-15' },
        { name: 'Karma Dorji', donations: 5, bloodType: 'A+', lastDonation: '2025-01-10' },
        { name: 'Pema Wangchuk', donations: 4, bloodType: 'B+', lastDonation: '2025-01-08' },
        { name: 'Sonam Dema', donations: 3, bloodType: 'AB+', lastDonation: '2025-01-05' },
        { name: 'Tashi Penjor', donations: 3, bloodType: 'O-', lastDonation: '2025-01-03' }
    ];
    
    leaderboardBody.innerHTML = '';
    
    sampleData.forEach((donor, index) => {
        const row = document.createElement('tr');
        const rank = index + 1;
        
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        row.innerHTML = `
            <td><span class="rank ${rankClass}">${rank}</span></td>
            <td>
                <div class="donor-info-small">
                    <div class="donor-name">${donor.name}</div>
                    <div class="donor-contact">Regular Donor</div>
                </div>
            </td>
            <td><span class="donation-count">${donor.donations}</span></td>
            <td><span class="blood-type ${donor.bloodType.toLowerCase().replace('+', 'positive').replace('-', 'negative')}">${donor.bloodType}</span></td>
            <td>${formatDate(donor.lastDonation)}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Function to show default featured donor
function showDefaultFeaturedDonor() {
    const featuredName = document.getElementById('featuredName');
    const featuredStats = document.getElementById('featuredStats');
    const featuredDescription = document.getElementById('featuredDescription');
    const featuredBadge = document.getElementById('featuredBadge');
    
    if (featuredName) featuredName.textContent = 'Jamyang Yangzom';
    if (featuredStats) featuredStats.textContent = 'Donated 7 Times - Saving countless lives';
    if (featuredDescription) featuredDescription.textContent = 'Jamyang is a true hero in our community, having donated blood 7 times and saving countless lives. Their dedication is an inspiration to us all.';
    if (featuredBadge) featuredBadge.textContent = 'TOP DONOR';
}

// Function to initialize top donors event listeners
function initTopDonorsEventListeners() {
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // For now, we'll just reload the same data
            // In a real implementation, you would filter by time period
            loadLeaderboardData();
        });
    });
    
    // Donate Now button
    const donateNowBtn = document.getElementById('donateNowBtn');
    if (donateNowBtn) {
        donateNowBtn.addEventListener('click', handleDonateNow);
    }
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Appointment Actions
function confirmAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
    
    if (appointmentIndex !== -1) {
        appointments[appointmentIndex].status = 'confirmed';
        localStorage.setItem('bloodDonationAppointments', JSON.stringify(appointments));
        
        // Track this donation for leaderboard
        const appointment = appointments[appointmentIndex];
        const donorInfo = {
            donorName: appointment.donorName,
            email: appointment.donorEmail,
            phone: appointment.donorPhone,
            bloodType: appointment.donorBloodType
        };
        
        trackDonation(donorInfo, appointment.date);
        
        showAlert('Appointment confirmed successfully!', 'success');
        loadBDashboardData();
    }
}

function rejectAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
    
    if (appointmentIndex !== -1) {
        appointments[appointmentIndex].status = 'rejected';
        localStorage.setItem('bloodDonationAppointments', JSON.stringify(appointments));
        showAlert('Appointment rejected successfully!', 'success');
        loadBDashboardData();
    }
}

function deleteAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
    const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
    localStorage.setItem('bloodDonationAppointments', JSON.stringify(updatedAppointments));
    showAlert('Appointment deleted successfully!', 'success');
    loadBDashboardData();
}

// Blood Request Actions
function viewRequestDetails(requestId) {
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
    const request = bloodRequests.find(req => req.id === requestId);
    
    if (request) {
        const detailsContent = document.getElementById('requestDetailsContent');
        if (detailsContent) {
            detailsContent.innerHTML = `
                <div class="request-details">
                    <div class="detail-item">
                        <label>Patient Name:</label>
                        <span>${request.patientName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Contact:</label>
                        <span>${request.phone}</span>
                    </div>
                    <div class="detail-item">
                        <label>Blood Type:</label>
                        <span>${request.bloodType}</span>
                    </div>
                    <div class="detail-item">
                        <label>Blood Needed:</label>
                        <span>${request.bloodNeeded}</span>
                    </div>
                    <div class="detail-item">
                        <label>Hospital:</label>
                        <span>${request.hospital}</span>
                    </div>
                    <div class="detail-item">
                        <label>Urgency:</label>
                        <span class="urgency-badge ${request.urgency.toLowerCase()}">${request.urgency}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${request.status}">${request.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Required Date:</label>
                        <span>${request.requiredDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Request Date:</label>
                        <span>${request.requestDate}</span>
                    </div>
                    ${request.scheduledDonor ? `
                    <div class="detail-item">
                        <label>Scheduled Donor:</label>
                        <span>${request.scheduledDonor}</span>
                    </div>
                    <div class="detail-item">
                        <label>Scheduled Date:</label>
                        <span>${request.scheduledDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Scheduled Time:</label>
                        <span>${request.scheduledTime}</span>
                    </div>
                    ` : ''}
                    ${request.donorResponse ? `
                    <div class="detail-item">
                        <label>Donor Response:</label>
                        <span class="status-badge ${request.donorResponse}">${request.donorResponse}</span>
                    </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Store the current request ID for scheduling
        document.getElementById('scheduleFromDetailsBtn').setAttribute('data-request-id', requestId);
        openModal('requestDetailsModal');
    }
}

function scheduleDonor(requestId) {
    document.getElementById('requestId').value = requestId;
    openModal('scheduleModal');
}

function markRequestFulfilled(requestId) {
    if (confirm('Mark this blood request as fulfilled?')) {
        const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
        const requestIndex = bloodRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex !== -1) {
            bloodRequests[requestIndex].status = 'fulfilled';
            bloodRequests[requestIndex].fulfilledDate = new Date().toISOString();
            localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));
            
            // Track donation if there was a scheduled donor who accepted
            const request = bloodRequests[requestIndex];
            if (request.scheduledDonor && request.donorResponse === 'accepted') {
                const donorInfo = {
                    donorName: request.scheduledDonor,
                    email: request.scheduledDonorContact?.includes('@') ? request.scheduledDonorContact : '',
                    phone: !request.scheduledDonorContact?.includes('@') ? request.scheduledDonorContact : '',
                    bloodType: request.bloodType
                };
                
                trackDonation(donorInfo, request.scheduledDate);
            }
            
            showAlert('Blood request marked as fulfilled!', 'success');
            loadBloodRequestsData();
        }
    }
}

function deleteBloodRequest(requestId) {
    if (confirm('Are you sure you want to delete this blood request?')) {
        const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
        const updatedRequests = bloodRequests.filter(req => req.id !== requestId);
        localStorage.setItem('bloodRequests', JSON.stringify(updatedRequests));
        showAlert('Blood request deleted successfully!', 'success');
        loadBloodRequestsData();
    }
}

function clearDonationHistory() {
    if (confirm('Are you sure you want to clear all donation history? This action cannot be undone.')) {
        const appointments = JSON.parse(localStorage.getItem('bloodDonationAppointments')) || [];
        const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
        localStorage.setItem('bloodDonationAppointments', JSON.stringify(pendingAppointments));
        showAlert('Donation history cleared successfully!', 'success');
        loadBDashboardData();
    }
}

function clearRequestHistory() {
    if (confirm('Are you sure you want to clear all blood request history? This action cannot be undone.')) {
        localStorage.removeItem('bloodRequests');
        showAlert('Blood request history cleared successfully!', 'success');
        loadBloodRequestsData();
    }
}

// ==================== BLOOD REQUEST FORM FUNCTIONALITY ====================

// Initialize blood request form
function initBloodRequestForm() {
    const requestForm = document.getElementById('bloodRequestForm');
    const successMessage = document.getElementById('successMessage');
    const customAmountContainer = document.getElementById('customAmountContainer');
    const unitsSelect = document.getElementById('units');
    const urgencyButtons = document.querySelectorAll('.urgency-btn');
    const urgencyInput = document.getElementById('urgency');
    
    if (requestForm) {
        console.log('Initializing blood request form...');
        
        // Handle custom amount selection
        if (unitsSelect && customAmountContainer) {
            unitsSelect.addEventListener('change', function() {
                if (this.value === 'custom') {
                    customAmountContainer.style.display = 'block';
                } else {
                    customAmountContainer.style.display = 'none';
                }
            });
        }
        
        // Handle urgency level buttons
        if (urgencyButtons.length && urgencyInput) {
            urgencyButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    urgencyButtons.forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    // Update hidden input value
                    const urgencyLevel = this.getAttribute('data-level');
                    urgencyInput.value = urgencyLevel;
                    
                    console.log('Urgency level set to:', urgencyLevel);
                });
            });
        }
        
        // Set minimum date for required date (today)
        const requiredDateInput = document.getElementById('requiredDate');
        if (requiredDateInput) {
            const today = new Date().toISOString().split('T')[0];
            requiredDateInput.min = today;
        }
        
        // Handle form submission
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Blood request form submitted');
            
            // Validate urgency level
            if (!urgencyInput.value) {
                alert('Please select an urgency level');
                return;
            }
            
            // Get form data
            const formData = {
                id: 'req_' + Date.now(),
                patientName: document.getElementById('patientName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                bloodType: document.getElementById('bloodType').value,
                units: document.getElementById('units').value,
                customAmount: document.getElementById('customAmount') ? document.getElementById('customAmount').value : '',
                hospital: document.getElementById('hospital').value,
                urgency: urgencyInput.value,
                requiredDate: document.getElementById('requiredDate').value,
                additionalInfo: document.getElementById('additionalInfo').value,
                status: 'pending',
                requestDate: new Date().toISOString().split('T')[0],
                scheduledDonor: '',
                scheduledDate: '',
                scheduledTime: ''
            };
            
            // Calculate final blood amount
            let bloodNeeded = '';
            if (formData.units === 'custom' && formData.customAmount) {
                bloodNeeded = formData.customAmount + ' ml';
            } else if (formData.units !== 'custom') {
                bloodNeeded = formData.units + ' ml';
            }
            formData.bloodNeeded = bloodNeeded;
            
            console.log('Blood request data:', formData);
            
            // Save to localStorage
            saveBloodRequest(formData);
            
            // Show success message
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            
            // Reset form
            requestForm.reset();
            
            // Reset urgency buttons
            urgencyButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            urgencyInput.value = '';
            
            // Hide custom amount container
            if (customAmountContainer) {
                customAmountContainer.style.display = 'none';
            }
            
            // Redirect to homepage after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        });
    }
}

// Save blood request to localStorage
function saveBloodRequest(requestData) {
    try {
        // Get existing blood requests or initialize empty array
        const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
        
        // Add new request
        bloodRequests.push(requestData);
        
        // Save back to localStorage
        localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));
        
        console.log('Blood request saved successfully. Total requests:', bloodRequests.length);
        console.log('All blood requests:', bloodRequests);
        
        return true;
    } catch (error) {
        console.error('Error saving blood request:', error);
        return false;
    }
}

// ==================== SUCCESS STORIES SLIDER FUNCTIONALITY ====================

function initSuccessStoriesSlider() {
    console.log('Initializing success stories slider...');
    
    const sliderContainer = document.getElementById('sliderContainer');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const sliderNav = document.getElementById('sliderNav');
    
    if (!sliderContainer || !prevBtn || !nextBtn || !sliderNav) {
        console.log('Slider elements not found');
        return;
    }
    
    const slides = sliderContainer.querySelectorAll('.slide');
    let currentSlide = 0;
    
    console.log(`Found ${slides.length} slides`);
    
    // Create navigation dots
    sliderNav.innerHTML = ''; // Clear any existing dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'slider-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        sliderNav.appendChild(dot);
    });
    
    // Update slider display - MATCHES YOUR CSS
    function updateSlider() {
        console.log(`Moving to slide ${currentSlide + 1}`);
        
        // Move the slider container horizontally
        sliderContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update active class for content animation
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
        
        // Update navigation dots
        const dots = sliderNav.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
    
    // Go to specific slide
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        if (currentSlide < 0) currentSlide = slides.length - 1;
        if (currentSlide >= slides.length) currentSlide = 0;
        updateSlider();
    }
    
    // Next slide
    function nextSlide() {
        currentSlide++;
        if (currentSlide >= slides.length) currentSlide = 0;
        updateSlider();
    }
    
    // Previous slide
    function prevSlide() {
        currentSlide--;
        if (currentSlide < 0) currentSlide = slides.length - 1;
        updateSlider();
    }
    
    // Event listeners for buttons
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Auto-advance slides every 5 seconds
    let slideInterval = setInterval(nextSlide, 5000);
    
    // Pause auto-advance on hover
    const storySlider = document.querySelector('.story-slider');
    if (storySlider) {
        storySlider.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        storySlider.addEventListener('mouseleave', () => {
            slideInterval = setInterval(nextSlide, 5000);
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
    
    // Initialize slider
    updateSlider();
    
    console.log(`Success stories slider initialized with ${slides.length} slides`);
}

// Handle "Become a Donor" button on success stories page
document.addEventListener('DOMContentLoaded', function() {
    const becomeDonorBtn = document.getElementById('becomeDonorBtn');
    if (becomeDonorBtn) {
        becomeDonorBtn.addEventListener('click', function() {
            if (currentUser) {
                window.location.href = 'dashboard.html';
            } else {
                openModal('registerModal');
            }
        });
    }
});

// Emergency logout function that can be called from browser console
function emergencyLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'index.html';
}

// Make it globally available
window.emergencyLogout = emergencyLogout;
window.confirmAppointment = confirmAppointment;
window.rejectAppointment = rejectAppointment;
window.deleteAppointment = deleteAppointment;
window.viewRequestDetails = viewRequestDetails;
window.scheduleDonor = scheduleDonor;
window.deleteBloodRequest = deleteBloodRequest;
window.acceptDonationSchedule = acceptDonationSchedule;
window.rejectDonationSchedule = rejectDonationSchedule;
window.markRequestFulfilled = markRequestFulfilled;