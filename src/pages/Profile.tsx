import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { User, Phone, Mail, KeyRound, Stethoscope, Save, Check, UploadCloud, Shield, CheckCircle, Clock, XCircle, Award, Plus, Trash2, X, AlertTriangle } from "lucide-react";
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
  
  const [availableServices, setAvailableServices] = useState<string[]>([]); 
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // State Modal Xóa ảnh (Dùng chung cho CCCD và Bằng cấp)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: 'cccd_front' | 'cccd_back' | 'degree', imgUrl: string } | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
        const { data } = await supabase.from('services').select('name');
        if (data) setAvailableServices(data.map(s => s.name));
    };
    fetchServices();

    if (profile?.specialties) {
        const currentSpecs = profile.specialties.split(',').map(s => s.trim()).filter(s => s);
        setSelectedSpecialties(currentSpecs);
    }
  }, [profile]);

  const toggleSpecialty = (serviceName: string) => {
    if (selectedSpecialties.includes(serviceName)) {
        setSelectedSpecialties(prev => prev.filter(item => item !== serviceName));
    } else {
        setSelectedSpecialties(prev => [...prev, serviceName]);
    }
  };

  const handleSaveSpecialties = async () => {
    setLoading(true);
    const specialtiesString = selectedSpecialties.join(', ');
    const { error } = await supabase.from('profiles').update({ specialties: specialtiesString }).eq('id', user?.id);

    if (error) toast.error("Lỗi: " + error.message);
    else toast.success("Đã cập nhật hồ sơ năng lực!");
    setLoading(false);
  };

  // --- HÀM UPLOAD ---
  const handleUploadDoc = async (file: File, type: 'cccd_front' | 'cccd_back' | 'degree') => {
    try {
        setUploadingDoc(true);
        const fileName = `${user?.id}_${type}_${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from('documents').upload(fileName, file);
        if (upErr) throw upErr;
        
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        
        let updateData: any = { verification_status: 'pending' };

        if (type === 'degree') {
            const currentDegrees = profile?.degree_img || [];
            updateData.degree_img = [...currentDegrees, publicUrl];
        } else {
            const column = type === 'cccd_front' ? 'cccd_front_img' : 'cccd_back_img';
            updateData[column] = publicUrl;
        }

        const { error: dbErr } = await supabase.from('profiles').update(updateData).eq('id', user?.id);
        if (dbErr) throw dbErr;
        
        toast.success("Tải lên thành công!");
        window.location.reload(); 
    } catch (err: any) {
        toast.error("Lỗi: " + err.message);
    } finally {
        setUploadingDoc(false);
    }
  };

  // --- HÀM XÓA ẢNH (CHUNG CHO CẢ 3 LOẠI) ---
  const openDeleteConfirm = (type: 'cccd_front' | 'cccd_back' | 'degree', imgUrl: string) => {
      setDeleteConfirm({ isOpen: true, type, imgUrl });
  };

  const executeDelete = async () => {
      if (!deleteConfirm) return;
      try {
          let updateData: any = {};

          if (deleteConfirm.type === 'degree') {
              // Xóa trong mảng bằng cấp
              const currentDegrees = profile?.degree_img || [];
              const newDegrees = currentDegrees.filter(img => img !== deleteConfirm.imgUrl);
              updateData.degree_img = newDegrees;
          } else {
              // Xóa CCCD (Set về null)
              const column = deleteConfirm.type === 'cccd_front' ? 'cccd_front_img' : 'cccd_back_img';
              updateData[column] = null;
              updateData.verification_status = 'unverified'; // Quay về chưa xác thực nếu xóa CCCD
          }

          const { error } = await supabase.from('profiles').update(updateData).eq('id', user?.id);

          if (error) throw error;
          toast.success("Đã xóa ảnh!");
          setDeleteConfirm(null);
          window.location.reload();
      } catch (err: any) {
          toast.error("Lỗi: " + err.message);
      }
  };

  const handleChangePassword = async () => { /* Giữ nguyên */ };
  const handleLogout = async () => { await signOut(); navigate('/'); };

  if (!user) return <div className="p-10 text-center">Vui lòng đăng nhập...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navigation />
      <div className="container mx-auto px-4 pt-28">
        <div className="max-w-3xl mx-auto">
            
            {/* THẺ HỒ SƠ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-[#e67e22] to-[#f39c12]"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-gray-400 bg-gray-100"><User size={64} /></div>
                        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}>Đăng xuất</Button>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{profile?.full_name}</h1>
                        <div className="flex gap-2 mt-2 items-center flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile?.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {profile?.role === 'staff' ? 'Nhân viên Y tế' : profile?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                            </span>
                            {/* HIỂN THỊ MÃ CHO CẢ NHÂN VIÊN VÀ KHÁCH HÀNG */}
                            {(profile?.role === 'staff' || profile?.role === 'customer') && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200 flex items-center gap-1">
                            <Award size={14}/> Mã GT: {profile?.referral_code || "Đang cấp..."}
                        </span>
                        )}
                    </div>
                </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 border rounded bg-gray-50"><Mail className="text-orange-500" size={20} /> <span className="font-medium">{user.email}</span></div>
                        <div className="flex items-center gap-3 p-3 border rounded bg-gray-50"><Phone className="text-orange-500" size={20} /> <span className="font-medium">{profile?.phone || "Chưa có SĐT"}</span></div>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC CHUYÊN MÔN --- */}
            {profile?.role === 'staff' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 border-l-4 border-l-blue-500">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2"><Stethoscope className="text-blue-500" /> Hồ sơ năng lực & Chuyên môn</h3>
                        <p className="text-sm text-gray-500 mb-4">Chọn các dịch vụ mà bạn có thể thực hiện:</p>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {availableServices.map((service, idx) => {
                                const isSelected = selectedSpecialties.includes(service);
                                return (
                                    <button key={idx} onClick={() => toggleSpecialty(service)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{isSelected && <Check size={14} />} {service}</button>
                                )
                            })}
                        </div>
                        <div className="flex justify-end border-t pt-4"><Button onClick={handleSaveSpecialties} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6"><Save size={16} className="mr-2"/> {loading ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
                    </div>

                    {/* --- KHU VỰC XÁC THỰC (ĐÃ SỬA: NÚT XÓA ẢNH CCCD) --- */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 border-l-4 border-l-orange-500">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4"><Shield className="text-orange-500" /> Xác thực Nhân viên (KYC)</h3>
                        <div className={`p-3 rounded-lg mb-6 text-sm font-bold border flex items-center gap-2 ${profile?.verification_status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' : profile?.verification_status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {profile?.verification_status === 'verified' ? <CheckCircle size={18}/> : profile?.verification_status === 'pending' ? <Clock size={18}/> : <XCircle size={18}/>}
                            Trạng thái: {profile?.verification_status === 'verified' ? 'ĐÃ ĐƯỢC DUYỆT (Có thể nhận việc)' : 'ĐANG CHỜ ADMIN DUYỆT'}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            
                            {/* 1. CCCD TRƯỚC */}
                            <div className="border p-4 rounded-xl text-center bg-gray-50 hover:shadow-md transition relative group">
                                <p className="text-sm font-bold text-gray-700 mb-3">CCCD Mặt Trước</p>
                                <div className="h-40 bg-white rounded-lg border border-gray-200 mb-3 flex items-center justify-center overflow-hidden relative">
                                    {profile?.cccd_front_img ? (
                                        <>
                                            <img src={profile.cccd_front_img} className="w-full h-full object-cover"/>
                                            {/* Nút Xóa Ảnh (Mới Thêm) */}
                                            <button 
                                                onClick={() => openDeleteConfirm('cccd_front', profile.cccd_front_img || '')}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition"
                                                title="Xóa ảnh này"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : <span className="text-gray-300 text-xs">Chưa có ảnh</span>}
                                </div>
                                {!profile?.cccd_front_img && (
                                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all text-sm">
                                        {uploadingDoc ? "Đang tải..." : <><UploadCloud size={16} /> Chọn ảnh</>}
                                        <input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleUploadDoc(e.target.files[0], 'cccd_front')} disabled={uploadingDoc} />
                                    </label>
                                )}
                            </div>

                            {/* 2. CCCD SAU */}
                            <div className="border p-4 rounded-xl text-center bg-gray-50 hover:shadow-md transition relative group">
                                <p className="text-sm font-bold text-gray-700 mb-3">CCCD Mặt Sau</p>
                                <div className="h-40 bg-white rounded-lg border border-gray-200 mb-3 flex items-center justify-center overflow-hidden relative">
                                    {profile?.cccd_back_img ? (
                                        <>
                                            <img src={profile.cccd_back_img} className="w-full h-full object-cover"/>
                                            {/* Nút Xóa Ảnh (Mới Thêm) */}
                                            <button 
                                                onClick={() => openDeleteConfirm('cccd_back', profile.cccd_back_img || '')}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition"
                                                title="Xóa ảnh này"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : <span className="text-gray-300 text-xs">Chưa có ảnh</span>}
                                </div>
                                {!profile?.cccd_back_img && (
                                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all text-sm">
                                        {uploadingDoc ? "Đang tải..." : <><UploadCloud size={16} /> Chọn ảnh</>}
                                        <input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleUploadDoc(e.target.files[0], 'cccd_back')} disabled={uploadingDoc} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* PHẦN BẰNG CẤP (GIỮ NGUYÊN CODE CŨ) */}
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm font-bold text-gray-700">Bằng cấp & Chứng chỉ hành nghề</p>
                                <label className="cursor-pointer inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                                    <Plus size={14}/> Thêm bằng cấp
                                    <input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleUploadDoc(e.target.files[0], 'degree')} disabled={uploadingDoc} />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {profile?.degree_img && profile.degree_img.map((imgUrl, idx) => (
                                    <div key={idx} className="relative group h-32 rounded-lg border overflow-hidden bg-gray-100">
                                        <img src={imgUrl} className="w-full h-full object-cover" />
                                        <button onClick={() => openDeleteConfirm('degree', imgUrl)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-700"><X size={12} /></button>
                                    </div>
                                ))}
                                {(!profile?.degree_img || profile.degree_img.length === 0) && <div className="col-span-2 md:col-span-4 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"><p className="text-sm text-gray-400">Chưa có bằng cấp nào được tải lên.</p></div>}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ĐỔI MẬT KHẨU (Code cũ) */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
               <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><KeyRound className="text-orange-500"/> Mật khẩu</h3>{!isChangingPass && <Button variant="ghost" className="text-blue-600" onClick={() => setIsChangingPass(true)}>Đổi mật khẩu</Button>}</div>
               {isChangingPass && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <Input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
                        <Input type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
                        <div className="flex gap-2"><Button onClick={handleChangePassword}>Lưu</Button><Button variant="outline" onClick={() => setIsChangingPass(false)}>Hủy</Button></div>
                    </div>
                )}
            </div>

            {profile?.role === 'customer' && <PatientManager />}
        </div>
      </div>

      {/* --- MODAL XÁC NHẬN XÓA ẢNH (POP-UP ĐẸP) --- */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDeleteConfirm(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative z-10 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận xóa ảnh?</h3>
                <p className="text-gray-600 mb-6 text-sm">Hành động này sẽ xóa vĩnh viễn ảnh này khỏi hồ sơ của bạn.</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="w-full">Hủy bỏ</Button>
                    <Button onClick={executeDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-md">Xóa ngay</Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Profile;