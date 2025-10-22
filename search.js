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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// ============================================
// BACKEND API URL - PRODUCTION
// ============================================
const API_URL = 'https://skill-sync-backend-o5lw.onrender.com/api';

let currentUser = null;
let allUsers = [];

// Helper function to get Firebase token
async function getToken() {
    if (currentUser) {
        return await currentUser.getIdToken();
    }
    return null;
}

// ============================================
// CHECK AUTHENTICATION
// ============================================
let authInitialized = false;
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.phoneNumber);
        loadAllUsers();
        
        // Check if there's a search query in URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            document.getElementById('search-input').value = query;
            performSearch(query);
        }
    } else {
        // Only redirect if this is not the first call (auth initialized)
        if (authInitialized) {
            console.log('❌ No user, redirecting to login');
            window.location.href = 'login.html';
        }
    }
    authInitialized = true;
});

// ============================================
// LOAD ALL USERS FROM MONGODB
// ============================================
async function loadAllUsers() {
    showLoading();
    
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/search`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users.map(user => ({
                id: user._id,
                name: user.name,
                bio: user.bio,
                institution: user.institution,
                interests: user.skills || [],
                profilePhoto: user.profilePhoto,
                email: user.email,
                phoneNumber: user.phoneNumber
            }));
            
            console.log(`✅ Loaded ${allUsers.length} users from MongoDB`);
            displayResults(allUsers);
        } else {
            console.error('❌ Failed to load users:', data.error);
            showNoResults();
        }
        
        hideLoading();
    } catch (error) {
        console.error('❌ Error loading users:', error);
        hideLoading();
        showNoResults();
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    performSearch(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        performSearch(query);
    }
});

async function performSearch(query) {
    if (!query) {
        loadAllUsers();
        return;
    }
    
    showLoading();
    
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const searchResults = data.users.map(user => ({
                id: user._id,
                name: user.name,
                bio: user.bio,
                institution: user.institution,
                interests: user.skills || [],
                profilePhoto: user.profilePhoto,
                email: user.email,
                phoneNumber: user.phoneNumber
            }));
            
            console.log(`✅ Found ${searchResults.length} results for "${query}"`);
            displayResults(searchResults);
        } else {
            console.error('❌ Search failed:', data.error);
            displayResults([]);
        }
        
        hideLoading();
    } catch (error) {
        console.error('❌ Error searching:', error);
        hideLoading();
        displayResults([]);
    }
}

// ============================================
// SKILL FILTER BUTTONS
// ============================================
const filterButtons = document.querySelectorAll('.skill-filter-btn');

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        filterButtons.forEach(b => {
            b.classList.remove('bg-indigo-600', 'text-white');
            b.classList.add('bg-gray-100', 'text-gray-700');
        });
        btn.classList.remove('bg-gray-100', 'text-gray-700');
        btn.classList.add('bg-indigo-600', 'text-white');
        
        const skill = btn.dataset.skill;
        
        if (skill === 'all') {
            displayResults(allUsers);
            searchInput.value = '';
        } else {
            searchInput.value = skill;
            performSearch(skill);
        }
    });
});

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(users) {
    const resultsGrid = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    
    resultsCount.textContent = users.length;
    
    if (users.length === 0) {
        resultsGrid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    resultsGrid.innerHTML = '';
    
    users.forEach(user => {
        const card = createUserCard(user);
        resultsGrid.appendChild(card);
    });
}

// ============================================
// CREATE USER CARD
// ============================================
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-5 shadow-sm hover-lift cursor-pointer';
    
    const photoUrl = user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366F1&color=fff`;
    const firstName = (user.name || 'User').split(' ')[0];
    
    // Get first 3 skills
    const skills = user.interests || [];
    const displaySkills = skills.slice(0, 3);
    const remainingCount = skills.length - 3;
    
    card.innerHTML = `
        <div class="flex items-start gap-4 mb-4">
            <img src="${photoUrl}" alt="${user.name}" class="w-14 h-14 rounded-full object-cover border-2 border-indigo-100">
            <div class="flex-1">
                <h3 class="text-base font-bold text-gray-900 mb-1">${user.name || 'User'}</h3>
                <p class="text-xs text-gray-500 mb-2">${user.institution || 'Student'}</p>
                ${user.bio ? `<p class="text-sm text-gray-600 line-clamp-2">${user.bio}</p>` : ''}
            </div>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-4">
            ${displaySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            ${remainingCount > 0 ? `<span class="skill-tag">+${remainingCount} more</span>` : ''}
        </div>
        
        <button onclick="viewProfile('${user.id}')" class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm">
            <i class="fas fa-eye mr-2"></i>View Profile
        </button>
    `;
    
    return card;
}

// ============================================
// VIEW PROFILE
// ============================================
function viewProfile(userId) {
    window.location.href = `profile-view.html?id=${userId}`;
}

window.viewProfile = viewProfile;

// ============================================
// LOADING STATES
// ============================================
function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('results-grid').classList.add('hidden');
    document.getElementById('no-results').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('results-grid').classList.remove('hidden');
}

function showNoResults() {
    document.getElementById('results-grid').classList.add('hidden');
    document.getElementById('no-results').classList.remove('hidden');
}

console.log('✅ Search page loaded');
console.log('🔗 Backend API:', API_URL);
