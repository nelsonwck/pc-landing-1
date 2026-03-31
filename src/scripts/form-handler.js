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

  phone: (value) => {
    if (!value.trim()) return 'Please enter your mobile number';
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 8) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

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
  const fields = ['name', 'phone'];
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
  ['name', 'phone'].forEach(fieldName => {
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

  // Conditional reference field: show when introduction is "Existing member" or "Private invitation"
  const introductionSelect = document.getElementById('introduction');
  const referenceGroup = document.getElementById('reference-group');
  if (introductionSelect && referenceGroup) {
    introductionSelect.addEventListener('change', () => {
      const showReference = ['Existing member', 'Private invitation'].includes(introductionSelect.value);
      referenceGroup.style.display = showReference ? '' : 'none';
      if (!showReference) {
        const refField = document.getElementById('reference');
        if (refField) refField.value = '';
      }
    });
  }

}

export { validateForm, validateField, showError, clearError };

// Submit form data via serverless API route
const submitForm = async (formData) => {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send inquiry');
  }

  return await response.json();
};

export { submitForm };

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
  const salutation = document.getElementById('salutation').value;
  const rawName = document.getElementById('name').value.trim();
  const formData = {
    name: `${salutation} ${rawName}`,
    phone: document.getElementById('phone').value.trim(),
    interest: document.getElementById('interest').value.trim(),
    introduction: document.getElementById('introduction').value || '',
    reference: document.getElementById('reference').value.trim()
  };

  try {
    await submitForm(formData);

    document.getElementById('form-success').style.display = 'block';
    form.reset();
    // Hide reference group after reset
    const refGroup = document.getElementById('reference-group');
    if (refGroup) refGroup.style.display = 'none';

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
