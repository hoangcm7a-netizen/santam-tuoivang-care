import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { Wallet, History, Clock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// KHAI BÁO KIỂU DỮ LIỆU
interface Job {
    id: string;
    name: string;
    address: string;
    status: string;
    assigned_staff?: { full_name: string };
}

const CustomerDashboard = () => {
    const { user, profile } = useAuth();
    const [activeJobs, setActiveJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentBalance, setCurrentBalance] = useState(0);

    // Bọc hàm fetch vào useCallback để tránh lỗi missing dependency
    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('contacts')
            .select('*, assigned_staff:profiles(full_name)')
            .eq('user_id', user.id)
            .neq('status', 'done')
            .order('created_at', { ascending: false });

        if (data) setActiveJobs(data as Job[]);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) {
            setCurrentBalance(profile?.wallet_balance || 0);
            fetchDashboardData();

            const profileChannel = supabase.channel('dashboard_profile_changes')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                }, (payload: Record<string, unknown>) => {
                    // Loại bỏ ngầm định any bằng cách ép kiểu rõ ràng
                    const updatedProfile = payload.new as { wallet_balance: number };
                    setCurrentBalance(updatedProfile.wallet_balance);
                }).subscribe();

            return () => { supabase.removeChannel(profileChannel); };
        }
    }, [user, profile, fetchDashboardData]); // Đã thêm fetchDashboardData vào dependencies

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            <Navigation />

            <div className="bg-white pt-24 pb-6 px-4 shadow-sm border-b">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800">Xin chào, {profile?.full_name}! 👋</h1>
                    <p className="text-gray-500 text-sm mt-1">Hôm nay bạn cần hỗ trợ gì không?</p>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6 space-y-6">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-orange-100 text-sm font-medium flex items-center gap-2">
                            <Wallet size={16} /> Số dư ví hiện tại
                        </p>
                        <h2 className="text-4xl font-bold mt-2 mb-4">
                            {currentBalance.toLocaleString()} đ
                        </h2>
                        <Link to="/wallet">
                            <Button variant="secondary" size="sm" className="text-orange-700 bg-white hover:bg-gray-100 font-bold border-none">
                                <History size={16} className="mr-2" /> Quản lý Ví & Lịch sử
                            </Button>
                        </Link>
                    </div>
                    <Wallet size={120} className="absolute -right-6 -bottom-10 text-white/10 rotate-12" />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="text-blue-600" /> Đơn hàng đang xử lý
                        </h3>
                        <Link to="/contact">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8">
                                <Plus size={16} className="mr-1" /> Đặt lịch mới
                            </Button>
                        </Link>
                    </div>

                    {loading ? <p>Đang tải...</p> : activeJobs.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-dashed text-center">
                            <p className="text-gray-400 mb-2">Hiện không có đơn hàng nào đang thực hiện.</p>
                            <Link to="/contact" className="text-blue-600 font-bold hover:underline">Đặt lịch ngay &rarr;</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeJobs.map(job => (
                                <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-l-4 border-l-blue-500 hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{job.name}</h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {job.address}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Trạng thái: <span className="text-blue-600 font-bold">
                                                    {job.assigned_staff ? `Đang thực hiện bởi ${job.assigned_staff.full_name}` : 'Đang tìm người...'}
                                                </span>
                                            </p>
                                        </div>
                                        <Link to={`/messages`}>
                                            <Button variant="outline" size="sm">Chi tiết</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;