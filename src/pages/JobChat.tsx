import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Send, ArrowLeft, Briefcase, FileText, Lock, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    contact_id: string;
    content: string;
    created_at: string;
    is_staff_reply: boolean;
    is_read?: boolean;
}

interface JobInfo {
    id: string;
    name: string;
    assigned_staff_id: string | null;
    status: string;
    payment_status?: string;
}

interface PartnerInfo {
    id: string;
    full_name: string;
}

interface ContractOffer {
    type: string;
    price: number;
    service: string;
    commitment: string;
}

const JobChat = () => {
    const { jobId, partnerId } = useParams<{ jobId: string; partnerId: string }>();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
    const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    const [showContractForm, setShowContractForm] = useState(false);
    const [contractPrice, setContractPrice] = useState("");
    const [contractService, setContractService] = useState("");
    const [contractCommitment, setContractCommitment] = useState("");

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [signPassword, setSignPassword] = useState("");
    const [selectedContract, setSelectedContract] = useState<ContractOffer | null>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }, []);

    const markAsRead = useCallback(async () => {
        if (!user || !jobId || !partnerId) return;
        try {
            await supabase.from('chat_messages').update({ is_read: true })
                .eq('contact_id', jobId).eq('receiver_id', user.id).eq('sender_id', partnerId).eq('is_read', false);
        } catch (err) { console.error(err); }
    }, [user, jobId, partnerId]);

    const fetchJobInfo = useCallback(async () => {
        if (!jobId) return;
        const { data } = await supabase.from('contacts').select('id, name, assigned_staff_id, status, payment_status').eq('id', jobId).single();
        if (data) setJobInfo(data as JobInfo);
    }, [jobId]);

    const fetchPartnerInfo = useCallback(async () => {
        if (!partnerId) return;
        const { data } = await supabase.from('profiles').select('id, full_name').eq('id', partnerId).single();
        if (data) setPartnerInfo(data as PartnerInfo);
    }, [partnerId]);

    const fetchMessages = useCallback(async () => {
        if (!jobId || !user || !partnerId) return;
        const { data } = await supabase.from('chat_messages').select('*').eq('contact_id', jobId).order('created_at', { ascending: true });
        if (data) {
            const filtered = (data as Message[]).filter((msg: Message) =>
                (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
                (msg.sender_id === partnerId && msg.receiver_id === user.id)
            );
            setMessages(filtered);
            scrollToBottom();
        }
    }, [jobId, partnerId, user, scrollToBottom]);

    useEffect(() => {
        if (user && jobId && partnerId) {
            fetchJobInfo(); fetchPartnerInfo(); fetchMessages(); markAsRead();

            // 1. Lắng nghe tin nhắn mới
            const chatChannel = supabase.channel(`job_chat_${jobId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    (payload: Record<string, unknown>) => {
                        const newMsg = payload.new as Message;
                        if (newMsg.contact_id === jobId) {
                            const isRelevant = (newMsg.sender_id === partnerId && newMsg.receiver_id === user.id) ||
                                (newMsg.sender_id === user.id && newMsg.receiver_id === partnerId);
                            if (isRelevant && newMsg.sender_id !== user.id) {
                                setMessages(prev => [...prev, newMsg]);
                                scrollToBottom(); markAsRead();
                            }
                        }
                    }
                ).subscribe();

            // 2. Lắng nghe sự thay đổi của Đơn hàng (Cập nhật UI ngay lập tức không cần F5)
            const contactChannel = supabase.channel(`job_status_${jobId}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts', filter: `id=eq.${jobId}` },
                    (payload: Record<string, unknown>) => {
                        const updatedJob = payload.new as JobInfo;
                        setJobInfo(updatedJob); // Tự động cập nhật state UI
                    }
                ).subscribe();

            return () => {
                supabase.removeChannel(chatChannel);
                supabase.removeChannel(contactChannel);
            };
        }
    }, [user, jobId, partnerId, fetchJobInfo, fetchPartnerInfo, fetchMessages, markAsRead, scrollToBottom]);

    const handleSend = async (contentOverride?: string) => {
        const content = contentOverride || newMessage;
        if (!content.trim() || !user || !partnerId || !jobId) return;

        setNewMessage("");
        try {
            await supabase.from('chat_messages').insert({
                sender_id: user.id, receiver_id: partnerId, contact_id: jobId,
                content: content, is_staff_reply: profile?.role === 'staff'
            });
        } catch (err: unknown) { toast.error("Gửi tin nhắn thất bại"); }
    };

    const handleSendContract = () => {
        if (!contractPrice || !contractService || !contractCommitment) return toast.error("Vui lòng điền đủ thông tin hợp đồng");

        const contractData: ContractOffer = {
            type: "CONTRACT_OFFER",
            price: parseInt(contractPrice),
            service: contractService,
            commitment: contractCommitment
        };

        const contentString = `[CONTRACT_DATA]:::${JSON.stringify(contractData)}`;
        handleSend(contentString);
        setShowContractForm(false);
        setContractPrice(""); setContractService(""); setContractCommitment("");
    };

    const handleSignAndPay = async () => {
        if (!signPassword) return toast.error("Vui lòng nhập mật khẩu");
        if (!selectedContract || !user || !jobId) return;

        setLoading(true);
        try {
            // 1. Xác thực mật khẩu
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: signPassword
            });
            if (authError) throw new Error("Mật khẩu không chính xác!");

            // 2. Gọi Hàm tự động (RPC) để giao dịch an toàn (trừ khách, cộng nhân viên)
            const { error: rpcError } = await supabase.rpc('process_contract_payment', {
                job_id: jobId,
                staff_id: partnerId,
                contract_price: selectedContract.price,
                job_name: jobInfo?.name || 'Dịch vụ'
            });

            if (rpcError) {
                if (rpcError.message.includes('INSUFFICIENT_FUNDS')) {
                    throw new Error(`Số dư ví không đủ. Hợp đồng yêu cầu ${selectedContract.price.toLocaleString()}đ. Vui lòng nạp thêm tiền!`);
                }
                throw new Error("Lỗi giao dịch: " + rpcError.message);
            }

            // 3. Gửi tin nhắn thông báo
            await handleSend("✅ ĐẠI DIỆN HỆ THỐNG: Khách hàng đã ký hợp đồng và thanh toán thành công. Đơn hàng chính thức bắt đầu!");

            toast.success("Ký duyệt và thanh toán thành công!");
            setShowPasswordModal(false);
            setSignPassword("");

            // Force fetch lại lần nữa cho chắc ăn (dù realtime đã lo việc này)
            fetchJobInfo();

        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isCustomer = profile?.role === 'customer';
    const isStaff = profile?.role === 'staff';
    const isJobAssigned = jobInfo?.assigned_staff_id != null;
    const isAssignedToThisStaff = jobInfo?.assigned_staff_id === partnerId;

    const renderMessageContent = (msg: Message, isMe: boolean) => {
        if (msg.content.startsWith("[CONTRACT_DATA]::: ")) {
            msg.content = msg.content.replace("[CONTRACT_DATA]::: ", "[CONTRACT_DATA]:::");
        }

        if (msg.content.startsWith("[CONTRACT_DATA]:::")) {
            try {
                const jsonStr = msg.content.split(":::")[1];
                const contract = JSON.parse(jsonStr) as ContractOffer;

                return (
                    <div className={`w-full max-w-sm rounded-xl overflow-hidden shadow-md border ${isMe ? 'bg-white text-gray-800' : 'bg-orange-50 border-orange-200'}`}>
                        <div className={`p-3 font-bold flex items-center gap-2 ${isMe ? 'bg-gray-100' : 'bg-orange-600 text-white'}`}>
                            <FileText size={18} /> ĐỀ XUẤT HỢP ĐỒNG
                        </div>
                        <div className="p-4 space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Tổng chi phí</p>
                                <p className="text-xl font-bold text-orange-600">{contract.price.toLocaleString()} đ</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Dịch vụ cung cấp</p>
                                <p className="whitespace-pre-wrap">{contract.service}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1"><ShieldCheck size={14} /> Cam kết</p>
                                <p className="whitespace-pre-wrap italic text-gray-600">{contract.commitment}</p>
                            </div>

                            {/* Nút chỉ hiện khi CHƯA CHỐT ĐƠN */}
                            {isCustomer && !isJobAssigned && (
                                <Button
                                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold transition-all"
                                    onClick={() => {
                                        setSelectedContract(contract);
                                        setShowPasswordModal(true);
                                    }}
                                >
                                    <CheckCircle2 size={16} className="mr-2" /> Ký duyệt & Thanh toán
                                </Button>
                            )}

                            {/* Sẽ tự động hiện nhãn này lên ngay khi Khách bấm ký xong */}
                            {isJobAssigned && (
                                <div className="text-center p-2 mt-2 bg-green-100 text-green-700 font-bold rounded flex items-center justify-center gap-1 animate-in fade-in">
                                    <Lock size={14} /> Đã chốt hợp đồng
                                </div>
                            )}
                        </div>
                    </div>
                );
            } catch (e) {
                return <p><i>[Lỗi hiển thị hợp đồng]</i></p>;
            }
        }

        return (
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                {msg.content}
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden relative">
            <div className="shrink-0 z-40"><Navigation /></div>

            <div className="flex-1 flex flex-col pt-16 max-w-3xl mx-auto w-full h-full relative shadow-2xl bg-white border-x border-gray-100">

                <div className="shrink-0 bg-white p-3 border-b shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-0 h-8 w-8 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="text-gray-600" />
                        </Button>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {partnerInfo?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h1 className="font-bold text-gray-800 truncate">{partnerInfo?.full_name}</h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <Briefcase size={12} /> {jobInfo?.name}
                            </p>
                        </div>
                    </div>

                    {isJobAssigned && (
                        <div className={`mt-2 py-1 px-3 rounded text-center text-xs font-bold ${isAssignedToThisStaff ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isAssignedToThisStaff ? "✅ Đang hợp tác thực hiện đơn này" : "🔒 Đơn hàng đã được giao cho người khác"}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f7fb] scroll-smooth">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <div className="bg-gray-200 p-4 rounded-full mb-2"><Briefcase size={32} /></div>
                            <p className="text-sm">Bắt đầu trao đổi công việc...</p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {renderMessageContent(msg, isMe)}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-1" />
                </div>

                <div className="shrink-0 bg-white p-3 border-t">
                    {(!isJobAssigned || isAssignedToThisStaff) ? (
                        <div className="flex flex-col gap-2">
                            {isStaff && !isJobAssigned && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowContractForm(true)}
                                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 font-bold border-dashed"
                                >
                                    <FileText size={16} className="mr-2" /> Soạn Hợp Đồng Báo Giá
                                </Button>
                            )}

                            <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-xl border focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                                <Input
                                    value={newMessage}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none px-2 h-10"
                                    autoComplete="off"
                                />
                                <Button onClick={() => handleSend()} size="icon" className="bg-blue-600 hover:bg-blue-700 h-10 w-10 rounded-lg shrink-0 transition-transform active:scale-95">
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 text-xs py-2 bg-gray-50 rounded-lg">
                            Cuộc hội thoại đã kết thúc.
                        </div>
                    )}
                </div>
            </div>

            {showContractForm && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-orange-600"><FileText /> Soạn Hợp Đồng</h3>
                            <button onClick={() => setShowContractForm(false)} className="text-gray-400 hover:text-gray-800"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700">Giá trị hợp đồng (VNĐ)</label>
                                <Input type="number" placeholder="VD: 500000" value={contractPrice} onChange={e => setContractPrice(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700">Chi tiết dịch vụ sẽ làm</label>
                                <textarea
                                    className="w-full border rounded-md p-2 text-sm focus:ring-2 outline-none border-gray-300"
                                    rows={3} placeholder="Mô tả công việc..."
                                    value={contractService} onChange={e => setContractService(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700">Cam kết chất lượng</label>
                                <textarea
                                    className="w-full border rounded-md p-2 text-sm focus:ring-2 outline-none border-gray-300"
                                    rows={2} placeholder="Cam kết của bạn..."
                                    value={contractCommitment} onChange={e => setContractCommitment(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleSendContract} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                                Gửi Cho Khách Hàng
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <Lock size={24} />
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Xác thực bảo mật</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Vui lòng nhập mật khẩu tài khoản của bạn để xác nhận ký hợp đồng và thanh toán <b className="text-orange-600">{selectedContract?.price.toLocaleString()}đ</b>.
                        </p>

                        <Input
                            type="password"
                            placeholder="Nhập mật khẩu..."
                            className="mb-4 text-center"
                            value={signPassword}
                            onChange={e => setSignPassword(e.target.value)}
                        />

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>Hủy</Button>
                            <Button onClick={handleSignAndPay} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                {loading ? 'Đang xử lý...' : 'Xác nhận Ký'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default JobChat;