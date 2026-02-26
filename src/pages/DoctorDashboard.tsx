import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, UserPlus, Trash2, Video, MessageSquare, 
  Activity, Heart, Droplets, Thermometer, User, ChevronRight, Loader2, X, Play, Bell, Users
} from 'lucide-react';

import VideoPlayer from '../components/VideoPlayer';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newPatient, setNewPatient] = useState(() => {
    const saved = localStorage.getItem('doctor_new_patient_draft');
    return saved ? JSON.parse(saved) : {
      name: '', age: '', heartRate: '', bloodPressure: '', cholesterol: '', spo2: '', difficulty: 'Medium',
      medications: [] as { name: string, time: string }[]
    };
  });

  useEffect(() => {
    localStorage.setItem('doctor_new_patient_draft', JSON.stringify(newPatient));
  }, [newPatient]);

  const [medInput, setMedInput] = useState({ name: '', time: '08:00' });

  const addMedication = () => {
    if (medInput.name) {
      setNewPatient(prev => ({
        ...prev,
        medications: [...prev.medications, { ...medInput }]
      }));
      setMedInput({ name: '', time: '08:00' });
    }
  };

  const removeMedication = (index: number) => {
    setNewPatient(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientWorkouts, setPatientWorkouts] = useState<any[]>([]);

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [user?.id]);

  const fetchWorkouts = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/workouts`);
      const data = await res.json();
      setPatientWorkouts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    fetchWorkouts(patient.id);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch(`/api/doctors/${user?.id}/patients`);
      const data = await res.json();
      setPatients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPatient, doctorId: user?.id })
      });
      if (res.ok) {
        setShowAddModal(false);
        const resetPatient = { 
          name: '', age: '', heartRate: '', bloodPressure: '', cholesterol: '', spo2: '', difficulty: 'Medium',
          medications: [] 
        };
        setNewPatient(resetPatient);
        localStorage.removeItem('doctor_new_patient_draft');
        fetchPatients();
        alert("Patient registered successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to register patient");
      }
    } catch (e) {
      console.error(e);
      alert("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatients(prev => prev.filter(p => p.id !== id));
        if (selectedPatient?.id === id) setSelectedPatient(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: patients.length, icon: Users, color: 'text-neon-blue' },
          { label: 'Active Alerts', value: '3', icon: Bell, color: 'text-red-400' },
          { label: 'Workouts Today', value: '12', icon: Activity, color: 'text-neon-green' },
          { label: 'Pending Messages', value: '5', icon: MessageSquare, color: 'text-neon-purple' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border-l-4 border-l-neon-blue"
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-white/40 font-medium uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-display font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Patients Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-neon-blue/50 transition-all"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-neon-blue text-black font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          {t('addPatient')}
        </button>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPatients.map((patient) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="glass p-6 rounded-3xl relative group overflow-hidden cursor-pointer hover:border-neon-blue/30 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold text-neon-blue">
                    {patient.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{patient.name}</h3>
                    <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{patient.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Video className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeletePatient(patient.id); }}
                    className="p-2 bg-white/5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'HR', value: patient.heart_rate, icon: Heart, color: 'text-red-400' },
                  { label: 'BP', value: patient.blood_pressure, icon: Activity, color: 'text-neon-blue' },
                  { label: 'SPO2', value: patient.spo2 + '%', icon: Droplets, color: 'text-neon-green' },
                  { label: 'CHOL', value: patient.cholesterol, icon: Activity, color: 'text-neon-purple' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`w-3 h-3 ${stat.color}`} />
                      <span className="text-[10px] text-white/40 font-bold uppercase">{stat.label}</span>
                    </div>
                    <p className="text-sm font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${patient.risk > 70 ? 'bg-red-500' : 'bg-neon-green'} animate-pulse`}></span>
                  <span className="text-xs font-medium text-white/60">Risk: {patient.risk || '45'}%</span>
                </div>
                <button className="text-xs font-bold text-neon-blue flex items-center gap-1 hover:underline">
                  View Full Report <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass p-8 rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-neon-blue/20 flex items-center justify-center text-2xl font-bold text-neon-blue">
                    {selectedPatient.name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">{selectedPatient.name}</h2>
                    <p className="text-sm text-white/40 uppercase tracking-widest">Patient Profile • {selectedPatient.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 text-white/40 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="glass p-6 rounded-2xl">
                    <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-neon-blue" />
                      Workout History
                    </h3>
                    
                    {selectedVideo && (
                      <div className="mb-6 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-neon-blue uppercase tracking-widest">Video Review</p>
                          <button onClick={() => setSelectedVideo(null)} className="text-[10px] text-white/40 hover:text-white uppercase font-bold">Close Player</button>
                        </div>
                        <VideoPlayer src={selectedVideo} />
                      </div>
                    )}

                    <div className="space-y-3">
                      {patientWorkouts.length > 0 ? patientWorkouts.map((w, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 ${w.logType === 'medication' ? 'bg-neon-purple/20' : 'bg-neon-green/20'} rounded-lg`}>
                              {w.logType === 'medication' ? (
                                <Droplets className="w-4 h-4 text-neon-purple" />
                              ) : (
                                <Play className="w-4 h-4 text-neon-green" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{w.type} {w.logType === 'medication' ? 'Taken' : 'Session'}</p>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest">{new Date(w.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          {w.video_url && (
                            <button 
                              onClick={() => setSelectedVideo(w.video_url)}
                              className="text-xs font-bold text-neon-blue flex items-center gap-1 hover:underline"
                            >
                              <Video className="w-3 h-3" /> Watch Video
                            </button>
                          )}
                        </div>
                      )) : (
                        <p className="text-sm text-white/20 text-center py-8">No workouts recorded yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass p-6 rounded-2xl border-l-4 border-l-red-400">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Health Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-xs text-white/40">Risk Score</span>
                        <span className="text-sm font-bold text-red-400">72%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-white/40">Difficulty</span>
                        <span className="text-sm font-bold text-neon-blue">{selectedPatient.difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-white/40">Age</span>
                        <span className="text-sm font-bold">{selectedPatient.age}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedPatient(null); /* Navigate to messages */ }}
                    className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Message
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass p-8 rounded-3xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold flex items-center gap-3">
                  <UserPlus className="text-neon-blue" />
                  Register New Patient
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-white/40 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Full Name</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Age</label>
                  <input 
                    type="number" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Heart Rate (bpm)</label>
                  <input 
                    type="number" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.heartRate}
                    onChange={(e) => setNewPatient({...newPatient, heartRate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Blood Pressure (mmHg)</label>
                  <input 
                    placeholder="120/80" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.bloodPressure}
                    onChange={(e) => setNewPatient({...newPatient, bloodPressure: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Cholesterol (mg/dL)</label>
                  <input 
                    type="number" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.cholesterol}
                    onChange={(e) => setNewPatient({...newPatient, cholesterol: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">SPO2 (%)</label>
                  <input 
                    type="number" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.spo2}
                    onChange={(e) => setNewPatient({...newPatient, spo2: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Fitness Difficulty</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                    value={newPatient.difficulty}
                    onChange={(e) => setNewPatient({...newPatient, difficulty: e.target.value})}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Medications</label>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Medication Name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                      value={medInput.name}
                      onChange={(e) => setMedInput({...medInput, name: e.target.value})}
                    />
                    <input 
                      type="time"
                      className="w-32 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-neon-blue/50"
                      value={medInput.time}
                      onChange={(e) => setMedInput({...medInput, time: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={addMedication}
                      className="bg-neon-blue text-black font-bold px-4 rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {newPatient.medications.map((med, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <Droplets className="w-4 h-4 text-neon-blue" />
                          <span className="text-sm font-bold">{med.name}</span>
                          <span className="text-xs text-white/40">at {med.time}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeMedication(i)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    disabled={loading}
                    className="w-full bg-neon-blue text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Patient'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
