import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { Wallet, History, ArrowUpCircle, ArrowDownCircle, CreditCard, CheckCircle, AlertCircle, QrCode, Landmark, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// KHAI BÁO KIỂU DỮ LIỆU
interface Transaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
    status: string;
}

interface UnpaidJob {
    id: string;
    name: string;
    price: number;
    created_at: string;
    assigned_staff?: { full_name: string };
}

const CustomerWallet = () => {
    const { user, profile } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [unpaidJobs, setUnpaidJobs] = useState<UnpaidJob[]>([]);

    const [showDeposit, setShowDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");

    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [withdrawPassword, setWithdrawPassword] = useState("");

    const [loading, setLoading] = useState(false);

    // Bọc hàm fetch bằng useCallback
    const fetchWalletData = useCallback(async () => {
        if (!user) return;
        const { data: profileData } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
        if (profileData) setBalance(profileData.wallet_balance || 0);

        const { data: transData } = await supabase.from('transactions')
            .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (transData) setTransactions(transData as Transaction[]);
    }, [user]);

    const fetchUnpaidJobs = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('contacts')
            .select('*, assigned_staff:profiles(full_name)')
            .eq('user_id', user.id).eq('payment_status', 'unpaid')
            .neq('assigned_staff_id', null).order('created_at', { ascending: false });
        if (data) setUnpaidJobs(data as UnpaidJob[]);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchWalletData();
            fetchUnpaidJobs();

            const profileChannel = supabase.channel('wallet_profile_changes')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                    (payload: Record<string, unknown>) => {
                        const newProfile = payload.new as { wallet_balance: number };
                        setBalance(newProfile.wallet_balance);
                    }).subscribe();
            return () => { supabase.removeChannel(profileChannel); };
        }
    }, [user, fetchWalletData, fetchUnpaidJobs]);

    const handleDeposit = async () => {
        const amount = parseInt(depositAmount.replace(/\D/g, ''));
        if (!amount || amount < 10000) return toast.error("Số tiền nạp tối thiểu 10.000đ");

        setLoading(true);
        try {
            const newBalance = balance + amount;
            await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user?.id);
            await supabase.from('transactions').insert({
                user_id: user?.id, amount: amount, type: 'deposit', description: 'Nạp tiền vào tài khoản', status: 'success'
            });

            toast.success(`Nạp thành công ${amount.toLocaleString()}đ`);
            setDepositAmount(""); setShowDeposit(false); fetchWalletData();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi nạp tiền: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawAmount.replace(/\D/g, ''));
        if (!amount || amount < 50000) return toast.error("Số tiền rút tối thiểu 50.000đ");
        if (amount > balance) return toast.error("Số dư ví không đủ để rút!");
        if (!bankName.trim() || !accountNumber.trim()) return toast.error("Vui lòng nhập đủ thông tin ngân hàng!");
        if (!withdrawPassword) return toast.error("Vui lòng nhập mật khẩu xác nhận!");

        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user!.email!,
                password: withdrawPassword
            });
            if (authError) throw new Error("Mật khẩu không chính xác!");

            const newBalance = balance - amount;
            const { error: updateError } = await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user?.id);
            if (updateError) throw updateError;

            await supabase.from('transactions').insert({
                user_id: user?.id, amount: amount, type: 'withdraw', description: `Rút tiền về ${bankName} - ${accountNumber}`, status: 'success'
            });

            toast.success(`Yêu cầu rút ${amount.toLocaleString()}đ thành công!`);

            setShowWithdraw(false);
            setWithdrawAmount(""); setBankName(""); setAccountNumber(""); setWithdrawPassword("");
            fetchWalletData();

        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Thay thế any bằng UnpaidJob
    const handlePayService = async (job: UnpaidJob) => {
        const price = job.price && job.price > 0 ? job.price : 200000;
        if (balance < price) return toast.error("Số dư không đủ. Vui lòng nạp thêm tiền!");
        if (!confirm(`Xác nhận thanh toán ${price.toLocaleString()}đ cho đơn hàng "${job.name}"?`)) return;

        setLoading(true);
        try {
            const newBalance = balance - price;
            await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user?.id);
            await supabase.from('transactions').insert({
                user_id: user?.id, amount: price, type: 'payment', description: `Thanh toán dịch vụ: ${job.name}`, status: 'success'
            });
            await supabase.from('contacts').update({ payment_status: 'paid' }).eq('id', job.id);

            toast.success("Thanh toán thành công!");
            fetchWalletData(); fetchUnpaidJobs();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi thanh toán: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            <Navigation />

            <div className="container mx-auto px-4 pt-28 max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Wallet className="text-orange-600" /> Ví Của Tôi
                </h1>

                <div className="grid md:grid-cols-3 gap-6">

                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-48 flex flex-col justify-between">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Số dư khả dụng</p>
                                    <h2 className="text-3xl font-bold mt-1">{balance.toLocaleString()} đ</h2>
                                </div>
                                <CreditCard className="opacity-80" />
                            </div>
                            <div className="z-10">
                                <p className="text-sm opacity-80 uppercase tracking-widest">{profile?.full_name}</p>
                                <p className="text-xs opacity-60">**** **** **** 8888</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => { setShowDeposit(true); setShowWithdraw(false); }} className="bg-green-600 hover:bg-green-700 w-full">
                                <ArrowDownCircle size={16} className="mr-2" /> Nạp tiền
                            </Button>
                            <Button onClick={() => { setShowWithdraw(true); setShowDeposit(false); }} className="bg-gray-800 hover:bg-gray-900 w-full">
                                <ArrowUpCircle size={16} className="mr-2" /> Rút tiền
                            </Button>
                        </div>

                        {showDeposit && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border animate-in fade-in slide-in-from-top-4">
                                <h3 className="font-bold text-gray-700 mb-3">Thông tin nạp tiền</h3>
                                <div className="space-y-3">
                                    <Input type="number" placeholder="Nhập số tiền (VNĐ)" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setShowDeposit(false)} className="flex-1">Hủy</Button>
                                        <Button onClick={handleDeposit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                                            Xác nhận
                                        </Button>
                                    </div>
                                    <div className="text-center text-xs text-gray-400 mt-2 flex flex-col items-center">
                                        <QrCode size={48} className="mb-1" />
                                        <p>Quét mã (Mô phỏng)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-6">

                        {/* HIỂN THỊ HÓA ĐƠN CẦN THANH TOÁN NẾU CÓ */}
                        {unpaidJobs.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-4 border-b bg-orange-50 flex justify-between items-center">
                                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                        <AlertCircle size={18} /> Hóa đơn cần thanh toán
                                    </h3>
                                    <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">{unpaidJobs.length}</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {unpaidJobs.map(job => {
                                        const price = job.price || 200000;
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
                        )}

                        <div className="bg-white rounded-xl shadow-sm border">
                            <div className="p-4 border-b">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <History size={18} /> Lịch sử giao dịch
                                </h3>
                            </div>
                            <div className="divide-y max-h-[400px] overflow-y-auto">
                                {transactions.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Chưa có giao dịch nào.</p>}
                                {transactions.map(tx => {
                                    const isAdd = tx.type === 'deposit';

                                    return (
                                        <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isAdd ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {isAdd ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{tx.description}</p>
                                                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className={`font-mono font-bold ${isAdd ? 'text-green-600' : 'text-red-600'}`}>
                                                {isAdd ? '+' : '-'}{tx.amount.toLocaleString()} đ
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showWithdraw && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                            <X size={20} />
                        </button>

                        <div className="mx-auto w-12 h-12 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Landmark size={24} />
                        </div>
                        <h3 className="font-bold text-xl text-center text-gray-800 mb-1">Rút Tiền Về Ngân Hàng</h3>
                        <p className="text-sm text-center text-gray-500 mb-6">Số dư khả dụng: <b className="text-orange-600">{balance.toLocaleString()}đ</b></p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500">SỐ TIỀN CẦN RÚT</label>
                                <Input type="number" placeholder="VD: 100000" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">TÊN NGÂN HÀNG</label>
                                    <Input type="text" placeholder="VD: Vietcombank" value={bankName} onChange={e => setBankName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">SỐ TÀI KHOẢN</label>
                                    <Input type="text" placeholder="Nhập STK" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Lock size={12} /> MẬT KHẨU XÁC NHẬN</label>
                                <Input type="password" placeholder="Nhập mật khẩu tài khoản" value={withdrawPassword} onChange={e => setWithdrawPassword(e.target.value)} />
                            </div>

                            <Button onClick={handleWithdraw} disabled={loading} className="w-full bg-gray-800 hover:bg-gray-900 text-white mt-2">
                                {loading ? 'Đang xử lý...' : 'Xác nhận Rút tiền'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerWallet;