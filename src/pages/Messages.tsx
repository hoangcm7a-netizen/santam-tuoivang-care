import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Send, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setMessages(data);
    setLoading(false);
  };

  if (!user) return <div className="pt-24 text-center">Vui lòng đăng nhập.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-28">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Send className="text-orange-500"/> Hộp thư hỗ trợ
            </h1>

            {loading ? (
                <p className="text-center text-gray-500">Đang tải tin nhắn...</p>
            ) : messages.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-500 mb-4">Bạn chưa gửi yêu cầu tư vấn nào.</p>
                    <Button asChild className="bg-[#e67e22] hover:bg-[#d35400]">
                        <Link to="/contact">Gửi yêu cầu ngay</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-800 text-lg">Yêu cầu tư vấn</span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${msg.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {msg.status === 'done' ? 'Đã hoàn tất' : 'Đang xử lý'}
                                </span>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 italic">"{msg.message}"</p>
                            
                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12}/> {new Date(msg.created_at).toLocaleString('vi-VN')}
                                </span>
                                
                                {/* NÚT VÀO PHÒNG CHAT */}
                                <Button asChild size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
                                    <Link to={`/chat/${msg.id}`}>
                                        <MessageCircle size={16} className="mr-2"/> Xem chi tiết & Chat
                                    </Link>
                                </Button>
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

export default Messages;