import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { Send, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// KHAI BÁO KIỂU DỮ LIỆU ĐỂ XÓA LỖI ANY
interface Message {
    id: string;
    sender_id: string;
    receiver_id: string | null;
    content: string;
    is_staff_reply: boolean;
    created_at: string;
}

const StaffChat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    // BỌC HÀM BẰNG useCallback ĐỂ SỬA LỖI MISSING DEPENDENCY
    const fetchMessages = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: true });
        if (data) setMessages(data as Message[]);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchMessages();
            const channel = supabase
                .channel('staff_chat_realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    (payload: Record<string, unknown>) => {
                        const newMsg = payload.new as Message;
                        if (newMsg.sender_id !== user.id && (newMsg.receiver_id === user.id || newMsg.receiver_id === null)) {
                            setMessages(prev => [...prev, newMsg]);
                        }
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user, fetchMessages]); // Đã thêm fetchMessages vào dependencies

    const handleSend = async () => {
        if (!newMessage.trim() || sending || !user) return;
        setSending(true);
        try {
            const { data, error } = await supabase.from('chat_messages').insert({
                sender_id: user.id,
                content: newMessage,
                is_staff_reply: true,
                receiver_id: null
            }).select();

            if (error) throw error;

            if (data && data.length > 0) {
                setMessages(prev => [...prev, data[0] as Message]);

                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
            }

            setNewMessage("");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi gửi tin: " + err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
            <Navigation />

            <div className="flex-1 container mx-auto px-4 pt-24 max-w-2xl flex flex-col h-[calc(100vh-80px)]">
                <div className="bg-white p-4 rounded-t-xl border-b shadow-sm flex items-center gap-3">
                    <Link to="/staff-dashboard" className="text-gray-500 hover:text-gray-800"><ArrowLeft /></Link>
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800">Ban Quản Trị (Admin)</h1>
                        <p className="text-xs text-green-600 flex items-center gap-1">● Trực tuyến</p>
                    </div>
                </div>

                <div className="flex-1 bg-gray-100 p-4 overflow-y-auto space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm mt-10">
                            <p>Chào bạn, đây là kênh hỗ trợ dành riêng cho Nhân viên.</p>
                            <p>Các thông báo xét duyệt dịch vụ cũng sẽ hiện ở đây.</p>
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSystemNoti = msg.content.includes("DUYỆT") || msg.content.includes("TỪ CHỐI");

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-blue-600 shrink-0"><ShieldCheck size={14} /></div>}

                                <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : isSystemNoti
                                            ? 'bg-yellow-50 border border-yellow-200 text-gray-800 rounded-bl-none'
                                            : 'bg-white text-gray-800 border rounded-bl-none'
                                    }`}>
                                    {isSystemNoti && <p className="font-bold text-xs text-orange-600 mb-1 uppercase">🔔 Thông báo hệ thống</p>}
                                    {msg.content}
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-white p-3 border-t rounded-b-xl flex gap-2 shadow-inner">
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1"
                        disabled={sending}
                    />
                    <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700 px-4">
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StaffChat;