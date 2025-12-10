import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return;
    }

    // Phone validation (basic Vietnamese phone number)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }

    toast.success("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.");
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Điện Thoại",
      content: "0973861431",
      subtext: "Trần Thị Kiều Oanh",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      content: "oanhtrandht@gmail.com",
      subtext: "Phản hồi trong 24h",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Địa Chỉ",
      content: "Thanh Hóa, Việt Nam",
      subtext: "Trường CĐ Y tế Thanh Hóa",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Giờ Làm Việc",
      content: "8:00 - 20:00",
      subtext: "Thứ 2 - Chủ Nhật",
    },
  ];

  const supportChannels = [
    { icon: <Phone className="w-5 h-5" />, text: "Điện thoại" },
    { icon: <MessageSquare className="w-5 h-5" />, text: "Chat trực tuyến" },
    { icon: <Mail className="w-5 h-5" />, text: "Email" },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Bắt Đầu Hành Trình Chăm Sóc An Tâm Ngay Hôm Nay
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 text-accent">
                    {info.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
                  <p className="text-lg font-medium text-primary mb-1">{info.content}</p>
                  <p className="text-sm text-muted-foreground">{info.subtext}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form and Support */}
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-border">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Gửi Yêu Cầu Tư Vấn
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Họ và Tên *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập họ và tên của bạn"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Số Điện Thoại *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0912345678"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Nhu Cầu Chăm Sóc *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Mô tả ngắn về nhu cầu chăm sóc của bạn..."
                      className="mt-2 min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Gửi Yêu Cầu
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support Info */}
            <div>
              <Card className="border-border mb-6">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Kênh Hỗ Trợ Khách Hàng
                  </h3>
                  <div className="space-y-4 mb-6">
                    {supportChannels.map((channel, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          {channel.icon}
                        </div>
                        <span className="text-foreground font-medium">{channel.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Chúng tôi luôn sẵn sàng hỗ trợ bạn qua nhiều kênh khác nhau. 
                    Đội ngũ điều phối viên và quản lý ca của chúng tôi sẽ đảm bảo 
                    mọi yêu cầu của bạn được xử lý nhanh chóng và chuyên nghiệp.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-to-br from-accent/10 to-accent/5">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Cần Hỗ Trợ Khẩn Cấp?
                  </h3>
                  <p className="text-foreground mb-6">
                    Liên hệ ngay với hotline của chúng tôi để được hỗ trợ nhanh nhất
                  </p>
                  <a
                    href="tel:0973861431"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Gọi Ngay: 0973861431
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map or Additional Info */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Sẵn Sàng Mang Đến Sự An Tâm Cho Gia Đình Bạn
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Hãy để chúng tôi đồng hành cùng bạn trong hành trình chăm sóc người thân yêu. 
              Mỗi câu hỏi, mỗi yêu cầu của bạn đều quan trọng với chúng tôi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
