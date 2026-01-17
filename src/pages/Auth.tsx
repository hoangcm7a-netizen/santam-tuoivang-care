import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertTriangle, User, Stethoscope, QrCode, Gift } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'staff'>('customer');
  
  // inputCode dùng chung cho cả Mã Đăng Ký hoặc Mã Giới Thiệu
  const [inputCode, setInputCode] = useState(''); 

  // Notification State
  const [notification, setNotification] = useState<{isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning'}>({ isOpen: false, title: '', message: '', type: 'success' });
  const showNotify = (title: string, message: string, type: 'success' | 'error' | 'warning') => setNotification({ isOpen: true, title, message, type });
  const closeNotify = () => setNotification(prev => ({ ...prev, isOpen: false }));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- ĐĂNG NHẬP ---
      if (view === 'login') {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
           if (error.message.includes("Email not confirmed")) showNotify("Chưa xác thực Email", "Vui lòng kiểm tra Gmail.", "warning");
           else showNotify("Đăng nhập thất bại", "Sai thông tin đăng nhập.", "error");
           setLoading(false); return;
        } 
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role === 'admin') navigate('/admin-dashboard');
          else if (profile?.role === 'staff') navigate('/staff-dashboard');
          else navigate('/customer-dashboard'); 
        }

      // --- QUÊN MẬT KHẨU ---
      } else if (view === 'forgot') {
          if (!email || !phone) {
             showNotify("Thiếu thông tin", "Nhập Email & SĐT.", "error"); setLoading(false); return;
          }
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile` });
          if (error) throw error;
          showNotify("Đã gửi link", "Kiểm tra email để đặt lại mật khẩu.", "success");
          setView('login');

      // --- ĐĂNG KÝ (LOGIC MỚI CHO CẢ STAFF & CUSTOMER) ---
      } else {
        // Validation cơ bản
        if (role === 'staff' && !inputCode) {
            showNotify("Thiếu mã", "Nhân viên bắt buộc phải có Mã đăng ký.", "error");
            setLoading(false); return;
        }

        let finalReferralCode = inputCode ? inputCode.toUpperCase() : `CUS-${Math.floor(1000 + Math.random() * 9000)}`;
        let referrerId = null; 

        // Kiểm tra mã giới thiệu (Nếu có nhập)
        if (inputCode) {
            const codeToCheck = inputCode.toUpperCase();
            
            // Tìm xem mã này có tồn tại không
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id, referral_code')
                .eq('referral_code', codeToCheck)
                .single();

            if (existingUser) {
                // --> MÃ ĐÃ TỒN TẠI: Nghĩa là người này được giới thiệu
                referrerId = existingUser.id;
                
                // Tạo mã mới cho user này để tránh trùng
                // VD: Mã gốc là HOANG -> Mã user này thành HOANG-1234 (để thể hiện là F1 của Hoàng)
                // Hoặc random hẳn: CUS-5678
                const prefix = role === 'staff' ? 'STAFF' : 'CUS';
                finalReferralCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            // --> MÃ CHƯA TỒN TẠI: User này lấy luôn mã đó làm mã của mình
        }

        // Tạo tài khoản Auth
        const { data: { user }, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: `${window.location.origin}/email-confirmed` }
        });
        if (error) throw error;

        if (user) {
          // Lưu vào Profile
          const { error: profileError } = await supabase.from('profiles').insert([{
              id: user.id,
              full_name: fullName,
              phone: phone,
              role: role,
              referral_code: finalReferralCode, 
              referred_by: referrerId, 
              verification_status: role === 'staff' ? 'unverified' : 'verified'
          }]);
          
          if (profileError) throw profileError;
          
          // Thông báo kết quả
          let msg = "Vui lòng kiểm tra Gmail để kích hoạt.";
          if (referrerId) {
              msg = `Đăng ký thành công! Bạn được giới thiệu bởi thành viên có mã ${inputCode}. (Đã ghi nhận ưu đãi)`;
          } else if (role === 'customer' && !inputCode) {
              msg = "Đăng ký thành công! Chào mừng bạn đến với An Tâm Tuổi Vàng.";
          }
          
          showNotify("Đăng ký thành công!", msg, "success");
          setView('login');
        }
      }
    } catch (error: any) {
      showNotify("Lỗi hệ thống", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10 relative">
      {/* POPUP THÔNG BÁO */}
      {notification.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeNotify}></div>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative z-10 animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {notification.type === 'success' ? <CheckCircle size={32} /> : notification.type === 'error' ? <XCircle size={32} /> : <AlertTriangle size={32} />}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{notification.title}</h3>
                <p className="text-gray-600 mb-6 text-sm">{notification.message}</p>
                <Button onClick={closeNotify} className={`w-full ${notification.type === 'success' ? 'bg-green-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-yellow-500'} hover:opacity-90`}>Đã Hiểu</Button>
            </div>
        </div>
      )}

      {/* FORM CHÍNH */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#2c3e50]">
                {view === 'login' ? 'Đăng Nhập' : view === 'register' ? 'Đăng Ký Tài Khoản' : 'Quên Mật Khẩu'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">An Tâm Tuổi Vàng - Chăm Sóc Tận Tâm</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'forgot' && (
             <div className="space-y-4">
                <div><Label>Email đăng ký</Label><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Số điện thoại</Label><Input required value={phone} onChange={e => setPhone(e.target.value)} /></div>
             </div>
          )}

          {view === 'register' && (
            <>
              <div><Label>Họ và tên</Label><Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" className="mt-1" /></div>
              <div><Label>Số điện thoại</Label><Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" className="mt-1" /></div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Label className="mb-3 block font-semibold text-gray-700">Bạn đăng ký với tư cách?</Label>
                <div className="flex gap-3 mb-4">
                  <div onClick={() => setRole('customer')} className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-all ${role === 'customer' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500 shadow-sm' : 'bg-white hover:bg-gray-50'}`}><User size={24} /><span className="text-sm font-bold">Khách hàng</span></div>
                  <div onClick={() => setRole('staff')} className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-all ${role === 'staff' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-sm' : 'bg-white hover:bg-gray-50'}`}><Stethoscope size={24} /><span className="text-sm font-bold">Nhân viên Y tế</span></div>
                </div>

                {/* Ô NHẬP MÃ - HIỆN CHO CẢ 2 NHƯNG KHÁC NHAU VỀ UI */}
                <div className={`mt-3 p-3 rounded-md border animate-in slide-in-from-top-2 ${role === 'staff' ? 'bg-blue-100/50 border-blue-200' : 'bg-orange-100/50 border-orange-200'}`}>
                    <Label className={`flex items-center gap-1 font-bold mb-1 ${role === 'staff' ? 'text-blue-800' : 'text-orange-800'}`}>
                        {role === 'staff' ? <><QrCode size={16}/> Mã Đăng ký / Giới thiệu *</> : <><Gift size={16}/> Mã Giới thiệu (Nhận ưu đãi)</>}
                    </Label>
                    <Input 
                        required={role === 'staff'} 
                        value={inputCode} 
                        onChange={e => setInputCode(e.target.value.toUpperCase())} 
                        placeholder={role === 'staff' ? "Bắt buộc nhập..." : "Để trống nếu không có..."} 
                        className="bg-white focus-visible:ring-offset-0"
                    />
                    <p className="text-[11px] text-gray-600 mt-1.5 leading-tight italic">
                       {role === 'staff' 
                         ? "ℹ️ Nhập mã của người giới thiệu hoặc mã đăng ký mới." 
                         : "ℹ️ Nhập mã giới thiệu để nhận voucher giảm giá (Tùy chọn)."}
                    </p>
                </div>
              </div>
            </>
          )}

          {view !== 'forgot' && (
             <>
                <div><Label>Email</Label><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div>
                    <div className="flex justify-between items-center mb-1"><Label>Mật khẩu</Label>{view === 'login' && <span onClick={() => setView('forgot')} className="text-xs text-blue-600 hover:underline cursor-pointer">Quên mật khẩu?</span>}</div>
                    <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
             </>
          )}

          <Button disabled={loading} className="w-full bg-[#e67e22] hover:bg-[#d35400] text-white h-11 text-base shadow-md">
            {loading ? 'Đang xử lý...' : (view === 'login' ? 'Đăng Nhập' : view === 'register' ? 'Đăng Ký' : 'Gửi Link')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {view === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-[#e67e22] font-bold hover:underline">
            {view === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;