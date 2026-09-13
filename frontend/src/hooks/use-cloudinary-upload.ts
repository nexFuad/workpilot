'use client';

import { useCallback, useState } from 'react';

export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(async (file: File, folder = 'workpilot/attendance') => {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) throw new Error('Cloudinary is not configured.');

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', preset);
      body.append('folder', folder);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
        method: 'POST',
        body,
      });
      const result = await response.json();
      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || 'Photo upload failed.');
      }
      return result.secure_url as string;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File, folder = 'workpilot/documents') => {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) throw new Error('Cloudinary is not configured.');
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', preset);
      body.append('folder', folder);
      const resource = file.type === 'application/pdf' ? 'raw' : 'image';
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resource}/upload`, {
        method: 'POST',
        body,
      });
      const result = await response.json();
      if (!response.ok || !result.secure_url)
        throw new Error(result.error?.message || 'Document upload failed.');
      return result.secure_url as string;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadImage, uploadFile, isUploading };
}
