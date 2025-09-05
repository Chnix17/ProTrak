import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Spin, Table, Button, Card } from 'antd';
import Sidebar from '../../../components/sidebar';
import { Create_Modal as CREATE_MODAL } from './lib/academic/modal_create';
import { Update_Modal as UPDATE_MODAL } from './lib/academic/modal_update';
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

  // const showCreateModal = () => {
  //   setIsCreateModalVisible(true);
  // };

  // const handleEdit = (year) => {
  //   setEditingYear(year);
  //   setIsUpdateModalVisible(true);
  // };

  // const handleDelete = async (id) => {
  //   if (window.confirm('Are you sure you want to delete this academic year?')) {
  //     try {
  //       const response = await axios.post(
  //         `${baseUrl}admin.php`,
  //         {
  //           operation: 'deleteAcademicYear',
  //           id: id
  //         },
  //         { headers: { 'Content-Type': 'application/json' } }
  //       );

  //       if (response.data.status === 'success') {
  //         toast.success('Academic year deleted successfully');
  //         fetchAcademicYears();
  //       } else {
  //         throw new Error(response.data.message || 'Failed to delete academic year');
  //       }
  //     } catch (error) {
  //       console.error('Error deleting academic year:', error);
  //       toast.error('Failed to delete academic year');
  //     }
  //   }
  // };

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
      <div className="flex-1 p-6 overflow-auto">
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Academic Year Management</h1>
            <Button 
              type="primary"
              icon={<PlusIcon className="w-4 h-4 mr-1" />}
              onClick={() => setIsCreateModalVisible(true)}
              className="flex items-center"
            >
              Add Academic Year
            </Button>
          </div>
        </Card>
        
        <Spin spinning={loading}>
          <Card>
            <Table 
              dataSource={academicYears}
              rowKey="school_year_id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Academic Year',
                  dataIndex: 'school_year_name',
                  key: 'school_year_name',
                },
                {
                  title: 'Semester',
                  dataIndex: 'school_year_semester_id',
                  key: 'school_year_semester_id',
                  render: (semesterId) => getSemesterName(semesterId),
                },
                {
                  title: 'Start Date',
                  dataIndex: 'school_year_start_date',
                  key: 'school_year_start_date',
                  render: (dateString) => formatDate(dateString),
                },
                {
                  title: 'End Date',
                  dataIndex: 'school_year_end_date',
                  key: 'school_year_end_date',
                  render: (dateString) => formatDate(dateString),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Button
                      type="text"
                      icon={<PencilIcon className="w-4 h-4" />}
                      onClick={() => {
                        setEditingYear(record);
                        setIsUpdateModalVisible(true);
                      }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Spin>

        {/* Create Modal */}
        <CREATE_MODAL
          show={isCreateModalVisible}
          onHide={() => setIsCreateModalVisible(false)}
          fetchAcademicYears={fetchAcademicYears}
          semesters={semesters}
        />

        {/* Update Modal */}
        <UPDATE_MODAL
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
  );
};

export default AcademicYear;