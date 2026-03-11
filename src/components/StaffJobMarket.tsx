import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { MapPin, Clock, Briefcase, Phone, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Khai báo Interface để xóa lỗi any
interface JobData {
    id: string;
    name: string;
    address?: string;
    phone: string;
    message?: string;
    user_id?: string;
    created_at: string;
}

export default function StaffJobMarket() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JobData[]>([]);
    const [myApplications, setMyApplications] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Bọc hàm bằng useCallback
    const fetchOpenJobs = useCallback(async () => {
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .is('assigned_staff_id', null)
            .neq('status', 'done')
            .order('created_at', { ascending: false });

        if (data) setJobs(data as JobData[]);
    }, []);

    // Bọc hàm bằng useCallback
    const fetchMyApplications = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('job_applications').select('job_id').eq('staff_id', user.id);
        if (data) setMyApplications(data.map(app => app.job_id));
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchOpenJobs();
            fetchMyApplications();

            const channel = supabase
                .channel('market_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
                    fetchOpenJobs();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user, fetchOpenJobs, fetchMyApplications]); // Đã thêm đủ dependencies

    const handleApplyAndChat = async (job: JobData) => {
        if (!user) return;

        if (myApplications.includes(job.id)) {
            if (!job.user_id) {
                return toast.error("Đơn hàng này bị lỗi thông tin khách hàng, không thể chat.");
            }
            navigate(`/job-chat/${job.id}/${job.user_id}`);
            return;
        }

        try {
            setLoading(true);

            const { error: appError } = await supabase.from('job_applications').insert({
                job_id: job.id,
                staff_id: user.id
            });
            if (appError) throw appError;

            if (job.user_id) {
                await supabase.from('chat_messages').insert({
                    sender_id: user.id,
                    receiver_id: job.user_id,
                    contact_id: job.id,
                    content: `Chào bạn, tôi muốn ứng tuyển đơn hàng "${job.name}". Chúng ta trao đổi thêm nhé!`,
                    is_staff_reply: true
                });
            }

            toast.success("Đã gửi yêu cầu! Đang chuyển đến khung chat...");
            setMyApplications([...myApplications, job.id]);

            setTimeout(() => {
                navigate(`/job-chat/${job.id}/${job.user_id}`);
            }, 1000);

        } catch (err: unknown) {
            if (err instanceof Error) toast.error("Lỗi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 border-l-4 border-l-green-500">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Briefcase className="text-green-600" /> Sàn Việc Làm (Cơ hội mới)
            </h3>

            {jobs.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500">Hiện chưa có đơn hàng mới nào.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {jobs.map(job => {
                        const isApplied = myApplications.includes(job.id);
                        return (
                            <div key={job.id} className="border rounded-xl p-4 hover:shadow-md transition bg-green-50/30 relative">
                                <div className="absolute top-3 right-3 animate-pulse">
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">MỚI</span>
                                </div>

                                <h4 className="font-bold text-lg text-gray-800 mb-2">{job.name}</h4>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <p className="flex items-center gap-2"><MapPin size={14} className="text-orange-500" /> {job.address || "Chưa có địa chỉ"}</p>
                                    <p className="flex items-center gap-2"><Phone size={14} className="text-blue-500" /> {job.phone}</p>
                                    <p className="flex items-center gap-2"><Clock size={14} className="text-purple-500" /> {new Date(job.created_at).toLocaleString()}</p>
                                    <div className="bg-white p-2 rounded border text-gray-700 italic">"{job.message}"</div>
                                </div>

                                <Button
                                    onClick={() => handleApplyAndChat(job)}
                                    disabled={loading}
                                    className={`w-full font-bold shadow-sm transition-all ${isApplied
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {isApplied ? (
                                        <>
                                            <MessageCircle size={16} className="mr-2" /> Vào khung chat
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight size={16} className="mr-2" /> Trao đổi & Ứng tuyển
                                        </>
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}