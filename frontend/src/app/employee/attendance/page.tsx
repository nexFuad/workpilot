'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, History } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { AttendanceDialog } from '@/components/employee/AttendanceDialog';
import { AttendanceHistoryCard } from '@/components/employee/AttendanceHistoryCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { useSearchBar } from '@/hooks/use-search-bar';
import { attendanceServer } from '@/server/attendance.server';
import { attendanceSchema } from '@/types/attendance.types';
import type { AttendanceAction, AttendanceFormValues } from '@/types/attendance.types';
const localTime = () => new Date().toTimeString().slice(0, 5);
const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(new Date(value));
const formatDay = (value: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

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
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
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
  const submitAttendance = async (values: AttendanceFormValues) => {
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
            <SearchInput
              wrapperClassName="relative block"
              iconClassName="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600"
              value={attendanceSearch.searchTerm}
              onChange={(event) => attendanceSearch.setSearchTerm(event.target.value)}
              placeholder="Search site, shift, time, or status"
              className="w-full rounded-xl border border-sky-100 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-sky-100"
            />
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
              <AttendanceHistoryCard key={attendance.id} attendance={attendance} />
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

      <AttendanceDialog
        actionOpen={actionOpen}
        onOpen={() => setActionOpen(true)}
        onClose={closeActionModal}
        actionLabel={actionLabel}
        isCheckedIn={Boolean(active)}
        handleSubmit={handleSubmit}
        onSubmit={submitAttendance}
        setValue={setValue}
        errors={errors}
        siteId={siteId}
        shiftId={shiftId}
        occurredTime={occurredTime}
        siteOptions={siteOptions}
        shiftOptions={shiftOptions}
        optionsLoading={options.isLoading}
        capturedPreview={capturedPreview}
        openCamera={openCamera}
        busy={busy}
        cameraOpen={cameraOpen}
        stopCamera={stopCamera}
        videoRef={videoRef}
        canvasRef={canvasRef}
        capturePhoto={capturePhoto}
      />
    </section>
  );
}
