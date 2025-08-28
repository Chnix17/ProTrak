import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const FacultySidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const isActiveRoute = (path) => location.pathname === path;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/teacher/dashboard',
      icon: HomeIcon,
      current: isActiveRoute('/teacher/dashboard')
    },
    {
      name: 'Workspace',
      href: '/faculty/workspace',
      icon: FolderIcon,
      current: isActiveRoute('/faculty/workspace')
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Faculty Portal</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <div className="px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 ${
                    item.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default FacultySidebar;
