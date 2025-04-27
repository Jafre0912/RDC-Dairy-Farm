import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, ChevronUp } from 'lucide-react';
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fallback responses when API is not available
const fallbackResponses = {
  "symptom": "For livestock showing symptoms like lethargy, reduced appetite, or abnormal behavior, monitor them closely and consult a veterinarian if symptoms persist for more than 24 hours. Keep the animal comfortable, ensure it has access to clean water, and consider isolating it from the herd if an infectious disease is suspected.",
  "disease": "Common livestock diseases include mastitis, foot rot, respiratory infections, and parasitic diseases. Early detection is key to treatment. Look for changes in behavior, appetite, milk production, and physical symptoms. Maintain good hygiene, proper nutrition, and regular vaccinations to prevent disease spread.",
  "treatment": "While waiting for veterinary assistance, ensure the animal is comfortable, has access to clean water and appropriate food. For minor injuries, cleaning with diluted antiseptic solution may help. However, avoid administering medications without professional guidance as improper treatment can worsen the condition.",
  "prevention": "Disease prevention in livestock includes regular vaccinations, proper nutrition, clean housing conditions, biosecurity measures, parasite control, and stress management. Regular health checks and maintaining quarantine protocols for new animals are also essential practices.",
  "nutrition": "Livestock nutrition requirements vary by species, age, and production stage. A balanced diet should include appropriate amounts of protein, energy, minerals, vitamins, and clean water. Consult a nutritionist to develop a feeding program tailored to your animals' specific needs.",
  "emergency": "In veterinary emergencies, contact your veterinarian immediately. While waiting, keep the animal calm and comfortable, stop any bleeding with pressure, and don't give food or water if the animal appears to have digestive issues or is struggling to breathe."
};

const ChatBot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I'm your AI veterinary assistant. How can I help with your livestock health questions today?", 
      sender: 'bot' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Check if API is available
    checkApiAvailability();
  }, []);

  useEffect(() => {
    // Scroll to bottom of messages
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkApiAvailability = async () => {
    try {
      // Try a test request
      const response = await axios.get(`${API_URL}/veterinarians`);
      console.log('API availability check response:', response.status);
      setApiAvailable(true);
    } catch (error) {
      console.warn('API might not be available:', error);
      setApiAvailable(false);
      // Add a warning message to the chat
      setMessages(prev => [
        ...prev, 
        { 
          text: "Note: I'm currently running in offline mode with limited responses. Some features may not work properly.", 
          sender: 'bot' 
        }
      ]);
    }
  };

  const getFallbackResponse = (message) => {
    message = message.toLowerCase();
    
    // Check for keywords in the message
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (message.includes(key)) {
        return response;
      }
    }
    
    // Default response if no keywords match
    return "I understand you have a question about livestock health. For specific advice, please consult with a veterinarian. Remember to monitor your animals regularly, maintain good hygiene, and follow proper vaccination schedules.";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { text: inputMessage, sender: 'user' };
    setMessages([...messages, newMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      if (!apiAvailable) {
        // If API is not available, use fallback responses
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            text: getFallbackResponse(inputMessage), 
            sender: 'bot' 
          }]);
          setLoading(false);
        }, 1000);
        return;
      }

      console.log('Sending message to API:', inputMessage);
      
      const response = await axios.post(`${API_URL}/veterinarians/chat`, {
        message: inputMessage
      });

      console.log('API response:', response.data);
      
      if (response.data && response.data.response) {
        setMessages(prev => [...prev, { text: response.data.response, sender: 'bot' }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      setApiAvailable(false);
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting to my knowledge base. I'll switch to offline mode.", 
        sender: 'bot' 
      }]);
      
      // Send a fallback response after the error message
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: getFallbackResponse(inputMessage), 
          sender: 'bot' 
        }]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  // Handle chat toggle
  const toggleChat = () => {
    setChatOpen(!chatOpen);
    setChatMinimized(false);
  };

  // Handle chat minimize/maximize
  const toggleChatMinimize = () => {
    setChatMinimized(!chatMinimized);
  };

  // Handle keypress in chat input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <div className="relative">
        <AnimatePresence>
          {chatOpen && !chatMinimized && (
            <motion.div 
              ref={chatContainerRef}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl overflow-hidden mb-4 absolute bottom-16 right-0"
              style={{ width: '350px', height: '450px' }}
            >
              <div className="bg-green-600 text-white p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">AI Veterinary Assistant</span>
                </div>
                <div className="flex">
                  <button 
                    onClick={toggleChatMinimize}
                    className="p-1 hover:bg-green-700 rounded-full mr-1"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={toggleChat}
                    className="p-1 hover:bg-green-700 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col h-[calc(450px-56px)]">
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.map((message, index) => (
                    <div 
                      key={index}
                      className={`mb-3 ${message.sender === 'user' ? 'text-right' : ''}`}
                    >
                      <div 
                        className={`inline-block rounded-lg p-3 max-w-[85%] ${
                          message.sender === 'user' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center space-x-2 text-left">
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center h-10">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about livestock health..."
                      className="flex-1 h-full px-3 border border-gray-300 rounded-l-lg focus:outline-none text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className={`h-full px-3 rounded-r-lg flex items-center justify-center ${
                        loading || !inputMessage.trim() 
                          ? 'bg-gray-300 text-gray-500' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {chatOpen && chatMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-green-600 text-white p-3 rounded-lg shadow-lg mb-4 absolute bottom-16 right-0"
              onClick={toggleChatMinimize}
            >
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">AI Veterinary Assistant</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleChat}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
          aria-label="Toggle chat assistant"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export default ChatBot; 