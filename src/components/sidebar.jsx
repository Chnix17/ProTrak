import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  UsersIcon, 
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { SecureStorage } from '../utils/encryption';
import { useSidebar } from '../contexts/SidebarContext';

const Sidebar = () => {
  const { isOpen, isCollapsed, isMobile, toggleSidebar, closeSidebar } = useSidebar();
  const [masterFilesOpen, setMasterFilesOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get user role from SecureStorage
    const userLevelName =
      SecureStorage.getLocalItem('user_level_name') ||
      SecureStorage.getLocalItem('user_level');
    if (userLevelName) {
      setUserRole(userLevelName);
    }
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileSection = event.target.closest('.profile-section');
      if (!profileSection && profileDropdownOpen) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Normalize role and determine access groups
  const normalizedRole = (userRole || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';
  const facultyRoleKeywords = ['teacher', 'faculty instructor', 'faculty/staff', 'instructor'];
  const isFaculty = facultyRoleKeywords.some((k) => normalizedRole.includes(k));
  const isStudent = normalizedRole === 'student' || normalizedRole.includes('student');


  const toggleMasterFiles = () => {
    setMasterFilesOpen(!masterFilesOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = () => {
    // Navigate to home page first
    navigate('/');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Force page reload to ensure navigation
    window.location.href = '/';
  };

  const handleProfileClick = () => {
    // For now, just close the dropdown when profile is clicked
    setProfileDropdownOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const adminNavigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      current: isActiveRoute('/admin/dashboard')
    }
  ];

  const facultyNavigationItems = [
    {
      name: 'Dashboard',
      href: '/teacher/dashboard',
      icon: HomeIcon,
      current: isActiveRoute('/teacher/dashboard')
    },
    {
      name: 'Workspace',
      href: '/teacher/workspace',
      icon: FolderIcon,
      current: isActiveRoute('/teacher/workspace')
    }
  ];

  const studentNavigationItems = [
    {
      name: 'Dashboard',
      href: '/student/dashboard',
      icon: HomeIcon,
      current: isActiveRoute('/student/dashboard')
    },
    {
      name: 'Workspace',
      href: '/student/workspace',
      icon: FolderIcon,
      current: isActiveRoute('/student/workspace')
    }
  ];

  const masterFileItems = [
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      current: isActiveRoute('/admin/users')
    },
    {
      name: 'Academic Year',
      href: '/admin/academic',
      icon: CalendarIcon,
      current: isActiveRoute('/admin/academic')
    }
  ];

  if (!isAdmin && !isFaculty && !isStudent) {
    return null; // Don't render sidebar for roles without a defined menu
  }

  // Determine sidebar width and visibility
  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const isVisible = isOpen || (!isMobile && !isCollapsed);
  
  return (
    <>
      {/* Mobile Toggle Button */}
      <div className={`fixed top-4 left-4 z-50 lg:hidden ${
        isOpen ? 'translate-x-64' : 'translate-x-0'
      } transition-transform duration-300 ease-in-out`}>
        <button
          onClick={toggleSidebar}
          className="p-3 rounded-xl bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
        >
          {isOpen ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <Bars3Icon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-white shadow-2xl border-r border-gray-200 transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      } ${isMobile ? 'lg:translate-x-0' : ''}`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">
          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PT</span>
              </div>
              <h1 className="text-lg font-bold text-white truncate">
                {isAdmin ? 'ProTrack Admin' : isFaculty ? 'ProTrack Faculty' : 'ProTrack Student'}
              </h1>
            </div>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 hidden lg:block"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-2">
            
            {/* Dashboard */}
            {(isAdmin ? adminNavigationItems : isFaculty ? facultyNavigationItems : studentNavigationItems).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                  item.current
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                    : 'text-gray-700 hover:text-indigo-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    item.current 
                      ? 'text-indigo-500' 
                      : 'text-gray-400 group-hover:text-indigo-500'
                  } ${!isCollapsed ? 'mr-3' : 'mx-auto'}`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {item.current && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"></div>
                )}
              </Link>
            ))}

            {/* Master Files Dropdown */}
            {isAdmin && (
              <div className="space-y-1">
                <button
                  onClick={toggleMasterFiles}
                  className={`group w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                    masterFileItems.some(item => item.current)
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-gray-700 hover:text-indigo-700 hover:bg-gray-50'
                  }`}
                  title={isCollapsed ? 'Master Files' : ''}
                >
                  <div className="flex items-center w-full">
                    <FolderIcon
                      className={`h-5 w-5 flex-shrink-0 ${
                        masterFileItems.some(item => item.current)
                          ? 'text-indigo-500'
                          : 'text-gray-400 group-hover:text-indigo-500'
                      } ${!isCollapsed ? 'mr-3' : 'mx-auto'}`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">Master Files</span>
                        <div className={`transform transition-transform duration-200 ${
                          masterFilesOpen ? 'rotate-90' : 'rotate-0'
                        }`}>
                          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </>
                    )}
                  </div>
                  {masterFileItems.some(item => item.current) && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"></div>
                  )}
                </button>

                {/* Master Files Submenu */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  masterFilesOpen && !isCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="pl-4 space-y-1 mt-1">
                    {masterFileItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                          item.current
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'text-gray-600 hover:text-indigo-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 flex-shrink-0 mr-3 ${
                            item.current 
                              ? 'text-indigo-500' 
                              : 'text-gray-400 group-hover:text-indigo-500'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.current && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r-full"></div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </nav>

        {/* User profile section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50/50">
          <div 
            className="profile-section flex items-center cursor-pointer hover:bg-white rounded-xl p-3 transition-all duration-200 shadow-sm border border-transparent hover:border-gray-200"
            onClick={toggleProfileDropdown}
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {userRole.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            {!isCollapsed && (
              <>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {isAdmin ? 'Admin User' : isFaculty ? 'Faculty User' : 'Student User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userRole}</p>
                </div>
                <ChevronDownIcon 
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </div>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && !isCollapsed && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 backdrop-blur-sm">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 rounded-lg mx-1"
              >
                <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-lg mx-1"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

    </>
  );
};

export default Sidebar;