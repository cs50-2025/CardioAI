const translations: any = {
  en: {
    welcome: "Welcome back",
    dashboard: "Dashboard",
    patients: "Patients",
    messages: "Messages",
    settings: "Settings",
    risk: "Cardiovascular Risk",
    heartRate: "Heart Rate",
    bloodPressure: "Blood Pressure",
    cholesterol: "Cholesterol",
    spo2: "SPO2",
    fitness: "Fitness",
    meditation: "Meditation",
    chatbot: "AI Assistant",
    logout: "Logout",
    addPatient: "Add Patient",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this patient?",
    startWorkout: "Start Workout",
    startMeditation: "Start Meditation",
    difficulty: "Difficulty",
    age: "Age",
    name: "Name",
    save: "Save",
    notifications: "Notifications",
    darkMode: "Dark Mode",
    language: "Language",
    accessibility: "Accessibility",
    alerts: "Alerts",
    reminders: "Reminders"
  },
  es: {
    welcome: "Bienvenido de nuevo",
    dashboard: "Panel",
    patients: "Pacientes",
    messages: "Mensajes",
    settings: "Ajustes",
    risk: "Riesgo Cardiovascular",
    heartRate: "Frecuencia Cardíaca",
    bloodPressure: "Presión Arterial",
    cholesterol: "Colesterol",
    spo2: "SPO2",
    fitness: "Fitness",
    meditation: "Meditación",
    chatbot: "Asistente AI",
    logout: "Cerrar Sesión",
    addPatient: "Añadir Paciente",
    delete: "Eliminar",
    confirmDelete: "¿Estás seguro de que quieres eliminar a este paciente?",
    startWorkout: "Empezar Entrenamiento",
    startMeditation: "Empezar Meditación",
    difficulty: "Dificultad",
    age: "Edad",
    name: "Nombre",
    save: "Guardar",
    notifications: "Notificaciones",
    darkMode: "Modo Oscuro",
    language: "Idioma",
    accessibility: "Accesibilidad",
    alerts: "Alertas",
    reminders: "Recordatorios"
  }
};

export function useTranslation(lang: string = 'en') {
  const t = (key: string) => {
    return translations[lang]?.[key] || translations['en'][key] || key;
  };
  return { t };
}
