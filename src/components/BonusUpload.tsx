import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { supabase, PHOTO_BUCKET, BONUS_SPOT_BASE, MAX_BONUS_UPLOADS, type GrachtenUser } from '@/lib/supabase';
import { compressImage } from '@/lib/compressImage';

type BonusUploadProps = {
  user: GrachtenUser;
  uploadedCount: number;
  onUploaded: () => void;
};

export default function BonusUpload({ user, uploadedCount, onUploaded }: BonusUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const remaining = MAX_BONUS_UPLOADS - uploadedCount;
  const canUpload = remaining > 0 && !uploading;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const spotIndex = BONUS_SPOT_BASE + uploadedCount;
      const path = `${user.id}/bonus_${uploadedCount}.jpg`;

      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, compressed, { upsert: true });

      if (upErr) throw upErr;

      await supabase.from('grachten_photos').insert({
        user_id: user.id,
        spot_index: spotIndex,
        storage_path: path,
      });

      onUploaded();
    } catch (err) {
      console.error('Bonus upload failed:', err);
      alert('Upload fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-green-600 rounded-2xl aspect-square max-w-[200px] mx-auto flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all hover:bg-green-500"
      onClick={() => canUpload && fileRef.current?.click()}
    >
      {uploading ? (
        <div className="w-8 h-8 border-3 border-tan-100 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <span className="text-white text-4xl font-bold">{remaining}</span>
          <Camera className="w-6 h-6 text-white/70 mt-2" strokeWidth={1.5} />
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
