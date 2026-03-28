// Scroll animations using Intersection Observer API
console.log('Animations module loaded');

// Initialize Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -10% 0px'
};

const observerCallback = (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      scrollObserver.unobserve(entry.target);
    }
  });
};

const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

const initScrollAnimations = () => {
  const fadeElements = document.querySelectorAll('.fade-in-element, .fade-in-stagger');
  fadeElements.forEach(el => scrollObserver.observe(el));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}

// Scroll indicator fade-out on scroll
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
  const handleScroll = () => {
    if (window.scrollY > 100) {
      scrollIndicator.style.opacity = '0';
      scrollIndicator.style.pointerEvents = 'none';
    } else {
      scrollIndicator.style.opacity = '0.7';
      scrollIndicator.style.pointerEvents = 'auto';
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

// Smooth scroll for scroll indicator
if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    const cellarSection = document.getElementById('cellar');
    if (cellarSection) {
      cellarSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Luxurious smooth scroll matching $transition-reveal: cubic-bezier(0.4, 0.0, 0.2, 1)
const luxuryScrollTo = (targetY, duration = 1200) => {
  const startY = window.scrollY;
  const distance = targetY - startY;

  // Solves cubic-bezier(x1,y1,x2,y2) at a given progress value
  // using binary search to find t where sampleX(t) = progress, then returns sampleY(t)
  const cubicBezierEase = (progress) => {
    const x1 = 0.4, y1 = 0.0, x2 = 0.2, y2 = 1.0;
    const sampleX = (t) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t ** 2 * (1 - t) + t ** 3;
    const sampleY = (t) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t ** 2 * (1 - t) + t ** 3;
    let lo = 0, hi = 1;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      sampleX(mid) < progress ? (lo = mid) : (hi = mid);
    }
    return sampleY((lo + hi) / 2);
  };

  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * cubicBezierEase(progress));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const heroCta = document.querySelector('.hero-cta-btn');
if (heroCta) {
  heroCta.addEventListener('click', (e) => {
    e.preventDefault();
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      luxuryScrollTo(ctaSection.getBoundingClientRect().top + window.scrollY);
    }
  });
}

export { scrollObserver, initScrollAnimations };

// Parallax scrolling for images
const initParallax = () => {
  // Skip scroll parallax on touch devices — accelerometer handles it via initMobileParallax
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const parallaxElements = document.querySelectorAll('.parallax-image');

  if (parallaxElements.length === 0) return;

  const handleParallax = () => {
    parallaxElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const elementHeight = el.offsetHeight;
      const windowHeight = window.innerHeight;

      const speed = parseFloat(el.dataset.parallaxSpeed) || 0.5;

      if (scrolled + windowHeight > elementTop && scrolled < elementTop + elementHeight) {
        const yPos = (scrolled - elementTop) * speed;
        el.style.transform = `translateY(${-yPos}px)`;
      }
    });
  };

  let ticking = false;

  const requestParallaxUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleParallax();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
  handleParallax();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParallax);
} else {
  initParallax();
}

export { initParallax };

// 3D Accelerometer Parallax for mobile
// Applies perspective rotateX/rotateY to image containers and hero background based on device orientation.
// iOS 13+ requires a user-gesture before calling DeviceOrientationEvent.requestPermission().
const initMobileParallax = () => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;
  if (typeof DeviceOrientationEvent === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Target all 3D-tiltable containers including the hero background
  const containers = document.querySelectorAll(
    '.column-image, .cellar-image, .experience-image, .hero-bg'
  );

  if (containers.length === 0) return;

  // Ensure containers have a centred transform origin for the 3D tilt
  containers.forEach(c => {
    c.style.transformOrigin = 'center center';
    c.style.willChange = 'transform';
  });

  let gammaTarget = 0, betaTarget = 0;
  let gammaCurrent = 0, betaCurrent = 0;
  let baselineBeta = null;
  let animRunning = false;

  const MAX_TILT = 8;   // maximum degrees of rotation in either axis
  const LERP = 0.07;    // smoothing factor (lower = smoother / lazier)
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const handleOrientation = ({ beta, gamma }) => {
    // Capture the resting tilt as a baseline on first event
    if (baselineBeta === null) baselineBeta = beta ?? 45;

    const normBeta = (beta ?? 45) - baselineBeta;
    gammaTarget = clamp(((gamma ?? 0) / 45) * MAX_TILT, -MAX_TILT, MAX_TILT);
    betaTarget  = clamp((normBeta  / 30) * (MAX_TILT * 0.55), -MAX_TILT * 0.55, MAX_TILT * 0.55);
  };

  const tick = () => {
    if (!animRunning) return;

    gammaCurrent += (gammaTarget - gammaCurrent) * LERP;
    betaCurrent  += (betaTarget  - betaCurrent)  * LERP;

    const ry = gammaCurrent.toFixed(3);
    const rx = (-betaCurrent).toFixed(3);

    // 3D tilt for all containers (hero-bg gets a wider perspective for subtler effect)
    containers.forEach(container => {
      const perspective = container.classList.contains('hero-bg') ? 1200 : 700;
      container.style.transform = `perspective(${perspective}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
    });

    requestAnimationFrame(tick);
  };

  const startListening = () => {
    if (animRunning) return;
    animRunning = true;
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    requestAnimationFrame(tick);
  };

  // iOS 13+ requires requestPermission() to be called from a user gesture
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.addEventListener('touchstart', () => {
      DeviceOrientationEvent.requestPermission()
        .then(state => { if (state === 'granted') startListening(); })
        .catch(() => {});
    }, { once: true });
  } else {
    startListening();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileParallax);
} else {
  initMobileParallax();
}

export { initMobileParallax };

// Sequential character reveal for whisper text
const initWhisperReveal = () => {
  const whisperElements = document.querySelectorAll('.whisper');

  if (whisperElements.length === 0) return;

  whisperElements.forEach(whisper => {
    const text = whisper.textContent.trim();
    whisper.textContent = '';
    whisper.innerHTML = text.split(' ').map(word => {
      const chars = word.split('').map(char => `<span class="whisper-char">${char}</span>`).join('');
      return `<span class="whisper-word">${chars}</span>`;
    }).join('<span class="whisper-char">&nbsp;</span>');

    whisper.dataset.revealed = 'false';
  });

  const whisperObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.revealed === 'false') {
        revealWhisper(entry.target);
        entry.target.dataset.revealed = 'true';
      }
    });
  }, {
    threshold: 0.5
  });

  whisperElements.forEach(whisper => whisperObserver.observe(whisper));
};

const revealWhisper = (whisperElement) => {
  const chars = whisperElement.querySelectorAll('.whisper-char');
  const delay = 50;

  chars.forEach((char, index) => {
    setTimeout(() => {
      char.style.opacity = '1';
      char.style.transform = 'translateY(0)';
    }, index * delay);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhisperReveal);
} else {
  initWhisperReveal();
}

export { initWhisperReveal };
