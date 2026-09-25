'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

type DeleteModalProps = {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  preventCloseWhileDeleting?: boolean;
};

export function DeleteModal({
  open,
  onClose,
  onDelete,
  isDeleting,
  title,
  description,
  confirmLabel,
  preventCloseWhileDeleting = false,
}: DeleteModalProps) {
  const close = () => {
    if (!preventCloseWhileDeleting || !isDeleting) onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-slate-950/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-60 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Trash2 className="size-5" />
          </span>
          <Dialog.Title className="mt-4 text-xl font-bold text-slate-800">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={preventCloseWhileDeleting && isDeleting}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onDelete}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {isDeleting && <LoaderCircle className="size-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
