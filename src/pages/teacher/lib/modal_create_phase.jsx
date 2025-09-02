import React, { useState } from 'react';
import { Modal, Input, Button, DatePicker } from 'antd';
import { PlusIcon, TrashIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../utils/encryption';
import dayjs from 'dayjs';

const { TextArea } = Input;

const CreatePhaseModal = ({ 
    show, 
    onHide, 
    projectMasterId,
    onPhasesAdded,
    schoolYearStartDate,
    schoolYearEndDate,
    existingPhases = []
}) => {
    const [loading, setLoading] = useState(false);
    const [phases, setPhases] = useState([
        { name: '', description: '', start_date: null, end_date: null }
    ]);

    const baseUrl = SecureStorage.getLocalItem("url");

    // Debug: Log school year dates when modal opens
    React.useEffect(() => {
        if (show) {
            console.log('=== PHASE MODAL OPENED ===');
            console.log('School Year Start Date:', schoolYearStartDate);
            console.log('School Year End Date:', schoolYearEndDate);
            console.log('Existing Phases:', existingPhases);
            console.log('Expected blocked range: Before 2025-08-27 and After 2025-09-26');
        }
    }, [show, schoolYearStartDate, schoolYearEndDate, existingPhases]);

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

    // Helper function to check if a date overlaps with existing phases
    const isDateOverlapping = (startDate, endDate, currentPhaseIndex = -1) => {
        if (!startDate || !endDate) return false;
        
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        
        // Check against existing phases from database
        for (const existingPhase of existingPhases) {
            const existingStart = dayjs(existingPhase.phase_start_date);
            const existingEnd = dayjs(existingPhase.phase_end_date);
            
            // Check if dates overlap
            if (start.isBefore(existingEnd) && end.isAfter(existingStart)) {
                return true;
            }
        }
        
        // Check against other phases being created in the same modal
        for (let i = 0; i < phases.length; i++) {
            if (i === currentPhaseIndex) continue; // Skip current phase
            
            const phase = phases[i];
            if (!phase.start_date || !phase.end_date) continue;
            
            const phaseStart = dayjs(phase.start_date);
            const phaseEnd = dayjs(phase.end_date);
            
            // Check if dates overlap
            if (start.isBefore(phaseEnd) && end.isAfter(phaseStart)) {
                return true;
            }
        }
        
        return false;
    };

    // Helper function to get disabled dates for DatePicker
    const getDisabledDate = (current, phaseIndex, isEndDate = false) => {
        if (!current) return false;
        
        const currentDate = dayjs(current);
        
        // Debug logging
        console.log('=== Date Validation Debug ===');
        console.log('Current date being checked:', currentDate.format('YYYY-MM-DD'));
        console.log('School year start date:', schoolYearStartDate);
        console.log('School year end date:', schoolYearEndDate);
        console.log('Phase index:', phaseIndex, 'Is end date:', isEndDate);
        
        // Always block dates outside school year range - this is the primary constraint
        if (schoolYearStartDate && currentDate.isBefore(dayjs(schoolYearStartDate), 'day')) {
            console.log('❌ BLOCKED: Date is before school year start date');
            return true;
        }
        if (schoolYearEndDate && currentDate.isAfter(dayjs(schoolYearEndDate), 'day')) {
            console.log('❌ BLOCKED: Date is after school year end date');
            return true;
        }
        
        console.log('✅ Date is within school year range');
        
        // For end date, also block dates before or equal to start date of same phase
        if (isEndDate && phases[phaseIndex]?.start_date) {
            const startDate = dayjs(phases[phaseIndex].start_date);
            if (currentDate.isBefore(startDate, 'day') || currentDate.isSame(startDate, 'day')) {
                return true;
            }
        }
        
        // Block dates that would overlap with existing phases
        if (existingPhases && existingPhases.length > 0) {
            console.log('Checking against existing phases:', existingPhases.length);
            for (const existingPhase of existingPhases) {
                const existingStart = dayjs(existingPhase.phase_start_date);
                const existingEnd = dayjs(existingPhase.phase_end_date);
                
                // Check if current date falls within existing phase range
                if ((currentDate.isAfter(existingStart, 'day') || currentDate.isSame(existingStart, 'day')) && 
                    (currentDate.isBefore(existingEnd, 'day') || currentDate.isSame(existingEnd, 'day'))) {
                    console.log('❌ BLOCKED: Date overlaps with existing phase');
                    return true;
                }
            }
        }
        
        // Block dates that would overlap with other phases being created in this session
        for (let i = 0; i < phases.length; i++) {
            if (i === phaseIndex) continue; // Skip current phase
            
            const phase = phases[i];
            if (!phase.start_date || !phase.end_date) continue;
            
            const phaseStart = dayjs(phase.start_date);
            const phaseEnd = dayjs(phase.end_date);
            
            // Check if current date falls within this phase range
            if ((currentDate.isAfter(phaseStart, 'day') || currentDate.isSame(phaseStart, 'day')) && 
                (currentDate.isBefore(phaseEnd, 'day') || currentDate.isSame(phaseEnd, 'day'))) {
                console.log('❌ BLOCKED: Date overlaps with other phase in session');
                return true;
            }
        }
        
        console.log('✅ Date is allowed');
        return false;
    };

    const handleSubmit = async () => {
        try {
            // Validate all phases
            const validPhases = phases.filter(phase => {
                const hasName = phase.name && phase.name.trim() !== '';
                const hasDescription = phase.description && phase.description.trim() !== '';
                const hasStartDate = phase.start_date !== null && phase.start_date !== undefined;
                const hasEndDate = phase.end_date !== null && phase.end_date !== undefined;
                
                console.log('Phase validation:', {
                    name: phase.name,
                    hasName,
                    description: phase.description,
                    hasDescription,
                    start_date: phase.start_date,
                    hasStartDate,
                    end_date: phase.end_date,
                    hasEndDate
                });
                
                return hasName && hasDescription && hasStartDate && hasEndDate;
            });

            console.log('Valid phases count:', validPhases.length);
            console.log('Total phases count:', phases.length);

            if (validPhases.length === 0) {
                toast.error('Please fill in at least one complete phase');
                return;
            }

            // Check for date validation
            for (let i = 0; i < validPhases.length; i++) {
                const phase = validPhases[i];
                const startDate = dayjs(phase.start_date);
                const endDate = dayjs(phase.end_date);
                
                // Check if end date is before start date
                if (endDate.isBefore(startDate)) {
                    toast.error(`Phase "${phase.name}": End date must be after start date`);
                    return;
                }
                
                // Check if dates are within school year range
                if (schoolYearStartDate && startDate.isBefore(dayjs(schoolYearStartDate))) {
                    toast.error(`Phase "${phase.name}": Start date cannot be before school year start date (${dayjs(schoolYearStartDate).format('YYYY-MM-DD')})`);
                    return;
                }
                
                if (schoolYearEndDate && endDate.isAfter(dayjs(schoolYearEndDate))) {
                    toast.error(`Phase "${phase.name}": End date cannot be after school year end date (${dayjs(schoolYearEndDate).format('YYYY-MM-DD')})`);
                    return;
                }
                
                // Check for overlapping dates
                if (isDateOverlapping(phase.start_date, phase.end_date, i)) {
                    toast.error(`Phase "${phase.name}": Date range overlaps with existing phases`);
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
                    <div className="bg-primary-subtle rounded-lg p-2 mr-3">
                        <PlusIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Add Project Phases</h2>
                        <p className="text-sm text-gray-600">Create timeline milestones</p>
                    </div>
                </div>
            }
            open={show}
            onCancel={handleCancel}
            footer={null}
            width={900}
            className="top-4"
        >
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        Add multiple phases to organize your project timeline. Each phase should have a name, description, and date range.
                    </p>
                    {(schoolYearStartDate || schoolYearEndDate) && (
                        <div className="p-4 bg-primary-subtle border border-primary-light rounded-xl">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 bg-primary rounded-lg p-2 mr-3">
                                    <CalendarIcon className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-primary mb-1">Date Restrictions</h4>
                                    <p className="text-sm text-primary-medium">
                                        Phase dates must be within the school year period
                                        {schoolYearStartDate && schoolYearEndDate && 
                                            ` (${dayjs(schoolYearStartDate).format('MMM DD, YYYY')} - ${dayjs(schoolYearEndDate).format('MMM DD, YYYY')})`
                                        }
                                        and cannot overlap with existing phases.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {phases.map((phase, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <div className="bg-primary-subtle rounded-lg p-2 mr-3">
                                    <ClockIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">
                                        Phase {index + 1}
                                    </h4>
                                    <p className="text-sm text-gray-600">Timeline milestone</p>
                                </div>
                            </div>
                            {phases.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removePhase(index)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove phase"
                                >
                                    <TrashIcon className="h-5 w-5" />
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
                                        disabledDate={(current) => getDisabledDate(current, index, false)}
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
                                        disabledDate={(current) => getDisabledDate(current, index, true)}
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

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={addPhase}
                        className="inline-flex items-center px-4 py-3 text-sm border-2 border-dashed border-primary-light text-primary rounded-xl hover:bg-primary-subtle hover:border-primary transition-all duration-200"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Another Phase
                    </button>

                    <div className="flex gap-3">
                        <Button 
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleSubmit}
                            loading={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary-medium text-white rounded-lg shadow-lg transition-all duration-200"
                        >
                            Add Phases
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export { CreatePhaseModal };