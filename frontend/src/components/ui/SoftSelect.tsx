'use client';

import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string };
export function SoftSelect({
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
}: {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-left text-sm text-slate-700 outline-none transition hover:bg-sky-50 focus:ring-4 focus:ring-sky-100 data-placeholder:text-slate-400">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="size-4 text-sky-600" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-60 max-h-64 overflow-hidden rounded-xl border border-sky-100 bg-white p-1 shadow-xl shadow-sky-100"
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none data-highlighted:bg-sky-50 data-[state=checked]:font-semibold data-[state=checked]:text-sky-700"
              >
                <Select.ItemIndicator className="absolute left-2">
                  <Check className="size-4" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
