import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Messages = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeChatters, setActiveChatters] = useState<Record<string, any[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
        fetchData();
        const channel = supabase
            .channel('messages_page_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
                fetchData();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchData = async () => {
      const { data: contactData } = await supabase
          .from('contacts')
          .select('*, assigned_staff:profiles(full_name)')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
      
      if (contactData) {
          setContacts(contactData);
          contactData.forEach(job => fetchChattersForJob(job.id));
      }
  };

  // --- HÀM MỚI: TÁCH QUÁ TRÌNH LẤY DỮ LIỆU ĐỂ TRÁNH LỖI ---
  const fetchChattersForJob = async (jobId: string) => {
      // BƯỚC 1: Lấy tất cả tin nhắn của Job này
      const { data: msgs } = await supabase
          .from('chat_messages')
          .select('sender_id, is_read')
          .eq('contact_id', jobId);

      if (msgs && msgs.length > 0) {
          const senderIds = new Set<string>();
          const unreadMap: Record<string, number> = {};

          msgs.forEach((msg: any) => {
              // Lọc ra những ID không phải là mình (tức là nhân viên/đối tác)
              if (msg.sender_id && msg.sender_id !== user?.id) {
                  senderIds.add(msg.sender_id);
                  
                  // Đếm tin chưa đọc
                  if (!msg.is_read) {
                      const key = `${jobId}_${msg.sender_id}`;
                      unreadMap[key] = (unreadMap[key] || 0) + 1;
                  }
              }
          });

          // BƯỚC 2: Lấy thông tin chi tiết của những người này từ bảng profiles
          if (senderIds.size > 0) {
              const { data: profiles } = await supabase
                  .from('profiles')
                  .select('id, full_name, role')
                  .in('id', Array.from(senderIds));
              
              if (profiles) {
                  setActiveChatters(prev => ({ ...prev, [jobId]: profiles }));
              }
          }
          
          setUnreadCounts(prev => ({ ...prev, ...unreadMap }));
      }
  };

  const getRoleLabel = (role: string) => {
      const r = role ? role.toLowerCase() : '';
      if (r === 'staff') return 'Nhân viên Y tế';
      if (r === 'admin') return 'Ban Quản Trị';
      return 'Khách hàng';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navigation />
      <div className="container mx-auto px-4 pt-28 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
            <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <MessageSquare /> Hộp thư hỗ trợ
            </h1>
        </div>

        <div className="space-y-6">
            {contacts.length === 0 && (
                <p className="text-center text-gray-400 py-10">Bạn chưa có yêu cầu tư vấn nào.</p>
            )}

            {contacts.map(c => {
                const staffList = activeChatters[c.id] || [];
                const isAssigned = !!c.assigned_staff_id;

                return (
                    <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-300 transition relative">
                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12}/> {new Date(c.created_at).toLocaleString()}
                                </span>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${c.status === 'done' ? 'bg-green-100 text-green-700' : isAssigned ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {c.status === 'done' ? 'Hoàn thành' : isAssigned ? 'Đang thực hiện' : 'Đang tìm người'}
                            </span>
                        </div>
                        
                        <p className="text-gray-600 italic mb-4 text-sm">"{c.message}"</p>
                        
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Danh sách nhân viên đang chat:</p>
                            
                            {staffList.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Chưa có tin nhắn nào.</p>
                            ) : (
                                staffList.map((staff: any) => {
                                    // Logic ẩn: Nếu đơn đã chốt cho người khác thì không hiện những người còn lại
                                    if (isAssigned && c.assigned_staff_id !== staff.id) return null;

                                    const unread = unreadCounts[`${c.id}_${staff.id}`] || 0;

                                    return (
                                        <Link 
                                            key={staff.id} 
                                            to={`/job-chat/${c.id}/${staff.id}`} 
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                                                        {staff.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {unread > 0 && (
                                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white animate-bounce">
                                                            {unread}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{staff.full_name}</p>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        {getRoleLabel(staff.role)}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <Button size="sm" variant="ghost" className="text-blue-600 group-hover:bg-blue-200">
                                                <MessageSquare size={16}/> Chat
                                            </Button>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default Messages;