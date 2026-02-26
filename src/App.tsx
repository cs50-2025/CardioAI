import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import FitnessPage from './pages/FitnessPage';
import MeditationPage from './pages/MeditationPage';
import MessagesPage from './pages/MessagesPage';
import ChatbotPage from './pages/ChatbotPage';
import SettingsPage from './pages/SettingsPage';

import { useState, useEffect } from 'react';
import MedicationReminderModal from './components/MedicationReminderModal';
import DailyActivityReminderModal from './components/DailyActivityReminderModal';
import AntigravityCursor from './components/AntigravityCursor';
import { useNavigate, useLocation } from 'react-router-dom';

function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMedication, setActiveMedication] = useState<any>(null);
  const [showDailyReminder, setShowDailyReminder] = useState(false);
  const [remindLaterTime, setRemindLaterTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('daily_reminder_snooze');
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    if (remindLaterTime) {
      localStorage.setItem('daily_reminder_snooze', remindLaterTime.toString());
    } else {
      localStorage.removeItem('daily_reminder_snooze');
    }
  }, [remindLaterTime]);

  // Medication Check
  useEffect(() => {
    if (user?.role !== 'patient') return;

    const checkMeds = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const medications = Array.isArray(user.medications) ? user.medications : [];
      const medToTake = medications.find((m: any) => m.time === currentTime);
      if (medToTake) {
        const lastTaken = localStorage.getItem(`med_${medToTake.name}_${now.toDateString()}`);
        if (!lastTaken) {
          setActiveMedication(medToTake);
        }
      }
    };

    const interval = setInterval(checkMeds, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Daily Activity Check
  useEffect(() => {
    if (user?.role !== 'patient' || location.pathname === '/fitness' || location.pathname === '/meditation') return;

    const checkDaily = async () => {
      const now = new Date();
      const today = now.toDateString();
      const lastDismissed = localStorage.getItem(`daily_reminder_${today}`);
      
      if (lastDismissed) return;
      if (remindLaterTime && Date.now() < remindLaterTime) return;

      try {
        const res = await fetch(`/api/patients/${user.id}/workouts`);
        const workouts = await res.json();
        
        const todayWorkouts = workouts.filter((w: any) => new Date(w.timestamp).toDateString() === today);
        const hasFitness = todayWorkouts.some((w: any) => w.type === 'Fitness');
        const hasMeditation = todayWorkouts.some((w: any) => w.type === 'Meditation');

        if (!hasFitness || !hasMeditation) {
          setShowDailyReminder(true);
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkDaily();
    const interval = setInterval(checkDaily, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname, remindLaterTime]);

  const handleMedComplete = async (videoUrl: string) => {
    if (!activeMedication || !user) return;
    try {
      await fetch('/api/medication-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          medicationName: activeMedication.name,
          videoUrl
        })
      });
      localStorage.setItem(`med_${activeMedication.name}_${new Date().toDateString()}`, 'true');
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <>
        <AntigravityCursor />
        <AuthPage />
      </>
    );
  }

  return (
    <>
      <AntigravityCursor />
      <Layout>
        <Routes>
          <Route path="/" element={user.role === 'doctor' ? <DoctorDashboard /> : <PatientDashboard />} />
          {user.role === 'doctor' && (
            <>
              <Route path="/patients" element={<DoctorDashboard />} />
            </>
          )}
          {user.role === 'patient' && (
            <>
              <Route path="/fitness" element={<FitnessPage />} />
              <Route path="/meditation" element={<MeditationPage />} />
            </>
          )}
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {activeMedication && (
        <MedicationReminderModal 
          medication={activeMedication}
          onComplete={handleMedComplete}
          onClose={() => setActiveMedication(null)}
        />
      )}

      {showDailyReminder && (
        <DailyActivityReminderModal 
          onSendNow={() => {
            setShowDailyReminder(false);
            navigate('/fitness');
          }}
          onRemindLater={() => {
            setShowDailyReminder(false);
            setRemindLaterTime(Date.now() + 10 * 60 * 1000);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
