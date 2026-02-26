import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, User, Lock, Loader2, ArrowRight, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isDoctor, setIsDoctor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', password: '', patientId: '' });
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let url = '';
      let body = {};

      if (isDoctor) {
        url = isLogin ? '/api/auth/doctor/login' : '/api/auth/doctor/signup';
        body = { name: formData.name, password: formData.password };
      } else {
        url = isLogin ? '/api/auth/patient/login' : '/api/auth/patient/signup';
        body = isLogin ? { id: formData.patientId } : { name: formData.name };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        if (!isLogin && !isDoctor) {
          setSuccessMessage(`Account created! Your Patient ID is: ${data.user.id}. Please save this to sign in.`);
          setIsLogin(true);
          setFormData({ ...formData, patientId: data.user.id });
        } else {
          login(data.token, data.user);
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#050505] text-white overflow-hidden">
      {/* Left Side: Branding & Visuals */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-8 lg:p-16 bg-gradient-to-br from-black to-zinc-900 border-r border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-neon-blue/10 rounded-xl border border-neon-blue/20">
              <Activity className="w-8 h-8 text-neon-blue" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">Cardio<span className="text-neon-blue">AI</span></span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-6xl lg:text-8xl font-display font-bold leading-[0.9] tracking-tighter mb-8">
              THE FUTURE <br />
              OF HEART <br />
              <span className="text-neon-blue">HEALTH.</span>
            </h1>
            <p className="text-white/40 max-w-md text-lg leading-relaxed">
              Advanced cardiovascular intelligence for doctors and patients. 
              Real-time monitoring, AI-driven insights, and personalized care.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 mt-12 lg:mt-0">
          <div className="flex gap-8 items-center">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i + 10}/100/100`} alt="user" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40">
              Trusted by <span className="text-white font-medium">2,000+</span> medical professionals worldwide.
            </p>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-neon-blue/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full" />
      </div>

      {/* Right Side: Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-display font-bold mb-2">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-white/40">
              {isLogin ? 'Sign in to access your dashboard' : 'Create your account to start monitoring'}
            </p>
          </div>

          <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/10">
            <button 
              onClick={() => { setIsDoctor(true); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${isDoctor ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              Doctor
            </button>
            <button 
              onClick={() => { setIsDoctor(false); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${!isDoctor ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              Patient
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isDoctor ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Username</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-blue transition-colors" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-neon-blue/50 focus:bg-white/10 transition-all"
                      placeholder="Dr. Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-blue transition-colors" />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-neon-blue/50 focus:bg-white/10 transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {!isLogin ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-blue transition-colors" />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-neon-blue/50 focus:bg-white/10 transition-all"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Patient ID</label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-blue transition-colors" />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-neon-blue/50 focus:bg-white/10 transition-all"
                        placeholder="e.g. P12345"
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </motion.div>
              )}
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-neon-green/10 border border-neon-green/20 rounded-2xl flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                  <p className="text-neon-green text-sm font-medium leading-relaxed">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="w-full bg-neon-blue hover:bg-neon-blue/90 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(0,242,255,0.15)]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <span className="text-lg">{isLogin ? (isDoctor ? 'Sign In' : 'Access Dashboard') : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-white hover:text-neon-blue font-bold transition-colors ml-1"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>

        {/* Footer Links */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </div>
  );
}
