import React, { useState, createContext, useCallback, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css'; 
import NotFound from './components/NotFound';
import Layout from './components/Layout';
import { SecureStorage } from './utils/encryption';
import { SidebarProvider } from './contexts/SidebarContext';
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




export const ThemeContext = createContext();

const App = () => {
    const defaultUrl = "http://localhost/coc/itb/";
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
            '/admin/dashboard',
            '/admin/academic',
            '/admin/users',
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
                            <Route path="/login" element={<Logins />} />
                            {/* <Route path="/register" element={<Register />} /> */}
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/academic" element={<AcademicDashboard/>}/>
                            <Route path="/student/dashboard" element={<StudentDashbaord/>}/>
                            <Route path="/teacher/dashboard" element={<TeacherDashboard/>}/>
                            <Route path="/teacher/workspace" element={<FacultyWorkspace/>}/>
                            <Route path="/teacher/projects" element={<Projects/>}/>
                            <Route path="/teacher/project-detail/:projectMasterId/:projectId" element={<TeacherProjectDetailView/>}/>
                            {/* <Route path="/faculty/workspace/projects" element={<FacultyProjects/>}/> */}
                            <Route path="/student/workspace" element={<StudentWorkspace/>} />
                            <Route path="/student/project/:projectMasterId" element={<StudentProjectView/>} />
                            <Route path="/student/project/:projectMasterId/:projectId" element={<ProjectDetailView/>} />
                            <Route path="/admin/users" element={<User />} />
                        </Routes>
                    </Layout>
                </div>
            </SidebarProvider>
        </ThemeContext.Provider>
    );
};

export default App;
