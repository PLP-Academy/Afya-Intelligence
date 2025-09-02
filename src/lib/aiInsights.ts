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
  tierLevel?: 'basic' | 'advanced';
}

type SubscriptionTier = 'community_advocate' | 'health_champion' | 'global_advocate';

const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;
const HUGGING_FACE_MODEL = 'microsoft/DialoGPT-medium'; // For conversational AI insights

async function callHuggingFaceAPI(prompt: string): Promise<string> {
  if (!HUGGING_FACE_API_KEY || HUGGING_FACE_API_KEY.trim() === '') {
    console.warn('Hugging Face API key not configured. Check your .env file for VITE_HUGGING_FACE_API_KEY');
    return getFallbackInsight(prompt);
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Hugging Face API key invalid. Please check your API key at https://huggingface.co/settings/tokens');
        return getFallbackInsight(prompt);
      }
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Handle different response formats
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    } else if (typeof result.generated_text === 'string') {
      return result.generated_text;
    }

    console.warn('Unexpected response format from Hugging Face API, using fallback');
    return getFallbackInsight(prompt);
  } catch (error) {
    console.error('Hugging Face API call failed:', error);
    return getFallbackInsight(prompt);
  }
}

function getFallbackInsight(symptomsText: string): string {
  const insights = [
    "Based on your symptoms, consider consulting with a healthcare professional for personalized advice.",
    "Track your hydration and sleep patterns alongside your symptoms for comprehensive insights.",
    "Consider keeping a symptom journal that includes environmental factors like weather and stress levels.",
    "Regular exercise and a balanced diet can positively impact overall symptom management.",
    "If symptoms persist for more than a few days, consider professional medical evaluation."
  ];

  return insights[Math.floor(Math.random() * insights.length)];
}

export async function generateAIInsights(symptoms: SymptomData[], tier: SubscriptionTier = 'community_advocate'): Promise<Insight[]> {
  if (symptoms.length === 0) {
    return [{
      type: 'education',
      message: 'Welcome to Afya Intelligence! Start logging your symptoms to receive personalized AI health insights and track patterns over time.',
      severity: 'low',
      tierLevel: 'basic'
    }];
  }

  const insights: Insight[] = [];
  const isAdvancedTier = tier === 'health_champion' || tier === 'global_advocate';

  // Focus on most recent symptom and recent context
  const latestSymptom = symptoms[0]; // Most recent first
  const recentSymptoms = symptoms.slice(0, isAdvancedTier ? 15 : 5); // More context for advanced tiers

  try {
    if (isAdvancedTier && HUGGING_FACE_API_KEY && HUGGING_FACE_API_KEY.trim() !== '') {
      // Advanced tier: Use AI API with detailed prompts
      const symptomHistory = recentSymptoms
        .map((s, i) => `Symptom ${i+1}: ${s.symptom} (severity: ${s.severity}/5, ${new Date(s.timestamp).toLocaleDateString()})`)
        .join('\n');

      const prompt = `Advanced health analysis for: ${latestSymptom.symptom} (latest symptom, severity: ${latestSymptom.severity}/5)
      Recent symptom history (${recentSymptoms.length} entries):
      ${symptomHistory}

      Provide 2-3 detailed insights:
      1. Pattern analysis comparing current and past symptoms
      2. Potential triggers or contributing factors
      3. Specific, actionable wellness recommendations

      Be conversational and supportive. Consider the full context and timeline.`;

      const aiResponse = await callHuggingFaceAPI(prompt);
      insights.push({
        type: 'pattern',
        message: aiResponse,
        severity: 'medium',
        confidence: 0.8,
        tierLevel: 'advanced'
      });
    } else {
      // Basic tier: Use intelligent pattern analysis without API calls
      const basicInsight = generateBasicTierInsight?.(latestSymptom, symptoms, tier) ||
                          createFallbackInsight(latestSymptom);
      insights.push(basicInsight);
    }
  } catch (error) {
    console.error('AI insights generation failed:', error);
    // Always provide some insight even if AI fails - use safe fallback
    const fallbackInsight = generateBasicTierInsight?.(latestSymptom, symptoms, tier) ||
                           createFallbackInsight(latestSymptom);
    insights.push(fallbackInsight);
  }

  // Enhanced pattern analysis based on tier
  const patternAnalysis = analyzeSymptomPatterns(symptoms, tier);
  insights.push(...patternAnalysis);

  // Tier-specific alerts and recommendations
  const severityAlert = checkSevereSymptoms(symptoms, tier);
  if (severityAlert) insights.push(severityAlert);

  // Add tier-specific educational content for all users
  if (insights.length < 3) {
    const educationalInsight = getEducationalInsight(tier);
    if (educationalInsight) insights.push(educationalInsight);
  }

  return insights;
}

function analyzeSymptomPatterns(symptoms: SymptomData[], tier: SubscriptionTier): Insight[] {
  const insights: Insight[] = [];
  const isAdvancedTier = tier === 'health_champion' || tier === 'global_advocate';

  if (symptoms.length < 2) return insights;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklySymptoms = symptoms.filter(s =>
    new Date(s.timestamp) > oneWeekAgo
  );

  const avgSeverity = weeklySymptoms.reduce((sum, s) => sum + s.severity, 0) / weeklySymptoms.length;

  if (weeklySymptoms.length >= 3) {
    if (avgSeverity >= 4) {
      const message = isAdvancedTier
        ? 'Critical severity pattern detected. This suggests a potentially serious health condition. Please schedule an appointment with a healthcare provider within the next 24-48 hours for proper evaluation and diagnosis.'
        : 'You\'ve logged multiple high-severity symptoms this week. Consider consulting a healthcare professional.';
      insights.push({
        type: 'alert',
        message,
        severity: 'high',
        tierLevel: isAdvancedTier ? 'advanced' : 'basic'
      });
    } else if (avgSeverity >= 3) {
      const message = isAdvancedTier
        ? `Analysis of your weekly symptoms shows moderate severity (avg: ${avgSeverity.toFixed(1)}/5). This could indicate stress-related issues, nutritional deficiencies, or emerging conditions. Recommend lifestyle adjustments and tracking environmental factors.`
        : 'Moderate symptoms detected this week. Monitor closely and consider preventive measures.';
      insights.push({
        type: 'pattern',
        message,
        severity: 'medium',
        tierLevel: isAdvancedTier ? 'advanced' : 'basic'
      });
    }
  }

  // Advanced frequency analysis for premium users
  if (isAdvancedTier && symptoms.length >= 5) {
    const symptomDescriptions = symptoms.map(s => s.symptom.toLowerCase());

    // Detect patterns in headache frequency
    const headacheIndices = symptomDescriptions
      .map((desc, index) => desc.includes('headache') ? index : -1)
      .filter(index => index !== -1);

    if (headacheIndices.length >= 2) {
      const headachePatterns = symptoms.filter((_, index) => headacheIndices.includes(index));
      const avgHeadacheSeverity = headachePatterns.reduce((sum, s) => sum + s.severity, 0) / headachePatterns.length;

      const headacheInsights = analyzeHeadachePattern(headachePatterns, avgHeadacheSeverity);
      insights.push(...headacheInsights);
    }

    // Fatigue analysis
    const fatigueCount = symptomDescriptions.filter(s => s.includes('fatigue') || s.includes('tired')).length;
    if (fatigueCount >= 2) {
      insights.push({
        type: 'recommendation',
        message: 'Persistent fatigue pattern detected. Consider comprehensive health assessment including thyroid function, anemia screening, and sleep quality evaluation. Lifestyle factors to examine: sleep hygiene, exercise routine, and caffeine intake.',
        severity: 'medium',
        tierLevel: 'advanced'
      });
    }
  } else if (tier === 'community_advocate') {
    // Basic frequency analysis for free tier
    const symptomDescriptions = symptoms.map(s => s.symptom.toLowerCase());
    const headacheCount = symptomDescriptions.filter(s => s.includes('headache')).length;

    if (headacheCount >= 2) {
      insights.push({
        type: 'pattern',
        message: 'You\'ve logged multiple headaches. Consider tracking triggers like sleep, stress, or diet.',
        severity: 'medium',
        tierLevel: 'basic'
      });
    }
  }

  return insights;
}

function analyzeHeadachePattern(headacheSymptoms: SymptomData[], avgSeverity: number): Insight[] {
  const insights: Insight[] = [];

  // Time pattern analysis
  const headacheTimes = headacheSymptoms.map(s => new Date(s.timestamp).getHours());
  const morningHeadaches = headacheTimes.filter(hour => hour >= 6 && hour <= 11).length;
  const afternoonHeadaches = headacheTimes.filter(hour => hour >= 12 && hour <= 17).length;
  const eveningHeadaches = headacheTimes.filter(hour => hour >= 18 || hour <= 5).length;

  if (morningHeadaches >= 2) {
    insights.push({
      type: 'pattern',
      message: 'Morning headache pattern detected. Consider evaluating sleep apnea, caffeine withdrawal, or blood pressure issues. Morning headaches are often linked to sleep disorders or medication rebound effects.',
      severity: avgSeverity >= 4 ? 'high' : 'medium',
      tierLevel: 'advanced'
    });
  } else if (afternoonHeadaches >= 2) {
    insights.push({
      type: 'pattern',
      message: 'Afternoon headache pattern observed. Common triggers include dehydration, eye strain from screens, or food-related sensitivities. Track hydration (aim for 8-10 glasses of water daily) and screen time breaks.',
      severity: avgSeverity >= 4 ? 'high' : 'medium',
      tierLevel: 'advanced'
    });
  } else if (eveningHeadaches >= 2) {
    insights.push({
      type: 'pattern',
      message: 'Evening headache pattern identified. This may be associated with stress accumulation during the day, poor ergonomics at work, or hormonal factors. Consider relaxation techniques and workplace assessment.',
      severity: avgSeverity >= 4 ? 'high' : 'medium',
      tierLevel: 'advanced'
    });
  }

  return insights;
}

function checkSevereSymptoms(symptoms: SymptomData[], tier: SubscriptionTier): Insight | null {
  const isAdvancedTier = tier === 'health_champion' || tier === 'global_advocate';
  const recentSymptoms = symptoms.slice(0, isAdvancedTier ? 10 : 5); // Analyze more symptoms for advanced tier
  const highSeveritySymptoms = recentSymptoms.filter(s => s.severity >= 4);

  if (highSeveritySymptoms.length >= (isAdvancedTier ? 3 : 2)) {
    const message = isAdvancedTier
      ? `Critical Pattern Alert: ${highSeveritySymptoms.length} high-severity symptoms detected in your recent logs. This pattern requires immediate professional evaluation. Please consult a healthcare provider promptly and consider bringing your symptom log for comprehensive review.`
      : 'Multiple high-severity symptoms logged recently. Please consult with a healthcare provider promptly.';

    return {
      type: 'alert',
      message,
      severity: 'high',
      tierLevel: isAdvancedTier ? 'advanced' : 'basic'
    };
  } else if (isAdvancedTier && highSeveritySymptoms.length >= 2) {
    // More sensitive alerts for premium users
    return {
      type: 'alert',
      message: `Escalating Pattern: Multiple moderate-to-high severity symptoms (${highSeveritySymptoms.length} severe in recent logs). While currently below critical threshold, this trend warrants closer monitoring or professional consultation.`,
      severity: 'medium',
      tierLevel: 'advanced'
    };
  }

  return null;
}

function generateBasicTierInsight(latestSymptom: SymptomData, allSymptoms: SymptomData[], tier: SubscriptionTier): Insight {
  const symptomText = latestSymptom.symptom.toLowerCase();

  // Provide intelligent, symptom-specific insights based on common patterns
  if (symptomText.includes('headache')) {
    if (latestSymptom.severity >= 4) {
      return {
        type: 'pattern',
        message: `You've logged a severe headache (level ${latestSymptom.severity}/5). Consider tracking potential triggers like dehydration, stress, poor sleep, or screen time. If headaches are frequent, consider consulting a healthcare provider.`,
        severity: latestSymptom.severity >= 4 ? 'high' : 'medium',
        confidence: 0.7,
        tierLevel: 'basic'
      };
    } else {
      return {
        type: 'recommendation',
        message: `Headache logged. Try these immediate remedies: hydrate with water, step away from screens, and practice deep breathing. Track what preceded this headache for better prevention.`,
        severity: 'medium',
        confidence: 0.6,
        tierLevel: 'basic'
      };
    }
  }

  if (symptomText.includes('fatigue') || symptomText.includes('tired')) {
    return {
      type: 'pattern',
      message: `Fatigue noted. Common causes include poor sleep quality, stress, or nutritional deficiencies. Consider improving sleep hygiene and ensure you're getting adequate nutrition. If persistent, discuss with a healthcare provider.`,
      severity: latestSymptom.severity >= 4 ? 'high' : latestSymptom.severity >= 3 ? 'medium' : 'low',
      confidence: 0.7,
      tierLevel: 'basic'
    };
  }

  if (symptomText.includes('nausea') || symptomText.includes('stomach')) {
    return {
      type: 'recommendation',
      message: `Digestive symptom logged. Consider recent meals, hydration status, and stress levels. Bland foods like toast, rice, and ginger tea may help. Contact a healthcare provider if symptoms persist or include severe pain.`,
      severity: latestSymptom.severity >= 4 ? 'high' : 'medium',
      confidence: 0.6,
      tierLevel: 'basic'
    };
  }

  if (symptomText.includes('pain') && symptomText.includes('chest')) {
    return {
      type: 'alert',
      message: `Chest pain logged - this requires immediate medical attention. Please seek emergency care if this pain is severe, prolonged, or accompanied by shortness of breath, sweating, or dizziness.`,
      severity: 'high',
      confidence: 0.9,
      tierLevel: 'basic'
    };
  }

  if (symptomText.includes('pain') && (symptomText.includes('neck') || symptomText.includes('back'))) {
    return {
      type: 'recommendation',
      message: `Musculoskeletal pain logged. Consider ergonomic factors at work/desk, posture, or recent activity. Gentle stretching and maintaining good posture may help. If persistent, consult a healthcare provider.`,
      severity: latestSymptom.severity >= 3 ? 'medium' : 'low',
      confidence: 0.6,
      tierLevel: 'basic'
    };
  }

  if (symptomText.includes('cough')) {
    const isSevere = latestSymptom.severity >= 4;
    return {
      type: 'recommendation',
      message: `Respiratory symptom logged. Stay hydrated, use honey in warm water if appropriate for your age, and rest. ${isSevere ? 'Consider consulting a healthcare provider for evaluation.' : 'Monitor duration and contact healthcare provider if cough persists over 2 weeks or worsens.'}`,
      severity: isSevere ? 'high' : 'medium',
      confidence: 0.5,
      tierLevel: 'basic'
    };
  }

  if (symptomText.includes('fever') || symptomText.includes('temperature')) {
    const isHigh = latestSymptom.severity >= 4;
    return {
      type: 'alert',
      message: `Elevated temperature/febrile symptom logged. ${isHigh ? 'High fever requires immediate medical evaluation.' : 'Monitor temperature, hydrate well, and rest. Contact healthcare provider for fevers over 101.5°F/38.6°C, or lasting over 48 hours.'}`,
      severity: isHigh ? 'high' : 'medium',
      confidence: 0.8,
      tierLevel: 'basic'
    };
  }

  // Generic fallback for other symptoms
  const severity = latestSymptom.severity;
  let message = '';

  if (severity >= 4) {
    message = `High-severity symptom logged. Track details about this symptom and any accompanying symptoms. If this worsens or persists, consult a healthcare provider for proper evaluation.`;
  } else if (severity >= 3) {
    message = `You've logged a moderate symptom. Monitor how it changes over time and note any factors that seem to affect it. Consider consulting a healthcare provider if it continues or worsens.`;
  } else {
    message = `Symptom logged and noted. Continue tracking to identify patterns that may help with management. Consider basic lifestyle factors like hydration, sleep, and stress management.`;
  }

  return {
    type: 'pattern',
    message,
    severity: severity >= 4 ? 'high' : severity >= 3 ? 'medium' : 'low',
    confidence: 0.5,
    tierLevel: 'basic'
  };
}

function createFallbackInsight(latestSymptom: SymptomData): Insight {
  return {
    type: 'recommendation',
    message: `Your symptom has been logged. Monitor how it progresses and consider tracking factors that might influence it, such as hydration, sleep quality, or recent activity. Contact a healthcare provider if symptoms persist or worsen.`,
    severity: latestSymptom.severity >= 3 ? 'medium' : 'low',
    confidence: 0.3,
    tierLevel: 'basic'
  };
}

export function getEducationalInsight(tier: SubscriptionTier = 'community_advocate'): Insight {
  const educationInsights = [
    {
      type: 'education' as const,
      message: 'Did you know? Regular symptom tracking can help identify patterns that help with early diagnosis and better health management.',
      severity: 'low' as const
    },
    {
      type: 'recommendation' as const,
      message: 'Pro tip: Include context with your symptoms (time of day, what you ate, your activity level) for more accurate insights.',
      severity: 'low' as const
    },
    {
      type: 'education' as const,
      message: 'Your data contributes to global health research through anonymous, aggregated patterns. Every symptom logged helps advance SDG 3!',
      severity: 'low' as const
    }
  ];

  return educationInsights[Math.floor(Math.random() * educationInsights.length)];
}
