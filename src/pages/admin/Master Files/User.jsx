import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon, EyeSlashIcon, EyeIcon, ArchiveBoxIcon, ArchiveBoxArrowDownIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Create_Modal } from './lib/users/modal_create';
import Update_Modal from './lib/users/modal_update';
import { SecureStorage } from '../../../utils/encryption';
import Sidebar from '../../../components/sidebar';





const User = () => {
  const [users, setUsers] = useState([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [titles, setTitles] = useState([]);
  const [userLevels, setUserLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showArchivedUsers, setShowArchivedUsers] = useState(false);


     const baseUrl = SecureStorage.getLocalItem("url");

  const fetchUsers = useCallback(async (includeArchived = false) => {
    setLoading(true);
    try {
        const response = await axios.post(`${baseUrl}admin.php`, 
            { 
              operation: includeArchived ? "fetchInactiveUsers" : "fetchUsers" 
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.status === 'success') {
            setUsers(response.data.data);
        } else {
            toast.error("Error fetching users: " + (response.data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        toast.error("An error occurred while fetching users.");
    } finally {
        setLoading(false);
    }
  }, [baseUrl]);

  

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch users
        await fetchUsers();
        
        // Fetch user levels
        const levelsResponse = await axios.post(
          `${baseUrl}/admin.php`,
          { operation: 'fetchUserLevels' },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (levelsResponse.data.status === 'success') {
          setUserLevels(levelsResponse.data.data);
        }
        
        // Fetch titles
        const titlesResponse = await axios.post(
          `${baseUrl}/admin.php`,
          { operation: 'fetchTitles' },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (titlesResponse.data.status === 'success') {
          setTitles(titlesResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };
    
    fetchInitialData();
  }, [baseUrl]);




  const showCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const toggleArchivedView = () => {
    const newShowArchived = !showArchivedUsers;
    setShowArchivedUsers(newShowArchived);
    fetchUsers(newShowArchived);
  };


  const handleEdit = async (user) => {
    try {
      setLoading(true);
      // Fetch the full user details including title and user level info
      const response = await axios.post(
        `${baseUrl}/admin.php`,
        {
          operation: 'fetchUserById',
          userId: user.users_id
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.status === 'success') {
        setEditingUser(response.data.data);
        setIsUpdateModalVisible(true);
      } else {
        throw new Error(response.data.message || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveRestore = async (userId) => {
    const isRestoring = showArchivedUsers;
    const action = isRestoring ? 'restore' : 'archive';
    const confirmMessage = isRestoring 
      ? 'Are you sure you want to restore this user? This will activate their account.'
      : 'Are you sure you want to archive this user? This will deactivate their account.';
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await axios.post(`${baseUrl}admin.php`, 
          {
            operation: "updateUsers",
            userId: userId,
            archive: !isRestoring // false to restore (activate), true to archive
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.status === 'success') {
          toast.success(`User ${action}d successfully`);
          fetchUsers(showArchivedUsers);
        } else {
          throw new Error(response.data.message || `Failed to ${action} user`);
        }
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        toast.error(`Failed to ${action} user`);
      }
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const isActivating = currentStatus === 0;
    const action = isActivating ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const response = await axios.post(`${baseUrl}admin.php`, 
          {
            operation: "updateUsers",
            userId: userId,
            archive: !isActivating // false to activate (set to 1), true to deactivate (set to 0)
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.status === 'success') {
          toast.success(`User ${action}d successfully`);
          fetchUsers(showArchivedUsers);
        } else {
          throw new Error(response.data.message || `Failed to ${action} user`);
        }
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        toast.error(`Failed to ${action} user`);
      }
    }
  };

  const getTitleName = (titleId) => {
    // This function will be handled by the modal component
    return '';
  };

  // User level name is already included in the API response

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage system users and their access levels</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={toggleArchivedView}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                  {showArchivedUsers ? 'View Active Users' : 'View Archived Users'}
                </button>
                <button
                  onClick={showCreateModal}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add User
                </button>
              </div>
            </div>
          </div>



          {/* Create Modal */}
          <Create_Modal 
            show={isCreateModalVisible} 
            onHide={() => setIsCreateModalVisible(false)}
            fetchUsers={fetchUsers}
          />

          {/* Update Modal */}
          <Update_Modal 
            show={isUpdateModalVisible}
            onHide={() => {
              setIsUpdateModalVisible(false);
              setEditingUser(null);
            }}
            user={editingUser}
            fetchUsers={fetchUsers}
            userLevels={userLevels}
            titles={titles}
          />

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {showArchivedUsers ? 'Archived Users List' : 'Active Users List'}
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getTitleName(user.users_title_id)} {user.users_fname} {user.users_mname} {user.users_lname} {user.users_suffix}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.users_school_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.users_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.user_level_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.users_is_active === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.users_is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit User"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.users_is_active)}
                          className={`${
                            user.users_is_active === 1 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.users_is_active === 1 ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.users_is_active === 1 ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleArchiveRestore(user.users_id)}
                          className={showArchivedUsers ? "text-green-600 hover:text-green-900" : "text-orange-600 hover:text-orange-900"}
                          title={showArchivedUsers ? "Restore User" : "Archive User"}
                        >
                          {showArchivedUsers ? (
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                          ) : (
                            <ArchiveBoxIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No users found. Click "Add User" to create your first user.
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default User;