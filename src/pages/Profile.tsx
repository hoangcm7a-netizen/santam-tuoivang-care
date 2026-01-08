import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { User, Phone, Mail, KeyRound, Stethoscope, Save, Check } from "lucide-react";
import { PatientManager } from "@/components/PatientManager";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // --- STATE MỚI CHO VIỆC CHỌN CHUYÊN MÔN ---
  const [availableServices, setAvailableServices] = useState<string[]>([]); // Danh sách dịch vụ từ hệ thống
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]); // Các mục nhân viên đã chọn
  const [loading, setLoading] = useState(false);

  // 1. Tải danh sách dịch vụ & Chuyên môn hiện tại
  useEffect(() => {
    // Lấy danh sách dịch vụ từ bảng services
    const fetchServices = async () => {
        const { data } = await supabase.from('services').select('name');
        if (data) {
            setAvailableServices(data.map(s => s.name));
        }
    };

    fetchServices();

    // Lấy chuyên môn hiện tại của nhân viên (chuyển từ chuỗi sang mảng)
    if (profile?.specialties) {
        // Tách chuỗi "A, B, C" thành mảng ["A", "B", "C"]
        const currentSpecs = profile.specialties.split(',').map(s => s.trim()).filter(s => s);
        setSelectedSpecialties(currentSpecs);
    }
  }, [profile]);

  // 2. Hàm xử lý khi bấm vào một dịch vụ (Chọn/Bỏ chọn)
  const toggleSpecialty = (serviceName: string) => {
    if (selectedSpecialties.includes(serviceName)) {
        // Nếu đang chọn -> Bỏ chọn (Lọc bỏ nó ra khỏi mảng)
        setSelectedSpecialties(prev => prev.filter(item => item !== serviceName));
    } else {
        // Nếu chưa chọn -> Thêm vào mảng
        setSelectedSpecialties(prev => [...prev, serviceName]);
    }
  };

  // 3. Hàm lưu chuyên môn
  const handleSaveSpecialties = async () => {
    setLoading(true);
    
    // Gộp mảng lại thành chuỗi, ví dụ: "Tiêm truyền, Vật lý trị liệu"
    const specialtiesString = selectedSpecialties.join(', ');

    const { error } = await supabase
        .from('profiles')
        .update({ specialties: specialtiesString })
        .eq('id', user?.id);

    if (error) toast.error("Lỗi: " + error.message);
    else toast.success("Đã cập nhật hồ sơ năng lực!");
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return toast.error("Mật khẩu quá ngắn");
    if (newPassword !== confirmPassword) return toast.error("Mật khẩu không khớp");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error("Lỗi: " + error.message);
    else {
        toast.success("Đổi mật khẩu thành công!");
        setIsChangingPass(false);
    }
  };

  const handleLogout = async () => {
      await signOut();
      navigate('/'); 
  };

  if (!user) return <div className="p-10 text-center">Vui lòng đăng nhập...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-28">
        <div className="max-w-3xl mx-auto">
            
            {/* THẺ HỒ SƠ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-[#e67e22] to-[#f39c12]"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-gray-400">
                            <User size={64} />
                        </div>
                        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                            Đăng xuất
                        </Button>
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{profile?.full_name}</h1>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${profile?.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {profile?.role === 'staff' ? 'Nhân viên Y tế' : profile?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                        </span>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 border rounded bg-gray-50"><Mail className="text-orange-500" size={20} /> <span className="font-medium">{user.email}</span></div>
                        <div className="flex items-center gap-3 p-3 border rounded bg-gray-50"><Phone className="text-orange-500" size={20} /> <span className="font-medium">{profile?.phone || "Chưa có SĐT"}</span></div>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC CHỌN CHUYÊN MÔN (GIAO DIỆN MỚI) --- */}
            {profile?.role === 'staff' && (
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 border-l-4 border-l-blue-500">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                        <Stethoscope className="text-blue-500" /> Hồ sơ năng lực & Chuyên môn
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Chọn các dịch vụ mà bạn có thể thực hiện để Admin xếp lịch phù hợp:
                    </p>
                    
                    {/* Danh sách các thẻ (Tags) */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {availableServices.length > 0 ? availableServices.map((service, idx) => {
                            const isSelected = selectedSpecialties.includes(service);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggleSpecialty(service)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                                        ${isSelected 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {isSelected && <Check size={14} />} {/* Icon tích V */}
                                    {service}
                                </button>
                            )
                        }) : (
                            <p className="text-sm text-red-500 italic">Hệ thống chưa có dịch vụ nào. Vui lòng liên hệ Admin.</p>
                        )}
                    </div>

                    <div className="flex justify-end border-t pt-4">
                        <Button onClick={handleSaveSpecialties} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6">
                            <Save size={16} className="mr-2"/> 
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </div>
            )}

            {/* ĐỔI MẬT KHẨU */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><KeyRound className="text-orange-500"/> Mật khẩu</h3>
                    {!isChangingPass && <Button variant="ghost" className="text-blue-600" onClick={() => setIsChangingPass(true)}>Đổi mật khẩu</Button>}
                </div>
                {isChangingPass && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <Input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
                        <Input type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
                        <div className="flex gap-2">
                            <Button onClick={handleChangePassword}>Lưu</Button>
                            <Button variant="outline" onClick={() => setIsChangingPass(false)}>Hủy</Button>
                        </div>
                    </div>
                )}
            </div>

            {profile?.role === 'customer' && <PatientManager />}
        </div>
      </div>
    </div>
  );
};

export default Profile;