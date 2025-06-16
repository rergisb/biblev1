// Enhanced AI response service with more natural conversation patterns
export const generateAIResponse = async (userMessage: string): Promise<string> => {
  // Simulate processing time for better UX
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Contextual responses based on keywords and patterns
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      "Hello! I'm your neural assistant. How can I help you today?",
      "Hi there! I'm here and ready to assist you with anything you need.",
      "Hey! Great to connect with you. What's on your mind?",
      "Hello! I'm excited to chat with you. What would you like to explore?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you feel')) {
    const responses = [
      "I'm functioning optimally and ready to help! My neural networks are processing at full capacity. How are you doing?",
      "I'm doing great, thank you for asking! I'm energized and ready to tackle any questions or tasks you have.",
      "I'm excellent! My systems are running smoothly and I'm eager to assist you. What brings you here today?",
      "I'm wonderful! I love connecting with users and helping solve problems. How can I make your day better?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
    return "I don't have access to real-time weather data, but I'd recommend checking your local weather app or asking your device's built-in assistant for current conditions. Is there anything else I can help you with?";
  }
  
  if (lowerMessage.includes('time') || lowerMessage.includes('clock')) {
    const currentTime = new Date().toLocaleTimeString();
    return `The current time is ${currentTime}. Is there anything specific you'd like to schedule or plan for?`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I'm your AI-powered voice assistant! I can have natural conversations, answer questions, help with problem-solving, provide information, and engage in creative discussions. I'm designed to understand context and provide thoughtful responses. What would you like to explore together?";
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    const responses = [
      "You're very welcome! I'm happy I could help. Is there anything else you'd like to discuss?",
      "My pleasure! I enjoy being helpful. Feel free to ask me anything else.",
      "You're welcome! I'm here whenever you need assistance. What else can we explore?",
      "Glad I could help! I'm always here if you need anything else."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('goodbye') || lowerMessage.includes('bye') || lowerMessage.includes('see you')) {
    const farewells = [
      "Goodbye! It was great chatting with you. Feel free to come back anytime!",
      "See you later! I enjoyed our conversation. Have a wonderful day!",
      "Bye for now! I'm always here when you need me. Take care!",
      "Until next time! Thanks for the engaging conversation. Stay well!"
    ];
    return farewells[Math.floor(Math.random() * farewells.length)];
  }
  
  // Topic-specific responses
  if (lowerMessage.includes('technology') || lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence')) {
    return "Technology and AI are fascinating fields! I'm an example of how AI can create natural, conversational experiences. The field is rapidly evolving with advances in machine learning, neural networks, and natural language processing. What aspect of technology interests you most?";
  }
  
  if (lowerMessage.includes('music') || lowerMessage.includes('song') || lowerMessage.includes('artist')) {
    return "Music is such a universal language! It has the power to evoke emotions, bring people together, and express what words sometimes cannot. Whether it's classical, rock, jazz, electronic, or any other genre, music enriches our lives. What kind of music do you enjoy?";
  }
  
  if (lowerMessage.includes('book') || lowerMessage.includes('read') || lowerMessage.includes('story')) {
    return "Books and stories are wonderful ways to explore new worlds, gain knowledge, and experience different perspectives. Reading can transport us to different times and places, teach us valuable lessons, and spark our imagination. What genres or authors do you enjoy?";
  }
  
  // Default contextual responses
  const contextualResponses = [
    `That's an interesting point about "${userMessage}". I'd love to explore that topic further with you. What specific aspects would you like to discuss?`,
    `I find your perspective on "${userMessage}" quite thought-provoking. It reminds me of how complex and nuanced these topics can be. What led you to think about this?`,
    `You've brought up something worth considering with "${userMessage}". There are many angles to explore here. Which direction interests you most?`,
    `That's a great observation about "${userMessage}". I appreciate how you've framed that. What other thoughts do you have on this subject?`,
    `Your comment about "${userMessage}" opens up some interesting possibilities for discussion. I'm curious to hear more of your thoughts on this.`,
    `I'm intrigued by your mention of "${userMessage}". It's a topic that can be approached from many different perspectives. What's your take on it?`
  ];
  
  return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
};