import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // True = Đăng nhập, False = Đăng ký
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'staff'>('customer'); // Mặc định là khách
  const isEmailConfirmed = searchParams.get('type') === 'signup' || searchParams.get('access_token');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- ĐĂNG NHẬP ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Bắt lỗi chưa xác nhận email
          if (error.message.includes("Email not confirmed")) {
            alert("⚠️ Xin vui lòng xác nhận gmail!\nSau khi xác nhận xong hãy nhấn đăng nhập lại.");
          } else {
            throw error;
          }
        } else {
          navigate('/'); 
        }
      } else {
        // --- ĐĂNG KÝ ---
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
          }
        });
        if (signUpError) throw signUpError;

        if (user) {
          // Lưu profile
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: user.id,
              full_name: fullName,
              phone: phone,
              role: role,
            },
          ]);
          if (profileError) throw profileError;
          
          alert('✅ Đăng ký thành công!\nXin vui lòng kiểm tra Gmail để xác nhận tài khoản.\nSau khi xác nhận xong hãy quay lại đây để đăng nhập.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* --- THÊM PHẦN THÔNG BÁO XÁC NHẬN THÀNH CÔNG --- */}
        {(searchParams.get('confirmed') === 'true' || isEmailConfirmed) && (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-bold text-lg">🎉 Xác nhận Gmail thành công!</p>
                <p className="text-sm text-green-600">Bạn có thể đăng nhập ngay bây giờ.</p>
             </div>
        )}

        <h2 className="text-2xl font-bold text-center mb-6 text-[#2c3e50]">
          {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản Mới'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên</label>
                <input required type="text" className="w-full p-2 border rounded" 
                       value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input required type="text" className="w-full p-2 border rounded" 
                       value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bạn là ai?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" checked={role === 'customer'} onChange={() => setRole('customer')} />
                    Khách hàng
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" checked={role === 'staff'} onChange={() => setRole('staff')} />
                    Nhân viên Y tế
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required type="email" className="w-full p-2 border rounded" 
                   value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input required type="password" className="w-full p-2 border rounded" 
                   value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <Button disabled={loading} className="w-full bg-[#e67e22] hover:bg-[#d35400] text-white">
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#e67e22] font-bold hover:underline">
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;