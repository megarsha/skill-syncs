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

// ============================================
// BACKEND API URL - PRODUCTION
// ============================================
const API_URL = 'https://skill-sync-backend-o5lw.onrender.com';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let recaptchaVerifier;
let confirmationResult;

// ============================================
// INITIALIZE RECAPTCHA ON PAGE LOAD
// ============================================
window.onload = function() {
    // Initialize invisible reCAPTCHA for login page
    if (document.getElementById('recaptcha-container')) {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
            }
        });
    }
    
    // Initialize for signup page
    if (document.getElementById('recaptcha-signup-container')) {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-signup-container', {
            'size': 'invisible',
            'callback': (response) => {
                console.log('reCAPTCHA solved');
            }
        });
    }
    
    // ONLY CHECK AUTH FOR LOGIN/SIGNUP PAGES
    checkAuthForLoginPages();
};

// ============================================
// CHECK AUTH STATE (ONLY FOR LOGIN/SIGNUP PAGES)
// ============================================
function checkAuthForLoginPages() {
    const currentPage = window.location.pathname;
    
    // Only run on login or signup pages
    if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is already logged in, redirect to dashboard
                console.log('✅ User already logged in, redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            }
        });
    }
}

// ============================================
// PHONE LOGIN FUNCTIONALITY
// ============================================
if (document.getElementById('phone-login-form')) {
    document.getElementById('phone-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const countryCode = document.getElementById('country-code').value;
        const phoneNumber = document.getElementById('phone').value.trim();
        const fullNumber = countryCode + phoneNumber;
        const submitBtn = document.getElementById('send-otp-btn');
        
        // Validation
        if (phoneNumber.length !== 10) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }
        
        // Show loading state
        submitBtn.textContent = 'Sending OTP...';
        submitBtn.disabled = true;
        
        console.log('Sending OTP to:', fullNumber);
        
        // Send OTP
        firebase.auth().signInWithPhoneNumber(fullNumber, recaptchaVerifier)
            .then((result) => {
                confirmationResult = result;
                console.log('OTP sent successfully');
                
                // Prompt for OTP
                const otp = prompt('Enter the 6-digit OTP sent to ' + fullNumber);
                
                if (otp && otp.length === 6) {
                    // Verify OTP
                    submitBtn.textContent = 'Verifying...';
                    return confirmationResult.confirm(otp);
                } else {
                    throw new Error('Invalid OTP format');
                }
            })
            .then((result) => {
                const user = result.user;
                console.log('Login successful:', user);
                
                // Save user to MongoDB backend - UPDATED URL
                return user.getIdToken().then((token) => {
                    return fetch(`${API_URL}/api/auth/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(response => response.json())
                .then((data) => {
                    if (data.success) {
                        console.log('✅ User registered/logged in MongoDB:', data.message);
                        console.log('✅ Redirecting to dashboard...');
                        window.location.href = 'dashboard.html';
                    } else {
                        throw new Error(data.error || 'Failed to register user');
                    }
                });
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error: ' + error.message);
                
                // Reset button
                submitBtn.textContent = 'Login';
                submitBtn.disabled = false;
                
                // Reset reCAPTCHA
                if (recaptchaVerifier) {
                    recaptchaVerifier.clear();
                    recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                        'size': 'invisible'
                    });
                }
            });
    });
}

// ============================================
// GOOGLE LOGIN FUNCTIONALITY
// ============================================
if (document.getElementById('google-login-btn')) {
    document.getElementById('google-login-btn').addEventListener('click', function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                console.log('Google login successful:', user);
                
                // Save/update user in MongoDB backend - UPDATED
                return user.getIdToken().then((token) => {
                    return fetch(`${API_URL}/api/auth/google`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            uid: user.uid,
                            name: user.displayName,
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            profilePhoto: user.photoURL
                        })
                    });
                })
                .then(response => response.json())
                .then((data) => {
                    if (data.success) {
                        console.log('✅ Google login successful in MongoDB');
                        console.log('✅ Redirecting to dashboard...');
                        window.location.href = 'dashboard.html';
                    } else {
                        throw new Error(data.error || 'Failed to save user');
                    }
                });
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            });
    });
}

// ============================================
// PHONE NUMBER FORMATTING
// ============================================
const phoneInputs = document.querySelectorAll('input[type="tel"]');
phoneInputs.forEach(input => {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });
});

console.log('✅ Skill Sync - Auth System Ready!');
console.log('🌐 Backend API:', API_URL);
