import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  UserPlusIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';

const InviteStudentModal = ({ isOpen, onClose, projectMasterId }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitingStudents, setInvitingStudents] = useState(new Set());
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch students by master ID
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchStudentByMasterId',
          project_master_id: parseInt(projectMasterId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const studentsData = response.data.data || [];
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const fullName = `${student.users_fname} ${student.users_mname || ''} ${student.users_lname}`.toLowerCase();
        const email = student.users_email?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) ||
               student.users_school_id?.toLowerCase().includes(searchLower);
      });
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Handle invite student
  const handleInviteStudent = async (studentId) => {
    try {
      setInvitingStudents(prev => new Set([...prev, studentId]));
      const token = SecureStorage.getLocalItem('token');
      
      // Add student directly to the project
      const inviteResponse = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'insertJoined',
          student_user_id: [studentId],
          student_project_master_id: parseInt(projectMasterId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (inviteResponse.data.status === 'success') {
        toast.success('Student added to project successfully!');
        // Remove invited student from the list
        setStudents(prev => prev.filter(student => student.users_id !== studentId));
        setFilteredStudents(prev => prev.filter(student => student.users_id !== studentId));
      } else {
        toast.error(inviteResponse.data.message || 'Failed to add student to project');
      }
    } catch (error) {
      console.error('Error adding student to project:', error);
      toast.error('Failed to add student to project');
    } finally {
      setInvitingStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      fetchStudents();
    }
  }, [isOpen, projectMasterId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-primary-subtle rounded-lg p-2 mr-3">
              <UserPlusIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invite Students</h2>
              <p className="text-sm text-gray-600">Invite other students to collaborate on your project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No students found' : 'No students available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'All students in this workspace may already be invited or part of projects'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.users_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center flex-1">
                    <div className="bg-primary-subtle rounded-full p-3 mr-4">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {`${student.users_fname} ${student.users_mname ? student.users_mname + ' ' : ''}${student.users_lname}`}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        <span>{student.users_email}</span>
                        {student.users_school_id && (
                          <>
                            <span className="mx-2">•</span>
                            <span>ID: {student.users_school_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInviteStudent(student.users_id)}
                    disabled={invitingStudents.has(student.users_id)}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {invitingStudents.has(student.users_id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Inviting...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-4 w-4 mr-2" />
                        Invite
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteStudentModal;
