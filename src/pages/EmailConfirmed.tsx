import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Giữ lại menu để người dùng không bị lạc */}
      <Navigation />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-in zoom-in duration-300 relative overflow-hidden">
          
          {/* Hiệu ứng trang trí nền */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
          
          {/* Icon thành công */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-12 h-12 text-green-600 animate-bounce" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Xác Thực Thành Công!
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Chúc mừng bạn! Tài khoản <strong>An Tâm Tuổi Vàng</strong> của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng dịch vụ ngay bây giờ.
          </p>

          <div className="space-y-3">
            <Button 
                asChild 
                className="w-full bg-[#e67e22] hover:bg-[#d35400] h-12 text-lg shadow-md transition-all hover:-translate-y-1"
            >
              <Link to="/auth">
                Đăng Nhập Ngay <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
              <Link to="/">Về Trang Chủ</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;