import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { Clock, MapPin, Video, Wallet, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const StaffDashboard = () => {
  const { user, profile } = useAuth();
  
  // State lưu danh sách đơn được giao
  const [assignedContacts, setAssignedContacts] = useState<any[]>([]);

  // Dữ liệu giả định cho Ca làm (Sau này bạn có thể thay bằng API thật nếu muốn)
  const todayTasks = [
    {
      id: 1,
      time: "08:00 - 10:00",
      customer: "Cụ Nguyễn Văn A",
      address: "123 Lê Lợi, TP Thanh Hóa",
      status: "pending", 
      notes: "Cụ bị lãng tai, cần nói to.",
    },
    {
      id: 2,
      time: "14:00 - 16:00",
      customer: "Bà Trần Thị B",
      address: "456 Quang Trung, TP Thanh Hóa",
      status: "pending",
      notes: "Nhớ nhắc bà uống thuốc huyết áp.",
    },
  ];

  // Tải danh sách đơn tư vấn được Admin giao cho nhân viên này
  useEffect(() => {
    if (user) {
        const fetchAssigned = async () => {
            const { data } = await supabase
                .from('contacts')
                .select('*')
                .eq('assigned_staff_id', user.id) // Lọc theo ID nhân viên
                .neq('status', 'done') // Chỉ hiện những đơn chưa hoàn tất
                .order('created_at', { ascending: false });
            
            if (data) setAssignedContacts(data);
        };
        fetchAssigned();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-28">
        
        {/* Header + Trạng thái */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Chào {profile?.full_name?.split(' ').pop()}! 👩‍⚕️
                </h1>
                <p className="text-sm text-gray-500">Chúc bạn một ngày làm việc hiệu quả.</p>
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> Đang nhận việc
            </div>
        </div>

        {/* --- KHU VỰC MỚI: HỘP THƯ TƯ VẤN ĐƯỢC GIAO --- */}
        <div className="mb-8">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Mail className="text-blue-500" /> Đơn tư vấn cần hỗ trợ ({assignedContacts.length})
            </h3>
            
            <div className="space-y-3">
                {assignedContacts.length === 0 && (
                    <p className="text-gray-400 italic text-sm bg-white p-4 rounded-xl border border-dashed text-center">
                        Chưa có đơn tư vấn nào được giao.
                    </p>
                )}
                
                {assignedContacts.map((c) => (
                    <div key={c.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center hover:shadow-md transition">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-gray-800 truncate">{c.name}</p>
                            <p className="text-xs text-gray-500 truncate">{c.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(c.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                            <Link to={`/chat/${c.id}`}> {/* Dẫn sang trang ChatRoom */}
                                <MessageCircle size={16} className="mr-2"/> Chat ngay
                            </Link>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
        {/* ------------------------------------------------ */}

        {/* Thống kê nhanh */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-2">
                <Wallet className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Thu nhập tháng này</span>
            </div>
            <h2 className="text-3xl font-bold">5.450.000 đ</h2>
            <p className="text-xs opacity-70 mt-1">Đã hoàn thành 12 ca chăm sóc</p>
        </div>

        {/* Danh sách công việc hôm nay (Ca làm) */}
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Clock className="text-orange-500" /> Ca làm hôm nay
        </h3>

        <div className="space-y-4">
            {todayTasks.map((task) => (
                <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between mb-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold font-mono">
                            {task.time}
                        </span>
                        <span className="text-orange-600 font-bold text-sm">Chưa bắt đầu</span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-800 mb-1">{task.customer}</h4>
                    
                    <div className="flex items-start gap-2 text-gray-500 text-sm mb-3">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        <span>{task.address}</span>
                    </div>

                    <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mb-4">
                        💡 <strong>Lưu ý:</strong> {task.notes}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full">
                            Check-in
                        </Button>
                        <Button asChild className="w-full bg-[#e67e22] hover:bg-[#d35400]">
                            <Link to="/test-video">
                                <Video className="w-4 h-4 mr-2" /> Báo cáo
                            </Link>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;