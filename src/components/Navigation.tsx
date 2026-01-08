import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // <-- Thêm useNavigate
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectInfoBtn } from "@/pages/ProjectInfoBtn";
import { useAuth } from '@/lib/AuthContext';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate(); // <-- Khai báo hook điều hướng
    
    const { user, profile, signOut } = useAuth();

    // Logic chuyển hướng trang chủ
    const getHomeLink = () => {
        if (!user || !profile) return "/";
        if (profile.role === 'customer') return "/customer-dashboard";
        if (profile.role === 'staff') return "/staff-dashboard";
        if (profile.role === 'admin') return "/admin-dashboard";
        return "/";
    };

    const homeLink = getHomeLink();

    const links = [
        { name: "Trang Chủ", path: homeLink },
        { name: "Dịch Vụ", path: "/services" },
        { name: "Về Chúng Tôi", path: "/about" },
        { name: "Liên Hệ", path: "/contact" },
    ];

    const isActive = (path: string) => location.pathname === path;

    // --- HÀM ĐĂNG XUẤT CHUẨN ---
    const handleLogout = async () => {
        await signOut();      // 1. Đăng xuất khỏi hệ thống
        navigate('/');        // 2. Chuyển ngay về trang chủ
        setIsOpen(false);     // 3. Đóng menu mobile (nếu đang mở)
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    
                    <Link to={homeLink} className="flex items-center gap-2 group">
                        <img
                            src="/LOGO.png"
                            alt="An Tâm Tuổi Vàng Logo"
                            className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.path)
                                        ? "text-primary border-b-2 border-accent"
                                        : "text-foreground"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <ProjectInfoBtn />

                        {profile?.role === 'staff' && (
                            <Button asChild variant="ghost" className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 px-2">
                                <Link to="/test-video">📋 Báo cáo ca làm</Link>
                            </Button>
                        )}

                        {user ? (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <Link to="/profile" className="text-right hidden lg:block cursor-pointer hover:opacity-70 transition-opacity">
                                    <p className="text-sm font-bold text-primary truncate max-w-[150px]">
                                        {profile?.full_name || 'Người dùng'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                        {profile?.role === 'staff' ? 'Nhân viên Y tế' : 'Khách hàng'}
                                    </p>
                                </Link>
                                
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleLogout} // <-- Sử dụng hàm đăng xuất mới
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    Đăng xuất
                                </Button>
                            </div>
                        ) : (
                            <Button asChild variant="outline" size="sm" className="ml-2">
                                <Link to="/auth">Đăng Nhập</Link>
                            </Button>
                        )}

                        <Button asChild variant="default" size="sm">
                            <Link to="/contact">Đặt Lịch Ngay</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-border mt-2 bg-white">
                        {user && (
                            <Link 
                                to="/profile" 
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-3 bg-gray-50 mb-2 flex items-center gap-3 hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{profile?.full_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {profile?.role === 'staff' ? 'Nhân viên - Nhấn để xem hồ sơ' : 'Khách hàng - Nhấn để xem hồ sơ'}
                                    </p>
                                </div>
                            </Link>
                        )}

                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`block px-4 py-2 rounded-lg transition-colors ${isActive(link.path)
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-muted"
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {profile?.role === 'staff' && (
                            <Link
                                to="/test-video"
                                className="block px-4 py-2 rounded-lg text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 mx-2"
                                onClick={() => setIsOpen(false)}
                            >
                                📋 Báo cáo ca làm
                            </Link>
                        )}

                        <div className="px-4 py-2" onClick={() => setIsOpen(false)}>
                            <ProjectInfoBtn />
                        </div>

                        <div className="px-4 pt-2 space-y-2">
                            {user ? (
                                <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}> {/* <-- Sử dụng hàm đăng xuất mới */}
                                    Đăng xuất
                                </Button>
                            ) : (
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                                        Đăng Nhập Tài Khoản
                                    </Link>
                                </Button>
                            )}
                            
                            <Button asChild variant="default" className="w-full">
                                <Link to="/contact" onClick={() => setIsOpen(false)}>
                                    Đặt Lịch Ngay
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;