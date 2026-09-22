'use client';

import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string };
const tones = {
  sky: {
    trigger:
      'border-sky-100 bg-sky-50/60 hover:bg-sky-50 focus:ring-sky-100 data-placeholder:text-slate-400',
    icon: 'text-sky-600',
    content: 'border-sky-100 shadow-xl shadow-sky-100',
    item: 'data-highlighted:bg-sky-50 data-[state=checked]:text-sky-700',
  },
  emerald: {
    trigger:
      'border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 focus:border-emerald-400 focus:bg-white focus:ring-emerald-100 data-placeholder:text-slate-400',
    icon: 'text-emerald-600',
    content: 'border-emerald-100 shadow-none',
    item: 'data-highlighted:bg-emerald-50 data-[state=checked]:text-emerald-700',
  },
};

export function SoftSelect({
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
  tone = 'sky',
  compact = false,
  triggerClassName = '',
  contentClassName = '',
  viewportClassName = '',
}: {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Option[];
  disabled?: boolean;
  tone?: keyof typeof tones;
  compact?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  viewportClassName?: string;
}) {
  const styles = tones[tone];
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        className={`flex w-full items-center justify-between border text-left text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${compact ? 'min-w-32 rounded-lg px-2.5 py-2 text-xs font-bold focus:ring-2' : 'mt-2 rounded-xl px-3.5 py-3 text-sm focus:ring-4'} ${styles.trigger} ${triggerClassName}`}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className={`size-4 ${styles.icon}`} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className={`z-60 w-(--radix-select-trigger-width) max-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border bg-white p-1 ${styles.content} ${contentClassName}`}
        >
          <Select.Viewport
            className={`max-h-60 overflow-y-auto [scrollbar-color:#cbd5e1_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 ${viewportClassName}`}
          >
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={`relative flex min-w-0 cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[state=checked]:font-semibold ${styles.item}`}
              >
                <Select.ItemIndicator className="absolute left-2">
                  <Check className="size-4" />
                </Select.ItemIndicator>
                <Select.ItemText className="truncate">{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
