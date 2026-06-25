import type { GeminiAnalysis, Issue } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Convert File to base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Analyze civic issue photo with Gemini Vision
export const analyzeIssueImage = async (
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiAnalysis> => {
  const prompt = `You are a civic issue analyst for Indian cities. Analyze this image of a community/infrastructure problem.

Respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "category": "pothole|streetlight|garbage|water|drainage|other",
  "severity": "low|medium|high|critical",
  "title": "Short 5-8 word title of the issue",
  "description": "2-3 sentences describing what you see, the likely impact on citizens, and urgency",
  "suggestedAuthority": "Municipal Corporation|PWD|Water Board|Electricity Board|Sanitation Department|Other"
}

Severity guide:
- low: minor inconvenience, no immediate danger
- medium: affects daily life, needs attention within a week
- high: significant disruption or safety risk, needs attention in 2-3 days  
- critical: immediate danger to life or property, needs emergency response`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) throw new Error('No response from Gemini');

  // Strip any accidental markdown fences
  const clean = rawText.replace(/```json|```/g, '').trim();

  try {
    const parsed: GeminiAnalysis = JSON.parse(clean);
    return parsed;
  } catch {
    throw new Error('Gemini returned invalid JSON: ' + clean);
  }
};

// Generate formal complaint letter for an issue
export const generateComplaintLetter = async (issue: Issue): Promise<string> => {
  const reportedDate = issue.reportedAt.toDate().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const prompt = `Write a formal complaint letter from a concerned citizen to the ${issue.suggestedAuthority} regarding a civic issue.

Issue Details:
- Type: ${issue.category.toUpperCase()}
- Title: ${issue.title}
- Location: ${issue.location.address}, ${issue.location.city}
- Description: ${issue.description}
- Severity: ${issue.severity.toUpperCase()}
- Reported On: ${reportedDate}
- Verified by: ${issue.verificationCount} citizens

Write a professional, concise letter (200-250 words) that:
1. States the issue clearly with location
2. Describes the impact on citizens
3. Mentions that ${issue.verificationCount} citizens have verified this issue
4. Requests action within 7 days for medium/high or 24 hours for critical
5. Includes a Subject line, proper salutation, body, and closing

Use "A Concerned Citizen" as the sender name.`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const letter = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!letter) throw new Error('No letter generated');
  return letter;
};
