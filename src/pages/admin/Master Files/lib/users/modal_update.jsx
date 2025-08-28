import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { UserIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../../../utils/encryption';    

const Update_Modal = ({ 
    show, 
    onHide, 
    user,
    fetchUsers,
    userLevels,
    titles
}) => {
    const [form] = Form.useForm();
    const timeoutRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const baseUrl = SecureStorage.getLocalItem("url");
    
    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]*$/;
    const passwordSingleSpecialCharRegex = /[!@#$%^&*]/g;

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                users_id: user.users_id,
                // Align with Create_Modal: title select uses title_name as value
                users_title: user.title_name || '',
                users_firstname: user.users_fname,
                users_middlename: user.users_mname || '',
                users_lastname: user.users_lname,
                users_suffix: user.users_suffix || '',
                users_school_id: user.users_school_id,
                users_email: user.users_email,
                // Align with Create_Modal: role select uses numeric user_level_id
                users_role: user.users_user_level_id,
            });
        } else {
            form.resetFields();
        }
    }, [user, form]);

    // Titles and userLevels are supplied by parent (User.jsx) to stay consistent with Create_Modal

    // Track form changes
  const handleValuesChange = (changedValues, allValues) => {
    setHasChanges(true);
  };

  const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const jsonData = {
                operation: 'updateUser',
                userId: user.users_id,
                json: {
                    // Map title_name to title_id like Create_Modal
                    users_title_id: values.users_title ? (titles.find(t => t.title_name === values.users_title)?.title_id || 1) : 1,
                    users_fname: values.users_firstname,
                    users_mname: values.users_middlename || "",
                    users_lname: values.users_lastname,
                    users_suffix: values.users_suffix || "",
                    users_school_id: values.users_school_id,
                    users_email: values.users_email,
                    users_user_level_id: parseInt(values.users_role),
                    ...(values.users_password && { users_password: values.users_password })
                }
            };

            const response = await axios.post(`${baseUrl}/admin.php`, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                toast.success('User updated successfully!');
                fetchUsers();
                onHide();
                form.resetFields();
            } else {
                if (response.data.message === 'A user with that School ID and Email already exists.') {
                    form.setFields([
                        {
                            name: 'users_school_id',
                            errors: ['A user with that School ID and Email already exists.']
                        },
                        {
                            name: 'users_email',
                            errors: ['A user with that School ID and Email already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                if (response.data.message === 'School ID already exists.') {
                    form.setFields([
                        {
                            name: 'users_school_id',
                            errors: ['School ID already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                if (response.data.message === 'Email address already exists.') {
                    form.setFields([
                        {
                            name: 'users_email',
                            errors: ['Email address already exists.']
                        }
                    ]);
                    setLoading(false);
                    return;
                }
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Failed to update user: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <span>Edit User</span>
                </div>
            }
            open={show}
            onCancel={onHide}
            footer={null}
            width={700}
            centered
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleValuesChange}
                className="p-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6 items-end">
                    <Form.Item
                        label="Title"
                        name="users_title"
                        className="mb-0"
                        style={{ minWidth: 80, maxWidth: 100 }}
                    >
                        <Select placeholder="Title" size="small" style={{ width: '100%' }}>
                            <Select.Option value="">None</Select.Option>
                            {Array.isArray(titles) && titles.map((title) => (
                                <Select.Option key={title.title_id} value={title.title_name}>
                                    {title.title_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="First Name"
                        name="users_firstname"
                        rules={[
                            { required: true, message: 'Please input first name!' },
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter first name" />
                    </Form.Item>
                    <Form.Item
                        label="Middle Name"
                        name="users_middlename"
                        rules={[
                            { pattern: /^[a-zA-Z\s]*$/, message: 'Name can only contain letters and spaces' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter middle name" />
                    </Form.Item>
                    <Form.Item
                        label="Last Name"
                        name="users_lastname"
                        rules={[
                            { required: true, message: 'Please input last name!' },
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter last name" />
                    </Form.Item>
                    <Form.Item
                        label="Suffix"
                        name="users_suffix"
                        className="mb-0"
                        style={{ minWidth: 80, maxWidth: 100 }}
                    >
                        <Select placeholder="Suffix" size="small" style={{ width: '100%' }}>
                            <Select.Option value="">None</Select.Option>
                            <Select.Option value="Jr.">Jr.</Select.Option>
                            <Select.Option value="Sr.">Sr.</Select.Option>
                            <Select.Option value="II">II</Select.Option>
                            <Select.Option value="III">III</Select.Option>
                            <Select.Option value="IV">IV</Select.Option>
                            <Select.Option value="V">V</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                <div className="border-b border-gray-200 mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Form.Item
                        label="School ID"
                        name="users_school_id"
                        rules={[
                            { required: true, message: 'Please input school ID!' },
                            { pattern: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/, message: 'School ID must be in the format x1-x1-x1' }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter school ID" />
                    </Form.Item>
                    <Form.Item
                        label="Email Address"
                        name="users_email"
                        rules={[
                            { required: true, message: 'Please input email address!' },
                            { 
                                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message: 'Please enter a valid email address'
                            }
                        ]}
                        className="mb-0"
                    >
                        <Input placeholder="Enter email address" />
                    </Form.Item>
                </div>

                <div className="border-b border-gray-200 mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Form.Item
                        label="Role"
                        name="users_role"
                        rules={[{ required: true, message: 'Please select a role!' }]}
                        className="mb-0"
                    >
                        <Select placeholder="Select role">
                            {Array.isArray(userLevels) && userLevels.map((level) => (
                                <Select.Option key={level.user_level_id} value={level.user_level_id}>
                                    {level.user_level_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="New Password (leave blank to keep current)"
                        name="users_password"
                        rules={[
                            { min: 8, message: 'Password must be at least 8 characters long!' }
                        ]}
                        className="mb-0"
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                </div>



                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onHide}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={loading}
                        className="bg-green-900 hover:bg-lime-900"
                        disabled={!hasChanges}
                    >
                        Save Changes
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default Update_Modal;