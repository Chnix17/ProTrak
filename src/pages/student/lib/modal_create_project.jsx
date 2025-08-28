import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';

const ModalCreateProject = ({ isOpen, onClose, onSuccess, projectMasterId }) => {
  const [formData, setFormData] = useState({
    project_title: '',
    project_description: '',
    members: []
  });
  const [availableMembers, setAvailableMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch available students
  const fetchAvailableMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchStudents',
          exclude_user_id: userId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Fetch students response:', response.data);
      console.log('Current user ID:', userId);
      
      if (response.data.status === 'success') {
        const allStudents = response.data.data || [];
        console.log('All students:', allStudents);
        
        // Filter out current user and only include active students
        const students = allStudents.filter(student => {
          const isNotCurrentUser = student.users_id !== parseInt(userId);
          const isActive = student.users_is_active === 1 || student.users_is_active === "1" || student.users_is_active === true;
          
          return isNotCurrentUser && isActive;
        });
        
        console.log('Filtered students:', students);
        setAvailableMembers(students);
        setFilteredMembers(students);
      } else {
        console.log('API returned error status:', response.data);
      }
    } catch (error) {
      console.error('Error fetching available members:', error);
      // Don't show error toast as members are optional
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Helper function to format full name
  const formatFullName = (student) => {
    const parts = [
      student.title_name,
      student.users_fname,
      student.users_mname,
      student.users_lname,
      student.users_suffix
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(' ');
  };

  // Handle search functionality
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredMembers(availableMembers);
    } else {
      const filtered = availableMembers.filter(student => {
        const fullName = formatFullName(student).toLowerCase();
        const email = student.users_email.toLowerCase();
        const searchLower = searchValue.toLowerCase();
        
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
      setFilteredMembers(filtered);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    if (!formData.project_description.trim()) {
      toast.error('Please enter a project description');
      return;
    }

    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const payload = {
        operation: 'saveProjectMain',
        project_main_master_id: parseInt(projectMasterId),
        project_title: formData.project_title.trim(),
        project_description: formData.project_description.trim(),
        project_created_by_user_id: parseInt(userId),
        ...(formData.members.length > 0 && { members: formData.members })
      };
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Project created successfully!');
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle member selection
  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(id => id !== memberId)
        : [...prev.members, memberId]
    }));
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      project_title: '',
      project_description: '',
      members: []
    });
    setSearchTerm('');
    setFilteredMembers([]);
    onClose();
  };

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen && projectMasterId) {
      fetchAvailableMembers();
    }
  }, [isOpen, projectMasterId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label htmlFor="project_title" className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                id="project_title"
                name="project_title"
                value={formData.project_title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter project title"
                required
              />
            </div>

            {/* Project Description */}
            <div>
              <label htmlFor="project_description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                id="project_description"
                name="project_description"
                value={formData.project_description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter detailed project description"
                required
              />
            </div>

            {/* Members Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Members (Optional)
              </label>
              
              {isLoadingMembers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading students...</p>
                </div>
              ) : availableMembers.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No other students available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search Input */}
                  <div>
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  {/* Members List */}
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'No students found matching your search' : 'No students available'}
                        </p>
                      </div>
                    ) : (
                      filteredMembers.map((student) => (
                        <div key={student.users_id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
                          <input
                            type="checkbox"
                            id={`member-${student.users_id}`}
                            checked={formData.members.includes(student.users_id)}
                            onChange={() => handleMemberToggle(student.users_id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`member-${student.users_id}`} className="ml-3 flex-1 cursor-pointer">
                            <div className="text-sm font-medium text-gray-900">
                              {formatFullName(student)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.users_email}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {student.users_school_id}
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {formData.members.length > 0 && (
                <div className="mt-3 p-2 bg-indigo-50 rounded-md">
                  <p className="text-sm text-indigo-700 font-medium">
                    {formData.members.length} student{formData.members.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.members.map(memberId => {
                      const student = availableMembers.find(s => s.users_id === memberId);
                      return student ? (
                        <span key={memberId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {formatFullName(student)}
                          <button
                            type="button"
                            onClick={() => handleMemberToggle(memberId)}
                            className="ml-1 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalCreateProject;