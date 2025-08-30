import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SecureStorage } from '../../utils/encryption';

const Logins = () => {
  const [schoolId, setSchoolId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaColors, setCaptchaColors] = useState([]);
  const navigate = useNavigate();

  // Get base URL from storage
  const getBaseUrl = () => {
    return SecureStorage.getLocalItem("url");
  };

  // Store user data individually in both session and local storage
  const storeUserData = (userData) => {
    const userFields = [
      'user_id',
      'title_id', 
      'firstname',
      'middlename',
      'lastname',
      'suffix',
      'school_id',
      'email',
      'user_level_id',
      'user_level_name',
      'is_active'
    ];

    userFields.forEach(field => {
      if (userData[field] !== undefined) {
        // Store in local storage
        SecureStorage.setLocalItem(field, userData[field].toString());
        // Store in session storage
        sessionStorage.setItem(field, userData[field].toString());
      }
    });
  };

  // Generate advanced CAPTCHA with colors and styling
  const generateCaptcha = () => {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = upperChars + lowerChars + numbers;
    const colors = ['#618264', '#79AC78', '#B0D9B1', '#2563eb', '#dc2626', '#7c2d12', '#581c87'];
    let result = '';
    let colorArray = [];
    
    for (let i = 0; i < 6; i++) {
      result += allChars.charAt(Math.floor(Math.random() * allChars.length));
      colorArray.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    
    setCaptcha(result);
    setCaptchaColors(colorArray);
    setCaptchaInput('');
    setCaptchaError(false);
    setCaptchaValid(false);
  };

  // Real-time CAPTCHA validation (case-sensitive)
  const validateCaptchaRealtime = (input) => {
    const isValid = input === captcha; // Exact case matching
    setCaptchaValid(isValid);
    setCaptchaError(false);
    return isValid;
  };

  // Initialize CAPTCHA on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate CAPTCHA first (case-sensitive)
    if (captchaInput !== captcha) {
      setCaptchaError(true);
      toast.error('Invalid CAPTCHA. Please match the exact case.');
      generateCaptcha();
      return;
    }
    
    setIsLoading(true);

    try {
      const baseUrl = getBaseUrl();
      const loginData = {
        operation: "login",
        json: {
          username: schoolId,
          password: passcode
        }
      };

      const response = await axios.post(`${baseUrl}auth.php`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        toast.success('Login successful!');
        
        // Store user data individually in both storages
        if (response.data.data) {
          storeUserData(response.data.data);
          
          // Also store the complete user data as backup
          SecureStorage.setLocalItem('userData', JSON.stringify(response.data.data));
          sessionStorage.setItem('userData', JSON.stringify(response.data.data));
        }

        // Redirect based on user level
        const roleRaw = response.data.data?.user_level_name || '';
        const role = roleRaw.toString().toLowerCase();

        if (role.includes('admin')) {
          navigate('/admin/dashboard');
        } else if (role.includes('faculty') || role.includes('instructor') || role === 'faculty instructor') {
          navigate('/teacher/dashboard');
        } else if (role.includes('student')) {
          navigate('/student/dashboard');
        } else {
          // Fallback
          navigate('/dashboard');
        }
        
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Invalid credentials';
        toast.error(errorMessage);
      } else if (error.request) {
        // Network error
        toast.error('Network error. Please check your connection.');
      } else {
        // Other error
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex">
      {/* Left Panel - System Introduction */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-green-700 to-green-800 relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, #618264, #79AC78)'}}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-white rounded-lg transform rotate-45"></div>
          <div className="absolute bottom-32 left-32 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border border-white rounded-lg transform -rotate-12"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full max-w-lg mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg mx-auto p-3">
              <img 
                src="/pictures/assets/logo.png" 
                alt="CITE Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-center tracking-wide">CITE ProTrak</h1>
          </div>

          {/* System Introduction */}
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-xl font-medium mb-4 tracking-wide">Project Tracking And Monitoring System</h2>
              <p className="text-base leading-relaxed opacity-90 max-w-sm mx-auto" style={{color: '#D0E7D2'}}>
                Streamline your academic projects with comprehensive tracking and collaboration tools.
              </p>
            </div>
            
            {/* Minimal Features */}
            <div className="space-y-3 text-center">
              <div className="text-sm opacity-80" style={{color: '#D0E7D2'}}>
                Real-time Monitoring • Collaboration 
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 p-3">
              <img 
                src="/pictures/assets/logo.png" 
                alt="CITE Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">CITE ProTrak</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School ID / Employee ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your ID"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{'--tw-ring-color': '#79AC78'}}
                  onFocus={(e) => e.target.style.borderColor = '#79AC78'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-12"
                    style={{'--tw-ring-color': '#79AC78'}}
                    onFocus={(e) => e.target.style.borderColor = '#79AC78'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Verification
                </label>
                
                {/* CAPTCHA Display */}
                <div className="mb-3">
                  <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[80px]">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 left-4 w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div className="absolute top-6 right-6 w-2 h-2 bg-gray-500 rounded-full"></div>
                      <div className="absolute bottom-3 left-8 w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="absolute bottom-2 right-4 w-3 h-3 bg-gray-500 rounded-full"></div>
                      <svg className="absolute top-4 right-12 w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
                      </svg>
                    </div>
                    
                    {/* CAPTCHA Text */}
                    <div className="relative z-10 flex items-center space-x-1">
                      {captcha.split('').map((char, index) => (
                        <span
                          key={index}
                          className="font-bold text-2xl transform select-none"
                          style={{
                            color: captchaColors[index] || '#618264',
                            transform: `rotate(${(Math.random() - 0.5) * 20}deg) scale(${0.9 + Math.random() * 0.2})`,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                            fontFamily: 'monospace'
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                    
                    {/* Refresh Button */}
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-white hover:bg-opacity-50"
                      title="Generate New CAPTCHA"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* CAPTCHA Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter the characters above (case-sensitive)"
                    value={captchaInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCaptchaInput(value);
                      validateCaptchaRealtime(value);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      captchaError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : captchaValid && captchaInput.length === captcha.length
                        ? 'border-green-500 focus:ring-green-500 bg-green-50'
                        : captchaInput.length === captcha.length && !captchaValid
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    style={
                      captchaError 
                        ? {} 
                        : captchaValid && captchaInput.length === captcha.length
                        ? {'--tw-ring-color': '#10b981'}
                        : captchaInput.length === captcha.length && !captchaValid
                        ? {'--tw-ring-color': '#dc2626'}
                        : {'--tw-ring-color': '#79AC78'}
                    }
                    onFocus={(e) => {
                      if (!captchaError) {
                        if (captchaValid && captchaInput.length === captcha.length) {
                          e.target.style.borderColor = '#10b981';
                        } else if (captchaInput.length === captcha.length && !captchaValid) {
                          e.target.style.borderColor = '#dc2626';
                        } else {
                          e.target.style.borderColor = '#79AC78';
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (!captchaError) {
                        if (captchaValid && captchaInput.length === captcha.length) {
                          e.target.style.borderColor = '#10b981';
                        } else if (captchaInput.length === captcha.length && !captchaValid) {
                          e.target.style.borderColor = '#dc2626';
                        } else {
                          e.target.style.borderColor = '#d1d5db';
                        }
                      }
                    }}
                    maxLength={captcha.length}
                    required
                  />
                  
                  {/* Real-time validation indicator */}
                  {captchaInput.length > 0 && captchaValid && captchaInput.length === captcha.length && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Status Messages */}
                {captchaError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Invalid CAPTCHA. Please match the exact case.
                  </p>
                )}
                
                {captchaValid && captchaInput.length === captcha.length && (
                  <p className="text-green-600 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    CAPTCHA verified successfully!
                  </p>
                )}
                
                {captchaInput.length > 0 && captchaInput.length < captcha.length && (
                  <p className="text-gray-500 text-sm mt-1">
                    {captcha.length - captchaInput.length} more character(s) needed
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                style={{
                  backgroundColor: isLoading ? '#9ca3af' : '#618264',
                  ':hover': { backgroundColor: '#79AC78' }
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#79AC78')}
                onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#618264')}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>© 2024 ProTrak. All rights reserved.</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Logins;
