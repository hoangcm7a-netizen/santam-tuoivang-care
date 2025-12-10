import { useState } from 'react';

export const ProjectInfoBtn = () => {
	const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            {/* --- 1. NÚT BẤM --- */}
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm font-medium text-gray-700 hover:text-[#e67e22] transition-colors focus:outline-none px-4 py-2"
            >
                Mô tả dự án
            </button>

            {/* --- 2. CỬA SỔ MODAL (Đã gỡ bỏ Animation gây lỗi) --- */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999999, /* Tăng Z-Index cực cao */
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingTop: '80px', /* Cách lề trên để né Header */
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', /* Nền tối */
                    backdropFilter: 'blur(2px)',
                }}>

                    {/* Lớp nền (Bấm ra ngoài để tắt) */}
                    <div
                        style={{ position: 'absolute', inset: 0 }}
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Hộp nội dung chính - ĐÃ XÓA CLASS ANIMATION */}
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative mx-4 mb-10 overflow-hidden"
                        style={{ maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>

                        {/* Header của Modal */}
                        <div className="bg-[#2c3e50] p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-white uppercase">Về Dự Án An Tâm Tuổi Vàng</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-orange-400 font-bold text-2xl leading-none px-2"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Nội dung cuộn - Sửa lại thanh cuộn */}
                        <div className="p-6 text-gray-800 space-y-5 overflow-y-auto">

                            {/* Phần 1: Tóm tắt */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <h3 className="font-bold text-[#e67e22] flex items-center gap-2 mb-2">
                                    💡 Mô tả tóm tắt
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    Dự án là mô hình kết nối giữa các nhân viên y tế có chuyên môn với các gia đình có người cao tuổi cần chăm sóc sức khỏe tại nhà dựa trên nền tảng khoa học, công nghệ (Web, app).
                                </p>
                            </div>

                            {/* Phần 2: Sản phẩm/Dịch vụ */}
                            <div>
                                <h3 className="font-bold text-[#2c3e50] mb-2 border-b pb-1">❤️ Sản phẩm/Dịch vụ</h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    Dự án “An tâm tuổi vàng” cung cấp các dịch vụ chăm sóc sức khỏe từ cơ bản đến nâng cao chuyên biệt cho người cao tuổi như:
                                </p>
                                <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                                    <li><strong>Hỗ trợ sinh hoạt hằng ngày:</strong> Vệ sinh cá nhân, tâm sự bầu bạn, hỗ trợ di chuyển, chăm sóc dinh dưỡng…</li>
                                    <li><strong>Chăm sóc y tế:</strong> Quản lý và cho uống thuốc theo y lệnh, phục hồi chức năng, đo huyết áp…</li>
                                </ul>
                            </div>

                            {/* Phần 3: Hoạt động hiện tại */}
                            <div>
                                <h3 className="font-bold text-[#2c3e50] mb-2 border-b pb-1">🚀 Hoạt động hiện tại</h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    Dự án được lên ý tưởng vào <strong>tháng 5/2025</strong>, thử nghiệm hoạt động vào <strong>tháng 7/2025</strong>. Nền móng ban đầu với 4 nhân viên chuyên môn y tế với những bước đi đầu tiên trong việc chăm sóc 09 bệnh nhân theo giờ.
                                </p>
                            </div>

                            {/* Phần 4: Quy mô */}
                            <div>
                                <h3 className="font-bold text-[#2c3e50] mb-2 border-b pb-1">📍 Quy mô & Bảo trợ</h3>
                                <p className="text-sm text-gray-700">
                                    Dự án ban đầu sẽ phát triển tại địa bàn trung tâm <strong>tỉnh Thanh Hoá</strong>, sau đó sẽ phát triển ra các tỉnh thành khác.
                                </p>
                                <p className="text-sm text-gray-500 mt-2 italic border-t pt-2">
                                    Dự án từ Trường Cao đẳng Y tế Thanh Hóa kết hợp với Trường Đại Học Hồng Đức.
                                </p>
                            </div>

                        </div>

                        {/* Footer của Modal */}
                        <div className="p-4 bg-gray-50 border-t flex justify-end shrink-0">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-[#e67e22] hover:bg-[#d35400] text-white rounded-md font-medium transition-colors shadow-sm"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};