import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    step?: string;
    min?: number;
    max?: number;
}

export function NumberInput({
    value,
    onChange,
    placeholder = "0",
    className,
    step = "1",
    min,
    max,
    ...props
}: NumberInputProps) {
    const [displayValue, setDisplayValue] = useState(value.toString());
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update display value when prop value changes (but not when focused)
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(value.toString());
        }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // Clear the field if it shows "0" or the default placeholder
        if (value === 0 || displayValue === "0") {
            setDisplayValue("");
        }
        props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);

        // If the field is empty or invalid, set it to 0
        const numValue = parseFloat(displayValue);
        if (isNaN(numValue) || displayValue.trim() === "") {
            setDisplayValue("0");
            onChange(0);
        } else {
            // Apply min/max constraints
            let finalValue = numValue;
            if (min !== undefined && finalValue < min) {
                finalValue = min;
            }
            if (max !== undefined && finalValue > max) {
                finalValue = max;
            }

            setDisplayValue(finalValue.toString());
            onChange(finalValue);
        }

        props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayValue(inputValue);

        // Allow empty string while typing
        if (inputValue === "" || inputValue === "-") {
            return;
        }

        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue)) {
            onChange(numValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
        if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
            return;
        }

        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
            return;
        }

        // Allow: minus sign (for negative numbers)
        if (e.key === '-' && min === undefined) {
            return;
        }

        // Allow: decimal point
        if (e.key === '.' && step.includes('.')) {
            return;
        }

        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }

        props.onKeyDown?.(e);
    };

    return (
        <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(className)}
            {...props}
        />
    );
}
