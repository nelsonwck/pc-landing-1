// Form validation and submission handler
console.log('Form handler module loaded');

const form = document.getElementById('membership-form');
const submitButton = form?.querySelector('.submit-button');
const buttonLabel = submitButton?.querySelector('.button-label');
const buttonLoading = submitButton?.querySelector('.button-loading');

// Validation rules
const validators = {
  name: (value) => {
    if (!value.trim()) return 'Please enter your full name';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  },

  email: (value) => {
    if (!value.trim()) return 'Please enter your email address';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  phone: (value) => {
    if (!value.trim()) return 'Please enter your mobile number';
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 8) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  company: (value) => {
    if (!value.trim()) return 'Please enter your company or occupation';
    if (value.trim().length < 2) return 'Please provide more detail';
    return null;
  },

  consent: (checked) => {
    if (!checked) return 'You must consent to be contacted';
    return null;
  }
};

// Show error message
const showError = (fieldName, message) => {
  const field = document.getElementById(fieldName);
  const errorElement = document.getElementById(`${fieldName}-error`);

  if (field) field.classList.add('error');
  if (errorElement) errorElement.textContent = message;
};

// Clear error message
const clearError = (fieldName) => {
  const field = document.getElementById(fieldName);
  const errorElement = document.getElementById(`${fieldName}-error`);

  if (field) field.classList.remove('error');
  if (errorElement) errorElement.textContent = '';
};

// Validate single field
const validateField = (fieldName) => {
  const field = document.getElementById(fieldName);
  if (!field) return true;

  const value = field.type === 'checkbox' ? field.checked : field.value;
  const error = validators[fieldName]?.(value);

  if (error) {
    showError(fieldName, error);
    return false;
  }

  clearError(fieldName);
  return true;
};

// Validate entire form
const validateForm = () => {
  const fields = ['name', 'email', 'phone', 'company', 'consent'];
  let isValid = true;

  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  return isValid;
};

// Real-time validation on blur
if (form) {
  ['name', 'email', 'phone', 'company'].forEach(fieldName => {
    const field = document.getElementById(fieldName);
    if (field) {
      field.addEventListener('blur', () => validateField(fieldName));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          validateField(fieldName);
        }
      });
    }
  });

  const consentCheckbox = document.getElementById('consent');
  if (consentCheckbox) {
    consentCheckbox.addEventListener('change', () => validateField('consent'));
  }
}

export { validateForm, validateField, showError, clearError };

// HTML escaping helper to prevent XSS in email templates
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Resend API submission
const sendEmailViaResend = async (formData) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  const recipient = import.meta.env.VITE_EMAIL_RECIPIENT;

  if (!apiKey || !recipient) {
    console.error('Resend API key or recipient not configured');
    throw new Error('Email configuration missing');
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; color: #333; line-height: 1.6; }
        h2 { color: #AF862D; }
        .field { margin-bottom: 16px; }
        .label { font-weight: bold; }
        hr { margin: 20px 0; border: none; border-top: 1px solid #ddd; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h2>New Membership Inquiry - Prime Collective</h2>
      <div class="field"><div class="label">Name:</div><div>${escapeHtml(formData.name)}</div></div>
      <div class="field"><div class="label">Email:</div><div>${escapeHtml(formData.email)}</div></div>
      <div class="field"><div class="label">Phone:</div><div>${escapeHtml(formData.phone)}</div></div>
      <div class="field"><div class="label">Company/Occupation:</div><div>${escapeHtml(formData.company)}</div></div>
      <div class="field"><div class="label">Interest in Wine:</div><div>${escapeHtml(formData.interest || 'Not provided')}</div></div>
      <div class="field"><div class="label">Consent Given:</div><div>${formData.consent ? 'Yes' : 'No'}</div></div>
      <div class="field"><div class="label">Submitted:</div><div>${new Date().toLocaleString()}</div></div>
      <hr>
      <p class="footer">This inquiry was submitted via the Prime Collective landing page.</p>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: 'Prime Collective <onboarding@resend.dev>',
      to: [recipient],
      subject: 'New Membership Inquiry - Prime Collective',
      html: emailHtml
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }

  return await response.json();
};

export { sendEmailViaResend };

// Google Sheets submission via Apps Script
const sendToGoogleSheets = async (formData) => {
  const sheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  if (!sheetsUrl) {
    console.error('Google Sheets URL not configured');
    throw new Error('Google Sheets configuration missing');
  }

  const payload = {
    timestamp: new Date().toISOString(),
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    company: formData.company,
    interest: formData.interest || '',
    consent: formData.consent ? 'Yes' : 'No'
  };

  await fetch(sheetsUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  // With no-cors, we can't read the response — assume success if no error thrown
  return { success: true };
};

export { sendToGoogleSheets };

// Form submission handler
const handleFormSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  // Disable submit button and show loading
  submitButton.disabled = true;
  buttonLabel.style.display = 'none';
  buttonLoading.style.display = 'inline';

  // Hide previous messages
  document.getElementById('form-success').style.display = 'none';
  document.getElementById('form-error').style.display = 'none';

  // Collect form data
  const formData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    company: document.getElementById('company').value.trim(),
    interest: document.getElementById('interest').value.trim(),
    consent: document.getElementById('consent').checked
  };

  try {
    // Submit to Resend and Google Sheets in parallel
    await Promise.all([
      sendEmailViaResend(formData),
      sendToGoogleSheets(formData)
    ]);

    document.getElementById('form-success').style.display = 'block';
    form.reset();

    // Track conversion in GA4
    if (window.gtag) {
      window.gtag('event', 'form_submission', {
        form_type: 'membership_inquiry'
      });
    }

  } catch (error) {
    console.error('Form submission error:', error);
    document.getElementById('form-error').style.display = 'block';

  } finally {
    submitButton.disabled = false;
    buttonLabel.style.display = 'inline';
    buttonLoading.style.display = 'none';
  }
};

// Attach form submit handler
if (form) {
  form.addEventListener('submit', handleFormSubmit);
}

export { handleFormSubmit };
