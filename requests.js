// ============================================
// FIREBASE CONFIGURATION
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

console.log('🔥 Firebase initialized');
console.log('🔗 API URL:', API_URL);

let currentUser = null;

// Helper to get Firebase token
async function getToken() {
    const user = auth.currentUser;
    console.log('🔑 Getting token, current user:', user ? user.phoneNumber : 'null');
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
}

// ============================================
// CHECK AUTHENTICATION
// ============================================
console.log('⏳ Setting up auth state listener...');
let authInitialized = false;
auth.onAuthStateChanged(async (user) => {
    console.log('🔔 Auth state changed, user:', user ? user.phoneNumber : 'null');
    
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.phoneNumber);
        console.log('🔑 Firebase UID:', user.uid);
        
        // Get MongoDB user info
        try {
            const token = await user.getIdToken();
            console.log('🎫 Token obtained');
            const response = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await response.json();
            console.log('👤 MongoDB User Data:', userData);
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
        }
        
        console.log('📞 Calling loadReceivedRequests()');
        loadReceivedRequests();
        console.log('📞 Calling loadSentRequests()');
        loadSentRequests();
    } else {
        // Only redirect if this is not the first call (auth initialized)
        if (authInitialized) {
            console.log('❌ No user, redirecting to login');
            window.location.href = 'login.html';
        } else {
            console.log('⏳ Auth not initialized yet, waiting...');
        }
    }
    authInitialized = true;
});

// ============================================
// TAB SWITCHING
// ============================================
const receivedTab = document.getElementById('received-tab');
const sentTab = document.getElementById('sent-tab');
const receivedSection = document.getElementById('received-section');
const sentSection = document.getElementById('sent-section');

receivedTab.addEventListener('click', () => {
    receivedTab.className = 'px-4 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 transition-all';
    sentTab.className = 'px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all';
    receivedSection.classList.remove('hidden');
    sentSection.classList.add('hidden');
});

sentTab.addEventListener('click', () => {
    sentTab.className = 'px-4 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 transition-all';
    receivedTab.className = 'px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all';
    sentSection.classList.remove('hidden');
    receivedSection.classList.add('hidden');
});

// ============================================
// LOAD RECEIVED REQUESTS
// ============================================
async function loadReceivedRequests() {
    try {
        console.log('📥 Loading received requests...');
        const token = await getToken();
        console.log('🔑 Token obtained:', token ? 'Yes' : 'No');
        
        const response = await fetch(`${API_URL}/connections/pending`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📊 Response data:', data);
        
        if (data.success) {
            const container = document.getElementById('received-requests');
            const noRequests = document.getElementById('no-received');
            const pendingCount = document.getElementById('pending-count');
            
            pendingCount.textContent = data.count || 0;
            console.log('✅ Pending count:', data.count);
            
            if (!data.requests || data.requests.length === 0) {
                container.innerHTML = '';
                noRequests.classList.remove('hidden');
                console.log('📭 No requests found');
                return;
            }
            
            noRequests.classList.add('hidden');
            container.innerHTML = '';
            
            console.log(`📋 Found ${data.requests.length} requests`);
            data.requests.forEach((request) => {
                createReceivedRequestCard(request, container);
            });
        } else {
            console.error('❌ API returned error:', data.error);
        }
    } catch (error) {
        console.error('❌ Error loading received requests:', error);
    }
}

// ============================================
// LOAD SENT REQUESTS
// ============================================
async function loadSentRequests() {
    try {
        console.log('📤 Loading sent requests...');
        const token = await getToken();
        const response = await fetch(`${API_URL}/connections/sent`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Sent requests response status:', response.status);
        const data = await response.json();
        console.log('📊 Sent requests data:', data);
        
        if (data.success) {
            const container = document.getElementById('sent-requests');
            const noRequests = document.getElementById('no-sent');
            const sentCount = document.getElementById('sent-count');
            
            sentCount.textContent = data.count || 0;
            console.log('✅ Sent count:', data.count);
            
            if (!data.requests || data.requests.length === 0) {
                container.innerHTML = '';
                noRequests.classList.remove('hidden');
                console.log('📭 No sent requests found');
                return;
            }
            
            noRequests.classList.add('hidden');
            container.innerHTML = '';
            
            console.log(`📋 Found ${data.requests.length} sent requests`);
            data.requests.forEach((request) => {
                createSentRequestCard(request, container);
            });
        } else {
            console.error('❌ API returned error:', data.error);
        }
    } catch (error) {
        console.error('❌ Error loading sent requests:', error);
    }
}

// ============================================
// CREATE RECEIVED REQUEST CARD
// ============================================
function createReceivedRequestCard(request, container) {
    const userData = request.sender; // sender info is populated by backend
    const card = document.createElement('div');
    card.className = 'request-card bg-white rounded-xl p-5 shadow-sm';
    
    const photoUrl = userData.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366F1&color=fff`;
    const skills = userData.skills || [];
    const displaySkills = skills.slice(0, 3);
    
    card.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-4">
            <img src="${photoUrl}" alt="${userData.name}" class="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100">
            
            <div class="flex-1">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">${userData.name || 'User'}</h3>
                        <p class="text-sm text-gray-500">${userData.institution || 'Student'}</p>
                    </div>
                    <span class="text-xs text-gray-500">${getTimeAgo(request.createdAt)}</span>
                </div>
                
                ${request.message ? `
                    <div class="bg-gray-50 rounded-lg p-3 mb-3">
                        <p class="text-sm text-gray-700"><i class="fas fa-quote-left text-gray-400 text-xs mr-1"></i>${request.message}</p>
                    </div>
                ` : ''}
                
                <div class="flex flex-wrap gap-2 mb-3">
                    ${displaySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    ${skills.length > 3 ? `<span class="skill-tag">+${skills.length - 3} more</span>` : ''}
                </div>
                
                <div class="flex flex-col sm:flex-row gap-2">
                    <button onclick="acceptRequest('${request._id}')" class="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all text-sm">
                        <i class="fas fa-check mr-2"></i>Accept
                    </button>
                    <button onclick="rejectRequest('${request._id}')" class="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all text-sm">
                        <i class="fas fa-times mr-2"></i>Reject
                    </button>
                    <a href="profile-view.html?id=${userData._id}" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all text-sm text-center">
                        <i class="fas fa-eye mr-2"></i>View Profile
                    </a>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

// ============================================
// CREATE SENT REQUEST CARD
// ============================================
function createSentRequestCard(request, container) {
    const userData = request.receiver; // receiver info is populated by backend
    const card = document.createElement('div');
    card.className = 'request-card bg-white rounded-xl p-5 shadow-sm';
    
    const photoUrl = userData.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366F1&color=fff`;
    const skills = userData.skills || [];
    const displaySkills = skills.slice(0, 3);
    
    card.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-4">
            <img src="${photoUrl}" alt="${userData.name}" class="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100">
            
            <div class="flex-1">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">${userData.name || 'User'}</h3>
                        <p class="text-sm text-gray-500">${userData.institution || 'Student'}</p>
                    </div>
                    <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                        <i class="fas fa-clock mr-1"></i>Pending
                    </span>
                </div>
                
                ${request.message ? `
                    <div class="bg-blue-50 rounded-lg p-3 mb-3">
                        <p class="text-xs text-gray-500 mb-1">Your message:</p>
                        <p class="text-sm text-gray-700">${request.message}</p>
                    </div>
                ` : ''}
                
                <div class="flex flex-wrap gap-2 mb-3">
                    ${displaySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                
                <div class="flex gap-2">
                    <a href="profile-view.html?id=${userData._id}" class="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm text-center">
                        <i class="fas fa-eye mr-2"></i>View Profile
                    </a>
                    <button onclick="cancelRequest('${request._id}')" class="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all text-sm">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

// ============================================
// ACCEPT REQUEST
// ============================================
async function acceptRequest(requestId) {
    if (confirm('Accept this connection request?')) {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/connections/${requestId}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Request accepted');
                loadReceivedRequests(); // Reload the list
            } else {
                alert('Error: ' + (data.error || 'Failed to accept request'));
            }
        } catch (error) {
            console.error('❌ Error accepting request:', error);
            alert('Error accepting request');
        }
    }
}

// ============================================
// REJECT REQUEST
// ============================================
async function rejectRequest(requestId) {
    if (confirm('Reject this connection request?')) {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/connections/${requestId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Request rejected');
                loadReceivedRequests(); // Reload the list
            } else {
                alert('Error: ' + (data.error || 'Failed to reject request'));
            }
        } catch (error) {
            console.error('❌ Error rejecting request:', error);
            alert('Error rejecting request');
        }
    }
}

// ============================================
// CANCEL REQUEST
// ============================================
async function cancelRequest(requestId) {
    if (confirm('Cancel this connection request?')) {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/connections/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Request cancelled');
                loadSentRequests(); // Reload the list
            } else {
                alert('Error: ' + (data.error || 'Failed to cancel request'));
            }
        } catch (error) {
            console.error('❌ Error cancelling request:', error);
            alert('Error cancelling request');
        }
    }
}

window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.cancelRequest = cancelRequest;

// ============================================
// TIME AGO HELPER
// ============================================
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

console.log('✅ Requests page loaded');
