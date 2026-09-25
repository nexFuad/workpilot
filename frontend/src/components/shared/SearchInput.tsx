import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  wrapperClassName?: string;
  iconClassName?: string;
};

export function SearchInput({
  wrapperClassName = 'relative block w-full',
  iconClassName = 'pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400',
  ...inputProps
}: SearchInputProps) {
  return (
    <label className={wrapperClassName}>
      <Search className={iconClassName} />
      <input type="search" {...inputProps} />
    </label>
  );
}
