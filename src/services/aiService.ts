// Simple AI response service (you can replace this with OpenAI, Claude, or any other AI service)
export const generateAIResponse = async (userMessage: string): Promise<string> => {
  // For demonstration, using a simple response generator
  // In production, you'd integrate with OpenAI, Claude, or another AI service
  
  const responses = [
    "That's a great question! Let me think about that for a moment.",
    "I understand what you're asking. Here's my perspective on that topic.",
    "Thanks for sharing that with me. I find that quite interesting.",
    "I appreciate you asking. From what I understand, here's what I think.",
    "That's something I've considered before. Let me share my thoughts.",
    "I'm glad you brought that up. It's definitely worth discussing.",
    "That's a thoughtful question. Here's how I see it.",
    "I can help you with that. Let me break it down for you."
  ];

  // Simple keyword-based responses for demonstration
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! It's wonderful to meet you. How can I assist you today?";
  }
  
  if (lowerMessage.includes('how are you')) {
    return "I'm doing great, thank you for asking! I'm here and ready to help with whatever you need.";
  }
  
  if (lowerMessage.includes('weather')) {
    return "I don't have access to current weather data, but I'd recommend checking your local weather app or website for the most accurate forecast.";
  }
  
  if (lowerMessage.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}. Is there anything specific you'd like to schedule or plan?`;
  }
  
  if (lowerMessage.includes('help')) {
    return "I'm here to help! You can ask me questions, have a conversation, or just chat about whatever's on your mind. What would you like to talk about?";
  }

  // Return a random response with the user's message context
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return `${randomResponse} You mentioned: "${userMessage}". What else would you like to know?`;
};