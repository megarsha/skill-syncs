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
let profileUserId = null;
let profileData = null;
let connectionStatus = null;

// Helper function to get Firebase token
async function getToken() {
    if (currentUser) {
        return await currentUser.getIdToken();
    }
    return null;
}

// ============================================
// GET USER ID FROM URL
// ============================================
const urlParams = new URLSearchParams(window.location.search);
profileUserId = urlParams.get('id');

if (!profileUserId) {
    alert('Invalid profile link');
    window.location.href = 'search.html';
}

// ============================================
// CHECK AUTHENTICATION
// ============================================
let authInitialized = false;
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.phoneNumber);
        loadProfileData();
        checkConnectionStatus();
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
// LOAD PROFILE DATA FROM MONGODB
// ============================================
async function loadProfileData() {
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/users/${profileUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.user) {
            profileData = {
                ...data.user,
                interests: data.user.skills || []
            };
            console.log('✅ Profile loaded from MongoDB:', profileData);
            displayProfile(profileData);
        } else {
            alert('User not found');
            window.location.href = 'search.html';
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        alert('Error loading profile');
    }
}

// ============================================
// CHECK CONNECTION STATUS
// ============================================
async function checkConnectionStatus() {
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/connections/status/${profileUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            connectionStatus = data.status;
            updateActionButton(data.status, data.direction);
        }
    } catch (error) {
        console.error('❌ Error checking connection status:', error);
    }
}

// ============================================
// DISPLAY PROFILE
// ============================================
function displayProfile(data) {
    // Profile photo
    const photoUrl = data.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=6366F1&color=fff`;
    document.getElementById('profile-photo').src = photoUrl;
    
    // Name and institution
    document.getElementById('user-name').textContent = data.name || 'User';
    document.getElementById('user-institution').textContent = data.institution || 'Student';
    
    // Bio
    if (data.bio) {
        document.getElementById('bio-section').classList.remove('hidden');
        document.getElementById('user-bio').textContent = data.bio;
    }
    
    // Skills
    const skillsContainer = document.getElementById('skills-container');
    if (data.interests && data.interests.length > 0) {
        skillsContainer.innerHTML = data.interests.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
    } else {
        skillsContainer.innerHTML = '<p class="text-gray-500 text-sm">No skills added yet</p>';
    }
    
    // Social links
    const socialLinks = data.socialLinks || {};
    const socialContainer = document.getElementById('social-links-container');
    let socialHTML = '';
    
    if (socialLinks.linkedin) {
        socialHTML += `
            <a href="${socialLinks.linkedin}" target="_blank" class="social-link">
                <i class="fab fa-linkedin text-blue-600 text-xl"></i>
                <span class="text-sm font-medium text-gray-700">LinkedIn Profile</span>
                <i class="fas fa-external-link-alt text-gray-400 text-xs ml-auto"></i>
            </a>
        `;
    }
    
    if (socialLinks.github) {
        socialHTML += `
            <a href="${socialLinks.github}" target="_blank" class="social-link">
                <i class="fab fa-github text-gray-900 text-xl"></i>
                <span class="text-sm font-medium text-gray-700">GitHub Profile</span>
                <i class="fas fa-external-link-alt text-gray-400 text-xs ml-auto"></i>
            </a>
        `;
    }
    
    if (socialLinks.portfolio) {
        socialHTML += `
            <a href="${socialLinks.portfolio}" target="_blank" class="social-link">
                <i class="fas fa-globe text-green-600 text-xl"></i>
                <span class="text-sm font-medium text-gray-700">Portfolio Website</span>
                <i class="fas fa-external-link-alt text-gray-400 text-xs ml-auto"></i>
            </a>
        `;
    }
    
    if (socialHTML) {
        document.getElementById('social-section').classList.remove('hidden');
        socialContainer.innerHTML = socialHTML;
    }
}

// ============================================
// UPDATE ACTION BUTTON
// ============================================
function updateActionButton(status, direction) {
    const container = document.getElementById('action-button-container');
    const badge = document.getElementById('connection-status-badge');
    
    if (status === 'accepted') {
        // Show "Connected" status
        badge.innerHTML = '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold"><i class="fas fa-check-circle mr-1"></i>Connected</span>';
        
        container.innerHTML = `
            <button disabled class="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2">
                <i class="fas fa-check"></i>
                <span>Connected</span>
            </button>
        `;
        
        // Show contact information
        showContactInformation();
        
    } else if (status === 'pending' && direction === 'sent') {
        // Request sent, waiting for response
        badge.innerHTML = '<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold"><i class="fas fa-clock mr-1"></i>Request Pending</span>';
        
        container.innerHTML = `
            <button disabled class="w-full sm:w-auto px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2">
                <i class="fas fa-clock"></i>
                <span>Request Pending</span>
            </button>
        `;
        
    } else if (status === 'pending' && direction === 'received') {
        // They sent request to me
        badge.innerHTML = '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"><i class="fas fa-inbox mr-1"></i>Sent You Request</span>';
        
        container.innerHTML = `
            <a href="requests.html" class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <i class="fas fa-inbox"></i>
                <span>View Request</span>
            </a>
        `;
        
    } else {
        // No connection - show "Send Connection Request" button
        container.innerHTML = `
            <button id="send-connection-btn" class="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                <i class="fas fa-user-plus"></i>
                <span>Send Connection Request</span>
            </button>
        `;
        
        // Add click event
        document.getElementById('send-connection-btn').addEventListener('click', openConnectionModal);
    }
}

// ============================================
// SHOW CONTACT INFORMATION (FOR CONNECTED USERS)
// ============================================
function showContactInformation() {
    if (!profileData) return;
    
    const contactSection = document.getElementById('contact-section');
    const contactInfo = document.getElementById('contact-info');
    
    const contact = profileData.contactInfo || {};
    let contactHTML = '';
    
    // Email
    if (profileData.email) {
        contactHTML += `
            <a href="mailto:${profileData.email}" class="social-link bg-white">
                <i class="fas fa-envelope text-red-600 text-xl"></i>
                <div class="flex-1">
                    <p class="text-xs text-gray-500">Email</p>
                    <p class="text-sm font-medium text-gray-900">${profileData.email}</p>
                </div>
                <i class="fas fa-external-link-alt text-gray-400 text-xs"></i>
            </a>
        `;
    }
    
    // Phone
    if (profileData.phoneNumber) {
        contactHTML += `
            <a href="tel:${profileData.phoneNumber}" class="social-link bg-white">
                <i class="fas fa-phone text-blue-600 text-xl"></i>
                <div class="flex-1">
                    <p class="text-xs text-gray-500">Phone</p>
                    <p class="text-sm font-medium text-gray-900">${profileData.phoneNumber}</p>
                </div>
                <i class="fas fa-external-link-alt text-gray-400 text-xs"></i>
            </a>
        `;
    }
    
    // WhatsApp
    if (contact.whatsappNumber) {
        const whatsappLink = `https://wa.me/${contact.whatsappNumber.replace(/[^0-9]/g, '')}`;
        contactHTML += `
            <a href="${whatsappLink}" target="_blank" class="social-link bg-white">
                <i class="fab fa-whatsapp text-green-600 text-xl"></i>
                <div class="flex-1">
                    <p class="text-xs text-gray-500">WhatsApp</p>
                    <p class="text-sm font-medium text-gray-900">${contact.whatsappNumber}</p>
                </div>
                <i class="fas fa-external-link-alt text-gray-400 text-xs"></i>
            </a>
        `;
    }
    
    // Discord
    if (contact.discordId) {
        contactHTML += `
            <div class="social-link bg-white">
                <i class="fab fa-discord text-indigo-600 text-xl"></i>
                <div class="flex-1">
                    <p class="text-xs text-gray-500">Discord</p>
                    <p class="text-sm font-medium text-gray-900">${contact.discordId}</p>
                </div>
            </div>
        `;
    }
    
    if (contactHTML) {
        contactInfo.innerHTML = contactHTML;
        contactSection.classList.remove('hidden');
    }
}

// ============================================
// CONNECTION MODAL
// ============================================
const modal = document.getElementById('connection-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const sendRequestBtn = document.getElementById('send-request-btn');
const messageTextarea = document.getElementById('connection-message');
const messageCount = document.getElementById('message-count');

function openConnectionModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConnectionModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

closeModalBtn.addEventListener('click', closeConnectionModal);
cancelBtn.addEventListener('click', closeConnectionModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeConnectionModal();
    }
});

// Message character count
messageTextarea.addEventListener('input', () => {
    const count = messageTextarea.value.length;
    messageCount.textContent = count;
    if (count > 300) {
        messageTextarea.value = messageTextarea.value.substring(0, 300);
    }
});

// ============================================
// SEND CONNECTION REQUEST
// ============================================
sendRequestBtn.addEventListener('click', async () => {
    sendRequestBtn.disabled = true;
    sendRequestBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    
    const message = messageTextarea.value.trim();
    
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/connections/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                receiverId: profileUserId,
                message: message || ''
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Connection request sent');
            
            sendRequestBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Sent!';
            sendRequestBtn.className = 'flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold';
            
            setTimeout(() => {
                closeConnectionModal();
                checkConnectionStatus(); // Refresh button state
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to send request');
        }
    } catch (error) {
        console.error('❌ Error sending request:', error);
        alert('Error sending request. Please try again.');
        sendRequestBtn.disabled = false;
        sendRequestBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Request';
    }
});

console.log('✅ Profile view loaded');
console.log('🔗 Backend API:', API_URL);
