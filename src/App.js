import React, { useState, createContext, useCallback, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css'; 
import NotFound from './components/NotFound';
import Layout from './components/Layout';
import { SecureStorage } from './utils/encryption';
import { SidebarProvider } from './contexts/SidebarContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Logins from './pages/auth/Logins';
import AdminDashboard from './pages/admin/admindashboard';
import AcademicDashboard from './pages/admin/Master Files/AcademicYear';
import StudentDashbaord from './pages/student/studentDashboard';
import TeacherDashboard from './pages/teacher/teacherDashboard';
import FacultyWorkspace from './pages/teacher/workspace';
import Projects from './pages/teacher/projects';
import StudentWorkspace from './pages/student/StudentWorkspace';
import StudentProjectView from './pages/student/StudentProjectView';
import ProjectDetailView from './pages/student/ProjectDetailView';
import TeacherProjectDetailView from './pages/teacher/TeacherProjectDetailView';
import User from './pages/admin/Master Files/User';
import AdminProjects from './pages/admin/AdminProjects';




export const ThemeContext = createContext();

const App = () => {
    const defaultUrl = "http://localhost/protrack/api/api/";
    const storedUrl = SecureStorage.getLocalItem("url");
    
    if (!storedUrl || storedUrl !== defaultUrl) {
        SecureStorage.setLocalItem("url", defaultUrl);
    }

    

    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }, []);

    // Add state for the current theme
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
    });

    // Function to toggle the theme
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }, []);

    const [isNotFoundVisible, setIsNotFoundVisible] = useState(false);
    const location = useLocation();

    // Add URL validation
    useEffect(() => {
        const validPaths = [
            '/login',
            '/dashboard',
            '/admin/dashboard',
            '/admin/academic',
            '/admin/users',
            '/admin/projects',
            '/teacher/dashboard',
            '/student/dashboard',
            '/teacher/workspace',
            '/teacher/projects',
            '/teacher/project-detail',
            '/faculty/workspace/projects',
            '/student/workspace',
            '/student/project',
            '/register'
        ];

        // Only show not found if we're not on the root path and the path is not in validPaths
        if (location.pathname !== '/' && !validPaths.some(path => location.pathname.startsWith(path))) {
            setIsNotFoundVisible(true);
        } else {
            setIsNotFoundVisible(false);
        }
    }, [location.pathname]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <SidebarProvider>
                <div className={`app-container ${theme}`}>
                    <Toaster richColors position='top-center' duration={1500} />
                    <NotFound 
                        isVisible={isNotFoundVisible} 
                        onClose={() => setIsNotFoundVisible(false)} 
                    />
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="/dashboard" element={<Navigate to="/login" replace />} />
                            <Route path="/login" element={<Logins />} />
                            {/* <Route path="/register" element={<Register />} /> */}
                            
                            {/* Admin Protected Routes */}
                            <Route path="/admin/dashboard" element={
                                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/academic" element={
                                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                                    <AcademicDashboard/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/admin/users" element={
                                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                                    <User />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/projects" element={
                                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                                    <AdminProjects />
                                </ProtectedRoute>
                            } />
                            
                            {/* Faculty/Teacher Protected Routes */}
                            <Route path="/teacher/dashboard" element={
                                <ProtectedRoute allowedRoles={['faculty instructor']}>
                                    <TeacherDashboard/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/teacher/workspace" element={
                                <ProtectedRoute allowedRoles={['faculty instructor']}>
                                    <FacultyWorkspace/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/teacher/projects" element={
                                <ProtectedRoute allowedRoles={['faculty instructor']}>
                                    <Projects/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/teacher/project-detail/:projectMasterId/:projectId" element={
                                <ProtectedRoute allowedRoles={['faculty instructor']}>
                                    <TeacherProjectDetailView/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* Student Protected Routes */}
                            <Route path="/student/dashboard" element={
                                <ProtectedRoute allowedRoles={['student']}>
                                    <StudentDashbaord/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/student/workspace" element={
                                <ProtectedRoute allowedRoles={['student']}>
                                    <StudentWorkspace/>
                                </ProtectedRoute>
                            } />
                            <Route path="/student/project/:projectMasterId" element={
                                <ProtectedRoute allowedRoles={['student']}>
                                    <StudentProjectView/>
                                </ProtectedRoute>
                            } />
                            <Route path="/student/project/:projectMasterId/:projectId" element={
                                <ProtectedRoute allowedRoles={['student']}>
                                    <ProjectDetailView/>
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </Layout>
                </div>
            </SidebarProvider>
        </ThemeContext.Provider>
    );
};

export default App;
