import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ASSETS } from '../../constants/assets';

// Only official organisational email addresses may register.
const ORG_EMAIL_SUFFIX = '@strathmore.edu';

// Maps the exact error strings returned by the backend (and by pydantic
// validation) to the form field that should display the message.
function mapBackendErrorToField(message) {
  if (!message) {
    return { field: null, message };
  }
  const lower = message.toLowerCase();

  if (lower.includes('@strathmore.edu') || lower.includes('organizational email')) {
    return { field: 'email', message };
  }
  if (lower.includes('email') && lower.includes('already')) {
    return { field: 'email', message };
  }
  if (lower.includes('student id') || lower.includes('lecturer id') || lower.includes('id is already registered')) {
    return { field: 'studentOrLecturerId', message };
  }
  if (lower.includes('password')) {
    return { field: 'password', message };
  }
  return { field: 'form', message };
}

function validateField(name, values) {
  switch (name) {
    case 'fullName':
      if (!values.fullName.trim()) {
        return 'Please enter your full name.';
      }
      return '';
    case 'email':
      if (!values.email.trim()) {
        return 'Please enter your email address.';
      }
      // Basic shape check before the domain check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        return 'Please enter a valid email address.';
      }
      if (!values.email.trim().toLowerCase().endsWith(ORG_EMAIL_SUFFIX)) {
        return 'That is not an organizational email address. Please use your @strathmore.edu email.';
      }
      return '';
    case 'studentOrLecturerId':
      if (!values.studentOrLecturerId.trim()) {
        return values.isLecturer
          ? 'Please enter your Lecturer ID.'
          : 'Please enter your Student ID.';
      }
      if (!/^[A-Za-z0-9._-]{3,50}$/.test(values.studentOrLecturerId.trim())) {
        return 'ID must be 3-50 characters and contain only letters, numbers, dots, hyphens, or underscores.';
      }
      return '';
    case 'phoneNumber':
      if (!values.phoneNumber.trim()) {
        return 'Please enter your phone number.';
      }
      // Permissive: digits, spaces, +, -, parentheses
      if (!/^[+()\d\s-]{7,20}$/.test(values.phoneNumber.trim())) {
        return 'Please enter a valid phone number (7-20 characters).';
      }
      return '';
    case 'password':
      if (!values.password) {
        return 'Please enter a password.';
      }
      if (values.password.length < 8) {
        return 'Password must be at least 8 characters.';
      }
      if (values.password !== values.confirmPassword) {
        return 'Passwords do not match.';
      }
      return '';
    default:
      return '';
  }
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const [role, setRole] = useState('driver');
  const [email, setEmail] = useState('');
  const [studentOrLecturerId, setStudentOrLecturerId] = useState('');
  const [isLecturer, setIsLecturer] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');

  // Per-field error state. `''` means no error.
  const [fieldErrors, setFieldErrors] = useState({});
  // Top-of-form error (used when the backend message doesn't map to a field).
  const [formError, setFormError] = useState('');

  const values = {
    fullName,
    email,
    studentOrLecturerId,
    isLecturer,
    password,
    confirmPassword,
    phoneNumber,
  };

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const { [name]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const setFieldError = (name, message) => {
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
  };

  const validateAll = () => {
    const fields = ['fullName', 'email', 'studentOrLecturerId', 'phoneNumber', 'password'];
    const next = {};
    for (const name of fields) {
      const msg = validateField(name, values);
      if (msg) {
        next[name] = msg;
      }
    }
    setFieldErrors(next);
    return next;
  };

  const handleBlur = (name) => () => {
    const msg = validateField(name, values);
    setFieldError(name, msg);
  };

  const handleChange = (setter, name) => (e) => {
    setter(e.target.value);
    // Clear the error for this field as the user edits, but only if it
    // currently has one — avoids re-running the full validator on every
    // keystroke.
    if (fieldErrors[name]) {
      clearFieldError(name);
    }
    if (formError) {
      setFormError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validateAll();
    if (Object.keys(errors).length > 0) {
      // Focus the first invalid field for accessibility.
      const firstField = Object.keys(errors)[0];
      const el = document.querySelector(`[data-field="${firstField}"]`);
      if (el && typeof el.focus === 'function') {
        el.focus();
      }
      return;
    }

    try {
      await register({ fullName, email, password, phoneNumber, studentOrLecturerId, isLecturer });
      navigate('/login');
    } catch (err) {
      const { field, message } = mapBackendErrorToField(err.message || 'Registration failed');
      if (field && field !== 'form') {
        setFieldError(field, message);
        const el = document.querySelector(`[data-field="${field}"]`);
        if (el && typeof el.focus === 'function') {
          el.focus();
        }
      } else {
        setFormError(message);
      }
    }
  };

  const idLabel = isLecturer ? 'Lecturer ID number' : 'Student ID number';
  const idPlaceholder = isLecturer ? 'e.g. FAC-12345' : 'e.g. 184066';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: 'radial-gradient(circle at center, #1d4ed8 0%, #ffffff 72%)',
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 w-full max-w-md border border-white/60">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <img src={ASSETS.logo} alt="UniPark Logo" className="w-12 h-12 object-contain" />
          </Link>
          <h1 className="text-3xl font-bold text-blue-700">UniPark</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {(formError || error) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm" role="alert">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            label="Name"
            name="fullName"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={handleChange(setFullName, 'fullName')}
            onBlur={handleBlur('fullName')}
            error={fieldErrors.fullName}
            disabled={isLoading}
          />

          <Field
            label="Email address"
            name="email"
            type="email"
            placeholder="you@strathmore.edu"
            value={email}
            onChange={handleChange(setEmail, 'email')}
            onBlur={handleBlur('email')}
            error={fieldErrors.email}
            hint={`Must end with ${ORG_EMAIL_SUFFIX}`}
            disabled={isLoading}
          />

          <Field
            label={idLabel}
            name="studentOrLecturerId"
            type="text"
            placeholder={idPlaceholder}
            value={studentOrLecturerId}
            onChange={handleChange(setStudentOrLecturerId, 'studentOrLecturerId')}
            onBlur={handleBlur('studentOrLecturerId')}
            error={fieldErrors.studentOrLecturerId}
            disabled={isLoading}
          />

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700 select-none">
            <input
              type="checkbox"
              checked={isLecturer}
              onChange={(e) => {
                setIsLecturer(e.target.checked);
                // Re-validate the ID field because its label/placeholder change.
                if (fieldErrors.studentOrLecturerId) {
                  clearFieldError('studentOrLecturerId');
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              disabled={isLoading}
            />
            I am a lecturer
          </label>

          <Field
            label="Phone number"
            name="phoneNumber"
            type="tel"
            placeholder="+254 700 000 000"
            value={phoneNumber}
            onChange={handleChange(setPhoneNumber, 'phoneNumber')}
            onBlur={handleBlur('phoneNumber')}
            error={fieldErrors.phoneNumber}
            disabled={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handleChange(setPassword, 'password')}
              onBlur={handleBlur('password')}
              error={fieldErrors.password}
              disabled={isLoading}
            />

            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={handleChange(setConfirmPassword, 'password')}
              onBlur={handleBlur('password')}
              error={fieldErrors.password}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-transparent text-black border border-black py-2 rounded-md hover:border-blue-700 hover:bg-blue-700 hover:text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-blue-700 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Single labelled input with optional hint and inline error.
 */
function Field({ label, name, type = 'text', value, onChange, onBlur, error, hint, placeholder, disabled }) {
  const hasError = Boolean(error);
  const inputId = `signup-${name}`;
  const describedBy = [hasError ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={inputId}
        data-field={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={describedBy || undefined}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition disabled:bg-gray-50 disabled:cursor-not-allowed ${hasError
            ? 'border-red-400 focus:ring-red-300 focus:border-red-500 bg-red-50/40'
            : 'border-gray-300 focus:ring-primary focus:border-primary'
          }`}
      />
      {hint && !hasError && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
