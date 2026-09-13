
'use client';
import { Camera, LockKeyhole, Save, UserRound } from 'lucide-react';
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
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    profileImage: '',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        fullName: profile.fullName || user?.fullName || '',
        phone: profile.phone || user?.phone || '',
        address: profile.address || user?.address || '',
        profileImage: profile.profileImage || user?.profileImage || '',
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
        <div className="mx-auto grid size-24 place-items-center overflow-hidden rounded-2xl bg-sky-100 text-sky-700">
          {profile.profileImage || user?.profileImage ? (
            <img
              src={profile.profileImage || user?.profileImage || ''}
              alt="Profile"
              className="size-full object-cover"
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
        <div className="mt-6 border-t border-slate-100 pt-5 text-sm">
          <p className="font-bold text-slate-800">{user?.fullName || 'Employee profile'}</p>
          <p className="mt-1 text-slate-500">{user?.employeeId}</p>
        </div>
      </aside>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your personal contact information.</p>
          <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Full name
              <input
                value={profile.fullName || user?.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Employee ID
              <input disabled value={user?.employeeId ?? ''} className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Phone number
              <input
                value={profile.phone || user?.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Company
              <input disabled value={user?.companyName ?? ''} className={field} />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Address
              <textarea
                value={profile.address || user?.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                rows={3}
                className={field}
              />
            </label>
            <button className="flex w-fit items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white sm:col-span-2">
              <Save className="size-4" />
              Save profile
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
                <input
                  type="password"
                  value={password[key]}
                  onChange={(e) => setPassword({ ...password, [key]: e.target.value })}
                  className={field}
                />
              </label>
            ))}
            <button className="w-fit rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:col-span-3">
              Update password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
