import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Sidebar from '../../../components/sidebar';
import { Create_Modal } from './lib/academic/modal_create';
import Update_Modal from './lib/academic/modal_update';
import { SecureStorage } from '../../../utils/encryption';

const AcademicYear = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}admin.php`,
        { operation: "fetchSchoolYears" },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status === 'success') {
        setAcademicYears(response.data.data);
      } else {
        toast.error("Error fetching academic years: " + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error("An error occurred while fetching academic years.");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await axios.post(
        `${baseUrl}admin.php`,
        { operation: "fetchSemester" },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status === 'success') {
        setSemesters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAcademicYears();
    fetchSemesters();
  }, [fetchAcademicYears, fetchSemesters]);

  const showCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setIsUpdateModalVisible(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      try {
        const response = await axios.post(
          `${baseUrl}admin.php`,
          {
            operation: 'deleteAcademicYear',
            id: id
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.status === 'success') {
          toast.success('Academic year deleted successfully');
          fetchAcademicYears();
        } else {
          throw new Error(response.data.message || 'Failed to delete academic year');
        }
      } catch (error) {
        console.error('Error deleting academic year:', error);
        toast.error('Failed to delete academic year');
      }
    }
  };

  const getSemesterName = (semesterId) => {
    const semester = semesters.find(s => s.semester_id === semesterId);
    return semester ? semester.semester_name : 'Unknown';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Academic Year Management</h1>
                <p className="text-gray-600">Manage academic years and semesters</p>
              </div>
              <button
                onClick={showCreateModal}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Add Academic Year
              </button>
            </div>
          </div>

          {/* Academic Years Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {academicYears.map((year) => (
                    <tr key={year.school_year_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {year.school_year_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSemesterName(year.school_year_semester_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(year.school_year_start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(year.school_year_end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(year)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(year.school_year_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Modal */}
          <Create_Modal
            show={isCreateModalVisible}
            onHide={() => setIsCreateModalVisible(false)}
            fetchAcademicYears={fetchAcademicYears}
            semesters={semesters}
          />

          {/* Update Modal */}
          <Update_Modal
            show={isUpdateModalVisible}
            onHide={() => {
              setIsUpdateModalVisible(false);
              setEditingYear(null);
            }}
            fetchAcademicYears={fetchAcademicYears}
            academicYear={editingYear}
            semesters={semesters}
          />
        </div>
      </div>
    </div>
  );
};

export default AcademicYear;