import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  Stethoscope, 
  Utensils, 
  Activity, 
  Brain,
  Pill,
  Bandage,
  Users,
  Sparkles
} from "lucide-react";

const Services = () => {
  const serviceCategories = [
    {
      title: "Chăm Sóc Y Tế Cơ Bản & Nâng Cao",
      icon: <Stethoscope className="w-8 h-8" />,
      color: "bg-blue-500/10 text-blue-600",
      services: [
        { icon: <Heart className="w-5 h-5" />, text: "Theo dõi Dấu hiệu Sinh tồn (mạch, huyết áp...)" },
        { icon: <Pill className="w-5 h-5" />, text: "Quản lý và cho uống thuốc theo y lệnh" },
        { icon: <Bandage className="w-5 h-5" />, text: "Chăm sóc vết thương, vết loét do tì đè" },
        { icon: <Activity className="w-5 h-5" />, text: "Hỗ trợ sử dụng thiết bị y tế tại nhà" },
      ],
    },
    {
      title: "Hỗ Trợ Sinh Hoạt Hàng Ngày",
      icon: <Users className="w-8 h-8" />,
      color: "bg-green-500/10 text-green-600",
      services: [
        { icon: <Sparkles className="w-5 h-5" />, text: "Hỗ trợ vệ sinh cá nhân (tắm, thay tã)" },
        { icon: <Utensils className="w-5 h-5" />, text: "Hỗ trợ nấu ăn, ăn uống theo chế độ dinh dưỡng" },
        { icon: <Activity className="w-5 h-5" />, text: "Hỗ trợ di chuyển, thay đổi tư thế" },
      ],
    },
    {
      title: "Phục Hồi Chức Năng & Tinh Thần",
      icon: <Activity className="w-8 h-8" />,
      color: "bg-purple-500/10 text-purple-600",
      services: [
        { icon: <Activity className="w-5 h-5" />, text: "Tập Vật lý trị liệu cơ bản, xoa bóp, vận động nhẹ nhàng" },
        { icon: <Heart className="w-5 h-5" />, text: "Tâm sự, bầu bạn và giải trí (Đọc sách, chơi cờ)" },
      ],
    },
    {
      title: "Chăm Sóc Chuyên Biệt",
      icon: <Brain className="w-8 h-8" />,
      color: "bg-orange-500/10 text-orange-600",
      services: [
        { icon: <Brain className="w-5 h-5" />, text: "Chăm sóc người bệnh Alzheimer's và Parkinson" },
        { icon: <Activity className="w-5 h-5" />, text: "Chăm sóc sau đột quỵ" },
        { icon: <Heart className="w-5 h-5" />, text: "Chăm sóc bệnh nhân tiểu đường" },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Dịch Vụ Chăm Sóc Y Tế Tại Nhà Chuyên Biệt
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Danh Mục Dịch Vụ Đa Dạng - Kế Hoạch Chăm Sóc Cá Nhân Hóa
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {serviceCategories.map((category, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-4`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-2xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {category.services.map((service, serviceIndex) => (
                      <li key={serviceIndex} className="flex items-start gap-3">
                        <div className="mt-1 text-accent flex-shrink-0">
                          {service.icon}
                        </div>
                        <span className="text-foreground leading-relaxed">{service.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Quy Trình Sử Dụng Dịch Vụ
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Đơn giản, nhanh chóng và tiện lợi
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Đăng ký", desc: "Liên hệ với chúng tôi qua Website hoặc Hotline" },
                { step: "2", title: "Tư vấn", desc: "Đánh giá nhu cầu và đề xuất NVYT phù hợp" },
                { step: "3", title: "Chọn NVYT", desc: "Xem hồ sơ và chọn nhân viên y tế" },
                { step: "4", title: "Sử dụng", desc: "Đặt lịch và bắt đầu nhận dịch vụ" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary to-primary/90 border-none text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bạn cần tư vấn về dịch vụ phù hợp?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Đội ngũ chuyên viên của chúng tôi sẵn sàng tư vấn miễn phí để tìm ra giải pháp tốt nhất cho người thân của bạn
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl transition-colors"
              >
                Liên Hệ Tư Vấn Miễn Phí
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Services;
