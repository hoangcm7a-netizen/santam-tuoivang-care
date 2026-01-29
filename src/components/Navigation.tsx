import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Wallet, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectInfoBtn } from "@/pages/ProjectInfoBtn";
import { useAuth } from '@/lib/AuthContext';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();

    // Xác định link trang chủ dựa trên vai trò
    const getHomeLink = () => {
        if (!user || !profile) return "/";
        if (profile.role === 'customer') return "/customer-dashboard";
        if (profile.role === 'staff') return "/staff-dashboard";
        if (profile.role === 'admin') return "/admin-dashboard";
        return "/";
    };

    // Hiển thị tên vai trò tiếng Việt
    const getRoleDisplayName = () => {
        if (profile?.role === 'admin') return 'Quản Trị Viên';
        if (profile?.role === 'staff') return 'Nhân viên Y tế';
        return 'Khách hàng';
    };

    const homeLink = getHomeLink();
    const isInternalUser = profile?.role === 'staff' || profile?.role === 'admin';
    const isCustomer = profile?.role === 'customer';

    // Danh sách menu chính
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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    
                    {/* LOGO */}
                    <Link to={homeLink} className="flex items-center gap-2 group">
                        <img
                            src="/LOGO.png"
                            alt="An Tâm Tuổi Vàng Logo"
                            className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>

                    {/* DESKTOP MENU (CENTER) */}
                    <div className="hidden lg:flex items-center gap-8">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-bold transition-all duration-200 hover:text-orange-600 ${
                                    isActive(link.path)
                                        ? "text-orange-600 scale-105"
                                        : "text-gray-600"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* DESKTOP ACTIONS (RIGHT) */}
                    <div className="hidden lg:flex items-center gap-4">
                        <ProjectInfoBtn />

                        {user ? (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                {/* Các nút chức năng cho Khách hàng */}
                                {isCustomer && (
                                    <>
                                        <Link to="/messages">
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 relative" title="Hộp thư">
                                                <MessageSquare size={20} />
                                                {/* Có thể thêm badge số tin nhắn chưa đọc ở đây */}
                                            </Button>
                                        </Link>
                                        <Link to="/wallet">
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-orange-600 hover:bg-orange-50" title="Ví của tôi">
                                                <Wallet size={20} />
                                            </Button>
                                        </Link>
                                    </>
                                )}

                                {/* Thông tin User */}
                                <Link to="/profile" className="text-right cursor-pointer hover:opacity-80 transition-opacity">
                                    <p className="text-sm font-bold text-gray-800 truncate max-w-[150px]">
                                        {profile?.full_name || 'Người dùng'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                        {getRoleDisplayName()}
                                    </p>
                                </Link>
                                
                                {/* Nút Đăng xuất */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={handleLogout}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={20} />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" className="font-semibold text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                                    <Link to="/auth?mode=login">Đăng Nhập</Link>
                                </Button>
                                <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md hover:shadow-lg transition-all">
                                    <Link to="/contact">Đặt Lịch Ngay</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <button
                        className="lg:hidden p-2 text-gray-600 hover:text-orange-600 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                    </button>
                </div>

                {/* MOBILE MENU DROPDOWN */}
                {isOpen && (
                    <div className="lg:hidden pb-6 pt-2 space-y-2 border-t border-gray-100 mt-2 bg-white animate-in slide-in-from-top-5">
                        
                        {/* Mobile User Profile */}
                        {user && (
                            <div className="px-4 py-3 bg-gray-50 mb-4 flex items-center gap-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200">
                                    <User size={20} />
                                </div>
                                <Link to="/profile" onClick={() => setIsOpen(false)} className="flex-1">
                                    <p className="font-bold text-sm text-gray-900">{profile?.full_name}</p>
                                    <p className="text-xs text-gray-500">{getRoleDisplayName()}</p>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Links */}
                        <div className="space-y-1 px-2">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                                        isActive(link.path)
                                            ? "bg-orange-50 text-orange-700"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile Quick Actions (Wallet, Messages) */}
                        {user && isCustomer && (
                            <div className="grid grid-cols-2 gap-2 px-4 py-2 border-t border-gray-100 mt-2">
                                <Link 
                                    to="/messages" 
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm"
                                >
                                    <MessageSquare size={16}/> Hộp thư
                                </Link>
                                <Link 
                                    to="/wallet" 
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-orange-50 text-orange-700 font-medium text-sm"
                                >
                                    <Wallet size={16}/> Ví của tôi
                                </Link>
                            </div>
                        )}

                        {/* Mobile Project Info & Logout */}
                        <div className="px-4 pt-2 space-y-3">
                            <div onClick={() => setIsOpen(false)} className="w-full">
                                <ProjectInfoBtn />
                            </div>

                            {user ? (
                                <Button 
                                    variant="outline" 
                                    className="w-full text-red-500 border-red-200 hover:bg-red-50 justify-start" 
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} className="mr-2"/> Đăng xuất
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Button asChild variant="outline" className="w-full justify-start">
                                        <Link to="/auth?mode=login" onClick={() => setIsOpen(false)}>
                                            <User size={16} className="mr-2"/> Đăng Nhập
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                                        <Link to="/contact" onClick={() => setIsOpen(false)}>
                                            Đặt Lịch Ngay
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;