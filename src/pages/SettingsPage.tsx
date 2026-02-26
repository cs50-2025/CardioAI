import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { motion } from 'motion/react';
import { 
  Moon, Sun, Bell, Globe, Shield, 
  Accessibility, Smartphone, Save, Loader2
} from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, updateSettings, logout } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(user?.settings || {
    darkMode: true,
    notifications: true,
    language: 'en',
    accessibility: false,
    alerts: true
  });

  const handleSave = async () => {
    setLoading(true);
    await updateSettings(localSettings);
    setLoading(false);
  };

  const toggle = (key: string) => {
    setLocalSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('settings')}</h1>
          <p className="text-white/40 text-sm mt-1">Manage your account preferences and system configuration.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-neon-blue text-black font-bold px-8 py-3 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {t('save')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-neon-blue" />
            Appearance
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg"><Moon className="w-4 h-4 text-white/60" /></div>
              <div>
                <p className="text-sm font-bold">{t('darkMode')}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">System-wide dark theme</p>
              </div>
            </div>
            <button 
              onClick={() => toggle('darkMode')}
              className={`w-12 h-6 rounded-full transition-all relative ${localSettings.darkMode ? 'bg-neon-blue' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.darkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg"><Globe className="w-4 h-4 text-white/60" /></div>
              <div>
                <p className="text-sm font-bold">{t('language')}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Interface language</p>
              </div>
            </div>
            <select 
              value={localSettings.language}
              onChange={(e) => setLocalSettings({...localSettings, language: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-neon-blue/50"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-neon-purple" />
            {t('notifications')}
          </h3>
          
          {[
            { key: 'notifications', label: t('notifications'), sub: 'Push notifications for messages' },
            { key: 'alerts', label: t('alerts'), sub: 'Critical health alerts' },
            { key: 'reminders', label: t('reminders'), sub: 'Workout and medication reminders' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{item.sub}</p>
              </div>
              <button 
                onClick={() => toggle(item.key)}
                className={`w-12 h-6 rounded-full transition-all relative ${localSettings[item.key] ? 'bg-neon-purple' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings[item.key] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Security & Privacy */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-neon-green" />
            Security
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg"><Smartphone className="w-4 h-4 text-white/60" /></div>
              <div>
                <p className="text-sm font-bold">Two-Factor Auth</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Enhanced account security</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Disabled</span>
          </div>
        </div>

        {/* Accessibility */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-4">
            <Accessibility className="w-5 h-5 text-neon-pink" />
            {t('accessibility')}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">High Contrast</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Improve visual clarity</p>
            </div>
            <button 
              onClick={() => toggle('accessibility')}
              className={`w-12 h-6 rounded-full transition-all relative ${localSettings.accessibility ? 'bg-neon-pink' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.accessibility ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
