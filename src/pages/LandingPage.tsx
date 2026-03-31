import { motion } from 'motion/react';
import { 
  Activity, Heart, Shield, Zap, 
  ChevronRight, Play, CheckCircle2, 
  ArrowRight, Smartphone, MessageSquare, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Register & Connect",
      desc: "Sign up as a patient or doctor. Doctors can register patients and monitor their health in real-time.",
      icon: Smartphone,
      color: "text-neon-blue"
    },
    {
      title: "Daily Training",
      desc: "Complete AI-guided fitness and meditation sessions tailored to your specific cardiovascular needs.",
      icon: Zap,
      color: "text-neon-purple"
    },
    {
      title: "AI Monitoring",
      desc: "Our AI watches your form and vitals, providing instant feedback and recording sessions for your doctor.",
      icon: Brain,
      color: "text-neon-green"
    },
    {
      title: "Stay Connected",
      desc: "Message your doctor directly, receive medication reminders, and track your progress daily.",
      icon: MessageSquare,
      color: "text-neon-pink"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Marquee Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-[0.03] pointer-events-none select-none">
          <div className="flex whitespace-nowrap animate-marquee text-[20rem] font-bold leading-none">
            <span>HEARTAI PRECISION CARE HEARTAI PRECISION CARE&nbsp;</span>
            <span>HEARTAI PRECISION CARE HEARTAI PRECISION CARE&nbsp;</span>
          </div>
        </div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Animated Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] animate-pulse" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] uppercase bg-muted/30 border border-border rounded-full text-neon-blue">
              The Future of Cardiac Care
            </span>
            <h1 className="text-6xl md:text-8xl font-display font-bold mb-8 tracking-tighter leading-[0.9]">
              HEART<span className="text-neon-blue">AI</span> <br />
              <span className="text-muted-foreground">PRECISION HEALTH.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
              An advanced AI-driven platform connecting patients and doctors for real-time cardiovascular monitoring, guided training, and seamless care.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-neon-blue text-primary-foreground font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-muted translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  Get Started Now <ArrowRight className="w-5 h-5" />
                </span>
              </button>
              <button className="px-8 py-4 bg-muted/30 border border-border rounded-2xl font-bold hover:bg-muted/50 transition-all">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground/50"
        >
          <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-current rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Steps Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="mb-24 text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">How it Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Follow these simple steps to start your journey towards better heart health with HeartAI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 glass rounded-[32px] border-border/50 hover:border-neon-blue/20 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${step.color}`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-muted/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 leading-tight">
                Empowering Patients, <br />
                Informing Doctors.
              </h2>
              <div className="space-y-8">
                {[
                  { title: "Real-time Vitals", desc: "Monitor heart rate, blood pressure, and SPO2 with precision." },
                  { title: "Guided Workouts", desc: "AI-powered fitness sessions that correct your form instantly." },
                  { title: "Medication Reminders", desc: "Never miss a dose with smart, video-verified reminders." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-blue/20 flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-neon-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square glass rounded-[40px] overflow-hidden border-border p-4">
                <img 
                  src="https://picsum.photos/seed/heart/800/800" 
                  alt="Heart Health" 
                  className="w-full h-full object-cover rounded-[32px] opacity-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-12 left-12 right-12 p-8 glass rounded-3xl border-neon-blue/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-neon-blue/20 flex items-center justify-center">
                      <Activity className="text-neon-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Live Monitoring</p>
                      <p className="text-xl font-bold">72 BPM</p>
                    </div>
                  </div>
                  <div className="h-12 flex items-end gap-1">
                    {[...Array(20)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: [20, 40, 20] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                        className="flex-1 bg-neon-blue/40 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-display font-bold mb-8">HEART<span className="text-neon-blue">AI</span></h3>
          <p className="text-muted-foreground/50 text-sm mb-8">© 2026 HeartAI. All rights reserved.</p>
          <div className="flex justify-center gap-8 text-muted-foreground text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-neon-blue transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neon-blue transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neon-blue transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
