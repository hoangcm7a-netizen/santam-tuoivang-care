import { Link } from "react-router-dom";
import { Heart, Phone, Mail, MapPin } from "lucide-react";

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
            <h3 className="font-semibold mb-4">Liên Kết Nhanh</h3>
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
            <h3 className="font-semibold mb-4">Dịch Vụ</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>Chăm Sóc Y Tế</li>
              <li>Hỗ Trợ Sinh Hoạt</li>
              <li>Phục Hồi Chức Năng</li>
              <li>Chăm Sóc Chuyên Biệt</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Liên Hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span className="text-primary-foreground/80">0973861431</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span className="text-primary-foreground/80">oanhtrandht@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span className="text-primary-foreground/80">Thanh Hóa, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
                  <p>
                      &copy; 2025 An Tâm Tuổi Vàng.
                          Dự án từ <strong>Trường Cao đẳng Y tế Thanh Hóa</strong> kết hợp với <strong>Trường Đại Học Hồng Đức</strong>.
                  </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
