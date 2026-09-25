'use client';
import {
  Building2,
  Camera,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100';

export function ProfileSettings({ title = 'Profile settings' }: { title?: string }) {
  const { user, updateProfile, updatePassword } = useAuth();
  const { uploadFile, isUploading } = useCloudinaryUpload();
  const imageRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(() => ({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    profileImage: user?.profileImage ?? '',
  }));
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visiblePassword, setVisiblePassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
        profileImage: profile.profileImage,
      });
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Profile update failed.');
    }
  };
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file.');
    try {
      const profileImage = await uploadFile(file, 'workpilot/profiles');
      setProfile((p) => ({ ...p, profileImage }));
      toast.success('Photo uploaded. Save profile to keep it.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Photo upload failed.');
    }
  };
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.currentPassword || !password.newPassword || !password.confirmPassword)
      return toast.error('Complete all password fields.');
    if (password.newPassword !== password.confirmPassword)
      return toast.error('New passwords do not match.');
    try {
      await updatePassword.mutateAsync(password);
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password update failed.');
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative mx-auto grid size-24 place-items-center overflow-hidden rounded-2xl bg-sky-100 text-sky-700">
          {profile.profileImage ? (
            <Image
              src={profile.profileImage}
              alt="Profile"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <UserRound className="size-10" />
          )}
        </div>
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => uploadPhoto(e.target.files?.[0])}
        />
        <button
          disabled={isUploading}
          onClick={() => imageRef.current?.click()}
          className="mx-auto mt-4 flex items-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700"
        >
          <Camera className="size-4" />
          {isUploading ? 'Uploading…' : 'Change photo'}
        </button>
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <p className="text-base font-bold text-slate-800">
            {profile.fullName || 'Name not added'}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-sky-600">
            {user?.role || 'Account'}
          </p>
        </div>
        <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
          <div className="flex items-start gap-3">
            <IdCard className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-400">Employee ID</dt>
              <dd className="truncate font-semibold text-slate-700">{user?.employeeId || '—'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-400">Phone number</dt>
              <dd className="truncate font-semibold text-slate-700">
                {profile.phone || 'Not added'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-400">Company</dt>
              <dd className="truncate font-semibold text-slate-700">
                {user?.companyName || 'Not added'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-400">Account role</dt>
              <dd className="font-semibold capitalize text-slate-700">{user?.role || '—'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-400">Address</dt>
              <dd className="line-clamp-3 font-semibold leading-5 text-slate-700">
                {profile.address || 'Not added'}
              </dd>
            </div>
          </div>
        </dl>
      </aside>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your personal contact information.</p>
          <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Full name
              <input
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className={field}
                placeholder="Enter your full name (optional)"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Employee ID
              <input disabled value={user?.employeeId ?? ''} className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Phone number
              <input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={field}
                placeholder="Enter phone number (optional)"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Company
              <input disabled value={user?.companyName ?? ''} className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Address
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                rows={3}
                className={field}
                placeholder="Enter address (optional)"
              />
            </label>
            <button
              disabled={updateProfile.isPending || isUploading}
              className="flex w-fit items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              <Save className="size-4" />
              {updateProfile.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex gap-3">
            <LockKeyhole className="mt-1 size-5 text-slate-600" />
            <div>
              <h2 className="font-bold text-slate-800">Password & security</h2>
              <p className="text-sm text-slate-500">Use a password with at least 8 characters.</p>
            </div>
          </div>
          <form onSubmit={savePassword} className="mt-5 grid gap-4 sm:grid-cols-3">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((key) => (
              <label key={key} className="text-sm font-semibold text-slate-700">
                {key === 'currentPassword'
                  ? 'Current password'
                  : key === 'newPassword'
                    ? 'New password'
                    : 'Confirm password'}
                <div className="relative mt-1.5">
                  <input
                    type={visiblePassword[key] ? 'text' : 'password'}
                    required
                    minLength={key === 'currentPassword' ? 1 : 8}
                    value={password[key]}
                    onChange={(e) => setPassword({ ...password, [key]: e.target.value })}
                    className={`${field} mt-0 pr-11`}
                  />
                  <button
                    type="button"
                    aria-label={visiblePassword[key] ? 'Hide password' : 'Show password'}
                    aria-pressed={visiblePassword[key]}
                    onClick={() =>
                      setVisiblePassword((current) => ({ ...current, [key]: !current[key] }))
                    }
                    className="absolute inset-y-0 right-2.5 my-auto grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {visiblePassword[key] ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </label>
            ))}
            <button
              disabled={updatePassword.isPending}
              className="w-fit rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-3"
            >
              {updatePassword.isPending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
