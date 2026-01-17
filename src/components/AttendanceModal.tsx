import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Đảm bảo bạn có UI Dialog hoặc dùng div fixed
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  type: 'check-in' | 'check-out';
  onSuccess: () => void;
}

export const AttendanceModal = ({ isOpen, onClose, contactId, type, onSuccess }: AttendanceModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error("Vui lòng chọn ảnh minh chứng!");

    try {
      setLoading(true);
      
      // 1. Upload ảnh lên Storage 'attendance'
      const fileName = `${contactId}_${type}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('attendance')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Lấy link ảnh
      const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName);

      // 3. Cập nhật vào Database
      const updateData = type === 'check-in' 
        ? { check_in_time: new Date().toISOString(), check_in_img: publicUrl }
        : { check_out_time: new Date().toISOString(), check_out_img: publicUrl };

      const { error: dbError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId);

      if (dbError) throw dbError;

      toast.success(`${type === 'check-in' ? 'Check-in' : 'Check-out'} thành công!`);
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 animate-in zoom-in-95 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
        
        <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <Camera className="text-blue-600"/>
          Xác nhận {type === 'check-in' ? 'Bắt đầu ca' : 'Kết thúc ca'}
        </h3>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
            <Input 
              type="file" 
              accept="image/*" 
              capture="environment" // Mở camera trên điện thoại
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <p className="text-green-600 font-medium truncate">{file.name}</p>
            ) : (
              <div className="text-gray-500">
                <p>Chạm để chụp/tải ảnh</p>
                <p className="text-xs">(Bắt buộc)</p>
              </div>
            )}
          </div>

          <Button onClick={handleUpload} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="animate-spin mr-2"/> : "Xác nhận & Tải lên"}
          </Button>
        </div>
      </div>
    </div>
  );
};