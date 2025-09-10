import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorize from '../components/NotAuthorize';
import { SecureStorage } from './encryption';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [showModal, setShowModal] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false);
    // Check both regular localStorage and SecureStorage for backward compatibility
    const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getLocalItem('loggedIn');
    const userRole = SecureStorage.getLocalItem('user_level_name') || SecureStorage.getLocalItem('user_level');
    // Fallback to numeric role id when role name is missing
    const userLevelId = SecureStorage.getLocalItem('user_level_id') || SecureStorage.getLocalItem('user_level_id');
    // Complete mapping for all user level IDs to role names
    const roleMap = { 
        '1': 'Administrator',
        '2': 'Faculty Instructor', 
        '3': 'Student'
    };
    const resolvedUserRole = userRole || roleMap[String(userLevelId)] || '';
    console.log('Resolved User Role:', resolvedUserRole);

    // Debug logging to help identify the issue
    console.log('ProtectedRoute Debug:', {
        isLoggedIn,
        userRole,
        userLevelId,
        resolvedUserRole,
        allowedRoles
    });

    useEffect(() => {
        if (allowedRoles && !allowedRoles.includes(resolvedUserRole)) {
            setShowModal(true);
        }
    }, [allowedRoles, resolvedUserRole]);

    const handleModalClose = () => {
        setShowModal(false);
        // Delay navigation until after modal closes
        setTimeout(() => {
            setShouldNavigate(true);
        }, 300); // 300ms delay to match modal animation
    };

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    const getRedirectPath = () => {
        if (resolvedUserRole === 'Administrator' || resolvedUserRole === 'Admin') return '/admin/dashboard';
        if (resolvedUserRole === 'Faculty Instructor' ) return '/teacher/dashboard';
        if (resolvedUserRole === 'Student') return '/student/dashboard';
        if (resolvedUserRole === 'Staff') return '/admin/dashboard';
        return '/login';
    };

    if (allowedRoles && !allowedRoles.includes(resolvedUserRole)) {
        return (
            <>
                <NotAuthorize open={showModal} onClose={handleModalClose} />
                {shouldNavigate && <Navigate to={getRedirectPath()} replace />}
            </>
        );
    }

    return children;
};

export default ProtectedRoute;