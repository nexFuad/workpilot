'use client';
import { FileImage, FileText, LoaderCircle, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { useDocuments } from '@/hooks/use-documents';

const formatSize = (size: number) =>
  `${(size / 1024 / 1024).toFixed(size < 1024 * 1024 ? 1 : 0)} MB`;
export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const { documents, create } = useDocuments();
  const { uploadFile, isUploading } = useCloudinaryUpload();
  const submit = async () => {
    if (!file) return;
    try {
      const fileUrl = await uploadFile(file);
      await create.mutateAsync({ name: file.name, fileUrl, fileType: file.type, size: file.size });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      toast.success('Document uploaded and sent for review.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Document upload failed.');
    }
  };
  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="My documents"
        description="Upload documents for HR review and track their approval status."
      />
      <section className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm">
          <Upload className="size-5" />
        </span>
        <h2 className="mt-4 font-bold text-slate-800">Upload a document</h2>
        <p className="mt-1 text-sm text-slate-500">
          PDF, JPG or PNG files up to 10 MB are accepted.
        </p>
        <input
          ref={inputRef}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (!selected) return;
            if (
              !['application/pdf', 'image/jpeg', 'image/png'].includes(selected.type) ||
              selected.size > 10 * 1024 * 1024
            )
              return toast.error('Choose a PDF, JPG or PNG file under 10 MB.');
            setFile(selected);
          }}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
        />
        {file ? (
          <div className="mx-auto mt-5 flex max-w-md items-center justify-between rounded-xl bg-white p-3 text-left shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="size-5 shrink-0 text-sky-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
              </div>
            </div>
            <button onClick={() => setFile(null)} className="p-1 text-slate-400">
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          >
            Choose file
          </button>
          {file && (
            <button
              disabled={isUploading || create.isPending}
              onClick={submit}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {(isUploading || create.isPending) && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Upload document
            </button>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Uploaded documents</h2>
          <p className="mt-1 text-sm text-slate-500">HR/Admin can review each uploaded document.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.isLoading ? (
            <p className="p-6 text-sm text-slate-500">Loading documents…</p>
          ) : (documents.data?.documents.length ?? 0) === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              You have not uploaded any documents yet.
            </p>
          ) : (
            documents.data?.documents.map((document) => (
              <article
                key={document.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                    {document.fileType.startsWith('image/') ? (
                      <FileImage className="size-5" />
                    ) : (
                      <FileText className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-semibold text-slate-800 hover:text-sky-700"
                    >
                      {document.name}
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSize(document.size)} · Uploaded{' '}
                      {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                        new Date(document.createdAt),
                      )}
                    </p>
                    {document.reviewerNote && (
                      <p className="mt-1 text-xs text-slate-500">Note: {document.reviewerNote}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${document.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : document.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {document.status}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
