import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, Smartphone, Users, Heart, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-home.jpg";
import elderlyHappy from "@/assets/elderly-happy.jpg";

const Home = () => {
  const features = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "Chuyên Môn Đảm Bảo",
      description: "Chỉ kết nối NVYT (Điều dưỡng, KTV Vật lý Trị liệu) có bằng cấp, kinh nghiệm rõ ràng",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Xác Minh Nghiêm Ngặt",
      description: "Quy trình tuyển chọn, kiểm tra hồ sơ và lý lịch tư pháp chặt chẽ",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Công Nghệ Tiện Lợi",
      description: "Đặt lịch, theo dõi lịch trình, thanh toán và đánh giá dịch vụ dễ dàng qua Website/App",
    },
  ];

  const values = [
    "Người cao tuổi được hưởng tuổi già khỏe mạnh, an vui trong chính ngôi nhà của mình",
    "Giảm gánh nặng lo âu cho gia đình trong việc chăm sóc người thân",
    "Kết nối nhanh chóng với đội ngũ chuyên nghiệp đã qua xác minh",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Heart className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground">Dịch Vụ Chăm Sóc Chuyên Nghiệp</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Chăm sóc Y tế Chuyên biệt Tại Nhà – An Tâm Trọn Vẹn
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
              Nền tảng kết nối gia đình với đội ngũ Nhân viên Y tế (NVYT) đã qua xác minh chuyên môn và 
              lý lịch nghiêm ngặt, mang lại chất lượng sống tốt nhất cho người cao tuổi.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="secondary" className="text-base font-semibold">
                <Link to="/services">Khám phá Dịch vụ</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50">
                <Link to="/about">Tìm hiểu về Chúng tôi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Khác Biệt Cốt Lõi - Nền Tảng của Sự An Tâm
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chúng tôi cam kết mang đến dịch vụ chăm sóc chất lượng cao với đội ngũ chuyên nghiệp
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 text-accent">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Kiến Tạo Cầu Nối Của Niềm Tin Và Chuyên Môn
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Giải quyết nỗi lo của hàng ngàn gia đình Việt Nam đang đối mặt với thách thức chăm sóc 
                người thân cao tuổi trong nhịp sống hiện đại.
              </p>
              
              <div className="space-y-4">
                {values.map((value, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <Button asChild size="lg" className="mt-8">
                <Link to="/about">Tìm hiểu thêm về chúng tôi</Link>
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={elderlyHappy}
                  alt="Người cao tuổi hạnh phúc"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-accent rounded-2xl p-6 shadow-xl max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8 text-accent-foreground" />
                  <div className="text-3xl font-bold text-accent-foreground">1000+</div>
                </div>
                <p className="text-sm text-accent-foreground/80 font-medium">
                  Gia đình tin tưởng sử dụng dịch vụ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Sẵn sàng bắt đầu hành trình chăm sóc an tâm?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Liên hệ với chúng tôi ngay hôm nay để được tư vấn miễn phí và tìm hiểu về gói dịch vụ phù hợp
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base font-semibold">
            <Link to="/contact">Liên Hệ Ngay</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
