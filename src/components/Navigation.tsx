import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
// Đảm bảo đường dẫn này đúng với nơi bạn tạo file (src/pages/ProjectInfoBtn.tsx)
import { ProjectInfoBtn } from "@/pages/ProjectInfoBtn";

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const links = [
        { name: "Trang Chủ", path: "/" },
        { name: "Dịch Vụ", path: "/services" },
        { name: "Về Chúng Tôi", path: "/about" },
        { name: "Liên Hệ", path: "/contact" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <img
                            src="/LOGO.png"
                            alt="An Tâm Tuổi Vàng Logo"
                            className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Navigation (Giao diện máy tính) */}
                    <div className="hidden md:flex items-center gap-8">
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

                        {/* --- 1. CHÈN NÚT MÔ TẢ DỰ ÁN VÀO ĐÂY --- */}
                        <ProjectInfoBtn />
                        {/* --------------------------------------- */}

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

                {/* Mobile Navigation (Giao diện điện thoại) */}
                {isOpen && (
                    <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-border mt-2">
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

                        {/* --- 2. CHÈN NÚT MÔ TẢ DỰ ÁN VÀO MENU MOBILE --- */}
                        <div className="px-4 py-2" onClick={() => setIsOpen(false)}>
                            <ProjectInfoBtn />
                        </div>
                        {/* ---------------------------------------------- */}

                        <div className="px-4 pt-2">
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