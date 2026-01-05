import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export const VideoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!videoFile) return alert('⚠️ Vui lòng chọn video trước!');
    
    try {
      setUploading(true);

      // 1. Tạo tên file độc nhất (dùng thời gian hiện tại)
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `care-videos/${fileName}`;

      // 2. Tải lên Storage
      const { error: uploadError } = await supabase.storage
        .from('videos') // Đảm bảo bạn đã tạo bucket tên 'videos' trên Supabase
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      // 3. Lấy link công khai
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // 4. Lưu vào Database
      // Lưu ý: Tạm thời chưa lưu staff_id vì chưa làm đăng nhập
      const { error: dbError } = await supabase
        .from('care_logs')
        .insert([
          {
            video_url: publicUrl,
            description: `Test nộp video lúc ${new Date().toLocaleTimeString()}`,
            // staff_id: ..., // Để sau khi có User ID
            created_at: new Date().toISOString(),
          },
        ]);

      if (dbError) throw dbError;

      alert('✅ Thành công! Video đã được lưu lên Supabase.');
      setVideoFile(null);

    } catch (error: any) {
      console.error(error);
      alert('❌ Lỗi: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        📹 Test Tính Năng Nộp Video
      </h2>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-[#e67e22] file:text-white
              hover:file:bg-[#d35400] cursor-pointer"
          />
        </div>

        {videoFile && (
          <p className="text-sm text-green-600 text-center font-medium">
            Đã chọn: {videoFile.name}
          </p>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={uploading || !videoFile}
          className="w-full bg-[#e67e22] hover:bg-[#d35400] text-white h-12 text-lg"
        >
          {uploading ? '⏳ Đang tải lên (Vui lòng đợi)...' : 'Xác nhận Nộp'}
        </Button>
      </div>
    </div>
  );
};