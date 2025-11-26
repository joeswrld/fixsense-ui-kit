import { useState, useEffect } from 'react';
import { Loader2, Wrench, CheckCircle2 } from 'lucide-react';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', phone: '+234' },
  { code: 'US', name: 'United States', currency: 'USD', phone: '+1' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', phone: '+44' },
  { code: 'CA', name: 'Canada', currency: 'CAD', phone: '+1' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', phone: '+233' },
  { code: 'KE', name: 'Kenya', currency: 'KES', phone: '+254' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', phone: '+27' },
  { code: 'IN', name: 'India', currency: 'INR', phone: '+91' },
];

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

const OnboardingPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    country: '',
    countryCode: '',
    currency: '',
  });
  const [errors, setErrors] = useState({
    fullName: '',
    phoneNumber: '',
    country: '',
    currency: '',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Simulate checking onboarding status
    setTimeout(() => {
      // Auto-detect country (simulated)
      setFormData(prev => ({
        ...prev,
        country: 'NG',
        countryCode: '+234',
        currency: 'NGN',
      }));
      setLoading(false);
    }, 500);
  }, []);

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      phoneNumber: '',
      country: '',
      currency: '',
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must contain only digits';
    } else if (formData.phoneNumber.trim().length < 7) {
      newErrors.phoneNumber = 'Phone number is too short';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: countryCode,
        countryCode: country.phone,
        currency: country.currency,
      }));
      setErrors(prev => ({ ...prev, country: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  const isFormValid = 
    formData.fullName.trim() &&
    formData.phoneNumber.trim() &&
    formData.country &&
    formData.currency &&
    !Object.values(errors).some(error => error);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Welcome to FixSense!</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Your account has been set up successfully.</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 32px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <span>FixSense</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Let's set up your account</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
            This helps us personalize your experience and provide better service
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, fullName: e.target.value }));
                  setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: errors.fullName ? '2px solid #dc2626' : '1px solid #d1d5db', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              {errors.fullName && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Country <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: errors.country ? '2px solid #dc2626' : '1px solid #d1d5db', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select your country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.country}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Phone Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.countryCode}
                  disabled
                  style={{ 
                    width: '100px', 
                    padding: '12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px',
                    background: '#f3f4f6',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="tel"
                  placeholder="8012345678"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, phoneNumber: value }));
                    setErrors(prev => ({ ...prev, phoneNumber: '' }));
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    border: errors.phoneNumber ? '2px solid #dc2626' : '1px solid #d1d5db', 
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              {errors.phoneNumber && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.phoneNumber}</p>
              )}
              <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                Enter your phone number without the country code
              </p>
            </div>

            {/* Currency */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Preferred Currency <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, currency: e.target.value }));
                  setErrors(prev => ({ ...prev, currency: '' }));
                }}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: errors.currency ? '2px solid #dc2626' : '1px solid #d1d5db', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select currency</option>
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.currency}</p>
              )}
              <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                This will be used for cost estimates and pricing
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              style={{
                width: '100%',
                padding: '14px',
                background: isFormValid && !submitting ? '#3b82f6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isFormValid && !submitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                  Setting up your account...
                </>
              ) : (
                <>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  Continue to Dashboard
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;