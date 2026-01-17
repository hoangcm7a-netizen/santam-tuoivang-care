import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectInfoBtn } from "@/pages/ProjectInfoBtn";
import { useAuth } from '@/lib/AuthContext';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const { user, profile, signOut } = useAuth();

    // Logic chuyển hướng trang chủ
    const getHomeLink = () => {
        if (!user || !profile) return "/";
        if (profile.role === 'customer') return "/customer-dashboard";
        if (profile.role === 'staff') return "/staff-dashboard";
        if (profile.role === 'admin') return "/admin-dashboard";
        return "/";
    };

    const getRoleDisplayName = () => {
        if (profile?.role === 'admin') return 'Quản Trị Viên';
        if (profile?.role === 'staff') return 'Nhân viên Y tế';
        return 'Khách hàng';
    };

    const homeLink = getHomeLink();

    // Kiểm tra xem có phải là nhân sự nội bộ (Admin/Staff) không
    const isInternalUser = profile?.role === 'staff' || profile?.role === 'admin';

    const links = [
        { name: "Trang Chủ", path: homeLink },
        { name: "Dịch Vụ", path: "/services" },
        { name: "Về Chúng Tôi", path: "/about" },
        { name: "Liên Hệ", path: "/contact" },
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await signOut();
        navigate('/');
        setIsOpen(false);
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

                        {user ? (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <Link to="/profile" className="text-right hidden lg:block cursor-pointer hover:opacity-70 transition-opacity">
                                    <p className="text-sm font-bold text-primary truncate max-w-[150px]">
                                        {profile?.full_name || 'Người dùng'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                        {getRoleDisplayName()}
                                    </p>
                                </Link>
                                
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleLogout}
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

                        {/* --- CHỈ HIỆN NÚT ĐẶT LỊCH NẾU KHÔNG PHẢI LÀ ADMIN HOẶC STAFF --- */}
                        {!isInternalUser && (
                            <Button asChild variant="default" size="sm">
                                <Link to="/contact">Đặt Lịch Ngay</Link>
                            </Button>
                        )}
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
                                        {getRoleDisplayName()} - Nhấn để xem hồ sơ
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

                        <div className="px-4 py-2" onClick={() => setIsOpen(false)}>
                            <ProjectInfoBtn />
                        </div>

                        <div className="px-4 pt-2 space-y-2">
                            {user ? (
                                <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                                    Đăng xuất
                                </Button>
                            ) : (
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                                        Đăng Nhập Tài Khoản
                                    </Link>
                                </Button>
                            )}
                            
                            {/* --- MOBILE: CHỈ HIỆN NÚT ĐẶT LỊCH NẾU KHÔNG PHẢI ADMIN/STAFF --- */}
                            {!isInternalUser && (
                                <Button asChild variant="default" className="w-full">
                                    <Link to="/contact" onClick={() => setIsOpen(false)}>
                                        Đặt Lịch Ngay
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;