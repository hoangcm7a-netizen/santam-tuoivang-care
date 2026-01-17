import { Link } from "react-router-dom";
import { Heart, Phone, Mail, MapPin, User } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Heart className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="font-bold text-lg">An Tâm Tuổi Vàng</div>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Chăm sóc Y tế Chuyên biệt Tại Nhà – An Tâm Trọn Vẹn
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Liên Kết Nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Dịch Vụ
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Liên Hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Dịch Vụ</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>Chăm Sóc Y Tế</li>
              <li>Hỗ Trợ Sinh Hoạt</li>
              <li>Phục Hồi Chức Năng</li>
              <li>Chăm Sóc Chuyên Biệt</li>
            </ul>
          </div>

          {/* Contact Info - CHỈNH SỬA PHẦN NÀY */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Đội Ngũ Phát Triển</h3>
            <div className="flex flex-col gap-6">
              
              {/* Người thứ 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-accent">
                    <User className="w-4 h-4" />
                    <span>HHOANG2502</span>
                </div>
                <ul className="space-y-1 text-sm pl-6 border-l-2 border-primary-foreground/10">
                  <li className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-primary-foreground/70" />
                    <span className="text-primary-foreground/80">0917025861</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-primary-foreground/70" />
                    <span className="text-primary-foreground/80">hoangcm7a@gmail.com</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-accent">
                    <User className="w-4 h-4" />
                    <span>Lê Duy Chúc</span>
                </div>
                <ul className="space-y-1 text-sm pl-6 border-l-2 border-primary-foreground/10">
                  <li className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-primary-foreground/70" />
                    <span className="text-primary-foreground/80">0856935690</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-primary-foreground/70" />
                    <span className="text-primary-foreground/80">chucle562@gmail.com</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2 border-t border-primary-foreground/10">
                 <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                    <span className="text-primary-foreground/80">Thanh Hóa, Việt Nam</span>
                 </div>
              </div>

            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>
            &copy; 2025 An Tâm Tuổi Vàng.
            <br className="md:hidden"/>
            Dự án từ <strong>Trường Cao đẳng Y tế Thanh Hóa</strong> kết hợp với <strong>Trường Đại Học Hồng Đức</strong>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;