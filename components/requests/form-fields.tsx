import * as React from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Common props for all field components
interface FieldBaseProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
}

// Props for select fields with options
interface SelectFieldProps extends FieldBaseProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

// Props for input fields
interface InputFieldProps extends FieldBaseProps {
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}

// Props for date input fields
interface DateFieldProps extends FieldBaseProps {
  placeholder?: string;
}

/**
 * Reusable select field component
 */
export function SelectField({
  control,
  name,
  label,
  options,
  placeholder = 'Select an option',
  required = false
}: SelectFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Reusable input field component
 */
export function InputField({
  control,
  name,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  readOnly = false
}: InputFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-100' : ''}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Reusable date field component
 */
export function DateField({
  control,
  name,
  label,
  required = false
}: DateFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <Input type="date" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
