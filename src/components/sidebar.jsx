import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  UsersIcon, 
  CalendarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { SecureStorage } from '../utils/encryption';
import { useSidebar } from '../contexts/SidebarContext';
import ProfileModal from './ProfileModal';

const Sidebar = () => {
  const { isOpen, isCollapsed, isMobile, toggleSidebar, closeSidebar } = useSidebar();
  const [masterFilesOpen, setMasterFilesOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const location = useLocation();
  // const navigate = useNavigate();

  useEffect(() => {
    // Get user role from SecureStorage
    console.log('Sidebar useEffect - checking for user role');
    const userLevelName =
      SecureStorage.getLocalItem('user_level_name') ||
      SecureStorage.getLocalItem('user_level');
    console.log('Retrieved user_level_name:', userLevelName);
    if (userLevelName) {
      console.log('Setting userRole to:', userLevelName);
      setUserRole(userLevelName);
    } else {
      console.log('No user role found in storage');
      setUserRole('');
    }
  }, []);


  // Normalize role and determine access groups
  const normalizedRole = (userRole || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';
  const facultyRoleKeywords = ['teacher', 'faculty instructor', 'faculty/staff', 'instructor'];
  const isFaculty = facultyRoleKeywords.some((k) => normalizedRole.includes(k));
  const isStudent = normalizedRole === 'student' || normalizedRole.includes('student');


  const toggleMasterFiles = () => {
    setMasterFilesOpen(!masterFilesOpen);
  };


  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Logout initiated');
    console.log('Current userRole before logout:', userRole);
    console.log('localStorage before clear:', { ...localStorage });
    console.log('sessionStorage before clear:', { ...sessionStorage });
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Reset user role state
    setUserRole('');
    
    // Close any open dropdowns
    setMasterFilesOpen(false);
    
    console.log('Storage cleared, redirecting to login...');
    
    // Force navigation to login page with a slight delay to ensure state updates
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
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
    },
    {
      name: 'Projects',
      href: '/admin/projects',
      icon: FolderIcon,
      current: isActiveRoute('/admin/projects')
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
  
  return (
    <>
      {/* Mobile Toggle Button - Enhanced with better positioning */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 p-3 rounded-xl bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-primary hover:bg-primary-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 lg:hidden ${
          isOpen && isMobile ? 'left-72' : 'left-4'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <Bars3Icon className="h-5 w-5" />
        )}
      </button>

      {/* Mobile Overlay - Enhanced */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Enhanced mobile behavior */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 bg-white shadow-2xl border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isMobile ? 'w-64' : sidebarWidth
        } ${
          isMobile 
            ? (isOpen ? 'translate-x-0' : '-translate-x-full')
            : 'translate-x-0'
        } ${
          !isMobile && isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
        style={{
          transform: isMobile 
            ? (isOpen ? 'translateX(0)' : 'translateX(-100%)')
            : undefined
        }}
      >
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-primary-dark to-primary shadow-lg">
          <div className={`flex items-center transition-all duration-300 ${isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PT</span>
              </div>
              <h1 className="text-lg font-bold text-white truncate">
                ProTrack
              </h1>
            </div>
          </div>
          
          {/* Desktop collapse button */}
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

          {/* Mobile close button */}
          <button 
            onClick={closeSidebar} 
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 lg:hidden"
          >
            <XMarkIcon className="h-4 w-4" />
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
                onClick={() => isMobile && closeSidebar()}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative touch-manipulation ${
                  item.current
                    ? 'bg-primary-subtle text-primary shadow-sm border border-primary-light'
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50 active:bg-gray-100'
                }`}
                title={isCollapsed && !isMobile ? item.name : ''}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    item.current 
                      ? 'text-primary' 
                      : 'text-gray-400 group-hover:text-primary'
                  } ${!isCollapsed || isMobile ? 'mr-3' : 'mx-auto'}`}
                />
                {(!isCollapsed || isMobile) && <span className="truncate">{item.name}</span>}
                {item.current && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>
                )}
              </Link>
            ))}

            {/* Master Files Dropdown */}
            {isAdmin && (
              <div className="space-y-1">
                <button
                  onClick={toggleMasterFiles}
                  className={`group w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative touch-manipulation ${
                    masterFileItems.some(item => item.current)
                      ? 'bg-primary-subtle text-primary shadow-sm border border-primary-light'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  title={isCollapsed && !isMobile ? 'Master Files' : ''}
                >
                  <div className="flex items-center w-full">
                    <FolderIcon
                      className={`h-5 w-5 flex-shrink-0 ${
                        masterFileItems.some(item => item.current)
                          ? 'text-primary'
                          : 'text-gray-400 group-hover:text-primary'
                      } ${!isCollapsed || isMobile ? 'mr-3' : 'mx-auto'}`}
                    />
                    {(!isCollapsed || isMobile) && (
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
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>
                  )}
                </button>

                {/* Master Files Submenu */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  masterFilesOpen && (!isCollapsed || isMobile) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="pl-4 space-y-1 mt-1">
                    {masterFileItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => isMobile && closeSidebar()}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative touch-manipulation ${
                          item.current
                            ? 'bg-primary-subtle text-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 flex-shrink-0 mr-3 ${
                            item.current 
                              ? 'text-primary' 
                              : 'text-gray-400 group-hover:text-primary'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.current && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full"></div>
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
          {/* User Info Display */}
          <button
            onClick={() => setProfileModalVisible(true)}
            className="w-full flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-200 mb-3 hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            title={isCollapsed ? 'View Profile' : ''}
          >
            <div className="flex-shrink-0">
              {/* Default Avatar */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {(() => {
                    const firstname = SecureStorage.getLocalItem('firstname') || '';
                    const middlename = SecureStorage.getLocalItem('middlename') || '';
                    const lastname = SecureStorage.getLocalItem('lastname') || '';
                    const fullName = `${firstname} ${middlename} ${lastname}`.trim().replace(/\s+/g, ' ');
                    return fullName || (isAdmin ? 'Admin User' : isFaculty ? 'Faculty User' : 'Student User');
                  })()}
                </p>
                <p className="text-xs text-gray-500 truncate">{userRole}</p>
              </div>
            )}
          </button>
          
          {/* Logout Button */}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        visible={profileModalVisible} 
        onClose={() => setProfileModalVisible(false)} 
      />
    </>
  );
};

export default Sidebar;