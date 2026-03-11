import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { Clock, MapPin, Video, MessageCircle, CheckCircle, LogOut, Camera, Wallet, History, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { AttendanceModal } from "@/components/AttendanceModal";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import StaffJobMarket from "@/components/StaffJobMarket";

// KHAI BÁO KIỂU DỮ LIỆU ĐỂ XÓA LỖI ANY
interface Contact {
    id: string;
    name: string;
    address?: string;
    created_at: string;
    check_in_time?: string;
    check_out_time?: string;
}

interface Transaction {
    id: string;
    amount: number;
    type: string;
    description?: string;
    created_at: string;
}

const StaffDashboard = () => {
    const { user, profile } = useAuth();
    const [assignedContacts, setAssignedContacts] = useState<Contact[]>([]);

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const [attendanceModal, setAttendanceModal] = useState<{ isOpen: boolean, id: string, type: 'check-in' | 'check-out' } | null>(null);
    const [videoModal, setVideoModal] = useState<{ isOpen: boolean, id: string } | null>(null);

    // BỌC HÀM BẰNG useCallback
    const fetchAssigned = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('contacts').select('*').eq('assigned_staff_id', user.id).order('created_at', { ascending: false });
        if (data) setAssignedContacts(data as Contact[]);
    }, [user]);

    const fetchWalletInfo = useCallback(async () => {
        if (!user) return;
        const { data: profileData } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
        if (profileData) setBalance(profileData.wallet_balance || 0);

        const { data: transData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (transData) setTransactions(transData as Transaction[]);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAssigned();
            fetchWalletInfo();
        }
    }, [user, fetchAssigned, fetchWalletInfo]); // Đã thêm dependencies

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navigation />

            <div className="container mx-auto px-4 pt-28">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chào {profile?.full_name}! 👩‍⚕️</h1>
                        <p className="text-sm text-gray-500">Chúc bạn một ngày làm việc hiệu quả.</p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
                            <Wallet size={16} /> Số dư ví thu nhập
                        </p>
                        <h2 className="text-4xl font-bold mb-4">{balance.toLocaleString()} đ</h2>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                            onClick={() => setShowHistory(true)}
                        >
                            <History size={14} className="mr-2" /> Xem lịch sử giao dịch
                        </Button>
                    </div>
                </div>

                <Link to="/staff-chat" className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 hover:bg-blue-700 flex items-center gap-2">
                    <MessageCircle size={24} />
                    <span className="hidden md:inline">Chat với Admin</span>
                </Link>

                <StaffJobMarket />

                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="text-orange-500" /> Việc cần làm hôm nay
                </h3>

                <div className="space-y-4">
                    {assignedContacts.map((c) => {
                        const isCheckedIn = !!c.check_in_time;
                        const isCheckedOut = !!c.check_out_time;

                        return (
                            <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold font-mono flex items-center gap-1">
                                        <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCheckedOut ? 'bg-green-100 text-green-700' : isCheckedIn ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {isCheckedOut ? 'Đã hoàn thành' : isCheckedIn ? 'Đang làm việc' : 'Chưa bắt đầu'}
                                    </span>
                                </div>

                                <h4 className="text-lg font-bold text-gray-800 mb-1">{c.name}</h4>
                                <div className="flex items-start gap-2 text-gray-500 text-sm mb-4">
                                    <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
                                    <span>{c.address || "Địa chỉ chưa cập nhật"}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button asChild variant="outline" className="w-full col-span-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                                        <Link to={`/chat/${c.id}`}><MessageCircle className="w-4 h-4 mr-2" /> Trao đổi với khách</Link>
                                    </Button>

                                    {!isCheckedIn ? (
                                        <Button className="w-full col-span-2 bg-green-600 hover:bg-green-700 py-6"
                                            onClick={() => setAttendanceModal({ isOpen: true, id: c.id, type: 'check-in' })}>
                                            <Camera className="w-5 h-5 mr-2" /> Bắt đầu ca (Check-in)
                                        </Button>
                                    ) : !isCheckedOut ? (
                                        <>
                                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                                onClick={() => setVideoModal({ isOpen: true, id: c.id })}>
                                                <Video className="w-4 h-4 mr-2" /> Nộp Video
                                            </Button>
                                            <Button variant="destructive" className="w-full"
                                                onClick={() => setAttendanceModal({ isOpen: true, id: c.id, type: 'check-out' })}>
                                                <LogOut className="w-4 h-4 mr-2" /> Kết thúc ca
                                            </Button>
                                        </>
                                    ) : (
                                        <Button disabled variant="secondary" className="w-full col-span-2 bg-gray-100 text-gray-400">
                                            <CheckCircle className="w-4 h-4 mr-2" /> Ca làm đã đóng
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showHistory && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md p-0 animate-in zoom-in-95 relative max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">

                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <History className="text-blue-600" /> Lịch sử biến động số dư
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-white">
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Wallet className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Chưa có giao dịch nào.</p>
                                </div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-full mt-1 ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm line-clamp-2">
                                                    {tx.description || (tx.type === 'bonus' ? 'Thưởng nóng' : 'Giao dịch khác')}
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(tx.created_at).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`font-mono font-bold text-sm whitespace-nowrap ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} đ
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {attendanceModal && (
                <AttendanceModal
                    isOpen={true} onClose={() => setAttendanceModal(null)}
                    contactId={attendanceModal.id} type={attendanceModal.type}
                    onSuccess={fetchAssigned}
                />
            )}
            {videoModal && (
                <VideoUploadModal
                    isOpen={true} onClose={() => setVideoModal(null)}
                    contactId={videoModal.id} staffId={user?.id || ''}
                />
            )}
        </div>
    );
};

export default StaffDashboard;