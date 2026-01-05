import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Users, CheckCircle } from "lucide-react";
import teamPhoto from "@/assets/team-photo.jpg";

const About = () => {
  const team = [
    { name: "Nguyễn Thị Thu Nga", role: "Trưởng nhóm", department: "Dược" },
    { name: "Trần Thị Minh Ánh", role: "Thành viên", department: "Điều Dưỡng" },
    { name: "Lê Thị Phương Anh", role: "Thành viên", department: "Y Tế" },
    { name: "Trương Thị Huyền", role: "Thành viên", department: "Y Tế" },
    { name: "Hoàng Huy", role: "Thành viên", department: "Công Nghệ Thông Tin" },
  ];

  const mentors = [
    { name: "GV Nguyễn Thị Hiền", role: "Cố vấn chuyên môn", org: "Trường CĐ Y tế Thanh Hóa" },
    { name: "ThS. Nguyễn Văn Hinh", role: "Chuyên gia Chuyển đổi số", org: "Cố vấn Công nghệ" },
  ];

  const steps = [
    "Gia đình Đăng ký",
    "Tư vấn & Đánh giá nhu cầu",
    "Nhận đề xuất NVYT",
    "Chọn NVYT phù hợp",
    "Đặt lịch chăm sóc",
    "Sử dụng dịch vụ",
    "Thanh toán",
    "Đánh giá dịch vụ",
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Về Dự Án An Tâm Tuổi Vàng
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Người Đồng Hành Đáng Tin Cậy Của Gia Đình Việt
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              Câu Chuyện Của Chúng Tôi
            </h2>
            <Card className="border-border">
              <CardContent className="p-8">
                <p className="text-lg text-foreground leading-relaxed mb-6">
                  Dự án được hình thành từ nỗi niềm trăn trở có thật của người sáng lập khi chứng kiến 
                  người thân gặp khó khăn trong việc chăm sóc ông nội bị bệnh mạn tính. Trong bối cảnh 
                  xã hội hiện đại, nhiều gia đình phải đối mặt với những thách thức tương tự.
                </p>
                <p className="text-lg text-foreground leading-relaxed">
                  Chúng tôi nhận thấy nhu cầu cấp thiết về một giải pháp an toàn, chuyên nghiệp và đáng 
                  tin cậy để kết nối gia đình với các nhân viên y tế có chuyên môn. Từ đó, An Tâm Tuổi Vàng 
                  ra đời với sứ mệnh mang lại sự an tâm cho hàng ngàn gia đình Việt Nam.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Tầm Nhìn</h3>
                <p className="text-foreground leading-relaxed">
                  Trở thành trung tâm hàng đầu Việt Nam về kết nối và cung cấp dịch vụ chăm sóc 
                  sức khỏe chuyên nghiệp tại nhà cho người cao tuổi, góp phần nâng cao chất lượng 
                  cuộc sống của người cao tuổi và gia đình Việt Nam.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Sứ Mệnh</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Cung cấp dịch vụ chất lượng cao, đáng tin cậy, và tiện lợi ngay tại nhà</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Giảm gánh nặng lo âu cho gia đình trong việc chăm sóc người thân cao tuổi</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Giúp người cao tuổi được hưởng tuổi già khỏe mạnh, an vui</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Đội Ngũ Sáng Lập
          </h2>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <img
                src={teamPhoto}
                alt="Đội ngũ An Tâm Tuổi Vàng"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-bold text-foreground">Nhóm Tác Giả</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Trường Cao đẳng Y tế Thanh Hóa
              </p>
              <div className="space-y-3">
                {team.map((member, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.role} - {member.department}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Mentors */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Cố Vấn Chuyên Môn
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {mentors.map((mentor, index) => (
                <Card key={index} className="border-border">
                  <CardContent className="p-6">
                    <div className="font-semibold text-lg text-foreground mb-2">{mentor.name}</div>
                    <div className="text-accent font-medium mb-1">{mentor.role}</div>
                    <div className="text-sm text-muted-foreground">{mentor.org}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Mô Hình Vận Hành
          </h2>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="border-border hover:border-accent transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground font-bold text-xl flex items-center justify-center mx-auto mb-3">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-foreground">{step}</p>
                    </CardContent>
                  </Card>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-accent/30 transform -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
