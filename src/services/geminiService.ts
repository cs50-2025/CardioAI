import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function predictRisk(patientData: any) {
  const prompt = `Analyze the following cardiovascular patient data and provide a risk assessment:
    Name: ${patientData.name}
    Age: ${patientData.age}
    Heart Rate: ${patientData.heart_rate} bpm
    Blood Pressure: ${patientData.blood_pressure}
    Cholesterol: ${patientData.cholesterol} mg/dL
    SPO2: ${patientData.spo2}%
    
    Provide a JSON response with:
    1. riskScore (0-100)
    2. riskLevel (Low, Medium, High)
    3. factors (array of strings)
    4. suggestions (array of strings)
    5. insights (short paragraph)`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            factors: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            insights: { type: Type.STRING }
          },
          required: ["riskScore", "riskLevel", "factors", "suggestions", "insights"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Risk prediction error:", error);
    return {
      riskScore: 45,
      riskLevel: "Moderate",
      factors: ["Age", "Blood Pressure"],
      suggestions: ["Regular exercise", "Low sodium diet"],
      insights: "Unable to reach AI service. Showing estimated data."
    };
  }
}

export async function chatWithAI(message: string, context: string) {
  const prompt = `You are a professional cardiovascular AI assistant. 
  Context: ${context}
  User Message: ${message}
  
  Provide a helpful, empathetic, and medically accurate (but with a disclaimer) response. Keep it concise.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
