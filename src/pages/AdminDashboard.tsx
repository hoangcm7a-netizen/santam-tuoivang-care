import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { Users, FileText, DollarSign, Trash2, CheckCircle, Pencil, X, AlertTriangle, Send, UserCheck, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'contacts' | 'services'>('users');
  
  // Dữ liệu
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]); 

  // Modal States
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  
  // State Modal Xóa
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    type: 'user' | 'contact' | 'service';
    title: string;
    message: string;
  } | null>(null);
  
  // State Modal Chuyển đơn & Phản hồi
  const [forwardModal, setForwardModal] = useState<{ isOpen: boolean, contact: any } | null>(null);
  const [replyModal, setReplyModal] = useState<{ isOpen: boolean, contact: any } | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchData();
    if (activeTab === 'contacts') fetchStaff();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
    }
    if (activeTab === 'contacts') {
        const { data } = await supabase.from('contacts').select('*, assigned_staff:profiles(full_name)').order('created_at', { ascending: false });
        if (data) setContacts(data);
    }
    if (activeTab === 'services') {
        const { data } = await supabase.from('services').select('*').order('name');
        if (data) setServices(data);
    }
  };

  const fetchStaff = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'staff');
      if (data) setStaffList(data);
  };

  // --- LOGIC GỢI Ý NHÂN VIÊN ---
  const getRecommendedStaff = (message: string) => {
      if (!message || staffList.length === 0) return staffList;
      const lowerMessage = message.toLowerCase();
      return [...staffList].sort((a, b) => {
          const aMatch = a.specialties && lowerMessage.includes(a.specialties.toLowerCase()) ? 1 : 0;
          const bMatch = b.specialties && lowerMessage.includes(b.specialties.toLowerCase()) ? 1 : 0;
          return bMatch - aMatch;
      });
  };

  // --- CÁC HÀM XỬ LÝ CHUYỂN ĐƠN & PHẢN HỒI ---
  const handleAssignStaff = async (staffId: string) => {
      if (!forwardModal) return;
      const { error } = await supabase.from('contacts').update({ 
          assigned_staff_id: staffId,
          status: 'read' 
      }).eq('id', forwardModal.contact.id);

      if (error) toast.error("Lỗi: " + error.message);
      else {
          toast.success("Đã chuyển đơn cho nhân viên!");
          setForwardModal(null);
          fetchData();
      }
  };

  const handleReply = async () => {
      if (!replyModal || !replyText) return;
      
      try {
          // Lấy thông tin Admin đang đăng nhập
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // 1. Thêm tin nhắn vào bảng Chat (Để khách nhìn thấy trong phòng Chat)
          const { error: chatError } = await supabase.from('chat_messages').insert([
              {
                  contact_id: replyModal.contact.id,
                  sender_id: user.id,
                  content: replyText,
                  is_staff_reply: true // Đánh dấu là tin của phía Bệnh viện
              }
          ]);
          if (chatError) throw chatError;

          // 2. Cập nhật trạng thái đơn thành "Đã xong"
          const { error: updateError } = await supabase.from('contacts').update({ 
              admin_reply: replyText, // Vẫn lưu backup ở đây
              status: 'done' 
          }).eq('id', replyModal.contact.id);

          if (updateError) throw updateError;

          toast.success("Đã gửi phản hồi thành công!");
          setReplyModal(null);
          setReplyText("");
          fetchData();

      } catch (err: any) {
          toast.error("Lỗi: " + err.message);
      }
  };

  // --- CÁC HÀM XỬ LÝ XÓA (DELETE) ---
  const handleDeleteUserClick = (u: any) => {
    if (u.role === 'admin') {
        toast.error("⛔ KHÔNG THỂ XÓA TÀI KHOẢN ADMIN!");
        return;
    }
    setDeleteModal({
        isOpen: true, id: u.id, type: 'user', 
        title: 'Xóa tài khoản?', message: `Bạn có chắc muốn xóa tài khoản "${u.full_name}"?`
    });
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    try {
        let error = null;
        if (deleteModal.type === 'user') {
            const { error: err } = await supabase.rpc('delete_user_by_admin', { user_id_to_delete: deleteModal.id });
            error = err;
        } else if (deleteModal.type === 'contact') {
            const { error: err } = await supabase.from('contacts').delete().eq('id', deleteModal.id);
            error = err;
        } else if (deleteModal.type === 'service') {
            const { error: err } = await supabase.from('services').delete().eq('id', deleteModal.id);
            error = err;
        }

        if (error) throw error;
        toast.success("Đã xóa thành công!");
        fetchData();
    } catch (err: any) {
        toast.error("Lỗi: " + err.message);
    } finally {
        setDeleteModal(null);
    }
  };

  // --- CÁC HÀM XỬ LÝ SỬA (UPDATE) ---
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update({ 
            full_name: editingUser.full_name,
            phone: editingUser.phone,
            role: editingUser.role 
        }).eq('id', editingUser.id);

    if (error) toast.error("Lỗi: " + error.message);
    else {
        toast.success("Cập nhật thành công!");
        setEditingUser(null);
        fetchData();
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    const { error } = await supabase.from('services').update({ 
            name: editingService.name,
            price: editingService.price,
            description: editingService.description 
        }).eq('id', editingService.id);

    if (error) toast.error("Lỗi: " + error.message);
    else {
        toast.success("Cập nhật dịch vụ thành công!");
        setEditingService(null);
        fetchData();
    }
  };

  const markAsDone = async (id: string) => {
    await supabase.from('contacts').update({ status: 'done' }).eq('id', id);
    toast.success("Đã xử lý xong!");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navigation />
      <div className="container mx-auto px-4 pt-28">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Trang Quản Trị (Admin) 🛡️</h1>

        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}><Users size={18}/> Tài khoản</button>
            <button onClick={() => setActiveTab('contacts')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'contacts' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}><FileText size={18}/> Đơn Tư Vấn ({contacts.filter(c => c.status === 'new').length})</button>
            <button onClick={() => setActiveTab('services')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'services' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}><DollarSign size={18}/> Dịch Vụ</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 min-h-[400px]">
            
            {/* 1. TAB USERS */}
            {activeTab === 'users' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr><th className="p-3">Họ Tên</th><th className="p-3">Vai trò</th><th className="p-3">SĐT</th><th className="p-3 text-right">Hành động</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-medium">{u.full_name}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{u.role.toUpperCase()}</span></td>
                                    <td className="p-3 text-sm">{u.phone}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)} className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"><Pencil size={16}/></Button>
                                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-8 w-8 p-0" onClick={() => handleDeleteUserClick(u)}><Trash2 size={16}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 2. TAB CONTACTS */}
            {activeTab === 'contacts' && (
                <div className="space-y-4">
                    {contacts.length === 0 && <p className="text-gray-500 text-center py-10">Chưa có đơn tư vấn nào.</p>}
                    {contacts.map(c => (
                        <div key={c.id} className={`p-4 rounded-lg border flex flex-col lg:flex-row justify-between gap-4 ${c.status === 'new' ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-800">{c.name}</h3>
                                    {c.status === 'new' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">MỚI</span>}
                                    {c.status === 'done' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200">HOÀN TẤT</span>}
                                </div>
                                <p className="text-sm text-gray-600">📞 {c.phone} | ✉️ {c.email}</p>
                                <p className="mt-2 text-gray-800 bg-gray-50 p-3 rounded italic border border-gray-100">"{c.message}"</p>
                                <div className="mt-2 flex flex-wrap gap-4 text-xs">
                                    {c.assigned_staff && <span className="text-blue-600 font-medium flex items-center gap-1"><UserCheck size={14}/> Đã giao: {c.assigned_staff.full_name}</span>}
                                    {c.admin_reply && <span className="text-green-600 font-medium flex items-center gap-1"><MessageSquareReply size={14}/> Đã trả lời</span>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 justify-center min-w-[150px]">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => setForwardModal({isOpen: true, contact: c})}><Send size={14} className="mr-2"/> Chuyển NV</Button>
                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 w-full" onClick={() => setReplyModal({isOpen: true, contact: c})}><MessageSquareReply size={14} className="mr-2"/> Phản hồi</Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 w-full" onClick={() => setDeleteModal({isOpen: true, id: c.id, type: 'contact', title: 'Xóa đơn?', message: 'Bạn chắc chứ?'})}><Trash2 size={14} className="mr-2"/> Xóa đơn</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. TAB SERVICES */}
            {activeTab === 'services' && (
                <div className="grid md:grid-cols-2 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="border p-4 rounded-lg hover:shadow-md transition relative group bg-white">
                            <h3 className="font-bold text-lg text-blue-700">{s.name}</h3>
                            <p className="text-xl font-bold text-gray-800 my-1">{s.price}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setEditingService(s)} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Pencil size={16} /></button>
                                <button className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" onClick={() => setDeleteModal({isOpen: true, id: s.id, type: 'service', title: 'Xóa dịch vụ?', message: `Bạn có chắc muốn xóa dịch vụ "${s.name}"?`})}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL CHUYỂN ĐƠN (FORWARD) --- */}
      {forwardModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg">Chuyển đơn cho nhân viên</h3>
                    <button onClick={() => setForwardModal(null)}><X size={20}/></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Nội dung đơn: <span className="italic">"{forwardModal.contact.message}"</span></p>
                <div className="space-y-2">
                    {getRecommendedStaff(forwardModal.contact.message).map(staff => {
                        const isRecommended = staff.specialties && forwardModal.contact.message.toLowerCase().includes(staff.specialties.toLowerCase());
                        return (
                            <div key={staff.id} className={`p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 ${isRecommended ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : ''}`}>
                                <div>
                                    <p className="font-bold text-gray-800 flex items-center gap-2">{staff.full_name} {isRecommended && <span className="bg-green-600 text-white text-[10px] px-2 rounded-full">Phù hợp nhất</span>}</p>
                                    <p className="text-xs text-gray-500">{staff.specialties || "Chưa cập nhật chuyên môn"}</p>
                                </div>
                                <Button size="sm" onClick={() => handleAssignStaff(staff.id)}>Chọn</Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL PHẢN HỒI (REPLY) --- */}
      {replyModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg">Phản hồi khách hàng</h3>
                    <button onClick={() => setReplyModal(null)}><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Khách hàng: <strong>{replyModal.contact.name}</strong> ({replyModal.contact.phone})</p>
                    <Textarea placeholder="Nhập nội dung phản hồi..." rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setReplyModal(null)}>Hủy</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleReply}>Lưu & Gửi</Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN XÓA (DELETE) --- */}
      {deleteModal && deleteModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModal(null)}></div>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative z-10 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{deleteModal.title}</h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{deleteModal.message}</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setDeleteModal(null)} className="w-full">Hủy bỏ</Button>
                    <Button onClick={executeDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-md">Xóa Vĩnh Viễn</Button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL SỬA USER --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg">Sửa thông tin tài khoản</h3>
                    <button onClick={() => setEditingUser(null)}><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-sm font-medium">Họ Tên</label><Input value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} /></div>
                    <div><label className="text-sm font-medium">Số điện thoại</label><Input value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} /></div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Vai trò (Role)</label>
                        <select className="w-full border rounded-md p-2 bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                            <option value="customer">Khách hàng</option>
                            <option value="staff">Nhân viên</option>
                            <option value="admin">Admin (Quản trị)</option>
                        </select>
                    </div>
                    <Button onClick={handleUpdateUser} className="w-full bg-blue-600 hover:bg-blue-700">Lưu Thay Đổi</Button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL SỬA DỊCH VỤ --- */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg">Cập nhật Dịch vụ</h3>
                    <button onClick={() => setEditingService(null)}><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-sm font-medium">Tên dịch vụ</label><Input value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} /></div>
                    <div><label className="text-sm font-medium">Giá tiền</label><Input value={editingService.price} onChange={e => setEditingService({...editingService, price: e.target.value})} /></div>
                    <div><label className="text-sm font-medium">Mô tả chi tiết</label><Textarea value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})} rows={4} /></div>
                    <Button onClick={handleUpdateService} className="w-full bg-green-600 hover:bg-green-700">Lưu Dịch Vụ</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;