interface SymptomData {
  symptom: string;
  severity: number;
  timestamp: string;
  id?: string;
}

interface Insight {
  type: 'pattern' | 'alert' | 'recommendation' | 'education';
  message: string;
  severity: 'low' | 'medium' | 'high';
  confidence?: number;
  tierLevel?: SubscriptionTier;
}

type SubscriptionTier = 'community_advocate' | 'health_champion' | 'global_advocate';

// Google Gemini API integration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Available: gemini-pro, gemini-2.0-flash-exp

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    console.warn('⚠️ Google Gemini API key not configured. Using local AI processing.');
    return generateLocalAIInsight(prompt);
  }

  try {
    console.log(`🤖 Calling Google Gemini model: ${GEMINI_MODEL}`);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topK: 40,
          topP: 0.8,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error (${response.status}):`, errorText);

      if (response.status === 401 || response.status === 403) {
        console.error('❌ Invalid Google Gemini API key. Check your token at https://makersuite.google.com/app/apikey');
        return generateLocalAIInsight(prompt);
      }
      if (response.status === 429) {
        console.warn('📊 Gemini rate limited, using local processing');
        return generateLocalAIInsight(prompt);
      }
      if (response.status === 404) {
        console.warn(`🚫 Gemini model ${GEMINI_MODEL} not found`);
        return generateLocalAIInsight(prompt);
      }
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Extract content from Gemini response
    let content = '';
    if (result.candidates && result.candidates[0]?.content?.parts) {
      content = result.candidates[0].content.parts.map((part: any) => part.text || '').join(' ');
    }

    if (content && content.length > 10) {
      console.log(`✅ Successful Gemini response from ${GEMINI_MODEL}`);
      return content.trim();
    } else {
      console.warn(`⚠️ Empty response from ${GEMINI_MODEL}, using local processing`);
      return generateLocalAIInsight(prompt);
    }

  } catch (error) {
    console.error('💥 Google Gemini API call failed:', error);
    console.log('🔄 Falling back to local AI processing');
    return generateLocalAIInsight(prompt);
  }
}

// Enhanced local AI processing for medical insights
function generateLocalAIInsight(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract symptom information from prompt
      const symptomMatch = prompt.match(/symptom:?\s*([^,\(\n]+)/i);
      const symptom = symptomMatch ? symptomMatch[1].trim().toLowerCase() : 'symptom';

      const severityMatch = prompt.match(/severity:?\s*(?:level\s*)?(\d+)/i);
      const severity = severityMatch ? parseInt(severityMatch[1]) : 2;

      // Symptom-specific medical recommendations
      if (symptom.includes('headache') || symptom.includes('pain') && prompt.includes('head')) {
        if (severity >= 4) {
          resolve("🚨 CRITICAL: Severe headache detected with neurological symptoms. IMMEDIATELY seek medical attention. Possible causes include meningitis, stroke, or brain injury. Do not delay - call emergency services.");
        } else if (severity >= 3) {
          resolve("⚠️ Moderate to severe headache pattern requires attention. Consider migraine, tension headache, or medication rebound. Track triggers: caffeine, stress, screen time, or poor sleep. If accompanied by nausea, vomiting, or visual changes, consult a healthcare provider within 24 hours.");
        } else {
          resolve("📊 Headache logged and analyzed. Common triggers include dehydration (aim for 8 glasses of water daily), screen fatigue, or stress. Try the '5-10-15 rule': blink every 5 seconds, look at something 10 feet away for 10 seconds, repeat every 15 minutes. Monitor pattern for preventive care.");
        }
      }

      else if (symptom.includes('chest pain') || symptom.includes('chest') && symptom.includes('pain')) {
        if (severity >= 4) {
          resolve("🚨 URGENT MEDICAL EMERGENCY: Severe chest pain could indicate heart attack, pulmonary embolism, or aortic dissection. CALL EMERGENCY 911/112 immediately. DO NOT DELAY - every minute counts for heart attack treatment.");
        } else {
          resolve("⚠️ Chest pain requires immediate evaluation. Could indicate cardiac issues, gastrointestinal problems, or musculoskeletal pain. Do not ignore - seek medical consultation promptly. Note: any chest pain should be evaluated professionally.");
        }
      }

      else if (symptom.includes('fever') || symptom.includes('temperature') || symptom.includes('hot')) {
        if (severity >= 4) {
          resolve("🔥 HIGH FEVER ALERT: Body temperature above 103°F/39.4°C requires immediate medical attention. Could indicate serious infection. Seek emergency care. In the meantime: stay hydrated, use damp cloth on forehead, take fever-reducing medication if appropriate.");
        } else {
          resolve("🌡️ Fever detected. Monitor temperature closely: oral >100.4°F/38°C = fever. Common causes: viral infections, bacterial infections, or inflammatory conditions. If fever >102°F persistently or accompanied by severe symptoms, seek medical care.");
        }
      }

      else if (symptom.includes('nausea') || symptom.includes('vomit') || symptom.includes('stomach')) {
        if (severity >= 4) {
          resolve("🚨 Severe nausea/gastrointestinal distress requires immediate medical attention. If accompanied by dehydration signs (dry mouth, dizziness), severe vomiting, or blood in stool/vomit - seek immediate medical attention.");
        } else {
          resolve("🤢 Gastrointestinal symptoms logged. Common causes include dietary indiscretions, stress, or viral infections. Try BRAT diet: Bananas, Rice, Applesauce, Toast. Stay hydrated. If persists >48 hours or accompanied by severe pain, consult healthcare provider.");
        }
      }

      else if (symptom.includes('fatigue') || symptom.includes('tired') || symptom.includes('exhaust')) {
        if (severity >= 4) {
          resolve("⚡ EXTREME FATIGUE may indicate serious conditions like anemia, thyroid dysfunction, depression, or heart disease. Requires comprehensive medical evaluation including blood work. Rest but seek medical advice - this is NOT normal fatigue.");
        } else {
          resolve("😴 Fatigue pattern detected. Could be due to poor sleep quality, lifestyle factors, nutritional deficiencies, or underlying conditions. Track: sleep duration/quality, diet, exercise, stress levels. Consider sleep hygiene improvements: consistent bedtime, cool/dark room, reduce screen time.");
        }
      }

      else if (symptom.includes('cough') || symptom.includes('throat')) {
        if (severity >= 4) {
          resolve("🔊 Severe cough may indicate serious respiratory condition requiring immediate medical attention. If accompanied by shortness of breath, chest pain, high fever, or wheezing - seek emergency care. Active coughing fits >10 minutes need evaluation.");
        } else {
          resolve("😷 Respiratory symptoms noted. Could be viral infection, allergies, or environmental irritants. Home remedies: honey/warm water, humidifier, throat lozenges. Monitor for improvement. If lasts >2 weeks, worsens, or accompanied by fever/difficulty breathing, see healthcare provider.");
        }
      }

      else if (severity >= 4) {
        resolve(`🚨 HIGH SEVERITY ALERT: You logged "${symptom}" as very severe. This level suggests possible serious medical condition requiring immediate professional evaluation. Please don't delay - contact healthcare provider or seek appropriate medical care based on symptom type.`);
      }

      else if (severity >= 3) {
        resolve(`⚠️ MODERATE SYMPTOM: "${symptom}" in moderate severity range. Monitor closely for changes. Consider consulting healthcare provider for proper evaluation and management plan. Track related factors: timing, triggers, accompanying symptoms.`);
      }

      else {
        resolve(`📝 Symptom logged: "${symptom}". Good tracking! Continue monitoring for patterns. For personalized medical advice, consult with your healthcare provider. Remember: this is not medical advice - always consult qualified healthcare professionals for medical concerns.`);
      }
    }, Math.random() * 400 + 200); // Simulate AI processing time
  });
}

// Legacy compatibility function
async function callHuggingFaceAPI(prompt: string): Promise<string> {
  return callGeminiAPI(prompt);
}

export async function generateAIInsights(symptoms: SymptomData[], tier: SubscriptionTier = 'community_advocate'): Promise<Insight[]> {
  if (symptoms.length === 0) {
    return [{
      type: 'education',
      message: 'Welcome to Afya Intelligence! Start logging your symptoms to receive personalized AI health insights and track patterns over time.',
      severity: 'low',
      tierLevel: 'community_advocate'
    }];
  }

  const insights: Insight[] = [];
  const isAdvancedTier = tier === 'health_champion' || tier === 'global_advocate';

  // Generate AI insights or fall back to local processing
  if (isAdvancedTier && GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
    try {
      const symptomHistory = symptoms.slice(0, Math.min(symptoms.length, 5))
        .map((s, i) => `Symptom ${i+1}: ${s.symptom} (severity: ${s.severity}/5)`)
        .join('\n');

      const prompt = `Provide a brief medical insight for: "${symptoms[0].symptom}" (severity: ${symptoms[0].severity}/5).

Recent context (${Math.min(symptoms.length, 5)} symptoms): ${symptomHistory}

Focus on safety, preventive measures, and when to seek professional help. Keep response under 150 words.`;

      const aiResponse = await callGeminiAPI(prompt);
      insights.push({
        type: 'pattern',
        message: aiResponse,
        severity: 'medium',
        confidence: 0.8,
        tierLevel: 'health_champion'
      });
    } catch (error) {
      console.error('AI insight generation failed:', error);
      const localInsight = generateBasicSymptomInsight(symptoms[0], symptoms[0].severity, tier);
      insights.push(localInsight);
    }
  }

  // Add pattern analysis and severe symptom checks
  const patternInsights = analyzeSymptomPatterns(symptoms, tier);
  insights.push(...patternInsights);

  const severityAlerts = checkSevereSymptoms(symptoms, tier);
  if (severityAlerts.length > 0) {
    insights.push(...severityAlerts);
  }

  // Ensure we have at least 2 insights
  if (insights.length < 2) {
    const educationalInsight = getEducationalInsight(tier);
    if (educationalInsight) insights.push(educationalInsight);
  }

  return insights;
}

function generateBasicSymptomInsight(symptom: SymptomData, severity: number, tier: SubscriptionTier): Insight {
  const symptomText = symptom.symptom.toLowerCase();

  if (symptomText.includes('headache')) {
    if (severity >= 4) {
      return {
        type: 'alert',
        message: `Severe headache logged. Track patterns and consider professional consultation. Monitor for neurological symptoms.`,
        severity: 'high',
        confidence: 0.8,
        tierLevel: tier
      };
    } else {
      return {
        type: 'recommendation',
        message: `Headache symptoms tracked. Consider hydration, screen breaks, and stress management. Persistent headaches may require medical evaluation.`,
        severity: 'medium',
        confidence: 0.6,
        tierLevel: tier
      };
    }
  }

  if (symptomText.includes('fatigue')) {
    return {
      type: 'pattern',
      message: `Fatigue symptoms detected. Consider lifestyle factors including sleep quality, nutrition, and stress management. Persistent fatigue warrants professional evaluation.`,
      severity: 'medium',
      confidence: 0.7,
      tierLevel: tier
    };
  }

  return {
    type: 'recommendation',
    message: `${symptom.symptom} symptom logged. Continue tracking patterns for better health insights. Regular health monitoring supports proactive wellness.`,
    severity: severity >= 3 ? 'medium' : 'low',
    confidence: 0.5,
    tierLevel: tier
  };
}

function analyzeSymptomPatterns(symptoms: SymptomData[], tier: SubscriptionTier): Insight[] {
  const insights: Insight[] = [];
  const isAdvancedTier = tier === 'health_champion' || tier === 'global_advocate';

  if (symptoms.length >= 2) {
    const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;

    if (avgSeverity >= 4) {
      insights.push({
        type: 'alert',
        message: 'High average symptom severity detected. Consider comprehensive health evaluation for underlying conditions.',
        severity: 'high',
        confidence: 0.8,
        tierLevel: tier
      });
    } else if (avgSeverity >= 3) {
      insights.push({
        type: 'pattern',
        message: 'Moderate symptom severity pattern observed. Monitor progression and implement preventive lifestyle measures.',
        severity: 'medium',
        confidence: 0.6,
        tierLevel: tier
      });
    }
  }

  if (isAdvancedTier && symptoms.length >= 3) {
    const headacheCount = symptoms.filter(s => s.symptom.toLowerCase().includes('headache')).length;
    if (headacheCount >= 2) {
      insights.push({
        type: 'pattern',
        message: 'Frequent headache pattern detected. Consider environmental factors, hydration, and stress management. Track timing for triggers.',
        severity: 'medium',
        confidence: 0.7,
        tierLevel: 'global_advocate'
      });
    }
  }

  return insights;
}

function checkSevereSymptoms(symptoms: SymptomData[], tier: SubscriptionTier): Insight[] {
  const alerts: Insight[] = [];
  const recentSymptoms = symptoms.slice(0, Math.min(symptoms.length, 10));
  const highSeveritySymptoms = recentSymptoms.filter(s => s.severity >= 4);

  if (highSeveritySymptoms.length >= 2) {
    alerts.push({
      type: 'alert',
      message: `Multiple high-severity symptoms detected recently (${highSeveritySymptoms.length}). This pattern warrants professional medical evaluation.`,
      severity: 'high',
      confidence: 0.9,
      tierLevel: tier
    });
  }

  // Check for emergency symptoms
  const emergencySymptoms = symptoms.filter(s =>
    (s.symptom.toLowerCase().includes('chest pain') ||
     s.symptom.toLowerCase().includes('difficulty breathing') ||
     (s.symptom.toLowerCase().includes('fever') && s.severity >= 4))
  );

  if (emergencySymptoms.length > 0) {
    alerts.push({
      type: 'alert',
      message: `EMERGENCY SYMPTOMS DETECTED: Please seek immediate medical attention. Call emergency services if symptoms are severe or worsening.`,
      severity: 'high',
      confidence: 1.0,
      tierLevel: tier
    });
  }

  return alerts;
}

export function getEducationalInsight(tier: SubscriptionTier = 'community_advocate'): Insight {
  const insights = [
    {
      type: 'education' as const,
      message: 'Did you know? Regular symptom tracking can help identify patterns and support proactive health management.',
      severity: 'low' as const,
      confidence: 0.5,
      tierLevel: tier
    },
    {
      type: 'education' as const,
      message: 'Health tip: Include context like time of day, recent eating habits, or stress levels for more meaningful insights.',
      severity: 'low' as const,
      confidence: 0.5,
      tierLevel: tier
    },
    {
      type: 'education' as const,
      message: 'Your symptom data contributes to health research. Thank you for helping advance global wellness initiatives.',
      severity: 'low' as const,
      confidence: 0.5,
      tierLevel: tier
    }
  ];

  return insights[Math.floor(Math.random() * insights.length)];
}
