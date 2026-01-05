import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, MessageSquare, Lock, User, PlusCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Import Supabase để lấy hồ sơ

// Định nghĩa kiểu dữ liệu Hồ sơ bệnh nhân
type Patient = {
  id: string;
  full_name: string;
  dob: string;
  pathology: string;
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  
  const { user, profile } = useAuth(); // Lấy thêm profile để check role
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // --- STATE MỚI CHO TÍNH NĂNG CHỌN HỒ SƠ ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // 1. Tải danh sách hồ sơ khi người dùng vào trang (Nếu là khách hàng)
  useEffect(() => {
    if (user && profile?.role === 'customer') {
      const fetchPatients = async () => {
        setLoadingPatients(true);
        const { data, error } = await supabase
          .from('patient_records')
          .select('*')
          .eq('user_id', user.id);
        
        if (!error && data) {
          setPatients(data);
        }
        setLoadingPatients(false);
      };
      fetchPatients();
    }
  }, [user, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check đăng nhập
    if (!user) {
        setShowLoginModal(true);
        return;
    }

    // Validation cơ bản
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      toast.error("Vui lòng điền đầy đủ thông tin liên hệ");
      return;
    }

    // --- LOGIC MỚI: BẮT BUỘC CHỌN HỒ SƠ (Nếu là khách hàng và có hồ sơ) ---
    if (profile?.role === 'customer') {
        if (patients.length > 0 && !selectedPatientId) {
            toast.error("Vui lòng chọn 1 hồ sơ người cần chăm sóc bên dưới!");
            // Scroll xuống chỗ chọn hồ sơ để nhắc user (tuỳ chọn)
            return;
        }
    }

    // Validation Email/Phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }

    // --- GỬI DỮ LIỆU ---
    // Ở đây bạn có thể thêm logic lưu vào Database (bảng bookings/contacts)
    // Bao gồm cả selectedPatientId
    console.log("Gửi yêu cầu:", { ...formData, patient_id: selectedPatientId });

    toast.success("Đã gửi yêu cầu thành công! Chúng tôi sẽ liên hệ để tư vấn cho hồ sơ bạn đã chọn.");
    
    // Reset form
    setFormData({ name: "", email: "", phone: "", message: "" });
    setSelectedPatientId(null);
  };

  // ... (Giữ nguyên mảng contactInfo và supportChannels như code cũ) ...
  const contactInfo = [
    { icon: <Phone className="w-6 h-6" />, title: "Điện Thoại", content: "0372054418", subtext: "Nguyễn Thị Thu Nga" },
    { icon: <Mail className="w-6 h-6" />, title: "Email", content: "ntthunga3@gmail.com", subtext: "Phản hồi trong 24h" },
    { icon: <MapPin className="w-6 h-6" />, title: "Địa Chỉ", content: "Thanh Hóa, Việt Nam", subtext: "Trường CĐ Y tế Thanh Hóa" },
    { icon: <Clock className="w-6 h-6" />, title: "Giờ Làm Việc", content: "8:00 - 20:00", subtext: "Thứ 2 - Chủ Nhật" },
  ];
  const supportChannels = [
    { icon: <Phone className="w-5 h-5" />, text: "Điện thoại" },
    { icon: <MessageSquare className="w-5 h-5" />, text: "Chat trực tuyến" },
    { icon: <Mail className="w-5 h-5" />, text: "Email" },
  ];

  return (
    <div className="min-h-screen pt-20 relative">
      
      {/* Modal Yêu cầu đăng nhập */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}></div>
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative z-10 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-5">
                 <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Yêu cầu đăng nhập</h3>
              <p className="text-gray-600 mb-8 text-sm">Bạn cần đăng nhập để gửi yêu cầu và chọn hồ sơ người thân.</p>
              <div className="flex gap-3 justify-center">
                 <Button variant="outline" onClick={() => setShowLoginModal(false)} className="w-full">Để sau</Button>
                 <Button className="bg-[#e67e22] hover:bg-[#d35400] text-white w-full" onClick={() => navigate('/auth')}>Đăng nhập ngay</Button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">Liên Hệ & Đặt Lịch</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">Chúng tôi luôn sẵn sàng lắng nghe và phục vụ</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 text-accent">{info.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
                  <p className="text-lg font-medium text-primary mb-1">{info.content}</p>
                  <p className="text-sm text-muted-foreground">{info.subtext}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-border shadow-md">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Gửi Yêu Cầu Tư Vấn</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Các input thông tin liên hệ */}
                  <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Họ và Tên *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Tên của bạn" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Số Điện Thoại *</Label>
                        <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="09xxx" className="mt-2" />
                      </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="message">Nhu Cầu Chăm Sóc *</Label>
                    <Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Mô tả nhu cầu..." className="mt-2 min-h-[100px]" />
                  </div>

                  {/* --- PHẦN CHỌN HỒ SƠ NGƯỜI THÂN (MỚI) --- */}
                  {user && profile?.role === 'customer' && (
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-500"/> Chọn hồ sơ người cần chăm sóc
                            </Label>
                            <Link to="/profile" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <PlusCircle className="w-3 h-3"/> Quản lý/Thêm mới
                            </Link>
                        </div>

                        {loadingPatients ? (
                            <p className="text-sm text-gray-500 text-center py-2">Đang tải hồ sơ...</p>
                        ) : patients.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {patients.map((p) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setSelectedPatientId(p.id)}
                                        className={`cursor-pointer p-3 rounded-lg border transition-all relative ${
                                            selectedPatientId === p.id 
                                            ? "bg-orange-50 border-orange-500 ring-1 ring-orange-500" 
                                            : "bg-white border-gray-200 hover:border-orange-300"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedPatientId === p.id ? "bg-orange-200 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{p.full_name}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{p.pathology || "Không có bệnh lý nền"}</p>
                                            </div>
                                        </div>
                                        {selectedPatientId === p.id && (
                                            <div className="absolute top-2 right-2 text-orange-600">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500 mb-2">Bạn chưa có hồ sơ người thân nào.</p>
                                <Button asChild variant="outline" size="sm">
                                    <Link to="/profile">Tạo hồ sơ ngay</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                  )}
                  {/* --------------------------------------- */}

                  <Button type="submit" className="w-full h-12 text-lg font-semibold bg-[#e67e22] hover:bg-[#d35400] shadow-md">
                    Gửi Yêu Cầu Tư Vấn
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support Info (Giữ nguyên) */}
            <div>
              <Card className="border-border mb-6">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6">Kênh Hỗ Trợ</h3>
                  <div className="space-y-4 mb-6">
                    {supportChannels.map((channel, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">{channel.icon}</div>
                        <span className="text-foreground font-medium">{channel.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground">Chúng tôi luôn sẵn sàng hỗ trợ bạn qua nhiều kênh khác nhau.</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-to-br from-accent/10 to-accent/5">
                <CardContent className="p-8">
                   <h3 className="text-xl font-bold text-foreground mb-4">Cần Hỗ Trợ Khẩn Cấp?</h3>
                   <a href="tel:0372054418" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg w-full">
                     <Phone className="w-5 h-5" /> Gọi: 0372054418
                   </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;