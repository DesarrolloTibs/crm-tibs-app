import { useState } from 'react';

export function useFormValidation<T extends Record<string, any>>() {
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

    const clearErrors = () => setErrors({});
    const clearError = (field: keyof T) => {
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const setError = (field: keyof T, message: string) => {
        setErrors(prev => ({
            ...prev,
            [field]: message
        }));
    };

    return {
        errors,
        setErrors,
        setError,
        clearError,
        clearErrors,
        hasErrors: Object.keys(errors).length > 0
    };
}
