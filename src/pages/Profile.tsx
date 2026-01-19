import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { User, Phone, Mail, KeyRound, Stethoscope, Save, Check, UploadCloud, Shield, CheckCircle, Clock, XCircle, Award, Plus, Trash2, X, AlertTriangle, Info, MessageSquare, RefreshCw, RefreshCcw } from "lucide-react";
import { PatientManager } from "@/components/PatientManager";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  // State cơ bản
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // State Dịch vụ & Đăng ký
  const [allServices, setAllServices] = useState<any[]>([]); 
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]); 
  const [selectedService, setSelectedService] = useState<any>(null); 
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: 'cccd_front' | 'cccd_back' | 'degree', imgUrl: string } | null>(null);
  const [kycAlert, setKycAlert] = useState(false); 

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "PASSWORD_RECOVERY") {
              setIsChangingPass(true);
              toast.info("Vui lòng nhập mật khẩu mới của bạn.");
          }
      });

    const fetchServices = async () => {
        const { data } = await supabase.from('services').select('*');
        if (data) setAllServices(data);
    };

    const fetchMyRegs = async () => {
        if (!user) return;
        const { data } = await supabase.from('staff_services').select('*').eq('staff_id', user.id);
        if (data) setMyRegistrations(data);
    };

    fetchServices();
    if (user) fetchMyRegs();

    return () => { authListener.subscription.unsubscribe(); };
  }, [user]);

  // --- HÀM GỬI DUYỆT LẠI KYC ---
  const handleReSubmitKYC = async () => {
      if (!profile?.cccd_front_img || !profile?.cccd_back_img) {
          return toast.error("Vui lòng tải đủ ảnh CCCD trước khi gửi duyệt lại.");
      }
      setLoading(true);
      try {
          const { error } = await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', user?.id);
          if (error) throw error;
          toast.success("Đã gửi yêu cầu xét duyệt lại!");
          window.location.reload();
      } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  // --- XỬ LÝ CLICK VÀO DỊCH VỤ ---
  const handleServiceClick = (service: any) => {
      const reg = myRegistrations.find(r => r.service_id === service.id);
      
      if (reg) {
          if (reg.status === 'pending') {
              toast.info("Đơn đăng ký dịch vụ này đang chờ duyệt.");
              return;
          } 
          else if (reg.status === 'approved') {
              toast.success("Bạn đã được cấp phép thực hiện dịch vụ này.");
              return;
          }
          // Nếu status === 'rejected', cho phép đi tiếp để đăng ký lại
          if (reg.status === 'rejected') {
              toast.error(`Lần trước bị từ chối: "${reg.admin_note}". Hãy kiểm tra điều kiện và đăng ký lại.`);
          }
      }

      // KIỂM TRA ĐIỀU KIỆN KYC
      const isKycVerified = profile?.verification_status === 'verified';
      const hasDegree = profile?.degree_img && profile.degree_img.length > 0;
      const hasCCCD = profile?.cccd_front_img && profile?.cccd_back_img;

      if (!isKycVerified || !hasDegree || !hasCCCD) {
          setKycAlert(true);
      } else {
          setSelectedService(service);
      }
  };

  // --- XÁC NHẬN ĐĂNG KÝ (HOẶC ĐĂNG KÝ LẠI) ---
  const confirmRegistration = async () => {
      if (!selectedService || !user) return;
      setLoading(true);
      try {
          // Kiểm tra xem đã có đơn cũ chưa
          const existingReg = myRegistrations.find(r => r.service_id === selectedService.id);

          if (existingReg) {
              // NẾU ĐÃ CÓ (Bị từ chối) -> UPDATE lại thành PENDING
              const { error } = await supabase.from('staff_services')
                  .update({ status: 'pending', admin_note: null }) // Xóa ghi chú cũ, đặt lại trạng thái
                  .eq('id', existingReg.id);
              if (error) throw error;
              toast.success("Đã gửi lại yêu cầu đăng ký!");
          } else {
              // NẾU CHƯA CÓ -> INSERT MỚI
              const { error } = await supabase.from('staff_services')
                  .insert({ staff_id: user.id, service_id: selectedService.id, status: 'pending' });
              if (error) throw error;
              toast.success("Đã gửi yêu cầu đăng ký!");
          }

          // Cập nhật lại danh sách
          const { data } = await supabase.from('staff_services').select('*').eq('staff_id', user.id);
          if (data) setMyRegistrations(data);
          
          setSelectedService(null);
      } catch (err: any) { 
          toast.error("Lỗi: " + err.message); 
      } finally { 
          setLoading(false); 
      }
  };

  // --- CÁC HÀM CŨ ---
  const handleUploadDoc = async (file: File, type: 'cccd_front' | 'cccd_back' | 'degree') => {
    try {
        setUploadingDoc(true);
        const fileName = `${user?.id}_${type}_${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from('documents').upload(fileName, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        
        let updateData: any = { }; 
        if (type === 'degree') {
            const currentDegrees = profile?.degree_img || [];
            updateData.degree_img = [...currentDegrees, publicUrl];
        } else {
            const column = type === 'cccd_front' ? 'cccd_front_img' : 'cccd_back_img';
            updateData[column] = publicUrl;
        }
        await supabase.from('profiles').update(updateData).eq('id', user?.id);
        toast.success("Tải ảnh thành công! Đừng quên bấm 'Gửi Duyệt' nếu bạn đang bị từ chối."); 
        window.location.reload(); 
    } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setUploadingDoc(false); }
  };

  const openDeleteConfirm = (type: 'cccd_front' | 'cccd_back' | 'degree', imgUrl: string) => { setDeleteConfirm({ isOpen: true, type, imgUrl }); };
  
  const executeDelete = async () => { 
      if (!deleteConfirm) return; 
      try { 
          let updateData: any = {}; 
          if (deleteConfirm.type === 'degree') { 
              const newDegrees = (profile?.degree_img || []).filter(img => img !== deleteConfirm.imgUrl); 
              updateData.degree_img = newDegrees; 
          } else { 
              const column = deleteConfirm.type === 'cccd_front' ? 'cccd_front_img' : 'cccd_back_img'; 
              updateData[column] = null; 
          } 
          await supabase.from('profiles').update(updateData).eq('id', user?.id); 
          toast.success("Đã xóa!"); setDeleteConfirm(null); window.location.reload(); 
      } catch (err: any) { toast.error("Lỗi: " + err.message); } 
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) return toast.error("Vui lòng nhập đầy đủ mật khẩu.");
    if (newPassword !== confirmPassword) return toast.error("Mật khẩu không khớp.");
    if (newPassword.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự.");
    try {
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Đổi mật khẩu thành công!");
        setIsChangingPass(false); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  if (!user) return <div className="p-10 text-center">Vui lòng đăng nhập...</div>;

  let statusColor = "bg-gray-50 text-gray-700 border-gray-200";
  let statusText = "Chưa gửi hồ sơ";
  let StatusIcon = AlertTriangle;
  const status = profile?.verification_status;

  if (status === 'verified') {
      statusColor = "bg-green-50 text-green-700 border-green-200";
      statusText = "ĐÃ ĐƯỢC DUYỆT (Có thể nhận việc)";
      StatusIcon = CheckCircle;
  } else if (status === 'pending') {
      statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
      statusText = "ĐANG CHỜ ADMIN DUYỆT";
      StatusIcon = Clock;
  } else if (status === 'rejected') {
      statusColor = "bg-red-50 text-red-700 border-red-200";
      statusText = "HỒ SƠ BỊ TỪ CHỐI (Vui lòng cập nhật & Gửi lại)";
      StatusIcon = XCircle;
  }

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
                            {(profile?.role === 'staff' || profile?.role === 'customer') && (<span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200 flex items-center gap-1"><Award size={14}/> Mã GT: {profile?.referral_code || "Đang cấp..."}</span>)}
                        </div>
                    </div>
                    {profile?.role === 'staff' && (
                        <div className="mt-4">
                            <Link to="/staff-chat" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                <MessageSquare size={18}/> Hộp thư & Thông báo từ Admin
                            </Link>
                        </div>
                    )}
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 border rounded bg-gray-50"><Mail className="text-orange-500" size={20} /> <span className="font-medium">{user.email}</span></div>
                        <div className="flex items-center gap-3 p-3 border rounded bg-gray-50"><Phone className="text-orange-500" size={20} /> <span className="font-medium">{profile?.phone || "Chưa có SĐT"}</span></div>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC ĐĂNG KÝ DỊCH VỤ --- */}
            {profile?.role === 'staff' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 border-l-4 border-l-blue-500">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2"><Stethoscope className="text-blue-500" /> Đăng ký Dịch vụ Hành nghề</h3>
                        <p className="text-sm text-gray-500 mb-4">Bạn cần đăng ký dịch vụ để Admin duyệt. Chỉ khi được duyệt (Màu xanh), bạn mới nhận được việc.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {allServices.map((service) => {
                                const reg = myRegistrations.find(r => r.service_id === service.id);
                                let statusClass = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"; 
                                let statusText = "Chưa đăng ký";
                                let Icon = Plus;

                                if (reg) {
                                    if (reg.status === 'approved') { 
                                        statusClass = "bg-green-50 text-green-700 border-green-500 ring-1 ring-green-500"; 
                                        statusText = "Đã được duyệt"; 
                                        Icon = CheckCircle; 
                                    } 
                                    else if (reg.status === 'pending') { 
                                        statusClass = "bg-yellow-50 text-yellow-700 border-yellow-500 border-dashed"; 
                                        statusText = "Đang chờ duyệt"; 
                                        Icon = Clock; 
                                    } 
                                    else { 
                                        // TRẠNG THÁI TỪ CHỐI
                                        statusClass = "bg-red-50 text-red-700 border-red-300 ring-1 ring-red-200 cursor-pointer hover:bg-red-100"; 
                                        statusText = "Bị từ chối - Nhấn để đăng ký lại"; 
                                        Icon = RefreshCcw; // Icon Refresh
                                    }
                                }

                                const rawPrice = String(service.price).replace(/\D/g, ''); 
                                const displayPrice = parseInt(rawPrice || '0').toLocaleString('vi-VN');

                                return (
                                    <div key={service.id} onClick={() => handleServiceClick(service)} className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-full ${statusClass}`}>
                                        <div className="flex justify-between items-start mb-2"><span className="font-bold text-sm">{service.name}</span><Icon size={16} /></div>
                                        <div className="text-xs mt-auto flex justify-between items-center">
                                            <span className="font-mono font-bold text-green-700">{displayPrice} đ</span>
                                            <span className="italic opacity-80 font-bold">{statusText}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* --- KHU VỰC XÁC THỰC --- */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 border-l-4 border-l-orange-500">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4"><Shield className="text-orange-500" /> Xác thực Nhân viên (KYC)</h3>
                        <div className={`p-3 rounded-lg mb-6 text-sm font-bold border flex flex-col md:flex-row justify-between items-center gap-3 ${statusColor}`}>
                            <div className="flex items-center gap-2"><StatusIcon size={20}/><span>{statusText}</span></div>
                            {(status === 'rejected' || status === 'unverified') && (
                                <Button size="sm" onClick={handleReSubmitKYC} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full md:w-auto">
                                    <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`}/> {loading ? 'Đang gửi...' : 'Gửi Duyệt Lại'}
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="border p-4 rounded-xl text-center bg-gray-50 hover:shadow-md transition relative group">
                                <p className="text-sm font-bold text-gray-700 mb-3">CCCD Mặt Trước</p>
                                <div className="h-40 bg-white rounded-lg border border-gray-200 mb-3 flex items-center justify-center overflow-hidden relative">
                                    {profile?.cccd_front_img ? (
                                        <><img src={profile.cccd_front_img} className="w-full h-full object-cover"/><button onClick={() => openDeleteConfirm('cccd_front', profile.cccd_front_img || '')} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition"><Trash2 size={16} /></button></>
                                    ) : <span className="text-gray-300 text-xs">Chưa có ảnh</span>}
                                </div>
                                {!profile?.cccd_front_img && (<label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all text-sm">{uploadingDoc ? "Đang tải..." : <><UploadCloud size={16} /> Chọn ảnh</>}<input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleUploadDoc(e.target.files[0], 'cccd_front')} disabled={uploadingDoc} /></label>)}
                            </div>
                            <div className="border p-4 rounded-xl text-center bg-gray-50 hover:shadow-md transition relative group">
                                <p className="text-sm font-bold text-gray-700 mb-3">CCCD Mặt Sau</p>
                                <div className="h-40 bg-white rounded-lg border border-gray-200 mb-3 flex items-center justify-center overflow-hidden relative">
                                    {profile?.cccd_back_img ? (
                                        <><img src={profile.cccd_back_img} className="w-full h-full object-cover"/><button onClick={() => openDeleteConfirm('cccd_back', profile.cccd_back_img || '')} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition"><Trash2 size={16} /></button></>
                                    ) : <span className="text-gray-300 text-xs">Chưa có ảnh</span>}
                                </div>
                                {!profile?.cccd_back_img && (<label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all text-sm">{uploadingDoc ? "Đang tải..." : <><UploadCloud size={16} /> Chọn ảnh</>}<input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleUploadDoc(e.target.files[0], 'cccd_back')} disabled={uploadingDoc} /></label>)}
                            </div>
                        </div>
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4"><p className="text-sm font-bold text-gray-700">Bằng cấp & Chứng chỉ hành nghề</p><label className="cursor-pointer inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition"><Plus size={14}/> Thêm bằng cấp<input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleUploadDoc(e.target.files[0], 'degree')} disabled={uploadingDoc} /></label></div>
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

            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
               <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><KeyRound className="text-orange-500"/> Mật khẩu</h3>{!isChangingPass && <Button variant="ghost" className="text-blue-600" onClick={() => setIsChangingPass(true)}>Đổi mật khẩu</Button>}</div>
               {isChangingPass && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <Input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
                        <Input type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
                        <div className="flex gap-2"><Button onClick={handleChangePassword} disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button><Button variant="outline" onClick={() => setIsChangingPass(false)} disabled={loading}>Hủy</Button></div>
                    </div>
                )}
            </div>

            {profile?.role === 'customer' && <PatientManager />}
        </div>
      </div>

      {/* --- CÁC MODAL --- */}
      {kycAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa đủ điều kiện!</h3>
                <p className="text-gray-600 mb-6 text-sm">Để đăng ký dịch vụ này, bạn cần cập nhật đầy đủ: <br/><b>1. Ảnh CCCD 2 mặt</b><br/><b>2. Bằng cấp/Chứng chỉ hành nghề</b><br/>Và chờ Admin xác thực hồ sơ (KYC).</p>
                <Button onClick={() => setKycAlert(false)} className="w-full bg-orange-600 hover:bg-orange-700">Đã hiểu, tôi sẽ cập nhật</Button>
            </div>
        </div>
      )}

      {selectedService && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 relative">
                <button onClick={() => setSelectedService(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Info size={24}/></div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{selectedService.name}</h3>
                        <p className="text-sm text-green-600 font-bold">
                            {parseInt(String(selectedService.price).replace(/\D/g, '') || '0').toLocaleString('vi-VN')} đ
                        </p>
                    </div>
                </div>
                <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded border"><p className="text-xs font-bold text-gray-500 uppercase mb-1">Mô tả công việc</p><p className="text-sm text-gray-700">{selectedService.description || "Chưa có mô tả"}</p></div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-100"><p className="text-xs font-bold text-orange-700 uppercase mb-1">Điều kiện bắt buộc</p><p className="text-sm text-orange-800">{selectedService.requirements || "Yêu cầu bằng cấp chuyên môn liên quan."}</p></div>
                </div>
                
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedService(null)} className="flex-1">Hủy</Button>
                    <Button onClick={confirmRegistration} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {loading ? "Đang gửi..." : "Xác nhận Đăng Ký"}
                    </Button>
                </div>
            </div>
        </div>
      )}

      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDeleteConfirm(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative z-10 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận xóa ảnh?</h3>
                <p className="text-gray-600 mb-6 text-sm">Hành động này sẽ xóa vĩnh viễn ảnh này khỏi hồ sơ của bạn.</p>
                <div className="flex gap-3 justify-center"><Button variant="outline" onClick={() => setDeleteConfirm(null)} className="w-full">Hủy bỏ</Button><Button onClick={executeDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-md">Xóa ngay</Button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;