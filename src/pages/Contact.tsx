import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Send, ArrowLeft, CheckCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// --- KHAI BÁO KIỂU DỮ LIỆU ĐỂ LOẠI BỎ HOÀN TOÀN "ANY" ---
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
}

interface PartnerInfo {
    id: string;
    full_name: string;
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

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
    }, []);

    const markAsRead = useCallback(async () => {
        if (!user || !jobId || !partnerId) return;
        try {
            const { error } = await supabase.from('chat_messages')
                .update({ is_read: true })
                .eq('contact_id', jobId)
                .eq('receiver_id', user.id)
                .eq('sender_id', partnerId)
                .eq('is_read', false);
            if (error) console.error("Lỗi đánh dấu đã đọc:", error);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
        }
    }, [user, jobId, partnerId]);

    const fetchJobInfo = useCallback(async () => {
        if (!jobId) return;
        try {
            const { data, error } = await supabase.from('contacts').select('id, name, assigned_staff_id, status').eq('id', jobId).single();
            if (error) throw error;
            if (data) setJobInfo(data as JobInfo);
        } catch (err: unknown) {
            if (err instanceof Error) console.error("Lỗi tải thông tin đơn:", err.message);
        }
    }, [jobId]);

    const fetchPartnerInfo = useCallback(async () => {
        if (!partnerId) return;
        try {
            const { data, error } = await supabase.from('profiles').select('id, full_name').eq('id', partnerId).single();
            if (error) throw error;
            if (data) setPartnerInfo(data as PartnerInfo);
        } catch (err: unknown) {
            if (err instanceof Error) console.error("Lỗi tải đối tác:", err.message);
        }
    }, [partnerId]);

    const fetchMessages = useCallback(async () => {
        if (!jobId || !user || !partnerId) return;
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('contact_id', jobId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                // Ép kiểu rõ ràng mảng data và định nghĩa kiểu cho msg trong vòng lặp filter
                const filtered = (data as Message[]).filter((msg: Message) => {
                    const isBetweenUs =
                        (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
                        (msg.sender_id === partnerId && msg.receiver_id === user.id);
                    return isBetweenUs;
                });
                setMessages(filtered);
                scrollToBottom();
            }
        } catch (err: unknown) {
            if (err instanceof Error) console.error("Lỗi tải tin nhắn:", err.message);
        }
    }, [jobId, partnerId, user, scrollToBottom]);

    useEffect(() => {
        if (user && jobId && partnerId) {
            fetchJobInfo();
            fetchPartnerInfo();
            fetchMessages();
            markAsRead();

            const channel = supabase
                .channel(`job_chat_${jobId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    // Xử lý triệt để biến payload ngầm định
                    (payload: Record<string, unknown>) => {
                        const newMsg = payload.new as Message;
                        if (newMsg.contact_id === jobId) {
                            const isRelevant =
                                (newMsg.sender_id === partnerId && newMsg.receiver_id === user.id) ||
                                (newMsg.sender_id === user.id && newMsg.receiver_id === partnerId);

                            if (isRelevant && newMsg.sender_id !== user.id) {
                                setMessages(prev => [...prev, newMsg]);
                                scrollToBottom();
                                markAsRead();
                            }
                        }
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user, jobId, partnerId, fetchJobInfo, fetchPartnerInfo, fetchMessages, markAsRead, scrollToBottom]);

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !partnerId || !jobId) return;

        const content = newMessage;
        setNewMessage("");

        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: user.id,
            receiver_id: partnerId,
            contact_id: jobId,
            content: content,
            created_at: new Date().toISOString(),
            is_staff_reply: profile?.role === 'staff'
        };

        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        try {
            const { error } = await supabase.from('chat_messages').insert({
                sender_id: user.id,
                receiver_id: partnerId,
                contact_id: jobId,
                content: content,
                is_staff_reply: profile?.role === 'staff'
            });

            if (error) throw error;
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(err.message);
                toast.error("Gửi lỗi, vui lòng thử lại");
            }
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleAcceptJob = async () => {
        if (!jobId || !partnerId || !user) return;
        if (!confirm(`Xác nhận giao việc cho nhân viên ${partnerInfo?.full_name}?`)) return;

        try {
            const { error } = await supabase.from('contacts').update({ assigned_staff_id: partnerId, status: 'processing' }).eq('id', jobId);
            if (error) throw error;

            await supabase.from('chat_messages').insert({
                sender_id: user.id,
                receiver_id: partnerId,
                contact_id: jobId,
                content: "✅ CHÚC MỪNG! Khách hàng đã chấp thuận bạn. Hợp đồng đã ký kết.",
                is_staff_reply: false
            });

            fetchJobInfo();
            toast.success("Đã giao việc thành công!");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi: " + err.message);
        }
    };

    const isCustomer = profile?.role === 'customer';
    const isJobAssigned = jobInfo?.assigned_staff_id != null;
    const isAssignedToThisStaff = jobInfo?.assigned_staff_id === partnerId;

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <div className="shrink-0 z-50">
                <Navigation />
            </div>

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

                        {isCustomer && !isJobAssigned && (
                            <Button onClick={handleAcceptJob} size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 h-8 shadow-sm">
                                <CheckCircle size={14} className="mr-1" /> Duyệt
                            </Button>
                        )}
                    </div>

                    {isJobAssigned && (
                        <div className={`mt-2 py-1 px-3 rounded text-center text-xs font-bold ${isAssignedToThisStaff ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isAssignedToThisStaff ? "✅ Đang hợp tác" : "🔒 Đã giao người khác"}
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
                                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}>
                                    {msg.content}
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-1" />
                </div>

                <div className="shrink-0 bg-white p-3 border-t">
                    {(!isJobAssigned || isAssignedToThisStaff) ? (
                        <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-xl border focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                            <Input
                                value={newMessage}
                                // Khai báo kiểu cho event Input Change
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                                // Khai báo kiểu cho event KeyDown
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none px-2 h-10"
                                autoComplete="off"
                            />
                            <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700 h-10 w-10 rounded-lg shrink-0 transition-transform active:scale-95">
                                <Send size={18} />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 text-xs py-2 bg-gray-50 rounded-lg">
                            Cuộc hội thoại đã kết thúc.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobChat;