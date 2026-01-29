import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { Wallet, History, ArrowUpCircle, ArrowDownCircle, CreditCard, CheckCircle, AlertCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CustomerWallet = () => {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [unpaidJobs, setUnpaidJobs] = useState<any[]>([]);
  
  // State nạp tiền
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
        fetchWalletData();
        fetchUnpaidJobs();
    }
  }, [user]);

  const fetchWalletData = async () => {
      // 1. Lấy số dư mới nhất
      const { data: profileData } = await supabase.from('profiles').select('wallet_balance').eq('id', user?.id).single();
      if (profileData) setBalance(profileData.wallet_balance || 0);

      // 2. Lấy lịch sử giao dịch
      const { data: transData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
      if (transData) setTransactions(transData);
  };

  const fetchUnpaidJobs = async () => {
      // Lấy các đơn hàng ĐÃ CÓ NGƯỜI NHẬN (status != new) nhưng CHƯA THANH TOÁN
      const { data } = await supabase
          .from('contacts')
          .select('*, assigned_staff:profiles(full_name)')
          .eq('user_id', user?.id)
          .eq('payment_status', 'unpaid')
          .neq('assigned_staff_id', null) // Phải có nhân viên nhận mới thanh toán
          .order('created_at', { ascending: false });
      
      if (data) setUnpaidJobs(data);
  };

  // --- CHỨC NĂNG: NẠP TIỀN (MÔ PHỎNG) ---
  const handleDeposit = async () => {
      const amount = parseInt(depositAmount.replace(/\D/g, ''));
      if (!amount || amount < 10000) return toast.error("Số tiền nạp tối thiểu 10.000đ");

      setLoading(true);
      try {
          // 1. Cộng tiền vào ví
          const newBalance = balance + amount;
          await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user?.id);

          // 2. Lưu lịch sử giao dịch
          await supabase.from('transactions').insert({
              user_id: user?.id,
              amount: amount,
              type: 'deposit',
              description: 'Nạp tiền vào tài khoản (Mô phỏng)',
              status: 'success'
          });

          toast.success(`Nạp thành công ${amount.toLocaleString()}đ`);
          setDepositAmount("");
          setShowDeposit(false);
          fetchWalletData();
      } catch (err: any) {
          toast.error("Lỗi nạp tiền: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  // --- CHỨC NĂNG: THANH TOÁN DỊCH VỤ ---
  const handlePayService = async (job: any) => {
      // Tạm tính giá nếu chưa có (Ví dụ cố định 200k hoặc lấy từ DB)
      const price = job.price && job.price > 0 ? job.price : 200000; 

      if (balance < price) {
          return toast.error("Số dư không đủ. Vui lòng nạp thêm tiền!");
      }

      if (!confirm(`Xác nhận thanh toán ${price.toLocaleString()}đ cho đơn hàng "${job.name}"?`)) return;

      setLoading(true);
      try {
          // 1. Trừ tiền khách hàng
          const newBalance = balance - price;
          const { error: balanceError } = await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user?.id);
          if (balanceError) throw balanceError;

          // 2. Lưu lịch sử giao dịch (Payment)
          await supabase.from('transactions').insert({
              user_id: user?.id,
              amount: price,
              type: 'payment',
              description: `Thanh toán dịch vụ: ${job.name}`,
              status: 'success'
          });

          // 3. Cập nhật trạng thái đơn hàng -> Đã thanh toán
          await supabase.from('contacts').update({ 
              payment_status: 'paid',
              // Có thể chuyển trạng thái đơn sang 'done' nếu quy trình là thanh toán xong mới coi là xong
              // status: 'done' 
          }).eq('id', job.id);

          // 4. (Tùy chọn) Cộng tiền cho nhân viên (Ví dụ: Nhân viên nhận 80%, Sàn giữ 20%)
          // await supabase.rpc('pay_staff_commission', { staff_id: job.assigned_staff_id, amount: price * 0.8 });

          toast.success("Thanh toán thành công!");
          fetchWalletData();
          fetchUnpaidJobs();

      } catch (err: any) {
          toast.error("Lỗi thanh toán: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-28 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Wallet className="text-orange-600"/> Ví Của Tôi
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
            
            {/* CỘT TRÁI: THÔNG TIN VÍ & NẠP TIỀN */}
            <div className="md:col-span-1 space-y-6">
                {/* Thẻ Visa ảo */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-48 flex flex-col justify-between">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Số dư khả dụng</p>
                            <h2 className="text-3xl font-bold mt-1">{balance.toLocaleString()} đ</h2>
                        </div>
                        <CreditCard className="opacity-80"/>
                    </div>
                    <div className="z-10">
                        <p className="text-sm opacity-80 uppercase tracking-widest">{profile?.full_name}</p>
                        <p className="text-xs opacity-60">**** **** **** 8888</p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* Nút Nạp tiền */}
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <ArrowDownCircle size={18} className="text-green-600"/> Nạp tiền vào ví
                    </h3>
                    {!showDeposit ? (
                        <Button onClick={() => setShowDeposit(true)} className="w-full bg-green-600 hover:bg-green-700">
                            Nạp Ngay
                        </Button>
                    ) : (
                        <div className="space-y-3 animate-in fade-in">
                            <Input 
                                type="number" 
                                placeholder="Nhập số tiền (VNĐ)" 
                                value={depositAmount} 
                                onChange={e => setDepositAmount(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowDeposit(false)} className="flex-1">Hủy</Button>
                                <Button onClick={handleDeposit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                                    {loading ? 'Đang xử lý...' : 'Xác nhận'}
                                </Button>
                            </div>
                            <div className="text-center text-xs text-gray-400 mt-2 flex flex-col items-center">
                                <QrCode size={48} className="mb-1"/>
                                <p>Quét mã (Mô phỏng)</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CỘT PHẢI: THANH TOÁN & LỊCH SỬ */}
            <div className="md:col-span-2 space-y-6">
                
                {/* 1. DANH SÁCH CẦN THANH TOÁN */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-orange-50 flex justify-between items-center">
                        <h3 className="font-bold text-orange-800 flex items-center gap-2">
                            <AlertCircle size={18}/> Hóa đơn cần thanh toán
                        </h3>
                        <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">{unpaidJobs.length}</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {unpaidJobs.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Không có hóa đơn nào cần thanh toán.</p>}
                        {unpaidJobs.map(job => {
                            const price = job.price || 200000; // Giá mặc định nếu chưa set
                            return (
                                <div key={job.id} className="flex flex-col sm:flex-row justify-between items-center p-3 border rounded-lg hover:shadow-md transition gap-3">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{job.name}</p>
                                        <p className="text-xs text-gray-500">NV: {job.assigned_staff?.full_name} • {new Date(job.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <span className="font-mono font-bold text-orange-600">{price.toLocaleString()} đ</span>
                                        <Button size="sm" onClick={() => handlePayService(job)} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                            Thanh toán
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2. LỊCH SỬ GIAO DỊCH */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-4 border-b">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <History size={18}/> Lịch sử giao dịch
                        </h3>
                    </div>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                        {transactions.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Chưa có giao dịch nào.</p>}
                        {transactions.map(tx => (
                            <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {tx.type === 'deposit' ? <ArrowDownCircle size={20}/> : <ArrowUpCircle size={20}/>}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{tx.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className={`font-mono font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} đ
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerWallet;