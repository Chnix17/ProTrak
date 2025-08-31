import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';

const Logins = () => {
  const [schoolId, setSchoolId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
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

  // Generate math CAPTCHA with addition only
  const generateCaptcha = () => {
    // Generate two random numbers between 1 and 20
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const answer = num1 + num2;
    
    setCaptcha(`${num1} + ${num2} = ?`);
    setCaptchaAnswer(answer);
    setCaptchaInput('');
    setCaptchaError(false);
    setCaptchaValid(false);
  };

  // Real-time CAPTCHA validation for math answer
  const validateCaptchaRealtime = (input) => {
    const numericInput = parseInt(input, 10);
    const isValid = !isNaN(numericInput) && numericInput === captchaAnswer;
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
    
    // Validate CAPTCHA first (math answer)
    const numericInput = parseInt(captchaInput, 10);
    if (isNaN(numericInput) || numericInput !== captchaAnswer) {
      setCaptchaError(true);
      toast.error('Invalid CAPTCHA. Please solve the math problem correctly.');
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const formVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        delay: 0.2
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex overflow-x-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Left Panel - System Introduction */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-green-700 to-green-800 relative overflow-hidden" 
        style={{background: 'linear-gradient(to bottom right, #618264, #79AC78)'}}
        variants={itemVariants}
      >
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
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
        >
          <motion.div 
            className="text-center mb-10"
            variants={itemVariants}
          >
            <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg mx-auto p-3">
              <img 
                src="/pictures/assets/logo.png" 
                alt="CITE Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-center tracking-wide">CITE ProTrak</h1>
          </motion.div>
        </motion.div>

        {/* System Introduction */}
        <div className="text-center space-y-8">
          <div>
            <h2 className="text-xl font-medium mb-4 tracking-wide">Project Tracking And Monitoring System</h2>
         
          </div>
          
          {/* Minimal Features */}
          <div className="space-y-3 text-center">
            <div className="text-sm opacity-80" style={{color: '#D0E7D2'}}>
              Real-time Monitoring • Collaboration 
            </div>
          </div>
        </div>

      </div>
    </motion.div>

    {/* Right Panel - Login Form */}
    <motion.div 
      className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 sm:p-12 md:p-16"
      variants={formVariants}
    >
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
            <motion.h2 
              className="text-3xl font-bold text-gray-800 mb-2"
              variants={itemVariants}
            >
              Welcome Back
            </motion.h2>
            <motion.p 
              className="text-gray-600"
              variants={itemVariants}
            >
              Please enter your credentials to login
            </motion.p>
          </div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            variants={containerVariants}
          >
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
              <motion.div 
                className="relative"
                variants={itemVariants}
              >
                <motion.input
                  type={showPassword ? 'text' : 'password'}
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  whileFocus={{ scale: 1.01, boxShadow: '0 0 0 2px #79AC78' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </motion.button>
              </motion.div>
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
                  
                  {/* CAPTCHA Math Problem */}
                  <div className="relative z-10 flex items-center justify-center">
                    <span
                      className="font-bold text-3xl select-none text-center"
                      style={{
                        color: '#618264',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {captcha}
                    </span>
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
                  placeholder="Enter the answer to the math problem"
                  value={captchaInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCaptchaInput(value);
                    validateCaptchaRealtime(value);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    captchaError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : captchaValid && captchaInput.length > 0
                      ? 'border-green-500 focus:ring-green-500 bg-green-50'
                      : captchaInput.length > 0 && !captchaValid
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  style={
                    captchaError 
                      ? {} 
                      : captchaValid && captchaInput.length > 0
                      ? {'--tw-ring-color': '#10b981'}
                      : captchaInput.length > 0 && !captchaValid
                      ? {'--tw-ring-color': '#dc2626'}
                      : {'--tw-ring-color': '#79AC78'}
                  }
                  onFocus={(e) => {
                    if (!captchaError) {
                      if (captchaValid && captchaInput.length > 0) {
                        e.target.style.borderColor = '#10b981';
                      } else if (captchaInput.length > 0 && !captchaValid) {
                        e.target.style.borderColor = '#dc2626';
                      } else {
                        e.target.style.borderColor = '#79AC78';
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (!captchaError) {
                      if (captchaValid && captchaInput.length > 0) {
                        e.target.style.borderColor = '#10b981';
                      } else if (captchaInput.length > 0 && !captchaValid) {
                        e.target.style.borderColor = '#dc2626';
                      } else {
                        e.target.style.borderColor = '#d1d5db';
                      }
                    }
                  }}
                  required
                />
                
                {/* Real-time validation indicator */}
                {captchaInput.length > 0 && captchaValid && (
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
                  Invalid CAPTCHA. Please solve the math problem correctly.
                </p>
              )}
              
              {captchaValid && captchaInput.length > 0 && (
                <p className="text-green-600 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  CAPTCHA verified successfully!
                </p>
              )}
              
            </div>

            {/* Submit Button */}
            <motion.div
              variants={itemVariants}
            >
              <motion.button
                type="submit"
                disabled={isLoading || !captchaValid}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading || !captchaValid ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'} transition-colors duration-200`}
                whileHover={!isLoading && captchaValid ? { scale: 1.02, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' } : {}}
                whileTap={!isLoading && captchaValid ? { scale: 0.98 } : {}}
                animate={!isLoading && captchaValid ? { 
                  background: ['#79AC78', '#618264', '#79AC78'],
                  transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
                } : {}}
              >
                {isLoading ? (
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </motion.div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Sign in
                  </motion.span>
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Sign Up Link */}
          <motion.div 
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <p className="text-gray-600">
              Don't have an account?{' '}
              <motion.a
                href="/register"
                className="font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign up
              </motion.a>
            </p>
          </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Logins;
