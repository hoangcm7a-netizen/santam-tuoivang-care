import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { CalendarDays, FileVideo, Users, History, Phone } from "lucide-react";

const CustomerDashboard = () => {
  const { profile } = useAuth();

  const menuItems = [
    {
      title: "ĐẶT LỊCH NGAY",
      desc: "Tìm điều dưỡng chăm sóc",
      icon: <CalendarDays size={40} />,
      link: "/contact", // Dẫn đến trang đặt lịch
      color: "bg-orange-500",
      hover: "hover:bg-orange-600",
      span: "col-span-2", // Ô to nhất
    },
    {
      title: "HỒ SƠ NGƯỜI THÂN",
      desc: "Quản lý bệnh án & Thông tin",
      icon: <Users size={32} />,
      link: "/profile", // Dẫn đến trang quản lý hồ sơ
      color: "bg-blue-500",
      hover: "hover:bg-blue-600",
      span: "col-span-1",
    },
    {
      title: "HỘP THƯ HỖ TRỢ",
      desc: "Xem phản hồi từ bác sĩ",
      icon: <FileVideo size={32} />,
      link: "/messages",
      color: "bg-green-500",
      hover: "hover:bg-green-600",
      span: "col-span-1",
    },
    {
      title: "LỊCH SỬ & THANH TOÁN",
      desc: "Xem lại các ca đã đặt",
      icon: <History size={32} />,
      link: "/history", // (Trang này sẽ làm sau)
      color: "bg-purple-500",
      hover: "hover:bg-purple-600",
      span: "col-span-2 md:col-span-1", // Mobile thì to, PC thì nhỏ
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-28">
        {/* Header Chào mừng */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, {profile?.full_name}! 👋
          </h1>
          <p className="text-gray-500">Bạn muốn làm gì hôm nay?</p>
        </div>

        {/* Grid Menu (Các ô gạch) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className={`${item.span} ${item.color} ${item.hover} text-white rounded-2xl p-6 shadow-lg transition-transform transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px] relative overflow-hidden group`}
            >
              {/* Trang trí nền */}
              <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              <div className="relative z-10">
                <div className="mb-4 opacity-90">{item.icon}</div>
                <h3 className="text-xl font-bold uppercase leading-tight">{item.title}</h3>
                <p className="text-sm opacity-90 mt-1">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Nút Gọi Hỗ Trợ Khẩn Cấp (Nổi góc màn hình) */}
        <a 
            href="tel:0372054418"
            className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl animate-bounce hover:bg-red-700 flex items-center gap-2 z-50"
        >
            <Phone size={24} />
            <span className="font-bold hidden md:inline">GỌI HỖ TRỢ</span>
        </a>

      </div>
    </div>
  );
};

export default CustomerDashboard;