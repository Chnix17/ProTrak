import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, message } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import axios from 'axios';
import dayjs from 'dayjs';
import { SecureStorage } from '../../../../../utils/encryption';

const { Option } = Select;

const Create_Modal = ({ show, onHide, fetchAcademicYears, semesters }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const jsonData = {
        operation: 'insertSchoolYear',
        school_year_name: values.school_year_name,
        school_year_start_date: values.school_year_date_range[0].format('YYYY-MM-DD'),
        school_year_end_date: values.school_year_date_range[1].format('YYYY-MM-DD'),
        school_year_semester_id: values.school_year_semester_id,
        school_year_admin_id: SecureStorage.getLocalItem("user_id")
      };

      console.log(jsonData);

      const response = await axios.post(`${baseUrl}admin.php`, jsonData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Academic year added successfully!');
        fetchAcademicYears();
        onHide();
        form.resetFields();
      } else {
        throw new Error(response.data.message || 'Failed to add academic year');
      }
    } catch (error) {
      console.error('Error adding academic year:', error);
      toast.error(`Failed to add academic year: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    // Can not select days before today
    return current && current < dayjs().startOf('day');
  };

  return (
    <Modal
      title="Add New Academic Year"
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
          icon={<PlusCircleOutlined />}
        >
          Add Academic Year
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          school_year_semester_id: semesters[0]?.semester_id
        }}
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

export { Create_Modal };