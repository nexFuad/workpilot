'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Clock3, History, ImagePlus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { SoftSelect } from '@/components/ui/SoftSelect';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { useSearchBar } from '@/hooks/use-search-bar';
import { attendanceServer } from '@/server/attendance.server';
import type { Attendance, AttendanceAction } from '@/types/attendance.types';

const schema = z.object({
  siteId: z.string().min(1, 'Select a site'),
  shiftId: z.string().min(1, 'Select a shift'),
  occurredTime: z.string().min(1, 'Choose a time'),
  photo: z.custom<File>().refine(Boolean, 'Take a live photo to continue'),
});
type FormValues = z.infer<typeof schema>;
const localTime = () => new Date().toTimeString().slice(0, 5);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(new Date(value));
const formatDay = (value: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

function HistoryCard({ attendance }: { attendance: Attendance }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{attendance.checkInSite.name}</p>
          <p className="mt-1 text-sm text-slate-500">{attendance.checkInShift.name}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attendance.checkOutAt ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
        >
          {attendance.checkOutAt ? 'Work completed' : 'On working'}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-sky-700">Check in: </span>
            {formatDate(attendance.checkInAt)}
          </p>
          <p>
            <span className="font-medium text-slate-700">Check out: </span>
            {attendance.checkOutAt ? formatDate(attendance.checkOutAt) : 'Pending'}
          </p>
        </div>
        <div className="flex gap-3">
          <figure>
            <span
              style={{ backgroundImage: `url(${attendance.checkInPhotoUrl})` }}
              className="block size-14 rounded-xl bg-sky-50 bg-cover bg-center"
            />
            <figcaption className="mt-1 text-center text-[10px] font-semibold text-sky-700">
              Check-in photo
            </figcaption>
          </figure>
          {attendance.checkOutPhotoUrl && (
            <figure>
              <span
                style={{ backgroundImage: `url(${attendance.checkOutPhotoUrl})` }}
                className="block size-14 rounded-xl bg-sky-50 bg-cover bg-center"
              />
              <figcaption className="mt-1 text-center text-[10px] font-semibold text-emerald-700">
                Check-out photo
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [actionOpen, setActionOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useQuery({
    queryKey: ['attendance', 'options'],
    queryFn: attendanceServer.options,
  });
  const current = useQuery({
    queryKey: ['attendance', 'current'],
    queryFn: attendanceServer.current,
  });
  const refreshAttendance = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['attendance', 'current'] }),
      queryClient.invalidateQueries({ queryKey: ['attendance', 'history'] }),
    ]);
  const checkIn = useMutation({
    mutationFn: attendanceServer.checkIn,
    onSuccess: refreshAttendance,
  });
  const checkOut = useMutation({
    mutationFn: attendanceServer.checkOut,
    onSuccess: refreshAttendance,
  });
  const { uploadImage, isUploading } = useCloudinaryUpload();
  const attendanceSearch = useSearchBar({
    queryKey: ['attendance', 'history'],
    queryFn: attendanceServer.history,
  });
  const active = current.data?.attendance;
  const {
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { siteId: '', shiftId: '', occurredTime: localTime(), photo: undefined },
  });
  const siteId = useWatch({ control, name: 'siteId' });
  const shiftId = useWatch({ control, name: 'shiftId' });
  const occurredTime = useWatch({ control, name: 'occurredTime' });

  useEffect(() => {
    if (cameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [cameraOpen, stream]);
  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraOpen(false);
  };
  const closeActionModal = () => {
    stopCamera();
    setActionOpen(false);
  };
  const openActionModal = () => {
    setCapturedPreview(null);
    reset({
      siteId: active?.checkInSite.id ?? '',
      shiftId: active?.checkInShift.id ?? '',
      occurredTime: localTime(),
      photo: undefined,
    });
    setActionOpen(true);
  };
  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('This browser does not support camera access.');
      return;
    }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(nextStream);
      setCameraOpen(true);
    } catch {
      toast.error('Allow camera permission in your browser, then try again.');
    }
  };
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      toast.error('Camera is still starting. Please try again in a moment.');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const photo = new File([blob], `attendance-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setValue('photo', photo, { shouldValidate: true });
        setCapturedPreview(URL.createObjectURL(photo));
        stopCamera();
      },
      'image/jpeg',
      0.9,
    );
  };
  const submitAttendance = async (values: FormValues) => {
    try {
      const photoUrl = await uploadImage(values.photo);
      const occurredAt = new Date();
      const [hours, minutes] = values.occurredTime.split(':').map(Number);
      occurredAt.setHours(hours, minutes, 0, 0);
      const payload: AttendanceAction = {
        siteId: values.siteId,
        shiftId: values.shiftId,
        photoUrl,
        occurredAt: occurredAt.toISOString(),
      };
      if (active) {
        await checkOut.mutateAsync(payload);
        toast.success('Check-out recorded successfully.');
      } else {
        await checkIn.mutateAsync(payload);
        toast.success('Check-in recorded successfully.');
      }
      setCapturedPreview(null);
      closeActionModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Attendance update failed.');
    }
  };

  const busy = isUploading || checkIn.isPending || checkOut.isPending;
  const siteOptions =
    options.data?.sites.map((site) => ({
      value: site.id,
      label: `${site.name} — ${site.location}`,
    })) ?? [];
  const shiftOptions =
    options.data?.shifts.map((shift) => ({
      value: shift.id,
      label: `${shift.name} (${shift.startTime}–${shift.endTime})`,
    })) ?? [];
  const records = attendanceSearch.data?.attendances ?? [];
  const actionLabel = active ? 'Check out' : 'Check in';

  return (
    <section className="w-full">
      <EmployeeHeader
        title="My Attendance"
        description="Check in, check out, and review your attendance history."
        action={
          current.isLoading ? (
            <div className="h-16 w-44 animate-pulse rounded-2xl border border-sky-100 bg-white p-3">
              <span className="block h-3 w-24 rounded bg-slate-100" />
              <span className="mt-2 block h-4 w-32 rounded bg-slate-100" />
            </div>
          ) : (
            <div className="h-fit rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                Current status
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {active ? 'Ready to check out' : 'Ready to check in'}
              </p>
            </div>
          )
        }
      />
      <div className="mb-6 mt-7 flex w-fit rounded-xl bg-sky-50 p-1">
        <button
          onClick={() => setTab('current')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'current' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}
        >
          <Clock3 className="size-4" />
          Current
        </button>
        <button
          onClick={() => setTab('history')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'history' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}
        >
          <History className="size-4" />
          History
        </button>
      </div>

      {tab === 'current' ? (
        <div className="w-full rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
          {current.isLoading ? (
            <div className="grid animate-pulse gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <span className="size-18 rounded-xl bg-slate-100" />
              <div className="space-y-3">
                <span className="block h-6 w-24 rounded-full bg-slate-100" />
                <span className="block h-7 w-72 max-w-full rounded bg-slate-100" />
                <span className="block h-20 w-full rounded-xl bg-slate-100" />
              </div>
              <span className="h-12 w-28 rounded-xl bg-slate-100" />
            </div>
          ) : active ? (
            <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <span
                style={{ backgroundImage: `url(${active.checkInPhotoUrl})` }}
                className="size-18 rounded-xl bg-sky-50 bg-cover bg-center shadow-sm"
              />
              <div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  On working
                </span>
                <h2 className="mt-3 text-2xl font-bold text-slate-800">
                  You are already checked in today
                </h2>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-sky-50/70 px-3 py-2">
                    <dt className="text-xs font-medium text-slate-500">Check-in time</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">
                      {formatTime(active.checkInAt)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-sky-50/70 px-3 py-2">
                    <dt className="text-xs font-medium text-slate-500">Check-in date</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">
                      {formatDay(active.checkInAt)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-sky-50/70 px-3 py-2">
                    <dt className="text-xs font-medium text-slate-500">Site</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">
                      {active.checkInSite.name}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-sky-50/70 px-3 py-2">
                    <dt className="text-xs font-medium text-slate-500">Shift</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">
                      {active.checkInShift.name}
                    </dd>
                  </div>
                </dl>
              </div>
              <button
                onClick={openActionModal}
                className="rounded-xl bg-amber-100 px-6 py-3 font-semibold text-amber-700 transition hover:bg-amber-200"
              >
                Check out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  Ready to check in
                </span>
                <h2 className="mt-3 text-2xl font-bold text-slate-800">Start your workday</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Select your site and shift, capture a live photo, then submit your attendance.
                </p>
              </div>
              <button
                onClick={openActionModal}
                className="w-full rounded-xl bg-sky-100 px-7 py-3 font-semibold text-sky-700 transition hover:bg-sky-200 sm:w-auto"
              >
                Check in
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-5 max-w-md">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600" />
              <input
                value={attendanceSearch.searchTerm}
                onChange={(event) => attendanceSearch.setSearchTerm(event.target.value)}
                placeholder="Search site, shift, time, or status"
                className="w-full rounded-xl border border-sky-100 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            {attendanceSearch.isFetching && (
              <p className="mt-2 text-xs text-slate-500">Searching attendance records…</p>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {attendanceSearch.isLoading &&
              Array.from({ length: 6 }, (_, index) => (
                <article
                  key={index}
                  className="animate-pulse rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex justify-between gap-4">
                    <span className="block h-5 w-32 rounded bg-slate-100" />
                    <span className="block h-6 w-20 rounded-full bg-slate-100" />
                  </div>
                  <span className="mt-5 block h-16 w-full rounded-xl bg-slate-100" />
                  <span className="mt-4 block h-4 w-2/3 rounded bg-slate-100" />
                </article>
              ))}
            {records.slice(0, visibleCount).map((attendance) => (
              <HistoryCard key={attendance.id} attendance={attendance} />
            ))}
            {!attendanceSearch.isLoading && records.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 lg:col-span-2">
                {attendanceSearch.debouncedSearch
                  ? 'No attendance records matched your search.'
                  : 'No attendance history yet.'}
              </div>
            )}
          </div>
          {visibleCount < records.length && (
            <button
              onClick={() => setVisibleCount((count) => count + 8)}
              className="mt-6 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700"
            >
              Load more attendance
            </button>
          )}
        </>
      )}

      <Dialog.Root
        open={actionOpen}
        onOpenChange={(open) => (open ? setActionOpen(true) : closeActionModal())}
      >
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
            <form
              onSubmit={handleSubmit(submitAttendance)}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-medium text-slate-700">
                Site
                <SoftSelect
                  value={siteId}
                  onValueChange={(value) => setValue('siteId', value, { shouldValidate: true })}
                  placeholder="Select your site"
                  options={siteOptions}
                  disabled={options.isLoading}
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
                  disabled={options.isLoading}
                />
                {errors.shiftId && (
                  <span className="mt-1 block text-xs text-rose-600">{errors.shiftId.message}</span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                {active ? 'Check-out time' : 'Check-in time'}
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
                      {active ? 'Check-out photo' : 'Check-in photo'}
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
                disabled={busy || options.isLoading}
                className={`w-full rounded-xl py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 ${active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}
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
    </section>
  );
}
