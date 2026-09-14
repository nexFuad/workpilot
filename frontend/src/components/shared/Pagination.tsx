'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
type Props = {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};
export function Pagination({ page, totalItems, pageSize = 12, onPageChange }: Props) {
  const total = Math.max(1, Math.ceil(totalItems / pageSize));
  const pages = Array.from({ length: Math.min(total, 5) }, (_, index) =>
    Math.min(Math.max(1, page - 2) + index, total),
  ).filter((value, index, array) => index === 0 || value > array[index - 1]);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl p-2 text-slate-700 disabled:opacity-30"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
        {pages.map((item) => (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`grid size-10 place-items-center rounded-xl text-sm font-semibold transition ${page === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        disabled={page === total}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl p-2 text-slate-700 disabled:opacity-30"
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}
