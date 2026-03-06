import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Send, ArrowLeft, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// KHAI BÁO KIỂU DỮ LIỆU
interface ContactInfo {
    id: string;
    name: string;
    message: string;
}

interface ChatMessage {
    id: string | number;
    contact_id?: string;
    sender_id: string;
    content: string;
    is_staff_reply: boolean;
    created_at?: string;
}

const ChatRoom = () => {
    const { id } = useParams<{ id: string }>();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const messagesRef = useRef<ChatMessage[]>([]);

    const fetchMessagesOnly = useCallback(async () => {
        if (!id) return;
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('contact_id', id)
            .order('created_at', { ascending: true });

        if (data) {
            if (JSON.stringify(data) !== JSON.stringify(messagesRef.current)) {
                setMessages(data as ChatMessage[]);
                messagesRef.current = data as ChatMessage[];
            }
        }
    }, [id]);

    const fetchChatData = useCallback(async () => {
        if (!id) return;
        const { data: contact } = await supabase.from('contacts').select('*').eq('id', id).single();
        setContactInfo(contact as ContactInfo);

        await fetchMessagesOnly();
        setLoading(false);
    }, [id, fetchMessagesOnly]);

    useEffect(() => {
        if (id) {
            fetchChatData();
            const interval = setInterval(fetchMessagesOnly, 3000);
            return () => clearInterval(interval);
        }
    }, [id, fetchChatData, fetchMessagesOnly]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !id) return;

        const optimisticMsg: ChatMessage = {
            id: Date.now(),
            sender_id: user.id,
            content: newMessage,
            is_staff_reply: profile?.role === 'staff' || profile?.role === 'admin'
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");

        try {
            const { error } = await supabase.from('chat_messages').insert([
                {
                    contact_id: id,
                    sender_id: user.id,
                    content: optimisticMsg.content,
                    is_staff_reply: optimisticMsg.is_staff_reply
                }
            ]);

            if (error) throw error;
            fetchMessagesOnly();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Gửi lỗi: " + err.message);
        }
    };

    if (loading) return <div className="pt-32 text-center text-gray-500">Đang tải cuộc trò chuyện...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navigation />

            <div className="container mx-auto px-4 pt-24 flex-1 flex flex-col max-w-3xl h-[calc(100vh-80px)]">

                <div className="bg-white p-4 rounded-t-xl shadow-sm border-b flex items-center gap-3 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-gray-800 text-lg truncate">
                            {profile?.role === 'customer' ? 'Hỗ trợ trực tuyến' : `Khách: ${contactInfo?.name || '...'}`}
                        </h2>
                        <p className="text-xs text-gray-500 truncate">
                            Mã đơn: #{contactInfo?.id?.slice(0, 8)}
                        </p>
                    </div>
                </div>

                <div className="flex-1 bg-white p-4 overflow-y-auto shadow-sm scrollbar-thin scrollbar-thumb-gray-300">

                    <div className="flex justify-center mb-6">
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-xs text-center max-w-[90%]">
                            <span className="text-orange-700 font-bold block mb-1">YÊU CẦU BAN ĐẦU</span>
                            <span className="text-gray-700 italic">"{contactInfo?.message}"</span>
                        </div>
                    </div>

                    {messages.length === 0 && (
                        <p className="text-center text-gray-400 text-sm mt-10">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</p>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${msg.is_staff_reply ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}>
                                        {msg.is_staff_reply ? <ShieldCheck size={14} /> : <User size={14} />}
                                    </div>
                                )}

                                <div className={`p-3 rounded-2xl max-w-[75%] text-sm shadow-sm break-words ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        )
                    })}

                    <div ref={scrollRef} />
                </div>

                <form onSubmit={handleSendMessage} className="bg-white p-3 rounded-b-xl shadow-lg border-t flex gap-2 shrink-0">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 focus-visible:ring-blue-500"
                    />
                    <Button type="submit" disabled={!newMessage.trim()} className="bg-[#e67e22] hover:bg-[#d35400] text-white">
                        <Send size={18} />
                    </Button>
                </form>

            </div>
        </div>
    );
};

export default ChatRoom;