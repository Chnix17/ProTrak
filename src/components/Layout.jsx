import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './sidebar';
import { useSidebar } from '../contexts/SidebarContext';

const Layout = ({ children }) => {
  const { isOpen, isCollapsed, isMobile } = useSidebar();
  const location = useLocation();
  
  // Don't show sidebar on login page
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';
  
  if (isLoginPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  // Calculate margin based on sidebar state
  const getMainContentMargin = () => {
    if (isMobile) {
      return 'ml-0'; // No margin on mobile
    }
    
    if (isCollapsed) {
      return 'ml-20'; // Collapsed sidebar width
    }
    
    return isOpen ? 'ml-64' : 'ml-0'; // Full width or no sidebar
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content area */}
      <div className={`transition-all duration-300 ease-in-out ${getMainContentMargin()}`}>
        <div className="min-h-screen">
          {/* Content wrapper with padding */}
          <div className="p-4 lg:p-6">
            <div className="max-w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
