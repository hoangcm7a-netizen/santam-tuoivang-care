import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

// Định nghĩa kiểu dữ liệu cho Hồ sơ
type Profile = {
  id: string;
  full_name: string;
  role: 'staff' | 'customer' | 'admin';
  phone: string | null;
  specialties: string | null;
  referral_code: string | null;
  referred_by: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | null;
  cccd_front_img: string | null;
  cccd_back_img: string | null;
  degree_img: string[] | null;
  wallet_balance: number | null;
};

// Tạo Context
const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signOut: () => void;
}>({ session: null, user: null, profile: null, signOut: () => {} });

// Provider bao bọc ứng dụng
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // 1. Kiểm tra phiên đăng nhập hiện tại khi vừa vào web
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    // 2. Lắng nghe sự thay đổi (Đăng nhập/Đăng xuất)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null); // Xóa hồ sơ nếu đăng xuất
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hàm lấy thông tin role từ bảng profiles
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để dùng nhanh ở các trang khác
export const useAuth = () => useContext(AuthContext);