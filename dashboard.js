// ============================================
// FIREBASE CONFIGURATION (Auth ONLY)
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyD2yu_mDXP7T65eF_gV424Pmox7oSrafh8",
  authDomain: "skill-sync-285ef.firebaseapp.com",
  projectId: "skill-sync-285ef",
  storageBucket: "skill-sync-285ef.firebasestorage.app",
  messagingSenderId: "87094028807",
  appId: "1:87094028807:web:849151a9c8254441f418a2",
  measurementId: "G-76QZ40SD0L"
};

// Initialize Firebase (prevent re-initialization)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// ============================================
// BACKEND API URL - PRODUCTION
// ============================================
const API_URL = 'https://skill-sync-backend-o5lw.onrender.com/api';

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let userData = {};
let selectedPhoto = null;
let interests = [];

// ============================================
// HELPER: GET FIREBASE TOKEN
// ============================================
async function getToken() {
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
}

// ============================================
// CHECK AUTHENTICATION & LOAD USER DATA
// ============================================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.email || user.phoneNumber);
        
        try {
            // Get Firebase token
            const token = await getToken();
            
            // Call backend to verify/create user
            const response = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                userData = data.user;
                // Map 'skills' to 'interests' for compatibility
                userData.interests = data.user.skills || [];
                console.log('✅ User data loaded from MongoDB:', userData);
                
                updateDashboardUI(userData);
                populateProfileSidebar(userData);
                loadConnectionsCount();
                loadPendingRequestsCount();
            } else {
                console.warn('⚠️ User not found in backend, using defaults');
                // Create default user data
                userData = {
                    name: user.displayName || 'Student',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    profilePhoto: user.photoURL || '',
                    bio: '',
                    interests: [],
                    institution: '',
                    contactInfo: { whatsappNumber: '', discordId: '' },
                    socialLinks: { linkedin: '', github: '', portfolio: '' }
                };
                updateDashboardUI(userData);
                populateProfileSidebar(userData);
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            alert('Error connecting to server. Please refresh the page.');
        }
    } else {
        console.log('❌ No user authenticated, redirecting to login...');
        window.location.href = 'login.html';
    }
});

// ============================================
// UPDATE DASHBOARD UI
// ============================================
function updateDashboardUI(data) {
    const firstName = (data.name || 'Student').split(' ')[0];
    document.getElementById('user-name-header').textContent = data.name || 'Student';
    document.getElementById('user-name-dropdown').textContent = data.name || 'Student';
    document.getElementById('user-email-dropdown').textContent = data.email || data.phoneNumber || '';
    
    const photoUrl = data.profilePhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(firstName) + '&background=6366F1&color=fff';
    document.getElementById('user-photo').src = photoUrl;
    document.getElementById('sidebar-photo').src = photoUrl;
}

// ============================================
// POPULATE PROFILE SIDEBAR
// ============================================
function populateProfileSidebar(data) {
    document.getElementById('edit-name').value = data.name || '';
    document.getElementById('edit-email').value = data.email || '';
    document.getElementById('edit-phone').value = data.phoneNumber || '';
    document.getElementById('edit-bio').value = data.bio || '';
    document.getElementById('edit-institution').value = data.institution || '';
    document.getElementById('edit-whatsapp').value = data.contactInfo?.whatsappNumber || '';
    document.getElementById('edit-discord').value = data.contactInfo?.discordId || '';
    document.getElementById('edit-linkedin').value = data.socialLinks?.linkedin || '';
    document.getElementById('edit-github').value = data.socialLinks?.github || '';
    document.getElementById('edit-portfolio').value = data.socialLinks?.portfolio || '';
    
    updateBioCount();
    renderInterests(data.interests || data.skills || []);
}

// ============================================
// LOAD CONNECTIONS COUNT (FROM MONGODB BACKEND)
// ============================================
async function loadConnectionsCount() {
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/connections`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            updateConnectionsCount(data.count);
        }
    } catch (error) {
        console.error('❌ Error loading connections count:', error);
    }
}

// ============================================
// LOAD PENDING REQUESTS COUNT (FROM MONGODB BACKEND)
// ============================================
async function loadPendingRequestsCount() {
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/connections/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            updatePendingRequestsCount(data.count);
        }
    } catch (error) {
        console.error('❌ Error loading pending requests:', error);
    }
}

// ============================================
// UPDATE STATS COUNTS
// ============================================
function updateConnectionsCount(count) {
    const elements = document.querySelectorAll('.connections-count');
    elements.forEach(el => el.textContent = count);
}

function updatePendingRequestsCount(count) {
    const elements = document.querySelectorAll('.pending-requests-count');
    elements.forEach(el => el.textContent = count);
    
    // Update specific count element
    const countEl = document.getElementById('pendingRequestsCount');
    if (countEl) countEl.textContent = count;
    
    // Update all notification badges
    const badges = [
        document.getElementById('bell-pending-badge'),
        document.getElementById('sidebar-pending-badge'),
        document.getElementById('card-pending-badge')
    ];
    
    badges.forEach(badge => {
        if (badge) {
            badge.textContent = count;
            if (count > 0) {
                badge.style.display = '';  // Show badge
            } else {
                badge.style.display = 'none';  // Hide badge
            }
        }
    });
}

// ============================================
// PROFILE DROPDOWN TOGGLE
// ============================================
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.add('hidden');
    }
});

// ============================================
// PROFILE SIDEBAR OPEN/CLOSE
// ============================================
const openProfileBtn = document.getElementById('open-profile-btn');
const closeSidebarBtn = document.getElementById('close-sidebar');
const profileSidebar = document.getElementById('profile-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function openSidebar() {
    profileSidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    profileDropdown.classList.add('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    profileSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

openProfileBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileSidebar.classList.contains('active')) {
        closeSidebar();
    }
});

// ============================================
// PHOTO UPLOAD (Preview Only)
// ============================================
const photoUploadInput = document.getElementById('photo-upload');
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const photoUploadWrapper = document.querySelector('.photo-upload-wrapper');
const sidebarPhoto = document.getElementById('sidebar-photo');

uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
photoUploadWrapper.addEventListener('click', () => photoUploadInput.click());

photoUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }
        
        selectedPhoto = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            sidebarPhoto.src = e.target.result;
        };
        reader.readAsDataURL(file);
        console.log('✅ Photo selected:', file.name);
    }
});

removePhotoBtn.addEventListener('click', () => {
    if (confirm('Remove your profile photo?')) {
        const firstName = (userData.name || 'Student').split(' ')[0];
        sidebarPhoto.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(firstName) + '&background=6366F1&color=fff';
        selectedPhoto = null;
        photoUploadInput.value = '';
    }
});

// ============================================
// BIO CHARACTER COUNT
// ============================================
const editBio = document.getElementById('edit-bio');
const bioCount = document.getElementById('bio-count');

function updateBioCount() {
    const count = editBio.value.length;
    bioCount.textContent = count;
    if (count > 200) {
        bioCount.style.color = 'red';
        editBio.value = editBio.value.substring(0, 200);
    } else {
        bioCount.style.color = '';
    }
}

editBio.addEventListener('input', updateBioCount);

// ============================================
// INTERESTS/SKILLS MANAGEMENT
// ============================================
const interestsContainer = document.getElementById('interests-container');
const newInterestInput = document.getElementById('new-interest');
const addInterestBtn = document.getElementById('add-interest-btn');

function renderInterests(interestsList) {
    interests = interestsList || [];
    interestsContainer.innerHTML = '';
    
    if (interests.length === 0) {
        interestsContainer.innerHTML = '<p class="text-sm text-gray-500">No skills added yet</p>';
        return;
    }
    
    interests.forEach((interest, index) => {
        const tag = document.createElement('div');
        tag.className = 'interest-tag';
        tag.innerHTML = `${interest}<button onclick="removeInterest(${index})" title="Remove"><i class="fas fa-times"></i></button>`;
        interestsContainer.appendChild(tag);
    });
}

function addInterest() {
    const interest = newInterestInput.value.trim();
    if (!interest) {
        alert('Please enter a skill');
        return;
    }
    if (interests.includes(interest)) {
        alert('This skill is already added');
        return;
    }
    if (interests.length >= 10) {
        alert('Maximum 10 skills allowed');
        return;
    }
    interests.push(interest);
    newInterestInput.value = '';
    renderInterests(interests);
}

function removeInterest(index) {
    interests.splice(index, 1);
    renderInterests(interests);
}

window.removeInterest = removeInterest;

addInterestBtn.addEventListener('click', addInterest);
newInterestInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addInterest();
    }
});

// ============================================
// SAVE PROFILE (TO MONGODB BACKEND)
// ============================================
const saveProfileBtn = document.getElementById('save-profile-btn');

saveProfileBtn.addEventListener('click', async () => {
    saveProfileBtn.disabled = true;
    saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    
    const name = document.getElementById('edit-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const institution = document.getElementById('edit-institution').value.trim();
    const whatsapp = document.getElementById('edit-whatsapp').value.trim();
    const discord = document.getElementById('edit-discord').value.trim();
    const linkedin = document.getElementById('edit-linkedin').value.trim();
    const github = document.getElementById('edit-github').value.trim();
    const portfolio = document.getElementById('edit-portfolio').value.trim();
    
    if (!name) {
        alert('Name is required');
        saveProfileBtn.disabled = false;
        saveProfileBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
        return;
    }
    
    try {
        const token = await getToken();
        
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                phoneNumber: phone,
                bio,
                institution,
                skills: interests,
                contactInfo: {
                    whatsappNumber: whatsapp,
                    discordId: discord
                },
                socialLinks: { 
                    linkedin, 
                    github, 
                    portfolio 
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Profile updated successfully in MongoDB');
            userData = data.user;
            userData.interests = data.user.skills || [];
            updateDashboardUI(userData);
            
            saveProfileBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
            saveProfileBtn.className = 'w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-sm sm:text-base';
            
            setTimeout(() => {
                saveProfileBtn.className = 'w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md text-sm sm:text-base';
                saveProfileBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
                saveProfileBtn.disabled = false;
                closeSidebar();
                // Reload students after profile update
                loadSuggestedStudents();
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to save profile');
        }
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        alert('Error saving profile: ' + error.message);
        saveProfileBtn.disabled = false;
        saveProfileBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
    }
});

// ============================================
// SEARCH BAR FUNCTIONALITY
// ============================================
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search');

// Search button click
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        } else {
            alert('Please enter a skill to search');
        }
    });
}

// Enter key to search
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
    
    // Show/hide clear button
    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 0) {
            clearSearchBtn.classList.remove('hidden');
            clearSearchBtn.classList.add('flex');
        } else {
            clearSearchBtn.classList.add('hidden');
            clearSearchBtn.classList.remove('flex');
        }
    });
}

// Clear search button
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
    });
}

// Quick search suggestions
const quickSearchBtns = document.querySelectorAll('.quick-search');
quickSearchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        searchInput.value = query;
        clearSearchBtn.classList.remove('hidden');
        clearSearchBtn.classList.add('flex');
        // Trigger search
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });
});

// Keyboard shortcut: "/" to focus search
document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !profileSidebar.classList.contains('active')) {
        e.preventDefault();
        searchInput.focus();
    }
});

// ============================================
// LOGOUT
// ============================================
const logoutBtn = document.getElementById('logout-btn');
const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut()
            .then(() => {
                console.log('✅ Logged out');
                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error('❌ Logout error:', error);
                window.location.href = 'login.html';
            });
    }
}

logoutBtn.addEventListener('click', handleLogout);
sidebarLogoutBtn.addEventListener('click', handleLogout);

// ============================================
// LOAD SUGGESTED STUDENTS (DASHBOARD)
// ============================================
let allStudents = [];
let currentFilter = 'all';

async function loadSuggestedStudents() {
    try {
        // Check if user profile is complete
        if (!userData.profileCompleted || !userData.skills || userData.skills.length === 0) {
            showEmptyProfileState();
            return;
        }
        
        const token = await getToken();
        const response = await fetch(`${API_URL}/search`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success && data.users && data.users.length > 0) {
            allStudents = data.users;
            displayStudents(allStudents.slice(0, 6)); // Show first 6 students
            updateResultsCount(data.users.length);
        } else {
            showNoStudentsState();
        }
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showNoStudentsState();
    }
}

function displayStudents(students) {
    const grid = document.getElementById('students-grid');
    const loading = document.getElementById('loading-students');
    const emptyProfile = document.getElementById('empty-profile');
    const noStudents = document.getElementById('no-students');
    
    // Hide all states
    loading.classList.add('hidden');
    emptyProfile.classList.add('hidden');
    noStudents.classList.add('hidden');
    
    if (students.length === 0) {
        showNoStudentsState();
        return;
    }
    
    grid.innerHTML = '';
    
    students.forEach(student => {
        const card = createStudentCard(student);
        grid.appendChild(card);
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl p-6 shadow-sm hover-lift cursor-pointer border border-gray-100';
    
    const photoUrl = student.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'User')}&background=6366F1&color=fff`;
    const skills = student.skills || [];
    const displaySkills = skills.slice(0, 3);
    const bio = student.bio || 'No bio available';
    const truncatedBio = bio.length > 80 ? bio.substring(0, 80) + '...' : bio;
    
    card.innerHTML = `
        <div class="flex items-start gap-4 mb-4">
            <img src="${photoUrl}" alt="${student.name}" class="w-14 h-14 rounded-full object-cover border-2 border-indigo-100 shadow-md">
            <div class="flex-1">
                <h3 class="text-base font-bold text-gray-900 mb-1">${student.name || 'User'}</h3>
                <p class="text-xs text-gray-500">${student.institution || 'Student'}</p>
            </div>
        </div>
        
        <p class="text-sm text-gray-600 mb-4 line-clamp-2">${truncatedBio}</p>
        
        <div class="flex flex-wrap gap-2 mb-4">
            ${displaySkills.map(skill => `
                <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold">
                    ${skill}
                </span>
            `).join('')}
            ${skills.length > 3 ? `
                <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                    +${skills.length - 3}
                </span>
            ` : ''}
        </div>
        
        <button onclick="viewProfile('${student._id}')" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all text-sm shadow-md hover:shadow-lg">
            <i class="fas fa-eye mr-2"></i>View Profile
        </button>
    `;
    
    return card;
}

function viewProfile(userId) {
    window.location.href = `profile-view.html?id=${userId}`;
}

window.viewProfile = viewProfile;

function showEmptyProfileState() {
    document.getElementById('students-grid').innerHTML = '';
    document.getElementById('loading-students').classList.add('hidden');
    document.getElementById('empty-profile').classList.remove('hidden');
    document.getElementById('no-students').classList.add('hidden');
}

function showNoStudentsState() {
    document.getElementById('students-grid').innerHTML = '';
    document.getElementById('loading-students').classList.add('hidden');
    document.getElementById('empty-profile').classList.add('hidden');
    document.getElementById('no-students').classList.remove('hidden');
}

function updateResultsCount(count) {
    const countEl = document.getElementById('results-count');
    if (count > 0) {
        countEl.textContent = `(${count} students)`;
    } else {
        countEl.textContent = '';
    }
}

// ============================================
// SKILL FILTER BUTTONS
// ============================================
const skillFilterBtns = document.querySelectorAll('.skill-filter-btn');

skillFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const skill = btn.getAttribute('data-skill');
        
        // Update active button
        skillFilterBtns.forEach(b => {
            b.className = 'skill-filter-btn px-5 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 whitespace-nowrap flex-shrink-0 transition-all border border-gray-200 shadow-sm';
        });
        btn.className = 'skill-filter-btn px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 hover:bg-indigo-700 transition-all shadow-md';
        
        currentFilter = skill;
        filterStudentsBySkill(skill);
    });
});

async function filterStudentsBySkill(skill) {
    try {
        if (skill === 'all') {
            displayStudents(allStudents.slice(0, 6));
            document.getElementById('results-title').textContent = 'Suggested Students';
            return;
        }
        
        const token = await getToken();
        const response = await fetch(`${API_URL}/search/skill/${skill}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success && data.users) {
            displayStudents(data.users.slice(0, 6));
            document.getElementById('results-title').textContent = `${skill} Experts`;
            updateResultsCount(data.users.length);
        } else {
            showNoStudentsState();
        }
    } catch (error) {
        console.error('❌ Error filtering students:', error);
    }
}

// ============================================
// LOAD STUDENTS ON PAGE LOAD
// ============================================
setTimeout(() => {
    if (currentUser && userData) {
        loadSuggestedStudents();
    }
}, 1000);

console.log('✅ Skill Sync Dashboard loaded successfully!');
console.log('🔗 Backend API: ' + API_URL);
console.log('📱 Mobile responsive: YES');
console.log('🎨 Profile sidebar: YES');
console.log('🔥 Firebase Auth: YES');
console.log('💾 MongoDB Backend: YES');
console.log('✨ Glassmorphism Search: YES');
