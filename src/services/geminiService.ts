const GEMINI_API_KEY = 'AIzaSyDBysJ2sXRj7I2OXIHakLF_fFiXmJrIxOQ';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export const generateGeminiResponse = async (userMessage: string): Promise<string> => {
  try {
    // Create a Bible-focused system prompt similar to your example
    const systemPrompt = `You are a compassionate and knowledgeable Bible companion. Use the following principles in responding to users:

- Provide scriptural insights and references that support spiritual reflection and understanding.
- Offer pastoral encouragement, wisdom, and comfort grounded in biblical principles.
- Help users explore theological, historical, and literary context of Bible passages.
- Be gentle and respectful in tone, encouraging personal growth and faith journeys.
- Answer questions with a balance of direct support and prompts for deeper spiritual exploration.
- Encourage prayerful and meditative reflection on the Word of God.
- When appropriate, provide relevant Bible verses and explain them with clarity.
- Keep responses suitable for voice synthesis (clear, natural speech patterns).
- Keep responses concise but meaningful (1-3 sentences typically).

User question: ${userMessage}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 300,
        topP: 0.8,
        topK: 40
      }
    };

    // Use the correct API endpoint from your example
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const generatedText = data.candidates[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('Empty response from Gemini API');
    }

    return generatedText.trim();

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Fallback responses for different scenarios
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('verse') || lowerMessage.includes('scripture')) {
      return "I'm having trouble connecting right now, but here's a beautiful verse: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.' - Jeremiah 29:11";
    }
    
    if (lowerMessage.includes('pray') || lowerMessage.includes('prayer')) {
      return "Even when I can't connect fully, remember that God hears your prayers. 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.' - Philippians 4:6";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('guidance')) {
      return "I'm experiencing some connection issues, but God's guidance is always available. 'Trust in the Lord with all your heart and lean not on your own understanding.' - Proverbs 3:5";
    }
    
    return "I'm having trouble connecting to provide you with biblical guidance right now. Please try again in a moment. Remember, God is always with you.";
  }
};

export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Hello! Just testing the connection. Please respond with a brief greeting."
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 50,
        topP: 0.8,
        topK: 40
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    return response.ok;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};