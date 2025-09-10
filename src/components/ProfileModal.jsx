import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Row, 
  Col, 
  Divider,
  Space,
  Badge,
  Spin,
  Select
} from 'antd';
import { toast } from 'sonner';
import { 
  UserOutlined, 
  EditOutlined, 
  LockOutlined, 
  MailOutlined,
  IdcardOutlined,
  SaveOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CloseOutlined
} from '@ant-design/icons';
import { SecureStorage } from '../utils/encryption';

const { Title, Text } = Typography;

const ProfileModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [titles, setTitles] = useState([]);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const baseUrl = SecureStorage.getLocalItem("url");

  useEffect(() => {
    if (visible) {
      fetchUserProfile();
      fetchTitles();
    }
  }, [visible]);

  useEffect(() => {
    if (userInfo && isEditing) {
      profileForm.setFieldsValue({
        users_title_id: userInfo.users_title_id,
        users_fname: userInfo.users_fname,
        users_mname: userInfo.users_mname,
        users_lname: userInfo.users_lname,
        users_suffix: userInfo.users_suffix,
        users_school_id: userInfo.users_school_id,
        users_email: userInfo.users_email
      });
    }
  }, [userInfo, isEditing, profileForm]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userId = SecureStorage.getLocalItem('users_id') || '1';
      const response = await fetch(`${baseUrl}/admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchUserById',
          userId: parseInt(userId)
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setUserInfo(data.data);
      } else {
        toast.error('Failed to load profile information');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile information');
    } finally {
      setLoading(false);
    }
  };

  const fetchTitles = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'fetchTitles'
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setTitles(data.data);
      }
    } catch (error) {
      console.error('Error fetching titles:', error);
    }
  };

  const handlePasswordReset = async (values) => {
    setLoading(true);
    // Clear previous field errors
    setPasswordFieldErrors({});
    
    try {
      const userId = SecureStorage.getLocalItem('users_id') || '1';
      const response = await fetch(`${baseUrl}/admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updatePassword',
          userId: parseInt(userId),
          json: values
        })
      });

      const data = await response.json();
      console.log('Password update response:', data); // Debug log
      
      if (data.status === 'success') {
        toast.success('Password updated successfully');
        passwordForm.resetFields();
        setPasswordFieldErrors({});
      } else {
        toast.error(data.message || 'Failed to update password');
        
        // Set field errors based on specific error messages
        if (data.message === 'New password must be different from current password') {
          setPasswordFieldErrors({
            currentPassword: {
              validateStatus: 'error',
              help: 'Current password cannot be the same as new password'
            },
            newPassword: {
              validateStatus: 'error',
              help: 'New password must be different from current password'
            }
          });
        } else if (data.message === 'Current password is incorrect') {
          setPasswordFieldErrors({
            currentPassword: {
              validateStatus: 'error',
              help: 'Current password is incorrect'
            }
          });
        } else if (data.message === 'New password and confirmation do not match') {
          setPasswordFieldErrors({
            newPassword: {
              validateStatus: 'error',
              help: 'Passwords do not match'
            },
            confirmPassword: {
              validateStatus: 'error',
              help: 'Passwords do not match'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      const userId = SecureStorage.getLocalItem('users_id') || '1';
      const response = await fetch(`${baseUrl}/admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateProfile',
          userId: parseInt(userId),
          json: values
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        await fetchUserProfile(); // Refresh user data
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      profileForm.resetFields();
    }
    setIsEditing(!isEditing);
  };

  const clearPasswordErrors = () => {
    setPasswordFieldErrors({});
  };

  const suffixOptions = [
    { value: '', label: 'None' },
    { value: 'Jr.', label: 'Jr.' },
    { value: 'Sr.', label: 'Sr.' },
    { value: 'II', label: 'II' },
    { value: 'III', label: 'III' },
    { value: 'IV', label: 'IV' },
    { value: 'V', label: 'V' }
  ];

  const getInitials = (fname, mname, lname) => {
    const first = fname ? fname.charAt(0) : '';
    const middle = mname ? mname.charAt(0) : '';
    const last = lname ? lname.charAt(0) : '';
    return `${first}${middle}${last}`.toUpperCase();
  };

  const formatFullName = (fname, mname, lname, suffix) => {
    const parts = [fname, mname, lname].filter(Boolean);
    const fullName = parts.join(' ');
    return suffix ? `${fullName} ${suffix}` : fullName;
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      className="profile-modal"
      styles={{
        body: { padding: 0 },
        header: { display: 'none' }
      }}
    >
      <div className="bg-gradient-to-br from-[#618264] to-[#79AC78] p-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <Avatar
            size={100}
            className="bg-white text-[#618264] text-2xl font-bold shadow-lg mb-4"
            icon={!userInfo ? <UserOutlined /> : null}
          >
            {userInfo && getInitials(userInfo.users_fname, userInfo.users_mname, userInfo.users_lname)}
          </Avatar>
          
          {userInfo && (
            <>
              <Title level={2} className="text-white mb-2">
                {userInfo.title_name && `${userInfo.title_name} `}
                {formatFullName(userInfo.users_fname, userInfo.users_mname, userInfo.users_lname, userInfo.users_suffix)}
              </Title>
              <div className="flex justify-center items-center space-x-4">
                <Badge 
                  status={userInfo.users_is_active ? "success" : "error"} 
                  text={
                    <span className="text-white font-medium">
                      {userInfo.users_is_active ? "Active" : "Inactive"}
                    </span>
                  } 
                />
                <Text className="text-white/90 font-medium">
                  {userInfo.user_level_name}
                </Text>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'info'
                ? 'bg-white text-[#618264] shadow-sm'
                : 'text-gray-600 hover:text-[#618264]'
            }`}
          >
            <UserOutlined className="mr-2" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'password'
                ? 'bg-white text-[#618264] shadow-sm'
                : 'text-gray-600 hover:text-[#618264]'
            }`}
          >
            <LockOutlined className="mr-2" />
            Change Password
          </button>
        </div>

        <Spin spinning={loading}>
          {/* Profile Information Tab */}
          {activeTab === 'info' && userInfo && (
            <div className="space-y-6">
              {/* Edit Button */}
              <div className="flex justify-end">
                <Button
                  type={isEditing ? "default" : "primary"}
                  icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
                  onClick={handleEditToggle}
                  className={isEditing ? "" : "bg-[#618264] hover:bg-[#79AC78] border-[#618264] hover:border-[#79AC78]"}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                >
                  <Card className="shadow-sm border-0" bodyStyle={{ padding: '24px' }}>
                    <Title level={4} className="text-[#618264] mb-4 flex items-center">
                      <IdcardOutlined className="mr-2" />
                      Edit Personal Information
                    </Title>
                    
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Title"
                          name="users_title_id"
                          rules={[{ required: true, message: 'Please select a title' }]}
                        >
                          <Select
                            placeholder="Select title"
                            size="large"
                            className="rounded-lg"
                          >
                            {titles.map(title => (
                              <Select.Option key={title.title_id} value={title.title_id}>
                                {title.title_name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Suffix"
                          name="users_suffix"
                        >
                          <Select
                            placeholder="Select suffix"
                            size="large"
                            className="rounded-lg"
                            allowClear
                          >
                            {suffixOptions.map(option => (
                              <Select.Option key={option.value} value={option.value}>
                                {option.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="First Name"
                          name="users_fname"
                          rules={[{ required: true, message: 'Please enter first name' }]}
                        >
                          <Input
                            placeholder="Enter first name"
                            size="large"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Middle Name"
                          name="users_mname"
                        >
                          <Input
                            placeholder="Enter middle name (optional)"
                            size="large"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Last Name"
                          name="users_lname"
                          rules={[{ required: true, message: 'Please enter last name' }]}
                        >
                          <Input
                            placeholder="Enter last name"
                            size="large"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  <Card className="shadow-sm border-0" bodyStyle={{ padding: '24px' }}>
                    <Title level={4} className="text-[#618264] mb-4 flex items-center">
                      <MailOutlined className="mr-2" />
                      Edit Account Information
                    </Title>
                    
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="School/Employee ID"
                          name="users_school_id"
                          rules={[{ required: true, message: 'Please enter school/employee ID' }]}
                        >
                          <Input
                            placeholder="Enter school/employee ID"
                            size="large"
                            className="rounded-lg font-mono"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Email Address"
                          name="users_email"
                          rules={[
                            { required: true, message: 'Please enter email address' },
                            { type: 'email', message: 'Please enter a valid email address' }
                          ]}
                        >
                          <Input
                            placeholder="Enter email address"
                            size="large"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <Button
                        onClick={handleEditToggle}
                        size="large"
                        className="rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                        size="large"
                        className="bg-[#618264] hover:bg-[#79AC78] border-[#618264] hover:border-[#79AC78] rounded-lg"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </Card>
                </Form>
              ) : (
                <>
                  <Card className="shadow-sm border-0" bodyStyle={{ padding: '24px' }}>
                    <Title level={4} className="text-[#618264] mb-4 flex items-center">
                      <IdcardOutlined className="mr-2" />
                      Personal Information
                    </Title>
                    
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">Title</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800">{userInfo.title_name || 'N/A'}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">Suffix</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800">{userInfo.users_suffix || 'None'}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">First Name</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800">{userInfo.users_fname}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">Middle Name</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800">{userInfo.users_mname || 'N/A'}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">Last Name</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800">{userInfo.users_lname}</Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <Card className="shadow-sm border-0" bodyStyle={{ padding: '24px' }}>
                    <Title level={4} className="text-[#618264] mb-4 flex items-center">
                      <MailOutlined className="mr-2" />
                      Account Information
                    </Title>
                    
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">School/Employee ID</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800 font-mono">{userInfo.users_school_id}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">Email Address</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Text className="text-gray-800">{userInfo.users_email}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">User Level</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Badge 
                              color="#618264" 
                              text={<Text className="text-gray-800">{userInfo.user_level_name}</Text>}
                            />
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="space-y-1">
                          <Text strong className="text-gray-600">Account Status</Text>
                          <div className="p-3 bg-gray-50 rounded-lg border">
                            <Badge 
                              status={userInfo.users_is_active ? "success" : "error"} 
                              text={
                                <Text className="text-gray-800">
                                  {userInfo.users_is_active ? "Active" : "Inactive"}
                                </Text>
                              } 
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Password Reset Tab */}
          {activeTab === 'password' && (
            <Card className="shadow-sm border-0" bodyStyle={{ padding: '24px' }}>
              <Title level={4} className="text-[#618264] mb-4 flex items-center">
                <LockOutlined className="mr-2" />
                Change Password
              </Title>
              
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordReset}
                className="max-w-md"
              >
                <Form.Item
                  label="Current Password"
                  name="currentPassword"
                  validateStatus={passwordFieldErrors.currentPassword?.validateStatus}
                  help={passwordFieldErrors.currentPassword?.help}
                  rules={[
                    { required: true, message: 'Please enter your current password' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter current password"
                    size="large"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    className="rounded-lg"
                    onChange={clearPasswordErrors}
                  />
                </Form.Item>

                <Form.Item
                  label="New Password"
                  name="newPassword"
                  validateStatus={passwordFieldErrors.newPassword?.validateStatus}
                  help={passwordFieldErrors.newPassword?.help}
                  rules={[
                    { required: true, message: 'Please enter a new password' },
                    { min: 8, message: 'Password must be at least 8 characters long' },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and number'
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter new password"
                    size="large"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    className="rounded-lg"
                    onChange={clearPasswordErrors}
                  />
                </Form.Item>

                <Form.Item
                  label="Confirm New Password"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  validateStatus={passwordFieldErrors.confirmPassword?.validateStatus}
                  help={passwordFieldErrors.confirmPassword?.help}
                  rules={[
                    { required: true, message: 'Please confirm your new password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Confirm new password"
                    size="large"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    className="rounded-lg"
                    onChange={clearPasswordErrors}
                  />
                </Form.Item>

                <Form.Item className="mb-0">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                      size="large"
                      className="bg-[#618264] hover:bg-[#79AC78] border-[#618264] hover:border-[#79AC78] rounded-lg"
                    >
                      Update Password
                    </Button>
                    <Button
                      onClick={() => passwordForm.resetFields()}
                      size="large"
                      className="rounded-lg"
                    >
                      Reset Form
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              <Divider />
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Title level={5} className="text-blue-800 mb-2">Password Requirements:</Title>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains at least one uppercase letter</li>
                  <li>• Contains at least one lowercase letter</li>
                  <li>• Contains at least one number</li>
                </ul>
              </div>
            </Card>
          )}
        </Spin>
      </div>

      <style jsx>{`
        .profile-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        .profile-modal .ant-card {
          border-radius: 12px;
        }
        .profile-modal .ant-input,
        .profile-modal .ant-input-password {
          border-radius: 8px;
        }
        .profile-modal .ant-btn {
          border-radius: 8px;
        }
      `}</style>
    </Modal>
  );
};

export default ProfileModal;
