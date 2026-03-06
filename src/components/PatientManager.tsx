import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { Trash2, Edit, Plus, User, UserCheck, MessageSquare, Clock, MapPin, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// --- TYPES ---
interface Patient {
  id: string;
  full_name: string;
  dob: string;
  pathology: string;
  notes: string;
}

// KHAI BÁO THÊM INTERFACE ĐỂ XÓA LỖI ANY
interface Staff {
  id: string;
  full_name: string;
  phone: string;
  specialties?: string;
}

interface JobRequest {
  id: string;
  name: string;
  address: string;
  message: string;
  status: string;
  created_at: string;
  assigned_staff_id?: string;
  assigned_staff?: { full_name: string; phone?: string };
}

export const PatientManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE 1: QUẢN LÝ YÊU CẦU & ỨNG VIÊN ---
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [applicants, setApplicants] = useState<Record<string, Staff[]>>({});
  
  // --- STATE 2: QUẢN LÝ HỒ SƠ BỆNH NHÂN ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [pathology, setPathology] = useState('');
  const [notes, setNotes] = useState('');

  // ==========================================
  // PHẦN 1: LOGIC QUẢN LÝ YÊU CẦU & DUYỆT ĐƠN
  // ==========================================

  const fetchApplicants = useCallback(async (jobIds: string[]) => {
      const { data } = await supabase
        .from('job_applications')
        .select('job_id, staff:profiles(id, full_name, phone, specialties)')
        .in('job_id', jobIds);
      
      if (data) {
          const appMap: Record<string, Staff[]> = {};
          data.forEach(item => {
              if (!appMap[item.job_id]) appMap[item.job_id] = [];
              appMap[item.job_id].push(item.staff as unknown as Staff);
          });
          setApplicants(appMap);
      }
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    const { data: jobs } = await supabase
        .from('contacts')
        .select('*, assigned_staff:profiles(full_name, phone)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (jobs) {
        setRequests(jobs as JobRequest[]);
        const openJobIds = jobs.filter(j => !j.assigned_staff_id).map(j => j.id);
        if (openJobIds.length > 0) {
            fetchApplicants(openJobIds);
        }
    }
  }, [user, fetchApplicants]);

  const handleApproveStaff = async (jobId: string, staff: Staff) => {
      if (!confirm(`Bạn xác nhận chọn nhân viên ${staff.full_name}?`)) return;

      try {
          const { error } = await supabase.from('contacts').update({
              assigned_staff_id: staff.id,
              status: 'processing'
          }).eq('id', jobId);

          if (error) throw error;

          await supabase.from('chat_messages').insert({
              sender_id: user?.id,
              receiver_id: staff.id,
              contact_id: jobId, 
              content: "✅ Tôi đã chấp thuận bạn cho công việc này. Hãy bắt đầu nhé!",
              is_staff_reply: false
          });

          toast.success("Đã giao việc thành công!");
          fetchRequests(); 

      } catch (err: unknown) {
          if (err instanceof Error) toast.error("Lỗi: " + err.message);
      }
  };

  // ==========================================
  // PHẦN 2: LOGIC QUẢN LÝ HỒ SƠ BỆNH NHÂN
  // ==========================================

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('patient_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setPatients(data as Patient[]);
    setLoading(false);
  }, [user]);

  // Đã thêm dependencies vào useEffect
  useEffect(() => {
    if (user) {
        fetchPatients();
        fetchRequests();
        
        const channel = supabase
        .channel('customer_dashboard_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => {
            fetchRequests(); 
        })
        .subscribe();

        return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchPatients, fetchRequests]);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const patientData = { user_id: user.id, full_name: fullName, dob: dob || null, pathology: pathology, notes: notes };

    try {
        if (currentId) {
            await supabase.from('patient_records').update(patientData).eq('id', currentId);
            toast.success("Cập nhật hồ sơ thành công!");
        } else {
            await supabase.from('patient_records').insert([patientData]);
            toast.success("Thêm hồ sơ mới thành công!");
        }
        resetForm();
        fetchPatients();
    } catch (err: unknown) {
        if (err instanceof Error) toast.error("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa hồ sơ này?')) return;
    await supabase.from('patient_records').delete().eq('id', id);
    toast.success("Đã xóa hồ sơ.");
    fetchPatients();
  };

  const handleEdit = (p: Patient) => {
    setCurrentId(p.id); setFullName(p.full_name); setDob(p.dob || ''); setPathology(p.pathology || ''); setNotes(p.notes || '');
    setIsEditing(true);
  };

  const resetForm = () => {
    setIsEditing(false); setCurrentId(null); setFullName(''); setDob(''); setPathology(''); setNotes('');
  };

  return (
    <div className="space-y-8 mt-6">
      
      {/* --- PHẦN 1: DANH SÁCH YÊU CẦU & DUYỆT ỨNG VIÊN --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
             <MessageSquare className="text-blue-500"/> Quản lý Yêu cầu Chăm sóc
          </h2>
          
          {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed">Bạn chưa gửi yêu cầu nào.</p>
          ) : (
              <div className="space-y-4">
                  {requests.map(req => (
                      <div key={req.id} className="border p-4 rounded-lg bg-gray-50/50 hover:bg-white transition shadow-sm">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="flex-1">
                                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                      {req.name} 
                                      {req.status === 'done' && <span className="bg-gray-200 text-gray-600 text-[10px] px-2 rounded-full">Hoàn tất</span>}
                                  </h3>
                                  <div className="text-sm text-gray-600 space-y-1 mt-1">
                                      <p className="flex items-center gap-2"><Clock size={14}/> {new Date(req.created_at).toLocaleString()}</p>
                                      <p className="flex items-center gap-2"><MapPin size={14}/> {req.address}</p>
                                      <p className="italic text-gray-700 bg-white p-2 rounded border mt-2">"{req.message}"</p>
                                  </div>
                              </div>
                              
                              <div className="min-w-[200px] flex flex-col items-end">
                                  {req.assigned_staff ? (
                                      <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-green-200">
                                          <UserCheck size={18}/> 
                                          <div>
                                              <p>Đã giao cho:</p>
                                              <p className="text-base">{req.assigned_staff.full_name}</p>
                                          </div>
                                      </div>
                                  ) : (
                                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
                                          <Clock size={14}/> Đang tìm người...
                                      </span>
                                  )}
                              </div>
                          </div>

                          {/* KHU VỰC DUYỆT ỨNG VIÊN */}
                          {!req.assigned_staff_id && applicants[req.id] && applicants[req.id].length > 0 && (
                              <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                                  <p className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                                      <CheckCircle size={16}/> Có {applicants[req.id].length} nhân viên muốn nhận việc này:
                                  </p>
                                  <div className="grid gap-2">
                                      {applicants[req.id].map((staff) => (
                                          <div key={staff.id} className="flex justify-between items-center bg-white p-3 rounded-lg border hover:shadow-md transition">
                                              <div>
                                                  <p className="font-bold text-gray-800 flex items-center gap-2"><User size={16}/> {staff.full_name}</p>
                                                  <p className="text-xs text-gray-500">{staff.phone} | {staff.specialties || 'Chưa có chuyên môn'}</p>
                                              </div>
                                              
                                              {/* CÁC NÚT HÀNH ĐỘNG */}
                                              <div className="flex gap-2">
                                                  <Button 
                                                      size="sm" 
                                                      variant="outline" 
                                                      className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                      onClick={() => navigate(`/job-chat/${req.id}/${staff.id}`)}
                                                  >
                                                      <MessageSquare size={14} className="mr-1"/> Chat
                                                  </Button>
                                                  <Button 
                                                      size="sm" 
                                                      className="bg-blue-600 hover:bg-blue-700 h-8" 
                                                      onClick={() => handleApproveStaff(req.id, staff)}
                                                  >
                                                      Chấp thuận
                                                  </Button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* --- PHẦN 2: HỒ SƠ NGƯỜI THÂN --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-orange-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-orange-500" /> Hồ Sơ Người Thân
          </h2>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700">
              <Plus size={16} className="mr-2" /> Thêm hồ sơ mới
            </Button>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleSave} className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-100 animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Họ tên người cần chăm sóc *</label>
                <input required className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày sinh (Năm sinh)</label>
                <input type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Bệnh lý nền / Tình trạng sức khỏe</label>
                <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" value={pathology} onChange={e => setPathology(e.target.value)} placeholder="VD: Cao huyết áp, tiểu đường, khó đi lại..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Lưu ý đặc biệt (Sở thích, tính cách...)</label>
                <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="VD: Cụ thích nói chuyện lịch sử, không ăn được đồ cứng..." />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm}>Hủy bỏ</Button>
              <Button type="submit" className="bg-[#e67e22] hover:bg-[#d35400]">Lưu hồ sơ</Button>
            </div>
          </form>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {patients.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition bg-gray-50 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50] flex items-center gap-2"><User size={18} className="text-gray-400"/> {p.full_name}</h3>
                  <p className="text-sm text-gray-500 mb-2 pl-6">Ngày sinh: {p.dob || 'Chưa cập nhật'}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-full"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-100 p-1.5 rounded-full"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700 space-y-1 bg-white p-3 rounded border">
                <p><strong>🏥 Bệnh lý:</strong> {p.pathology || 'Không có'}</p>
                <p><strong>📝 Lưu ý:</strong> {p.notes || 'Không có'}</p>
              </div>
            </div>
          ))}
          {!loading && patients.length === 0 && !isEditing && (
            <p className="text-gray-500 col-span-2 text-center py-8 border-2 border-dashed rounded-lg">Chưa có hồ sơ nào. Hãy thêm mới để đặt lịch nhanh hơn!</p>
          )}
        </div>
      </div>
    </div>
  );
};