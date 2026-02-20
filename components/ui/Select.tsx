'use client';

import SearchableSelect from './SearchableSelect';

interface SelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export default function Select({
  label,
  name,
  options,
  required = false,
  value,
  onChange,
  onValueChange,
  placeholder = 'Selectează...',
}: SelectProps) {
  function handleChange(val: string) {
    onValueChange?.(val);
    // Support legacy onChange API
    if (onChange) {
      const syntheticEvent = {
        target: { value: val, name },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  }

  return (
    <SearchableSelect
      label={label}
      name={name}
      options={options}
      required={required}
      value={value}
      onValueChange={handleChange}
      placeholder={placeholder}
    />
  );
}
