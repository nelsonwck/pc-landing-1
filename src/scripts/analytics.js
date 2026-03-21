// Google Analytics 4 tracking
console.log('Analytics module loaded');

// Initialize GA4
export const initGA4 = () => {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    console.warn('GA4 Measurement ID not configured');
    return;
  }

  // Load gtag script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: true
  });

  console.log('GA4 initialized:', measurementId);
};

// Scroll depth tracking
const scrollDepthTracked = {
  25: false,
  50: false,
  75: false,
  100: false
};

const trackScrollDepth = () => {
  const scrollPercentage = Math.round(
    (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
  );

  [25, 50, 75, 100].forEach(threshold => {
    if (scrollPercentage >= threshold && !scrollDepthTracked[threshold]) {
      scrollDepthTracked[threshold] = true;

      if (window.gtag) {
        window.gtag('event', 'scroll_depth', {
          percent: threshold
        });
      }

      console.log(`Scroll depth tracked: ${threshold}%`);
    }
  });
};

// Section visibility tracking
const trackSectionVisibility = () => {
  const sections = ['hero', 'cellar', 'experience', 'membership', 'cta'];
  const trackedSections = new Set();

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !trackedSections.has(entry.target.id)) {
        trackedSections.add(entry.target.id);

        if (window.gtag) {
          window.gtag('event', 'section_view', {
            section_name: entry.target.id
          });
        }

        console.log('Section viewed:', entry.target.id);
      }
    });
  }, {
    threshold: 0.5
  });

  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      sectionObserver.observe(section);
    }
  });
};

// Initialize tracking when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    trackScrollDepth();
    trackSectionVisibility();
  });
} else {
  window.addEventListener('scroll', trackScrollDepth, { passive: true });
  trackScrollDepth();
  trackSectionVisibility();
}

export { trackScrollDepth, trackSectionVisibility };
