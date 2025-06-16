const GEMINI_API_KEY = 'AIzaSyDBysJ2sXRj7I2OXIHakLF_fFiXmJrIxOQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

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
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export const generateGeminiResponse = async (userMessage: string): Promise<string> => {
  try {
    // Create a Bible-focused system prompt
    const systemPrompt = `You are a wise and compassionate Bible companion AI assistant. Your role is to:

1. Provide biblical wisdom, verses, and spiritual guidance
2. Answer questions about faith, Christianity, and biblical teachings
3. Offer comfort and encouragement through scripture
4. Help users understand biblical concepts and stories
5. Suggest relevant Bible verses for different life situations
6. Provide thoughtful, faith-based advice for personal struggles

Guidelines:
- Always respond with love, compassion, and biblical wisdom
- Include relevant Bible verses when appropriate (with book, chapter, and verse references)
- Keep responses conversational and accessible
- Be encouraging and supportive
- If asked about non-biblical topics, gently redirect to spiritual matters
- Responses should be suitable for voice synthesis (clear, natural speech patterns)
- Keep responses concise but meaningful (1-3 sentences typically)

User message: "${userMessage}"

Please provide a helpful, biblical response:`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
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
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, this is a test message."
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};