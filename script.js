// ============================================
// MOBILE MENU FUNCTIONALITY
// ============================================

const mobileToggle = document.getElementById('mobile-toggle');
const mobileClose = document.getElementById('mobile-close');
const mobileMenu = document.getElementById('mobile-menu');
const body = document.body;

// Open Mobile Menu
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.remove('translate-x-full');
        body.style.overflow = 'hidden';
    });
}

// Close Mobile Menu
if (mobileClose) {
    mobileClose.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        body.style.overflow = 'auto';
    });
}

// Close menu when clicking on links
const mobileMenuLinks = document.querySelectorAll('#mobile-menu a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        body.style.overflow = 'auto';
    });
});

// ============================================
// MOBILE MORE DROPDOWN
// ============================================

const mobileMore = document.getElementById('mobile-more');
const mobileMoreContent = document.getElementById('mobile-more-content');
const mobileArrow = document.querySelector('.mobile-arrow');

if (mobileMore && mobileMoreContent) {
    mobileMore.addEventListener('click', () => {
        mobileMoreContent.classList.toggle('hidden');
        
        if (mobileArrow) {
            mobileArrow.style.transform = mobileMoreContent.classList.contains('hidden') 
                ? 'rotate(0deg)' 
                : 'rotate(180deg)';
        }
    });
}

// ============================================
// DESKTOP MORE DROPDOWN
// ============================================

const desktopMoreBtn = document.getElementById('desktop-more-btn');
const desktopMoreMenu = document.getElementById('desktop-more-menu');
const desktopMore = document.getElementById('desktop-more');

if (desktopMoreBtn && desktopMoreMenu) {
    // Toggle dropdown on button click
    desktopMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        desktopMoreMenu.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (desktopMore && !desktopMore.contains(e.target)) {
            desktopMoreMenu.classList.add('hidden');
        }
    });

    // Close dropdown when clicking on dropdown links
    const desktopDropdownLinks = desktopMoreMenu.querySelectorAll('a');
    desktopDropdownLinks.forEach(link => {
        link.addEventListener('click', () => {
            desktopMoreMenu.classList.add('hidden');
        });
    });
}

// ============================================
// SMOOTH SCROLLING
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            // Calculate navbar height based on screen size
            const navHeight = window.innerWidth >= 1024 ? 72 : 56;
            const offsetTop = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// NAVBAR SCROLL SHADOW EFFECT
// ============================================

let lastScroll = 0;
const navbar = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add shadow when scrolling down
    if (currentScroll > 20) {
        navbar.classList.add('shadow-lg');
    } else {
        navbar.classList.remove('shadow-lg');
    }
    
    lastScroll = currentScroll;
});

// ============================================
// ACTIVE LINK HIGHLIGHTING (Optional)
// ============================================

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const scrollPosition = window.scrollY + 100;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('border-b-2', 'border-blue-600', 'text-gray-900');
        
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('border-b-2', 'border-blue-600', 'text-gray-900');
        }
    });
});

// ============================================
// PREVENT BODY SCROLL WHEN MENU OPEN
// ============================================

// Prevent scrolling when mobile menu is open
const preventScroll = (e) => {
    if (body.style.overflow === 'hidden') {
        e.preventDefault();
    }
};

// Add touch event listeners for mobile
document.addEventListener('touchmove', preventScroll, { passive: false });

// ============================================
// PAGE LOAD ANIMATIONS (Optional)
// ============================================

window.addEventListener('load', () => {
    // Add fade-in animation to sections
    const animatedElements = document.querySelectorAll('section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
});

// ============================================
// CONSOLE LOG
// ============================================

console.log('✅ Navigation Ready - Pixel Perfect Mobile & Desktop!');
console.log('📱 Mobile Menu: Slide-in from right');
console.log('🖥️ Desktop Menu: Dropdown working');
console.log('🎯 All features loaded successfully!');
