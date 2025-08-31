import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    // Default to true on desktop, false on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile && isOpen) {
        setIsOpen(false);
      } else if (!mobile && !isOpen && !isCollapsed) {
        setIsOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isOpen, isCollapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      if (isOpen) {
        setIsCollapsed(!isCollapsed);
      } else {
        setIsOpen(true);
        setIsCollapsed(false);
      }
    }
  };

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    setIsCollapsed(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
    setIsCollapsed(false);
  }, []);

  // Touch gesture handling
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isMobile) {
      if (isLeftSwipe && isOpen) {
        closeSidebar();
      } else if (isRightSwipe && !isOpen) {
        openSidebar();
      }
    }
  }, [isMobile, isOpen, touchStart, touchEnd, closeSidebar, openSidebar]);

  // Add touch event listeners
  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchstart', onTouchStart);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);

      return () => {
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [isMobile, isOpen, touchStart, touchEnd, onTouchStart, onTouchMove, onTouchEnd]);

  const value = {
    isOpen,
    isCollapsed,
    isMobile,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setIsOpen,
    setIsCollapsed,
    sidebarRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
