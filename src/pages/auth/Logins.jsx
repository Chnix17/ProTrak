import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SecureStorage } from '../../utils/encryption';

const Logins = () => {
  const [schoolId, setSchoolId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Header */}
      {/* <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-800">Razor</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            🌐
          </button>
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            Sign up
          </button>
          <button className="bg-orange-300 hover:bg-orange-400 text-gray-800 px-4 py-2 rounded-lg transition-colors">
            Request Demo
          </button>
        </div>
      </div> */}

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left side decorations */}
        <div className="absolute left-20 top-1/4 w-20 h-16 border-2 border-gray-300 rounded-lg transform rotate-12"></div>
        <div className="absolute left-16 bottom-1/3 w-24 h-20 bg-yellow-300 rounded-lg flex items-center justify-center transform -rotate-12">
          <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-black rounded-full"></div>
            ))}
          </div>
        </div>
        <div className="absolute left-32 bottom-1/4 w-16 h-12 border-2 border-gray-300 rounded-lg transform rotate-45"></div>

        {/* Right side decorations */}
        <div className="absolute right-20 top-1/3 w-20 h-16 border-2 border-gray-300 rounded-lg transform -rotate-12"></div>
        <div className="absolute right-16 bottom-1/3 w-24 h-20 bg-yellow-300 rounded-lg flex items-center justify-center transform rotate-12">
          <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-black rounded-full"></div>
            ))}
          </div>
        </div>

        {/* Curved lines */}
        <svg className="absolute left-10 top-1/2 w-32 h-32 text-gray-300" viewBox="0 0 100 100" fill="none">
          <path d="M20 20 Q50 60 80 20" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        <svg className="absolute right-10 top-1/4 w-32 h-32 text-gray-300" viewBox="0 0 100 100" fill="none">
          <path d="M20 80 Q50 40 80 80" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>

        {/* Character illustration */}
        <div className="absolute right-32 bottom-20 w-32 h-40">
          <div className="relative">
            {/* Simple character silhouette */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-black rounded-full mb-2"></div>
              <div className="w-12 h-16 bg-black rounded-t-full"></div>
              <div className="w-4 h-8 bg-black absolute -left-2 top-8 rounded-full transform rotate-45"></div>
              <div className="w-4 h-8 bg-black absolute -right-2 top-8 rounded-full transform -rotate-45"></div>
              <div className="w-3 h-6 bg-black absolute left-2 bottom-0 rounded-full"></div>
              <div className="w-3 h-6 bg-black absolute right-2 bottom-0 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md z-20 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ProTrak Login</h2>
          <p className="text-gray-600 text-sm">
            Hey, Enter your details to get sign in<br />
            to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Enter School ID/ Employee ID"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* <div className="text-right">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
              Having trouble in sign in?
            </a>
          </div> */}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-300 hover:bg-orange-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>


          {/* <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="text-gray-800 hover:underline">
                Request Now
              </a>
            </p>
          </div> */}
        </form>
      </div>

     
    </div>
  );
};

export default Logins;
