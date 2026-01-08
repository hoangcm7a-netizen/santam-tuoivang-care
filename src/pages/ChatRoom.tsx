import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Send, ArrowLeft, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ChatRoom = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [contactInfo, setContactInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Dùng Ref để so sánh dữ liệu cũ/mới (Tránh render lại nếu không có tin mới)
  const messagesRef = useRef<any[]>([]);

  useEffect(() => {
    if (id) {
        fetchChatData();
        // Tự động tải tin nhắn mới mỗi 3 giây
        const interval = setInterval(fetchMessagesOnly, 3000);
        return () => clearInterval(interval);
    }
  }, [id]);

  // --- LOGIC CUỘN MỚI: CHỈ CUỘN KHI CÓ TIN NHẮN ---
  useEffect(() => {
    if (messages.length > 0) {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Chỉ chạy khi danh sách tin nhắn thay đổi

  const fetchChatData = async () => {
    // 1. Lấy thông tin đơn tư vấn
    const { data: contact } = await supabase.from('contacts').select('*').eq('id', id).single();
    setContactInfo(contact);

    // 2. Lấy tin nhắn
    await fetchMessagesOnly();
    setLoading(false);
  };

  const fetchMessagesOnly = async () => {
    const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: true });
    
    if (data) {
        // --- KỸ THUẬT CHỐNG GIẬT ---
        // So sánh: Nếu dữ liệu mới KHÁC dữ liệu cũ thì mới cập nhật State
        if (JSON.stringify(data) !== JSON.stringify(messagesRef.current)) {
            setMessages(data);
            messagesRef.current = data; // Cập nhật bản sao để so sánh lần sau
        }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Gửi tin nhắn và cuộn xuống ngay lập tức (giả lập UX nhanh)
    const optimisticMsg = {
        id: Date.now(), // ID tạm
        sender_id: user?.id,
        content: newMessage,
        is_staff_reply: profile?.role === 'staff' || profile?.role === 'admin'
    };
    
    // Hiện tin nhắn ngay trên giao diện trước khi gửi server (cho mượt)
    setMessages(prev => [...prev, optimisticMsg]); 
    setNewMessage("");

    try {
        const { error } = await supabase.from('chat_messages').insert([
            {
                contact_id: id,
                sender_id: user?.id,
                content: optimisticMsg.content,
                is_staff_reply: optimisticMsg.is_staff_reply
            }
        ]);

        if (error) throw error;
        
        // Sau khi gửi thành công, tải lại dữ liệu thật từ server
        fetchMessagesOnly(); 
    } catch (err: any) {
        toast.error("Gửi lỗi: " + err.message);
    }
  };

  if (loading) return <div className="pt-32 text-center text-gray-500">Đang tải cuộc trò chuyện...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 flex-1 flex flex-col max-w-3xl h-[calc(100vh-80px)]">
        
        {/* Header Chat */}
        <div className="bg-white p-4 rounded-t-xl shadow-sm border-b flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
                <ArrowLeft size={20}/>
            </Button>
            <div className="overflow-hidden">
                <h2 className="font-bold text-gray-800 text-lg truncate">
                    {profile?.role === 'customer' ? 'Hỗ trợ trực tuyến' : `Khách: ${contactInfo?.name || '...'}`}
                </h2>
                <p className="text-xs text-gray-500 truncate">
                    Mã đơn: #{contactInfo?.id?.slice(0,8)}
                </p>
            </div>
        </div>

        {/* Nội dung Chat */}
        <div className="flex-1 bg-white p-4 overflow-y-auto shadow-sm scrollbar-thin scrollbar-thumb-gray-300">
            
            {/* Tin nhắn gốc */}
            <div className="flex justify-center mb-6">
                 <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-xs text-center max-w-[90%]">
                    <span className="text-orange-700 font-bold block mb-1">YÊU CẦU BAN ĐẦU</span>
                    <span className="text-gray-700 italic">"{contactInfo?.message}"</span>
                 </div>
            </div>

            {/* Các tin nhắn chat */}
            {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</p>
            )}

            {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                    <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${msg.is_staff_reply ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}>
                                {msg.is_staff_reply ? <ShieldCheck size={14}/> : <User size={14}/>}
                            </div>
                        )}
                        
                        <div className={`p-3 rounded-2xl max-w-[75%] text-sm shadow-sm break-words ${
                            isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                )
            })}
            
            {/* Điểm neo để cuộn xuống */}
            <div ref={scrollRef} />
        </div>

        {/* Ô nhập tin nhắn */}
        <form onSubmit={handleSendMessage} className="bg-white p-3 rounded-b-xl shadow-lg border-t flex gap-2 shrink-0">
            <Input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Nhập tin nhắn..." 
                className="flex-1 focus-visible:ring-blue-500"
            />
            <Button type="submit" disabled={!newMessage.trim()} className="bg-[#e67e22] hover:bg-[#d35400] text-white">
                <Send size={18}/>
            </Button>
        </form>

      </div>
    </div>
  );
};

export default ChatRoom;