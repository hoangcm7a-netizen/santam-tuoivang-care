import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { Trash2, Edit, Plus, User } from 'lucide-react';

// Kiểu dữ liệu
type Patient = {
  id: string;
  full_name: string;
  dob: string;
  pathology: string;
  notes: string;
};

export const PatientManager = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // Trạng thái mở form
  
  // Form data
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [pathology, setPathology] = useState('');
  const [notes, setNotes] = useState('');

  // 1. Tải danh sách
  useEffect(() => {
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('patient_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setPatients(data);
    setLoading(false);
  };

  // 2. Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const patientData = {
      user_id: user.id,
      full_name: fullName,
      dob: dob || null,
      pathology: pathology,
      notes: notes
    };

    if (currentId) {
      // Cập nhật
      await supabase.from('patient_records').update(patientData).eq('id', currentId);
    } else {
      // Thêm mới
      await supabase.from('patient_records').insert([patientData]);
    }

    resetForm();
    fetchPatients();
  };

  // 3. Xử lý Xóa
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa hồ sơ này?')) return;
    await supabase.from('patient_records').delete().eq('id', id);
    fetchPatients();
  };

  // Hàm điền dữ liệu vào form để sửa
  const handleEdit = (p: Patient) => {
    setCurrentId(p.id);
    setFullName(p.full_name);
    setDob(p.dob || '');
    setPathology(p.pathology || '');
    setNotes(p.notes || '');
    setIsEditing(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFullName('');
    setDob('');
    setPathology('');
    setNotes('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border mt-6">
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

      {/* --- FORM NHẬP LIỆU --- */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 border animate-in fade-in">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Họ tên người cần chăm sóc *</label>
              <input required className="w-full p-2 border rounded" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="VD: Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày sinh (Năm sinh)</label>
              <input type="date" className="w-full p-2 border rounded" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Bệnh lý nền / Tình trạng sức khỏe</label>
              <textarea className="w-full p-2 border rounded" value={pathology} onChange={e => setPathology(e.target.value)} placeholder="VD: Cao huyết áp, tiểu đường, khó đi lại..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Lưu ý đặc biệt (Sở thích, tính cách...)</label>
              <textarea className="w-full p-2 border rounded" value={notes} onChange={e => setNotes(e.target.value)} placeholder="VD: Cụ thích nói chuyện lịch sử, không ăn được đồ cứng..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>Hủy bỏ</Button>
            <Button type="submit" className="bg-[#e67e22] hover:bg-[#d35400]">Lưu hồ sơ</Button>
          </div>
        </form>
      )}

      {/* --- DANH SÁCH HỒ SƠ --- */}
      <div className="grid gap-4 md:grid-cols-2">
        {patients.map((p) => (
          <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition bg-orange-50/30">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-[#2c3e50]">{p.full_name}</h3>
                <p className="text-sm text-gray-500 mb-2">Ngày sinh: {p.dob || 'Chưa cập nhật'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <p><strong>🏥 Bệnh lý:</strong> {p.pathology || 'Không có'}</p>
              <p><strong>📝 Lưu ý:</strong> {p.notes || 'Không có'}</p>
            </div>
          </div>
        ))}
        {!loading && patients.length === 0 && !isEditing && (
          <p className="text-gray-500 col-span-2 text-center py-4">Chưa có hồ sơ nào. Hãy thêm mới để đặt lịch nhanh hơn!</p>
        )}
      </div>
    </div>
  );
};