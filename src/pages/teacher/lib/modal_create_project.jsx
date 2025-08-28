import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../utils/encryption';

const Create_Modal = ({ 
    show, 
    onHide, 
    fetchProjects,
    selectedSemester,
    selectedSchoolYear
}) => {
    const [form] = Form.useForm();
    const timeoutRef = useRef(null);
    const [loading, setLoading] = useState(false);


    // Get base URL from SecureStorage
    const baseUrl = SecureStorage.getLocalItem("url");

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Generate project code based on title and current timestamp
            const timestamp = new Date().getTime().toString().slice(-6);
            const titlePrefix = values.title.substring(0, 3).toUpperCase();
            const projectCode = `${titlePrefix}${timestamp}`;

            const jsonData = {
                operation: 'saveProjectMaster',
                json: {
                    project_title: values.title,
                    project_description: values.description,
                    project_code: projectCode,
                    project_teacher_id: SecureStorage.getLocalItem('user_id'),
                    project_school_year_id: selectedSchoolYear,
                    project_is_active: 1
                }
            };

            const token = SecureStorage.getLocalItem('token');
            const response = await axios.post(`${baseUrl}teacher.php`, jsonData, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'success') {
                toast.success('Project saved successfully!');
                fetchProjects();
                onHide();
                form.resetFields();
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error saving project:', error);
            toast.error(`Failed to save project: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };



    React.useEffect(() => {
        const currentTimeout = timeoutRef.current;
        return () => {
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
        };
    }, []);

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <DocumentTextIcon className="mr-2 h-5 w-5 text-indigo-600" /> 
                    Add New Project
                </div>
            }
            open={show}
            onCancel={onHide}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="p-4"

            >
                {/* Project Title */}
                <div className="mb-6">
                    <Form.Item
                        label="Project Title"
                        name="title"
                        rules={[
                            { required: true, message: 'Please input project title!' },
                            { min: 3, message: 'Title must be at least 3 characters long' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter project title" />
                    </Form.Item>
                </div>

                {/* Divider */}
                <div className="border-b border-gray-200 mb-6"></div>

                {/* Description */}
                <div className="mb-6">
                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[
                            { required: true, message: 'Please input project description!' },
                            { min: 10, message: 'Description must be at least 10 characters long' }
                        ]}
                        className="mb-0"
                    >
                        <Input.TextArea 
                            placeholder="Enter project description" 
                            rows={4}
                        />
                    </Form.Item>
                </div>



                {/* Info about project code and school year */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> A unique project code will be automatically generated based on the project title. This project will be created for the selected school year.
                    </p>
                </div>

                {/* Button Row */}
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onHide}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        Save Project
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export { Create_Modal };
