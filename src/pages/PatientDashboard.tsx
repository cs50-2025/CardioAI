import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { predictRisk } from '../services/geminiService';
import { motion } from 'motion/react';
import { 
  Heart, Activity, Droplets, Thermometer, 
  Calendar, Bell, MessageSquare, TrendingUp,
  Shield, Info, AlertTriangle, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock ECG data
  const ecgData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: 60 + Math.random() * 20 + (i % 5 === 0 ? 40 : 0)
  }));

  useEffect(() => {
    const getRisk = async () => {
      const data = await predictRisk(user);
      setRiskData(data);
      setLoading(false);
    };
    getRisk();
  }, [user]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            {t('welcome')}, <span className="text-neon-blue">{user?.name}</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Your cardiovascular health is our priority.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Health Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('heartRate'), value: user?.heart_rate, unit: 'bpm', icon: Heart, color: 'text-red-400', trend: '+2' },
          { label: t('bloodPressure'), value: user?.blood_pressure, unit: 'mmHg', icon: Activity, color: 'text-neon-blue', trend: 'Stable' },
          { label: t('spo2'), value: user?.spo2, unit: '%', icon: Droplets, color: 'text-neon-green', trend: 'Optimal' },
          { label: t('cholesterol'), value: user?.cholesterol, unit: 'mg/dL', icon: Activity, color: 'text-neon-purple', trend: '-5' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <p className="text-xs text-white/40 font-bold uppercase mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-display font-bold">{stat.value}</p>
              <span className="text-[10px] text-white/40 font-mono">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Risk Prediction Card */}
        {user?.settings?.alerts && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 glass rounded-3xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-neon-blue" />
                {t('risk')}
              </h3>
              <div className="px-3 py-1 bg-neon-blue/10 border border-neon-blue/20 rounded-full">
                <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">AI Analysis</span>
              </div>
            </div>
            
            <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96" cy="96" r="88"
                      className="stroke-white/5 fill-none"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="96" cy="96" r="88"
                      className="stroke-neon-blue fill-none"
                      strokeWidth="12"
                      strokeDasharray={552}
                      initial={{ strokeDashoffset: 552 }}
                      animate={{ strokeDashoffset: 552 - (552 * (riskData?.riskScore || 0)) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-bold">{riskData?.riskScore || '--'}%</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{riskData?.riskLevel || 'Calculating'}</span>
                  </div>
                </div>
                <p className="mt-6 text-sm text-white/60 leading-relaxed italic">
                  "{riskData?.insights || 'Analyzing your health data to provide personalized insights...'}"
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-400" /> Risk Factors
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {riskData?.factors?.map((f: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-red-400/10 border border-red-400/20 rounded-lg text-xs text-red-400 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-neon-green" /> Preventive Actions
                  </h4>
                  <ul className="space-y-2">
                    {riskData?.suggestions?.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-red-400/5 border-t border-red-400/10 flex items-center gap-3">
              <Info className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                WARNING: Not real monitoring. Consult a professional.
              </p>
            </div>
          </motion.div>
        )}

        {/* Real-time ECG Visualization */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-3xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-green" />
              Live ECG
            </h3>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest">Live</span>
            </span>
          </div>
          <div className="flex-1 p-4 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ecgData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#39ff14' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#39ff14" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="p-6 bg-white/5 border-t border-white/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-bold uppercase tracking-widest">Avg Heart Rate</span>
              <span className="text-neon-green font-mono font-bold">72 BPM</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workout Calendar */}
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neon-purple" />
              {t('workoutCalendar')}
            </h3>
            <button className="text-xs font-bold text-neon-purple hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { day: 'Mon', type: 'Cardio', status: 'Completed', color: 'bg-neon-green' },
              { day: 'Tue', type: 'Yoga', status: 'Completed', color: 'bg-neon-green' },
              { day: 'Wed', type: 'Strength', status: 'Pending', color: 'bg-white/20' },
              { day: 'Thu', type: 'Cardio', status: 'Upcoming', color: 'bg-white/10' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">{item.day}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.type}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{item.status}</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Messages Preview */}
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-neon-pink" />
              Recent Activity
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { icon: MessageSquare, text: 'Dr. Smith sent you a message', time: '2h ago', color: 'text-neon-blue', show: true },
              { icon: Shield, text: 'AI Risk Assessment updated', time: '5h ago', color: 'text-neon-purple', show: user?.settings?.alerts },
              { icon: Activity, text: 'Workout reminder: Time to exercise!', time: 'Now', color: 'text-neon-green', show: user?.settings?.reminders },
            ].filter(i => i.show).map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer">
                <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
