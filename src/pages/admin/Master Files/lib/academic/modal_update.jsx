import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import axios from 'axios';
import dayjs from 'dayjs';
import { SecureStorage } from '../../../../../utils/encryption';

const { Option } = Select;

const Update_Modal = ({ show, onHide, fetchAcademicYears, academicYear, semesters }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    if (academicYear) {
      form.setFieldsValue({
        school_year_name: academicYear.school_year_name,
        school_year_semester_id: academicYear.school_year_semester_id,
        school_year_date_range: [
          dayjs(academicYear.school_year_start_date),
          dayjs(academicYear.school_year_end_date)
        ]
      });
    }
  }, [academicYear, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const jsonData = {
        operation: 'updateSchoolYear',
        school_year_id: academicYear.school_year_id,
        school_year_name: values.school_year_name,
        school_year_start_date: values.school_year_date_range[0].format('YYYY-MM-DD'),
        school_year_end_date: values.school_year_date_range[1].format('YYYY-MM-DD'),
        school_year_semester_id: values.school_year_semester_id,
        school_year_admin_id: SecureStorage.getLocalItem("user_id")
      };

      const response = await axios.post(`${baseUrl}admin.php`, jsonData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Academic year updated successfully!');
        fetchAcademicYears();
        onHide();
      } else {
        throw new Error(response.data.message || 'Failed to update academic year');
      }
    } catch (error) {
      console.error('Error updating academic year:', error);
      toast.error(`Failed to update academic year: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    // Can not select days before today
    return current && current < dayjs().startOf('day');
  };

  if (!academicYear) return null;

  return (
    <Modal
      title="Edit Academic Year"
      open={show}
      onCancel={onHide}
      footer={[
        <Button key="back" onClick={onHide}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
          icon={<EditOutlined />}
        >
          Update Academic Year
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="school_year_name"
          label="Academic Year"
          rules={[
            { required: true, message: 'Please input the academic year!' },
            {
              pattern: /^SY\s\d{4}-\d{4}$/,
              message: 'Format should be "SY YYYY-YYYY" (e.g., SY 2023-2024)'
            }
          ]}
        >
          <Input placeholder="e.g., SY 2023-2024" />
        </Form.Item>

        <Form.Item
          name="school_year_semester_id"
          label="Semester"
          rules={[{ required: true, message: 'Please select a semester!' }]}
        >
          <Select placeholder="Select semester">
            {semesters.map(semester => (
              <Option key={semester.semester_id} value={semester.semester_id}>
                {semester.semester_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="school_year_date_range"
          label="Date Range"
          rules={[{ required: true, message: 'Please select date range!' }]}
        >
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            disabledDate={disabledDate}
            format="MMMM D, YYYY"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export { Update_Modal };