import { useRef, type ChangeEvent } from 'react';
import { Button } from 'antd';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { errorMessage, useUploadImageMutation } from '@/redux/api';
import { Photo } from '@/components/ui';
import { Frame } from './styles';

// Mirrors the API's limits (POST /uploads/images) so bad files fail before uploading.
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX_MB = 5;

/**
 * Picks an image, uploads it right away and reports the stored path
 * (`/api/uploads/images/…`) through `onChange`. Works as an antd Form.Item child.
 */
export default function ImageUpload({ value, onChange, alt = 'Ảnh', height = 160 }: {
  value?: string | null;
  onChange?: (path: string | undefined) => void;
  alt?: string;
  height?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [upload, { isLoading }] = useUploadImageMutation();

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again after an error
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) return toast(`Ảnh tối đa ${IMAGE_MAX_MB}MB thôi nha`);
    try {
      onChange?.((await upload(file).unwrap()).url);
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  return (
    <Frame style={{ height }}>
      {value ? <Photo src={value} alt={alt} /> : <span className="empty">Chưa có ảnh</span>}
      <div className="actions">
        <Button size="small" icon={<ImagePlus size={14} />} loading={isLoading} onClick={() => input.current?.click()}>
          {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </Button>
        {value && !isLoading && (
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange?.(undefined)} aria-label="Bỏ ảnh" />
        )}
      </div>
      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={pick} />
    </Frame>
  );
}
