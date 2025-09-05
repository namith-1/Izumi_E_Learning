// DOM Elements
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;
const testimonialCards = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const logo = document.querySelector('.logo-3d');
const cubeElement = document.querySelector('.cube');
const featureCards = document.querySelectorAll('.feature-card');
const subjectCards = document.querySelectorAll('.subject-card');

// Theme Toggle
function initThemeToggle() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    themeSwitch.checked = true;
  } else {
    body.classList.add('light-mode');
    body.classList.remove('dark-mode');
    themeSwitch.checked = false;
  }

  // Toggle theme
  themeSwitch.addEventListener('change', function() {
    if (this.checked) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
    
    // Add fade transition
    body.style.transition = 'background-color 0.5s, color 0.5s';
  });
}

// Testimonial Slider
let currentSlide = 0;

function showSlide(index) {
  testimonialCards.forEach(card => {
    card.classList.remove('active');
  });
  
  dots.forEach(dot => {
    dot.classList.remove('active');
  });
  
  // Handle out of bounds
  if (index < 0) {
    currentSlide = testimonialCards.length - 1;
  } else if (index >= testimonialCards.length) {
    currentSlide = 0;
  } else {
    currentSlide = index;
  }
  
  testimonialCards[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function initTestimonialSlider() {
  // Initial slide setup
  showSlide(currentSlide);
  
  // Event listeners for controls
  prevBtn.addEventListener('click', () => {
    showSlide(currentSlide - 1);
  });
  
  nextBtn.addEventListener('click', () => {
    showSlide(currentSlide + 1);
  });
  
  // Click on dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
    });
  });
  
  // Auto slide
  setInterval(() => {
    showSlide(currentSlide + 1);
  }, 5000);
}

// 3D Logo Animation
function initLogoAnimation() {
  logo.addEventListener('mousemove', function(e) {
    const logoRect = this.getBoundingClientRect();
    const x = (e.clientX - logoRect.left) / logoRect.width - 0.5;
    const y = (e.clientY - logoRect.top) / logoRect.height - 0.5;
    
    this.querySelector('.logo-text').style.transform = `
      rotateY(${x * 20}deg)
      rotateX(${-y * 20}deg)
      translateZ(10px)
    `;
  });
  
  logo.addEventListener('mouseleave', function() {
    this.querySelector('.logo-text').style.transform = 'rotateY(0) rotateX(0) translateZ(0)';
  });
}

// 3D Cube Animation (enhanced interactivity)
function initCubeInteractivity() {
  const scene = document.querySelector('.scene');
  
  scene.addEventListener('mousemove', function(e) {
    const rect = this.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    cubeElement.style.animation = 'none';
    cubeElement.style.transform = `
      translateZ(-100px) 
      rotateX(${-y * 40}deg) 
      rotateY(${x * 40}deg)
    `;
  });
  
  scene.addEventListener('mouseleave', function() {
    cubeElement.style.animation = 'cube-rotation 20s infinite linear';
    cubeElement.style.transform = 'translateZ(-100px) rotateX(0) rotateY(0)';
  });
}

// Scroll Animation
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  // Create intersection observer for features
  const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Prepare feature cards for animation
  featureCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.5s ease ${index * 0.1}s`;
    featureObserver.observe(card);
  });
  
  // Create intersection observer for subjects
  const subjectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Prepare subject cards for animation
  subjectCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.5s ease ${index * 0.1}s`;
    subjectObserver.observe(card);
  });
  
  // Animate sections on scroll
  const sections = document.querySelectorAll('section');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
      }
    });
  }, {
    threshold: 0.1
  });
  
  sections.forEach(section => {
    sectionObserver.observe(section);
  });
}

// Parallax Effect
function initParallaxEffect() {
  const floatingElements = document.querySelectorAll('.float-element, .floating-shape');
  
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    
    floatingElements.forEach(element => {
      const speed = 20;
      const elementX = -x * speed;
      const elementY = -y * speed;
      element.style.transform = `translate(${elementX}px, ${elementY}px) rotate(${elementX}deg)`;
    });
  });
}

// Header Scroll Effect
function initHeaderScrollEffect() {
  const header = document.querySelector('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.padding = '15px 0';
      header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
    } else {
      header.style.padding = '20px 0';
      header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
  });
}

// Initialize all functions
document.addEventListener('DOMContentLoaded', function() {
  initThemeToggle();
  initTestimonialSlider();
  initLogoAnimation();
  initCubeInteractivity();
  initScrollAnimations();
  initParallaxEffect();
  initHeaderScrollEffect();
});