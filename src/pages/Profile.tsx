import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { User, Phone, Mail, Shield } from "lucide-react";
import { PatientManager } from "@/components/PatientManager";

const Profile = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) return <div className="p-10 text-center">Vui lòng đăng nhập...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation /> {/* Giữ Menu */}
      
      <div className="container mx-auto px-4 pt-28">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header màu */}
          <div className="h-32 bg-gradient-to-r from-[#e67e22] to-[#f39c12]"></div>
          
          <div className="px-8 pb-8">
            {/* Avatar to */}
            <div className="relative -mt-16 mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-gray-400">
                 {/* Nếu có ảnh thì hiện ảnh, không thì hiện icon */}
                 <User size={64} />
              </div>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{profile?.full_name}</h1>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                        profile?.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {profile?.role === 'staff' ? 'Nhân viên Y tế' : 'Khách hàng Thân thiết'}
                    </span>
                </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="mt-8 grid gap-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-3 bg-white rounded-full shadow-sm text-orange-500"><Mail size={20} /></div>
                    <div>
                        <p className="text-sm text-gray-500">Email đăng nhập</p>
                        <p className="font-medium">{user.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-3 bg-white rounded-full shadow-sm text-orange-500"><Phone size={20} /></div>
                    <div>
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="font-medium">{profile?.phone || "Chưa cập nhật"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-3 bg-white rounded-full shadow-sm text-orange-500"><Shield size={20} /></div>
                    <div>
                        <p className="text-sm text-gray-500">Mã định danh (ID)</p>
                        <p className="font-medium text-xs text-gray-400 font-mono">{user.id}</p>
                    </div>
                </div>
            </div>
            {/* HIỂN THỊ QUẢN LÝ HỒ SƠ (CHỈ CHO KHÁCH HÀNG) */}
            {profile?.role === 'customer' && (
                <div className="mt-8 pt-8 border-t">
                    <PatientManager />
                </div>
            )}
            <div className="mt-8 pt-6 border-t flex justify-end">
                <button 
                    onClick={signOut}
                    className="px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition"
                >
                    Đăng xuất
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;