import React, { useState } from 'react';
import { Modal, Input, Button, DatePicker } from 'antd';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../utils/encryption';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Create_Phase_Modal = ({ 
    show, 
    onHide, 
    projectMasterId,
    onPhasesAdded
}) => {
    const [loading, setLoading] = useState(false);
    const [phases, setPhases] = useState([
        { name: '', description: '', start_date: null, end_date: null }
    ]);

    const baseUrl = SecureStorage.getLocalItem("url");

    const addPhase = () => {
        setPhases([...phases, { name: '', description: '', start_date: null, end_date: null }]);
    };

    const removePhase = (index) => {
        if (phases.length > 1) {
            const newPhases = phases.filter((_, i) => i !== index);
            setPhases(newPhases);
        }
    };

    const updatePhase = (index, field, value) => {
        const newPhases = [...phases];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setPhases(newPhases);
    };

    const handleSubmit = async () => {
        try {
            // Validate all phases
            const validPhases = phases.filter(phase => 
                phase.name && phase.description && phase.start_date && phase.end_date
            );

            if (validPhases.length === 0) {
                toast.error('Please fill in at least one complete phase');
                return;
            }

            // Check for date validation
            for (let i = 0; i < validPhases.length; i++) {
                const phase = validPhases[i];
                if (dayjs(phase.end_date).isBefore(dayjs(phase.start_date))) {
                    toast.error(`Phase "${phase.name}": End date must be after start date`);
                    return;
                }
            }

            setLoading(true);

            // Prepare payload in the required format
            const payload = validPhases.map(phase => ({
                project_master_id: projectMasterId,
                name: phase.name,
                description: phase.description,
                start_date: dayjs(phase.start_date).format('YYYY-MM-DD'),
                end_date: dayjs(phase.end_date).format('YYYY-MM-DD')
            }));

            const jsonData = {
                operation: 'savePhase',
                payload: payload
            };

            const token = SecureStorage.getLocalItem('token');
            const response = await axios.post(
                `${baseUrl}teacher.php`,
                jsonData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success(`${validPhases.length} phase(s) successfully added!`);
                if (onPhasesAdded) {
                    onPhasesAdded();
                }
                onHide();
                // Reset form
                setPhases([{ name: '', description: '', start_date: null, end_date: null }]);
            } else {
                throw new Error(response.data.message || "Unknown error");
            }
        } catch (error) {
            console.error('Error adding phases:', error);
            toast.error(`Failed to add phases: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPhases([{ name: '', description: '', start_date: null, end_date: null }]);
        onHide();
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <PlusIcon className="mr-2 h-5 w-5 text-indigo-600" /> 
                    Add Project Phases
                </div>
            }
            open={show}
            onCancel={handleCancel}
            footer={null}
            width={900}
            className="top-4"
        >
            <div className="p-4 max-h-[70vh] overflow-y-auto">
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Add multiple phases to organize your project timeline. Each phase should have a name, description, and date range.
                    </p>
                </div>

                {phases.map((phase, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-md font-medium text-gray-900">
                                Phase {index + 1}
                            </h4>
                            {phases.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removePhase(index)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Remove phase"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phase Name *
                                </label>
                                <Input
                                    placeholder="Enter phase name"
                                    value={phase.name}
                                    onChange={(e) => updatePhase(index, 'name', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date *
                                    </label>
                                    <DatePicker
                                        placeholder="Start date"
                                        value={phase.start_date ? dayjs(phase.start_date) : null}
                                        onChange={(date) => updatePhase(index, 'start_date', date)}
                                        className="w-full"
                                        format="YYYY-MM-DD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date *
                                    </label>
                                    <DatePicker
                                        placeholder="End date"
                                        value={phase.end_date ? dayjs(phase.end_date) : null}
                                        onChange={(date) => updatePhase(index, 'end_date', date)}
                                        className="w-full"
                                        format="YYYY-MM-DD"
                                        disabledDate={(current) => 
                                            phase.start_date && current && current.isBefore(dayjs(phase.start_date))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <TextArea
                                placeholder="Enter phase description"
                                value={phase.description}
                                onChange={(e) => updatePhase(index, 'description', e.target.value)}
                                rows={3}
                                className="w-full"
                            />
                        </div>
                    </div>
                ))}

                <div className="flex justify-between items-center mt-4">
                    <button
                        type="button"
                        onClick={addPhase}
                        className="flex items-center px-3 py-2 text-sm border border-dashed border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Another Phase
                    </button>

                    <div className="flex gap-2">
                        <Button onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleSubmit}
                            loading={loading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Add Phases
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export { Create_Phase_Modal };