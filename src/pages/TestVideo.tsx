import { VideoUpload } from "@/components/VideoUpload";
import Navigation from "@/components/Navigation";
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const TestVideo = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

  useEffect(() => {
    // Nếu chưa đăng nhập HOẶC không phải nhân viên -> Đuổi về trang chủ
    if (!user) {
        navigate('/auth'); // Chưa đăng nhập thì bắt đăng nhập
    } else if (profile && profile.role !== 'staff') {
        alert('Bạn không có quyền truy cập trang này!');
        navigate('/'); // Khách hàng thì đuổi về trang chủ
    }
  }, [user, profile, navigate]);

  if (!user || profile?.role !== 'staff') return null;
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation /> {/* Hiện thanh menu cho đẹp */}
      <div className="pt-24 container mx-auto px-4">
        <VideoUpload />
      </div>
    </div>
  );
};

export default TestVideo;