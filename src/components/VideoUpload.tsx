import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext'; // 1. Import Auth Context
import { toast } from 'sonner'; // Sử dụng toast thay cho alert
import { UploadCloud, Loader2, Video } from 'lucide-react';

export const VideoUpload = () => {
  const { user } = useAuth(); // 2. Lấy thông tin user đang đăng nhập
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleUpload = async () => {
    // Kiểm tra đăng nhập
    if (!user) return toast.error('⚠️ Bạn chưa đăng nhập!');
    if (!videoFile) return toast.warning('⚠️ Vui lòng chọn video trước!');
    
    try {
      setUploading(true);
      
      // A. Tải file lên Storage
      const fileExt = videoFile.name.split('.').pop();
      // Đặt tên file kèm ID user để dễ quản lý: userID_timestamp.ext
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `care-videos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      // B. Lấy link Public
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // C. Lưu vào Database kèm thông tin người tải (staff_id)
      const { error: dbError } = await supabase
        .from('care_logs')
        .insert([
          {
            staff_id: user.id, // <--- 3. LƯU NGƯỜI TẢI TẠI ĐÂY
            video_url: publicUrl,
            description: `Báo cáo video từ ${user.email} lúc ${new Date().toLocaleTimeString()}`,
            created_at: new Date().toISOString(),
            // contact_id: "ID_CUA_DON_HANG" // Nếu bạn đang làm chức năng này trong chi tiết đơn hàng, hãy truyền contact_id vào đây
          },
        ]);

      if (dbError) throw dbError;

      toast.success('✅ Đã nộp video báo cáo thành công!');
      setVideoFile(null);

    } catch (error: any) {
      console.error(error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
        <Video className="text-orange-500" /> Nộp Video Báo Cáo
      </h2>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition relative group">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
          />
          <div className="flex flex-col items-center justify-center text-gray-500">
             <UploadCloud size={40} className="mb-2 text-gray-400 group-hover:text-orange-500 transition-colors"/>
             <p className="text-sm font-medium">Chạm để chọn video</p>
             <p className="text-xs text-gray-400 mt-1">MP4, MOV (Tối đa 50MB)</p>
          </div>
        </div>

        {videoFile && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center justify-center border border-green-200">
             🎬 Đã chọn: <span className="font-bold ml-1 truncate max-w-[200px]">{videoFile.name}</span>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={uploading || !videoFile}
          className="w-full bg-[#e67e22] hover:bg-[#d35400] text-white h-12 text-lg font-bold shadow-md transition-all active:scale-95"
        >
          {uploading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải lên...</>
          ) : (
            'Xác nhận Nộp'
          )}
        </Button>
      </div>
    </div>
  );
};