'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Camera, ImagePlus, X } from 'lucide-react';
import type { RefObject } from 'react';
import type {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormSetValue,
} from 'react-hook-form';
import { SoftSelect } from '@/components/ui/SoftSelect';
import type { AttendanceFormValues } from '@/types/attendance.types';

type AttendanceDialogProps = {
  actionOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  actionLabel: string;
  isCheckedIn: boolean;
  handleSubmit: UseFormHandleSubmit<AttendanceFormValues>;
  onSubmit: SubmitHandler<AttendanceFormValues>;
  setValue: UseFormSetValue<AttendanceFormValues>;
  errors: FieldErrors<AttendanceFormValues>;
  siteId: string;
  shiftId: string;
  occurredTime: string;
  siteOptions: { value: string; label: string }[];
  shiftOptions: { value: string; label: string }[];
  optionsLoading: boolean;
  capturedPreview: string | null;
  openCamera: () => void;
  busy: boolean;
  cameraOpen: boolean;
  stopCamera: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  capturePhoto: () => void;
};

export function AttendanceDialog({
  actionOpen,
  onOpen,
  onClose,
  actionLabel,
  isCheckedIn,
  handleSubmit,
  onSubmit,
  setValue,
  errors,
  siteId,
  shiftId,
  occurredTime,
  siteOptions,
  shiftOptions,
  optionsLoading,
  capturedPreview,
  openCamera,
  busy,
  cameraOpen,
  stopCamera,
  videoRef,
  canvasRef,
  capturePhoto,
}: AttendanceDialogProps) {
  return (
    <Dialog.Root open={actionOpen} onOpenChange={(open) => (open ? onOpen() : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-800">
                {actionLabel}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-slate-500">
                Choose your details, take a live photo, and save your attendance.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Site
              <SoftSelect
                value={siteId}
                onValueChange={(value) => setValue('siteId', value, { shouldValidate: true })}
                placeholder="Select your site"
                options={siteOptions}
                disabled={optionsLoading}
              />
              {errors.siteId && (
                <span className="mt-1 block text-xs text-rose-600">{errors.siteId.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Shift
              <SoftSelect
                value={shiftId}
                onValueChange={(value) => setValue('shiftId', value, { shouldValidate: true })}
                placeholder="Select your shift"
                options={shiftOptions}
                disabled={optionsLoading}
              />
              {errors.shiftId && (
                <span className="mt-1 block text-xs text-rose-600">{errors.shiftId.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              {isCheckedIn ? 'Check-out time' : 'Check-in time'}
              <input
                type="time"
                value={occurredTime}
                onChange={(event) =>
                  setValue('occurredTime', event.target.value, { shouldValidate: true })
                }
                className="mt-1.5 w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-sky-100"
              />
              {errors.occurredTime && (
                <span className="mt-1 block text-xs text-rose-600">
                  {errors.occurredTime.message}
                </span>
              )}
            </label>
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-4 sm:col-span-2">
              <div className="flex flex-wrap items-center gap-4">
                {capturedPreview ? (
                  <span
                    style={{ backgroundImage: `url(${capturedPreview})` }}
                    className="size-20 rounded-xl bg-white bg-cover bg-center shadow-sm"
                  />
                ) : (
                  <span className="grid size-20 place-items-center rounded-xl bg-white text-sky-500">
                    <ImagePlus className="size-7" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-700">
                    {isCheckedIn ? 'Check-out photo' : 'Check-in photo'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use your device camera to capture a live photo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCamera}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-200"
                >
                  <Camera className="size-4" />
                  Take photo
                </button>
              </div>
              {errors.photo && (
                <span className="mt-2 block text-xs text-rose-600">{errors.photo.message}</span>
              )}
            </div>
            <button
              disabled={busy || optionsLoading}
              className={`w-full rounded-xl py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 ${isCheckedIn ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}
            >
              {busy ? 'Uploading photo and saving…' : `${actionLabel} now`}
            </button>
          </form>
          {cameraOpen && (
            <div className="fixed inset-0 z-70 grid place-items-center bg-slate-900/50 p-4">
              <section className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">Take live photo</h2>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="mt-4 aspect-video w-full rounded-2xl bg-slate-900 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-100 py-3 font-semibold text-sky-700 hover:bg-sky-200"
                >
                  <Camera className="size-4" />
                  Capture photo
                </button>
              </section>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
