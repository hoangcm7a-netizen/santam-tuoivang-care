import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, Stethoscope, CheckCircle, XCircle, AlertTriangle, KeyRound, Phone, Mail } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Các chế độ: 'login', 'register', 'forgot'
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  // Form data chung
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'staff'>('customer');
  const [staffCode, setStaffCode] = useState('');

  const SECRET_STAFF_CODE = "HHOANG2502"; 

  // --- QUẢN LÝ THÔNG BÁO ---
  const [notification, setNotification] = useState<{
    isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning';
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  const showNotify = (title: string, message: string, type: 'success' | 'error' | 'warning') => {
    setNotification({ isOpen: true, title, message, type });
  };
  const closeNotify = () => setNotification(prev => ({ ...prev, isOpen: false }));

  const isEmailConfirmed = searchParams.get('type') === 'signup' || searchParams.get('access_token');

  // --- XỬ LÝ CHÍNH ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. XỬ LÝ ĐĂNG NHẬP
      if (view === 'login') {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
           if (error.message.includes("Email not confirmed")) {
             showNotify("Chưa xác thực Email", "Vui lòng kiểm tra Gmail để kích hoạt tài khoản.", "warning");
           } else {
             showNotify("Đăng nhập thất bại", "Email hoặc mật khẩu không chính xác.", "error");
           }
           setLoading(false); return;
        } 
        
        // Điều hướng
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role === 'admin') navigate('/admin-dashboard');
          else if (profile?.role === 'staff') navigate('/staff-dashboard');
          else navigate('/customer-dashboard'); 
        }

      // 2. XỬ LÝ QUÊN MẬT KHẨU
      } else if (view === 'forgot') {
          // Bắt buộc nhập cả Email và SĐT
          if (!email || !phone) {
             showNotify("Thiếu thông tin", "Vui lòng nhập cả Email và Số điện thoại đã đăng ký.", "error");
             setLoading(false); return;
          }

          // Gửi link reset về email (kèm theo chuyển hướng đến trang Profile để đổi pass)
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: `${window.location.origin}/profile`,
          });

          if (error) throw error;

          showNotify(
              "Đã gửi yêu cầu!", 
              "Chúng tôi đã gửi một đường link đặt lại mật khẩu vào Email của bạn. Hãy kiểm tra hộp thư (cả mục Spam).", 
              "success"
          );
          setView('login'); // Quay về đăng nhập

      // 3. XỬ LÝ ĐĂNG KÝ
      } else {
        if (role === 'staff' && staffCode !== SECRET_STAFF_CODE) {
            showNotify("Mã xác thực sai", "Mã nhân viên không đúng.", "error");
            setLoading(false); return;
        }

        const { data: { user }, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: `${window.location.origin}/email-confirmed` }
        });
        if (error) throw error;

        if (user) {
          await supabase.from('profiles').insert([{ id: user.id, full_name: fullName, phone: phone, role: role }]);
          showNotify("Đăng ký thành công!", "Vui lòng kiểm tra Gmail để kích hoạt tài khoản.", "success");
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
        
        {/* Header xác nhận mail */}
        {(searchParams.get('confirmed') === 'true' || isEmailConfirmed) && (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center text-green-700 font-bold">
                🎉 Xác nhận thành công! Bạn có thể đăng nhập.
             </div>
        )}

        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#2c3e50]">
                {view === 'login' ? 'Đăng Nhập' : view === 'register' ? 'Đăng Ký Tài Khoản' : 'Quên Mật Khẩu'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">An Tâm Tuổi Vàng - Chăm Sóc Tận Tâm</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
            
          {/* TRƯỜNG NHẬP LIỆU CHO QUÊN MẬT KHẨU */}
          {view === 'forgot' && (
             <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-800 border border-orange-100 mb-4">
                    <p className="font-bold flex items-center gap-2 mb-1"><KeyRound size={16}/> Khôi phục tài khoản</p>
                    Nhập Email và Số điện thoại bạn đã dùng để đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu về Email của bạn.
                </div>
                <div>
                    <Label className="flex items-center gap-2"><Mail size={16}/> Email đăng ký</Label>
                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" />
                </div>
                <div>
                    <Label className="flex items-center gap-2"><Phone size={16}/> Số điện thoại xác thực</Label>
                    <Input required type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" className="mt-1" />
                </div>
             </div>
          )}

          {/* TRƯỜNG NHẬP LIỆU ĐĂNG KÝ */}
          {view === 'register' && (
            <>
              <div><Label>Họ và tên</Label><Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" className="mt-1" /></div>
              <div><Label>Số điện thoại</Label><Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" className="mt-1" /></div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <Label className="mb-2 block">Vai trò:</Label>
                <div className="flex gap-3">
                  <div onClick={() => setRole('customer')} className={`flex-1 p-2 border rounded cursor-pointer flex flex-col items-center gap-1 ${role === 'customer' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white'}`}><User size={20} /><span className="text-xs font-bold">Khách hàng</span></div>
                  <div onClick={() => setRole('staff')} className={`flex-1 p-2 border rounded cursor-pointer flex flex-col items-center gap-1 ${role === 'staff' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}><Stethoscope size={20} /><span className="text-xs font-bold">Nhân viên</span></div>
                </div>
                {role === 'staff' && (
                    <div className="mt-2"><Label>Mã xác thực:</Label><Input required value={staffCode} onChange={e => setStaffCode(e.target.value.toUpperCase())} placeholder="Mã..." className="mt-1" /></div>
                )}
              </div>
            </>
          )}

          {/* TRƯỜNG NHẬP LIỆU CHUNG (EMAIL/PASS) CHO LOGIN & REGISTER */}
          {view !== 'forgot' && (
             <>
                <div><Label>Email</Label><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" /></div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label>Mật khẩu</Label>
                        {view === 'login' && <span onClick={() => setView('forgot')} className="text-xs text-blue-600 hover:underline cursor-pointer">Quên mật khẩu?</span>}
                    </div>
                    <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
             </>
          )}

          <Button disabled={loading} className="w-full bg-[#e67e22] hover:bg-[#d35400] text-white h-11 text-base shadow-md">
            {loading ? 'Đang xử lý...' : (view === 'login' ? 'Đăng Nhập' : view === 'register' ? 'Đăng Ký' : 'Gửi Link Khôi Phục')}
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