import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Video, X } from 'lucide-react';
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contactId: string; // ID của đơn hàng
  staffId: string;   // ID nhân viên
}

export const VideoUploadModal = ({ isOpen, onClose, contactId, staffId }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!videoFile) return toast.error('Vui lòng chọn video!');
    
    try {
      setUploading(true);
      const fileName = `job_${contactId}_${Date.now()}.mp4`;
      
      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // 2. Lấy link
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // 3. Lưu vào care_logs (Kèm contact_id)
      const { error: dbError } = await supabase
        .from('care_logs')
        .insert([{
            video_url: publicUrl,
            description: `Báo cáo công việc`,
            staff_id: staffId,
            contact_id: contactId, // Quan trọng: Gắn với đơn hàng
            created_at: new Date().toISOString(),
        }]);

      if (dbError) throw dbError;

      toast.success('Nộp video thành công!');
      setVideoFile(null);
      onClose();

    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 animate-in zoom-in-95 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
        <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <Video className="text-orange-600"/> Nộp Video Báo Cáo
        </h3>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <Input 
              type="file" accept="video/*" 
              onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
              className="mb-2"
            />
            {videoFile && <p className="text-xs text-green-600">{videoFile.name}</p>}
          </div>
          <Button onClick={handleUpload} disabled={uploading} className="w-full bg-[#e67e22] hover:bg-[#d35400]">
            {uploading ? <Loader2 className="animate-spin mr-2"/> : "Tải lên & Hoàn tất"}
          </Button>
        </div>
      </div>
    </div>
  );
};