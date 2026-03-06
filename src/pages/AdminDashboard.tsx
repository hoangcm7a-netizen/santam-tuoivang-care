import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import {
    Users, FileText, DollarSign, Trash2, CheckCircle, Pencil, X,
    AlertTriangle, Send, UserCheck, MessageSquareReply, Clock,
    Award, Gift, Wallet, Plus, MapPin, Ban, QrCode, ArrowDownCircle, History, FileBadge, MessageSquare, MessageCircle, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

// ================= TYPES & INTERFACES =================
interface Profile {
    id: string;
    full_name: string;
    phone?: string;
    role: string;
    verification_status?: string;
    wallet_balance?: number;
    referred_by?: string;
    specialties?: string;
    cccd_front_img?: string | string[];
    cccd_back_img?: string | string[];
    degree_img?: string | string[];
    [key: string]: unknown;
}

interface Contact {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    message?: string;
    status: string;
    assigned_staff_id?: string;
    check_in_time?: string;
    check_in_img?: string;
    check_out_time?: string;
    check_out_img?: string;
    admin_reply?: string;
    assigned_staff?: { full_name: string };
}

interface Service {
    id: string;
    name: string;
    price: string;
    description?: string;
    requirements?: string;
}

interface ServiceRequest {
    id: string;
    staff_id: string;
    status: string;
    service?: { name: string } | { name: string }[];
    staff?: { id: string; full_name: string };
}

interface Transaction {
    id: string;
    user_id: string;
    sender_id?: string;
    amount: number;
    type: string;
    description?: string;
    created_at: string;
    receiver?: { full_name: string };
    sender?: { full_name: string };
}

interface ChatMessage {
    id: string;
    contact_id?: string;
    sender_id: string;
    receiver_id?: string;
    content: string;
    is_staff_reply: boolean;
    created_at: string;
}

interface CareLog {
    id: string;
    contact_id: string;
    video_url: string;
    created_at: string;
}

// ================= COMPONENT =================
const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'contacts' | 'services' | 'transactions' | 'chat'>('users');

    // --- DỮ LIỆU CÓ ĐỊNH DẠNG ---
    const [users, setUsers] = useState<Profile[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [staffList, setStaffList] = useState<Profile[]>([]);
    const [adminBalance, setAdminBalance] = useState(0);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

    // --- STATE CHAT ADMIN ---
    const [chatUsers, setChatUsers] = useState<Profile[]>([]);
    const [selectedChatUser, setSelectedChatUser] = useState<Profile | null>(null);
    const [adminChatMessages, setAdminChatMessages] = useState<ChatMessage[]>([]);
    const [adminChatInput, setAdminChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- STATE MODAL ---
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string, type: 'user' | 'contact' | 'service', title: string, message: string } | null>(null);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [addServiceModal, setAddServiceModal] = useState(false);
    const [newService, setNewService] = useState({ name: '', price: '', description: '', requirements: '' });
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [replyModal, setReplyModal] = useState<{ isOpen: boolean, contact: Contact } | null>(null);
    const [replyText, setReplyText] = useState("");
    const [inspectModal, setInspectModal] = useState<Contact | null>(null);
    const [jobLogs, setJobLogs] = useState<CareLog[]>([]);
    const [verifyModal, setVerifyModal] = useState<Profile | null>(null);
    const [bonusModal, setBonusModal] = useState<Profile | null>(null);
    const [bonusAmount, setBonusAmount] = useState("");
    const [bonusReason, setBonusReason] = useState("");
    const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean, id: string, name: string } | null>(null);
    const [depositModal, setDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [rejectReasonModal, setRejectReasonModal] = useState<{ isOpen: boolean, reqId: string, staffId: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [forwardModal, setForwardModal] = useState<{ isOpen: boolean, contact: Contact } | null>(null);
    const [transferStep, setTransferStep] = useState<'select' | 'otp'>('select');
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [transferReason, setTransferReason] = useState("");
    const [otpInput, setOtpInput] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");

    // BỌC CÁC HÀM BẰNG useCallback ĐỂ FIX LỖI EXHAUSTIVE-DEPS
    const fetchData = useCallback(async () => {
        if (activeTab === 'users') { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (data) setUsers(data as Profile[]); }
        if (activeTab === 'contacts') { const { data } = await supabase.from('contacts').select('*, assigned_staff:profiles(full_name)').order('created_at', { ascending: false }); if (data) setContacts(data as Contact[]); }
        if (activeTab === 'services') {
            const { data: svcs } = await supabase.from('services').select('*').order('created_at', { ascending: false }); if (svcs) setServices(svcs as Service[]);
            const { data: reqs } = await supabase.from('staff_services').select('*, staff:profiles(full_name, id), service:services(name)').order('created_at', { ascending: false }); if (reqs) setServiceRequests(reqs as ServiceRequest[]);
        }
        if (activeTab === 'transactions') { const { data } = await supabase.from('transactions').select('*, receiver:profiles!user_id(full_name), sender:profiles!sender_id(full_name)').order('created_at', { ascending: false }); if (data) setTransactions(data as Transaction[]); }
    }, [activeTab]);

    const fetchStaff = useCallback(async () => {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'staff');
        if (data) setStaffList(data as Profile[]);
    }, []);

    const fetchAdminBalance = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
        if (data) setAdminBalance(data.wallet_balance || 0);
    }, [user]);

    const fetchChatUsers = useCallback(async () => {
        const { data } = await supabase.from('chat_messages').select('sender_id, receiver_id, created_at, content').eq('is_staff_reply', true).order('created_at', { ascending: false });
        if (data) {
            const userIds = new Set<string>();
            data.forEach(msg => {
                if (msg.sender_id && msg.sender_id !== user?.id) userIds.add(msg.sender_id);
                if (msg.receiver_id && msg.receiver_id !== user?.id) userIds.add(msg.receiver_id);
            });
            if (userIds.size > 0) {
                const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(userIds));
                setChatUsers((profiles as Profile[]) || []);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        if (user) fetchAdminBalance();
        if (activeTab === 'contacts') fetchStaff();
        if (activeTab === 'chat') fetchChatUsers();
    }, [activeTab, user, fetchData, fetchAdminBalance, fetchStaff, fetchChatUsers]);

    useEffect(() => {
        if (activeTab === 'chat' && selectedChatUser) {
            const channel = supabase
                .channel('admin_chat')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    (payload: Record<string, unknown>) => {
                        const newMsg = payload.new as ChatMessage;
                        if (newMsg.sender_id === selectedChatUser.id || newMsg.receiver_id === selectedChatUser.id) {
                            setAdminChatMessages(prev => [...prev, newMsg]);
                        }
                    }
                )
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [selectedChatUser, activeTab]);

    const selectChatUser = async (staffUser: Profile) => {
        setSelectedChatUser(staffUser);
        const { data } = await supabase.from('chat_messages').select('*').or(`sender_id.eq.${staffUser.id},receiver_id.eq.${staffUser.id}`).order('created_at', { ascending: true });
        setAdminChatMessages((data as ChatMessage[]) || []);
    };

    const handleAdminSendChat = async () => {
        if (!adminChatInput.trim() || !selectedChatUser) return;
        try {
            const { data, error } = await supabase.from('chat_messages').insert({ sender_id: user?.id, receiver_id: selectedChatUser.id, content: adminChatInput, is_staff_reply: true }).select();
            if (error) throw error;
            if (data) setAdminChatMessages(prev => [...prev, data[0] as ChatMessage]);
            setAdminChatInput("");
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi gửi tin: " + err.message);
        }
    };

    const initiateTransfer = async (staffId: string) => {
        if (!transferReason) return toast.error("Vui lòng nhập lý do chuyển đơn!");
        setSelectedStaffId(staffId);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            const { error } = await supabase.from('admin_otps').insert({ admin_id: user?.id, code: code, expired_at: new Date(Date.now() + 5 * 60000).toISOString(), is_used: false });
            if (error) throw error;
            toast.info(`Mã xác thực đã gửi đến Email của bạn: ${code}`, { duration: 10000 });
            setGeneratedOtp(code);
            setTransferStep('otp');
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi tạo OTP: " + err.message);
        }
    };

    const confirmTransfer = async () => {
        if (!forwardModal || !selectedStaffId) return;
        if (otpInput !== generatedOtp) return toast.error("Mã xác thực không đúng hoặc đã hết hạn!");

        try {
            const { error } = await supabase.from('contacts')
                .update({ assigned_staff_id: selectedStaffId, status: 'processing', admin_note: `Admin chuyển đơn. Lý do: ${transferReason}` })
                .eq('id', forwardModal.contact.id);
            if (error) throw error;
            await supabase.from('admin_otps').update({ is_used: true }).eq('code', otpInput);
            await supabase.from('chat_messages').insert({
                sender_id: user?.id, receiver_id: selectedStaffId, is_staff_reply: false,
                content: `🔔 Bạn vừa được Admin chỉ định nhận đơn hàng "${forwardModal.contact.name}". Lý do: ${transferReason}. Vui lòng kiểm tra!`
            });

            toast.success("Chuyển đơn thành công!");
            setForwardModal(null); setTransferStep('select'); setTransferReason(""); setOtpInput("");
            fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const handleApproveRequest = async (req: ServiceRequest) => {
        try {
            const { error } = await supabase.from('staff_services').update({ status: 'approved', admin_note: 'Đã được duyệt bởi Admin' }).eq('id', req.id);
            if (error) throw error;
            const serviceName = Array.isArray(req.service) ? req.service[0]?.name : req.service?.name;
            await supabase.from('chat_messages').insert({ sender_id: user?.id, receiver_id: req.staff_id, is_staff_reply: false, content: `✅ Chúc mừng! Yêu cầu mở dịch vụ "${serviceName || 'này'}" của bạn đã được DUYỆT.` });
            toast.success("Đã duyệt!"); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const handleRejectRequest = async () => {
        if (!rejectReasonModal) return;
        try {
            const { error } = await supabase.from('staff_services').update({ status: 'rejected', admin_note: rejectReason }).eq('id', rejectReasonModal.reqId);
            if (error) throw error;
            await supabase.from('chat_messages').insert({ sender_id: user?.id, receiver_id: rejectReasonModal.staffId, is_staff_reply: false, content: `❌ Yêu cầu mở dịch vụ bị TỪ CHỐI. Lý do: ${rejectReason}.` });
            toast.error("Đã từ chối."); setRejectReasonModal(null); setRejectReason(""); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const handleDeposit = async () => {
        const amount = parseInt(depositAmount.replace(/\D/g, ''));
        if (!amount || amount <= 0) return toast.error("Số tiền không hợp lệ");
        try {
            const { error: updateErr } = await supabase.from('profiles').update({ wallet_balance: adminBalance + amount }).eq('id', user?.id);
            if (updateErr) throw updateErr;
            await supabase.from('transactions').insert([{ user_id: user?.id, sender_id: user?.id, amount: amount, type: 'deposit', description: 'Nạp tiền vào quỹ thưởng' }]);
            toast.success(`Đã nạp thành công ${amount.toLocaleString()} đ`); setDepositModal(false); setDepositAmount(""); await fetchAdminBalance(); await fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi nạp tiền: " + err.message);
        }
    };

    const handleGiveBonus = async () => {
        if (!bonusModal || !bonusAmount) return;
        const amount = parseInt(bonusAmount.replace(/\D/g, ''));
        if (amount <= 0 || amount > adminBalance) return toast.error("Số dư không đủ.");
        try {
            await supabase.from('profiles').update({ wallet_balance: adminBalance - amount }).eq('id', user?.id);
            await supabase.from('profiles').update({ wallet_balance: (bonusModal.wallet_balance || 0) + amount }).eq('id', bonusModal.id);
            await supabase.from('transactions').insert([{ user_id: bonusModal.id, sender_id: user?.id, amount: amount, type: 'bonus', description: bonusReason || 'Thưởng nóng từ Admin' }]);
            toast.success("Đã gửi thưởng thành công!"); setBonusModal(null); setBonusAmount(""); setBonusReason(""); await fetchData(); await fetchAdminBalance();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi: " + err.message);
        }
    };

    const handleDeleteClick = (item: { id: string, role?: string }, type: 'user' | 'contact' | 'service') => {
        if (type === 'user' && item.role === 'admin') return toast.error("Không thể xóa Admin!");
        setDeleteModal({ isOpen: true, id: item.id, type, title: 'Xác nhận xóa?', message: `Bạn chắc chắn muốn xóa ${type === 'service' ? 'dịch vụ' : type === 'contact' ? 'đơn này' : 'tài khoản'}?` });
    };

    const executeDelete = async () => {
        if (!deleteModal) return;
        try {
            if (deleteModal.type === 'user') await supabase.rpc('delete_user_by_admin', { user_id_to_delete: deleteModal.id });
            else if (deleteModal.type === 'contact') await supabase.from('contacts').delete().eq('id', deleteModal.id);
            else await supabase.from('services').delete().eq('id', deleteModal.id);
            toast.success("Đã xóa thành công!"); setDeleteModal(null); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const handleAddService = async () => {
        if (!newService.name || !newService.price) return toast.error("Vui lòng nhập tên và giá");
        try {
            const { error } = await supabase.from('services').insert([{ name: newService.name, price: newService.price, description: newService.description, requirements: newService.requirements }]);
            if (error) throw error; toast.success("Đã thêm dịch vụ!"); setAddServiceModal(false); setNewService({ name: '', price: '', description: '', requirements: '' }); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi: " + err.message);
        }
    };

    const handleUpdateService = async () => {
        if (!editingService) return;
        const { error } = await supabase.from('services').update({ name: editingService.name, price: editingService.price, description: editingService.description, requirements: editingService.requirements }).eq('id', editingService.id);
        if (error) toast.error(error.message); else { toast.success("Đã cập nhật!"); setEditingService(null); fetchData(); }
    };

    const handleApproveStaff = async () => {
        if (!verifyModal) return;
        try {
            const { error } = await supabase.from('profiles').update({ verification_status: 'verified' }).eq('id', verifyModal.id);
            if (error) throw error; toast.success("Đã duyệt HS"); setVerifyModal(null); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const executeRejectStaff = async () => {
        if (!rejectConfirm) return;
        try {
            await supabase.from('profiles').update({ verification_status: 'rejected' }).eq('id', rejectConfirm.id);
            toast.error("Đã từ chối HS"); setRejectConfirm(null); setVerifyModal(null); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        const { error } = await supabase.from('profiles').update({ full_name: editingUser.full_name, phone: editingUser.phone, role: editingUser.role }).eq('id', editingUser.id);
        if (error) toast.error(error.message); else { toast.success("Đã cập nhật"); setEditingUser(null); fetchData(); }
    };

    const getRecommendedStaff = (message?: string) => {
        if (!message || staffList.length === 0) return staffList;
        const lower = message.toLowerCase();
        return [...staffList].sort((a, b) => {
            const aM = a.specialties && lower.includes(a.specialties.toLowerCase()) ? 1 : 0;
            const bM = b.specialties && lower.includes(b.specialties.toLowerCase()) ? 1 : 0;
            return bM - aM;
        });
    };

    const handleReply = async () => {
        if (!replyModal || !replyText) return;
        try {
            await supabase.from('chat_messages').insert([{ contact_id: replyModal.contact.id, sender_id: user?.id, content: replyText, is_staff_reply: true }]);
            await supabase.from('contacts').update({ admin_reply: replyText, status: 'done' }).eq('id', replyModal.contact.id);
            toast.success("Đã gửi phản hồi!"); setReplyModal(null); setReplyText(""); fetchData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        }
    };

    const handleInspect = async (contact: Contact) => {
        setInspectModal(contact);
        const { data } = await supabase.from('care_logs').select('*').eq('contact_id', contact.id);
        setJobLogs((data as CareLog[]) || []);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            <Navigation />
            <div className="container mx-auto px-4 pt-28">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Trang Quản Trị (Admin) 🛡️</h1>
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:shadow-xl transition" onClick={() => setDepositModal(true)}>
                        <Wallet className="w-5 h-5" />
                        <span className="font-bold">Quỹ: {adminBalance.toLocaleString()} đ</span>
                        <div className="bg-white/20 hover:bg-white/30 p-1 rounded-full ml-2"><Plus size={16} /></div>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}><Users size={18} /> Tài khoản</button>
                    <button onClick={() => setActiveTab('contacts')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'contacts' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}><FileText size={18} /> Đơn Tư Vấn</button>
                    <button onClick={() => setActiveTab('services')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'services' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}><DollarSign size={18} /> Dịch Vụ</button>
                    <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}><MessageCircle size={18} /> Hỗ trợ (Chat)</button>
                    <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'transactions' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}><History size={18} /> Lịch sử GD</button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4 min-h-[400px]">
                    {activeTab === 'users' && (<div className="overflow-x-auto"> <table className="w-full text-left border-collapse"> <thead className="bg-gray-50 text-gray-600 text-sm"><tr><th className="p-3">Họ Tên</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Ví tiền</th><th className="p-3 text-right">Hành động</th></tr></thead> <tbody> {users.map(u => (<tr key={u.id} className="border-t hover:bg-gray-50"> <td className="p-3 font-medium">{u.full_name} {u.referred_by && <span className="block text-[10px] text-green-600 font-bold">GT bởi: {u.referred_by.slice(0, 6)}...</span>}</td> <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{u.role.toUpperCase()}</span></td> <td className="p-3">{u.verification_status === 'verified' ? <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Đã duyệt</span> : u.verification_status === 'rejected' ? <span className="text-red-600 text-xs font-bold flex items-center gap-1"><Ban size={12} /> Bị từ chối</span> : u.verification_status === 'pending' ? <span className="text-yellow-600 text-xs font-bold bg-yellow-100 px-2 py-1 rounded animate-pulse cursor-pointer" onClick={() => setVerifyModal(u)}>Chờ duyệt</span> : <span className="text-gray-400 text-xs">Chưa nộp HS</span>}</td> <td className="p-3 font-mono text-green-700 font-bold">{(u.wallet_balance || 0).toLocaleString()} đ</td> <td className="p-3 text-right flex justify-end gap-2">{u.role === 'staff' && (<>{u.verification_status === 'pending' && <Button size="sm" className="bg-green-600 h-8 px-2 text-xs" onClick={() => setVerifyModal(u)}>Duyệt HS</Button>}<Button size="sm" variant="outline" className="border-yellow-400 text-yellow-600 h-8 px-2" onClick={() => setBonusModal(u)}><Gift size={16} /></Button></>)}<Button size="sm" variant="ghost" onClick={() => setEditingUser(u)} className="h-8 w-8 p-0"><Pencil size={16} /></Button><Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => handleDeleteClick(u, 'user')}><Trash2 size={16} /></Button></td> </tr>))} </tbody> </table> </div>)}

                    {activeTab === 'contacts' && (<div className="space-y-4"> {contacts.length === 0 && <p className="text-center text-gray-400 py-10">Chưa có đơn nào.</p>} {contacts.map(c => (<div key={c.id} className={`p-4 rounded-lg border flex flex-col lg:flex-row justify-between gap-4 ${c.status === 'new' ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}> <div className="flex-1"> <h3 className="font-bold text-gray-800 flex items-center gap-2">{c.name} {c.status === 'new' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">MỚI</span>}</h3> <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin size={14} /> {c.address || "Chưa có địa chỉ"} | 📞 {c.phone}</p> <p className="mt-2 text-gray-800 bg-gray-50 p-2 rounded italic border">"{c.message}"</p> <div className="mt-2 flex gap-3 text-xs"> {c.assigned_staff ? <span className="text-blue-600 font-bold flex items-center gap-1"><UserCheck size={14} /> NV: {c.assigned_staff.full_name}</span> : <span className="text-orange-500 font-bold flex items-center gap-1">⚠ Chưa có người nhận (Đang treo trên sàn)</span>} {c.check_in_time && <span className="text-green-600 font-bold flex items-center gap-1"><Clock size={14} /> Đã Check-in</span>} {c.admin_reply && <span className="text-purple-600 font-bold flex items-center gap-1"><MessageSquareReply size={14} /> Đã trả lời</span>} </div> </div> <div className="flex flex-col gap-2 min-w-[140px]"> <Button size="sm" variant="secondary" className="w-full border" onClick={() => handleInspect(c)}><CheckCircle size={14} className="mr-2" /> Kiểm tra</Button> <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => { setForwardModal({ isOpen: true, contact: c }); setTransferStep('select'); }}><Send size={14} className="mr-2" /> Chuyển NV</Button> <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 w-full" onClick={() => setReplyModal({ isOpen: true, contact: c })}><MessageSquareReply size={14} className="mr-2" /> Phản hồi</Button> <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 w-full" onClick={() => handleDeleteClick(c, 'contact')}><Trash2 size={14} className="mr-2" /> Xóa</Button> </div> </div>))} </div>)}

                    {activeTab === 'services' && (<div> <div className="mb-8 border-b pb-8"> <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><FileBadge className="text-orange-600" /> Yêu cầu mở dịch vụ từ Nhân viên</h3> <div className="bg-white rounded-lg border overflow-hidden"> <table className="w-full text-left text-sm"> <thead className="bg-gray-50 text-gray-600"><tr><th className="p-3">Nhân viên</th><th className="p-3">Dịch vụ xin mở</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Xử lý</th></tr></thead> <tbody> {serviceRequests.filter(r => r.status === 'pending').length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">Không có yêu cầu nào đang chờ.</td></tr>)} {serviceRequests.map(req => (<tr key={req.id} className={`border-t ${req.status === 'pending' ? 'bg-yellow-50/50' : 'opacity-60'}`}> <td className="p-3 font-bold">{req.staff?.full_name}</td> <td className="p-3 text-blue-700">{Array.isArray(req.service) ? req.service[0]?.name : req.service?.name}</td> <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}</span></td> <td className="p-3 text-right"> {req.status === 'pending' && (<div className="flex justify-end gap-2"> <Button size="sm" onClick={() => { if (req.staff) setEditingUser({ ...req.staff, role: 'staff' }); }} variant="outline" className="h-7 text-xs">Xem Hồ sơ</Button> <Button size="sm" onClick={() => setRejectReasonModal({ isOpen: true, reqId: req.id, staffId: req.staff_id })} className="bg-red-500 hover:bg-red-600 h-7 text-xs">Từ chối</Button> <Button size="sm" onClick={() => handleApproveRequest(req)} className="bg-green-600 hover:bg-green-700 h-7 text-xs">Duyệt ngay</Button> </div>)} </td> </tr>))} </tbody> </table> </div> </div> <div className="flex justify-end mb-4"> <Button className="bg-green-600 hover:bg-green-700" onClick={() => setAddServiceModal(true)}> <Plus size={18} className="mr-2" /> Thêm Dịch Vụ Mới </Button> </div> <div className="grid md:grid-cols-2 gap-4"> {services.map(s => (<div key={s.id} className="border p-4 rounded-lg hover:shadow-md transition relative group bg-white"> <h3 className="font-bold text-lg text-blue-700">{s.name}</h3> <p className="text-xl font-bold text-gray-800 my-1">{s.price}</p> <p className="text-sm text-gray-500 mb-2">{s.description}</p> <div className="bg-orange-50 border border-orange-100 p-2 rounded text-xs text-orange-800 flex gap-2 items-start mt-2"> <FileBadge size={14} className="shrink-0 mt-0.5" /> <span><strong>Yêu cầu:</strong> {s.requirements || "Không có yêu cầu đặc biệt."}</span> </div> <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition"> <button onClick={() => setEditingService(s)} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Pencil size={16} /></button> <button onClick={() => handleDeleteClick(s, 'service')} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 size={16} /></button> </div> </div>))} </div> </div>)}

                    {activeTab === 'transactions' && (<div className="overflow-x-auto"> <table className="w-full text-left border-collapse"> <thead className="bg-gray-50 text-gray-600 text-sm"><tr><th className="p-3">Thời gian</th><th className="p-3">Loại</th><th className="p-3">Nội dung</th><th className="p-3">Người nhận</th><th className="p-3 text-right">Số tiền</th></tr></thead> <tbody> {transactions.map(tx => (<tr key={tx.id} className="border-t hover:bg-gray-50"> <td className="p-3 text-sm text-gray-500">{new Date(tx.created_at).toLocaleString()}</td> <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.type === 'deposit' ? 'bg-blue-100 text-blue-700' : tx.type === 'bonus' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}>{tx.type === 'deposit' ? 'Nạp quỹ' : tx.type === 'bonus' ? 'Thưởng nóng' : 'Khác'}</span></td> <td className="p-3 text-sm font-medium">{tx.description}</td> <td className="p-3 text-sm">{tx.type === 'deposit' ? 'Quỹ Admin' : (tx.receiver?.full_name || '...')}</td> <td className={`p-3 text-right font-mono font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} đ</td> </tr>))} </tbody> </table> </div>)}

                    {activeTab === 'chat' && (<div className="flex h-[500px] border rounded-lg overflow-hidden bg-white"> <div className="w-1/3 border-r flex flex-col bg-gray-50"> <div className="p-3 border-b font-bold text-gray-700">Hộp thư hỗ trợ</div> <div className="flex-1 overflow-y-auto"> {chatUsers.length === 0 && <p className="p-4 text-sm text-gray-400">Chưa có tin nhắn.</p>} {chatUsers.map(u => (<div key={u.id} onClick={() => selectChatUser(u)} className={`p-3 border-b cursor-pointer hover:bg-blue-50 transition flex items-center gap-3 ${selectedChatUser?.id === u.id ? 'bg-blue-100' : ''}`}> <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{u.full_name?.charAt(0)}</div> <div><p className="text-sm font-bold text-gray-800">{u.full_name}</p><p className="text-xs text-gray-500">{u.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}</p></div> </div>))} </div> </div> <div className="w-2/3 flex flex-col"> {selectedChatUser ? (<> <div className="p-3 border-b bg-white flex justify-between items-center shadow-sm"><span className="font-bold text-gray-800 flex items-center gap-2">Chat với: {selectedChatUser.full_name}</span><span className="text-xs text-green-600">● Đang kết nối</span></div> <div className="flex-1 p-4 overflow-y-auto bg-gray-100 space-y-3"> {adminChatMessages.map(msg => { const isMe = msg.sender_id === user?.id; return (<div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}> <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}> {msg.content} <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> </div> </div>) })} <div ref={chatEndRef} /> </div> <div className="p-3 bg-white border-t flex gap-2"> <Input value={adminChatInput} onChange={e => setAdminChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminSendChat()} placeholder="Nhập tin nhắn..." /> <Button onClick={handleAdminSendChat} className="bg-blue-600 hover:bg-blue-700"><Send size={18} /></Button> </div> </>) : (<div className="flex-1 flex items-center justify-center text-gray-400 flex-col"><MessageSquare size={48} className="mb-2 opacity-20" /><p>Chọn một nhân viên để bắt đầu chat</p></div>)} </div> </div>)}
                </div>
            </div>

            {forwardModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg">Chuyển đơn cho nhân viên</h3><button onClick={() => setForwardModal(null)}><X size={20} /></button></div>

                        {transferStep === 'select' ? (
                            <>
                                <p className="text-sm text-gray-500 mb-4">Nội dung đơn: <span className="italic">"{forwardModal.contact.message}"</span></p>
                                <Input value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="Nhập lý do chuyển đơn (Bắt buộc)..." className="mb-4" />
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {getRecommendedStaff(forwardModal.contact.message).map(staff => {
                                        const isRecommended = staff.specialties && forwardModal.contact.message?.toLowerCase().includes(staff.specialties.toLowerCase());
                                        return (
                                            <div key={staff.id} className={`p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50`}>
                                                <div>
                                                    <p className="font-bold text-gray-800 flex items-center gap-2">{staff.full_name} {isRecommended && <span className="bg-green-600 text-white text-[10px] px-2 rounded-full">Phù hợp</span>}</p>
                                                    <p className="text-xs text-gray-500">{staff.specialties || "Chưa cập nhật chuyên môn"}</p>
                                                </div>
                                                <Button size="sm" onClick={() => initiateTransfer(staff.id)}>Chọn & Gửi OTP</Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="bg-blue-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-blue-600"><Lock size={32} /></div>
                                <h4 className="font-bold text-lg mb-2">Xác thực chuyển đơn</h4>
                                <p className="text-sm text-gray-500 mb-6">Mã xác thực 6 số đã được gửi đến email Admin của bạn. Vui lòng nhập để tiếp tục.</p>
                                <Input
                                    value={otpInput}
                                    onChange={e => setOtpInput(e.target.value)}
                                    placeholder="Nhập mã OTP..."
                                    className="text-center text-2xl font-bold tracking-widest h-14 mb-4"
                                    maxLength={6}
                                />
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setTransferStep('select')} className="flex-1">Quay lại</Button>
                                    <Button onClick={confirmTransfer} className="flex-1 bg-green-600 hover:bg-green-700">Xác nhận Chuyển</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {rejectReasonModal && (<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-sm animate-in zoom-in-95"><h3 className="font-bold mb-2 text-red-600">Lý do từ chối?</h3><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="VD: Thiếu chứng chỉ hành nghề..." className="mb-4" /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRejectReasonModal(null)}>Hủy</Button><Button className="bg-red-600 hover:bg-red-700" onClick={handleRejectRequest}>Xác nhận Từ chối</Button></div></div></div>)}
            {addServiceModal && (<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg text-green-700 flex items-center gap-2"><Plus /> Thêm Dịch Vụ Mới</h3><button onClick={() => setAddServiceModal(false)}><X size={20} /></button></div><div className="space-y-4"><div><label className="text-sm font-medium">Tên dịch vụ *</label><Input value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="VD: Chăm sóc người già..." /></div><div><label className="text-sm font-medium">Giá tiền (VNĐ) *</label><Input value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="VD: 200.000 đ/giờ" /></div><div><label className="text-sm font-medium">Mô tả chi tiết</label><Textarea value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} rows={2} placeholder="Mô tả công việc..." /></div><div><label className="text-sm font-bold text-orange-700 flex items-center gap-1 mb-1"><FileBadge size={14} /> Điều kiện mở dịch vụ</label><Textarea value={newService.requirements} onChange={e => setNewService({ ...newService, requirements: e.target.value })} rows={3} placeholder="VD: Cần chứng chỉ điều dưỡng, Bằng tốt nghiệp loại Khá trở lên..." className="bg-orange-50/50 border-orange-200 focus:border-orange-400" /><p className="text-[11px] text-gray-500 mt-1">Nhân viên cần có các bằng cấp này trong hồ sơ để thực hiện dịch vụ.</p></div><Button onClick={handleAddService} className="w-full bg-green-600 hover:bg-green-700">Tạo Dịch Vụ</Button></div></div></div>)}
            {editingService && (<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg">Cập nhật Dịch vụ</h3><button onClick={() => setEditingService(null)}><X size={20} /></button></div><div className="space-y-4"><div><label className="text-sm font-medium">Tên dịch vụ</label><Input value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} /></div><div><label className="text-sm font-medium">Giá tiền</label><Input value={editingService.price} onChange={e => setEditingService({ ...editingService, price: e.target.value })} /></div><div><label className="text-sm font-medium">Mô tả</label><Textarea value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} rows={2} /></div><div><label className="text-sm font-bold text-orange-700 flex items-center gap-1 mb-1"><FileBadge size={14} /> Điều kiện mở dịch vụ</label><Textarea value={editingService.requirements || ''} onChange={e => setEditingService({ ...editingService, requirements: e.target.value })} rows={3} className="bg-orange-50/50 border-orange-200 focus:border-orange-400" /></div><Button onClick={handleUpdateService} className="w-full bg-green-600 hover:bg-green-700">Lưu Thay Đổi</Button></div></div></div>)}
            {depositModal && (<div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ArrowDownCircle className="text-green-600" /> Nạp tiền vào quỹ</h3><button onClick={() => setDepositModal(false)}><X size={20} /></button></div><div className="space-y-4 text-center"><div className="bg-gray-100 p-4 rounded-lg border flex flex-col items-center justify-center"><QrCode size={120} className="text-gray-800 mb-2" /><p className="text-xs text-gray-500">Quét mã để nạp tiền (Mô phỏng)</p></div><div><label className="text-xs font-bold text-gray-500 block text-left mb-1">Số tiền muốn nạp (VNĐ)</label><Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="VD: 1000000" className="font-mono font-bold text-lg text-center text-green-700" /></div><Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11" onClick={handleDeposit}>Xác nhận đã nạp</Button></div></div></div>)}
            {verifyModal && (<div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg text-green-700 flex items-center gap-2"><Award /> Duyệt Hồ Sơ: {verifyModal.full_name}</h3><button onClick={() => setVerifyModal(null)}><X size={20} /></button></div><div className="grid md:grid-cols-3 gap-4 mb-6">{['cccd_front_img', 'cccd_back_img', 'degree_img'].map((key, idx) => (<div key={idx} className="text-center"><p className="font-bold text-xs mb-2 uppercase">{key.replace('_img', '').replace('_', ' ')}</p>{(key === 'degree_img' ? (verifyModal[key] as string[]) || [] : [verifyModal[key] as string]).flat().map((img: string, i: number) => (img ? <img key={i} src={img} onClick={() => setPreviewImage(img)} className="h-32 w-full object-cover rounded border cursor-zoom-in hover:opacity-90 mb-2" /> : <div key={i} className="h-32 bg-gray-100 rounded flex items-center justify-center text-xs">Chưa có ảnh</div>))}</div>))}</div><div className="flex justify-end gap-3 border-t pt-4"><Button variant="outline" onClick={() => setVerifyModal(null)}>Để sau</Button><Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => setRejectConfirm({ isOpen: true, id: verifyModal.id, name: verifyModal.full_name })}><Ban className="mr-2" size={18} /> Từ chối</Button><Button className="bg-green-600 hover:bg-green-700 font-bold" onClick={handleApproveStaff}><CheckCircle className="mr-2" size={18} /> Xác nhận Duyệt</Button></div></div></div>)}
            {rejectConfirm && (<div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95"><div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Ban size={32} /></div><h3 className="text-xl font-bold text-gray-800 mb-2">Từ chối hồ sơ?</h3><p className="text-gray-600 mb-6 text-sm">Xác nhận từ chối hồ sơ của <b>{rejectConfirm.name}</b>? Nhân viên sẽ phải nộp lại.</p><div className="flex gap-3 justify-center"><Button variant="outline" onClick={() => setRejectConfirm(null)} className="w-full">Hủy</Button><Button onClick={executeRejectStaff} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">Từ chối ngay</Button></div></div></div>)}
            {bonusModal && (<div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-yellow-600 flex items-center gap-2"><Gift /> Thưởng cho {bonusModal.full_name}</h3><button onClick={() => setBonusModal(null)}><X size={20} /></button></div><div className="space-y-4"><div><label className="text-xs font-bold text-gray-500">Số tiền (VNĐ)</label><Input type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="VD: 500000" className="font-mono font-bold text-lg" /></div><div><label className="text-xs font-bold text-gray-500">Lý do</label><Textarea value={bonusReason} onChange={e => setBonusReason(e.target.value)} placeholder="VD: Thưởng thành tích..." rows={3} /></div><Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold" onClick={handleGiveBonus}>Gửi Thưởng</Button></div></div></div>)}
            {inspectModal && (<div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg">Kiểm tra: {inspectModal.name}</h3><button onClick={() => setInspectModal(null)}><X size={20} /></button></div><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4"><h4 className="font-bold text-blue-700 border-b pb-1">📸 Ảnh Chấm công</h4><div className="border p-3 rounded bg-green-50/30"><p className="text-xs font-bold text-green-700 mb-1">Check-in:</p>{inspectModal.check_in_time ? <><p className="text-xs mb-2">{new Date(inspectModal.check_in_time).toLocaleString()}</p><img src={inspectModal.check_in_img} onClick={() => setPreviewImage(inspectModal.check_in_img || null)} className="w-full h-32 object-cover rounded border cursor-zoom-in" /></> : <span className="text-gray-400 text-sm">Chưa có</span>}</div><div className="border p-3 rounded bg-orange-50/30"><p className="text-xs font-bold text-orange-700 mb-1">Check-out:</p>{inspectModal.check_out_time ? <><p className="text-xs mb-2">{new Date(inspectModal.check_out_time).toLocaleString()}</p><img src={inspectModal.check_out_img} onClick={() => setPreviewImage(inspectModal.check_out_img || null)} className="w-full h-32 object-cover rounded border cursor-zoom-in" /></> : <span className="text-gray-400 text-sm">Chưa có</span>}</div></div><div><h4 className="font-bold text-purple-700 border-b pb-1 mb-3">🎥 Video Báo cáo</h4><div className="space-y-3 h-[400px] overflow-y-auto">{jobLogs.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có video.</p>}{jobLogs.map(log => (<div key={log.id} className="border p-2 rounded bg-gray-50"><video src={log.video_url} controls className="w-full rounded bg-black h-40" /><p className="text-[10px] text-gray-500 mt-1">{new Date(log.created_at).toLocaleString()}</p></div>))}</div></div></div></div></div>)}
            {previewImage && (<div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}><img src={previewImage} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95" /><button className="absolute top-4 right-4 text-white hover:text-gray-300"><X size={32} /></button></div>)}
            {deleteModal && deleteModal.isOpen && (<div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95"><div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div><h3 className="text-xl font-bold mb-2">{deleteModal.title}</h3><p className="text-gray-600 mb-6 text-sm">{deleteModal.message}</p><div className="flex gap-3 justify-center"><Button variant="outline" onClick={() => setDeleteModal(null)} className="w-full">Hủy</Button><Button onClick={executeDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">Xóa Vĩnh Viễn</Button></div></div></div>)}
            {replyModal && (<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg">Phản hồi khách hàng</h3><button onClick={() => setReplyModal(null)}><X size={20} /></button></div><div className="space-y-4"><p className="text-sm text-gray-600">Khách hàng: <strong>{replyModal.contact.name}</strong></p><Textarea placeholder="Nhập nội dung..." rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReplyModal(null)}>Hủy</Button><Button className="bg-green-600 hover:bg-green-700" onClick={handleReply}>Lưu & Gửi</Button></div></div></div></div>)}
            {editingUser && (<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-lg">Sửa thông tin</h3><button onClick={() => setEditingUser(null)}><X size={20} /></button></div><div className="space-y-4"><div><label className="text-sm font-medium">Họ Tên</label><Input value={editingUser.full_name || ''} onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })} /></div><div><label className="text-sm font-medium">SĐT</label><Input value={editingUser.phone || ''} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} /></div><div><label className="text-sm font-medium">Vai trò</label><select className="w-full border rounded-md p-2 bg-white" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="admin">Admin</option></select></div><Button onClick={handleUpdateUser} className="w-full bg-blue-600 hover:bg-blue-700">Lưu Thay Đổi</Button></div></div></div>)}

        </div>
    );
};

export default AdminDashboard;