import React, { useState, useRef, useEffect } from 'react'
import { MdContentCopy, MdCheck, MdLocationOn, MdAttachFile, MdMic, MdCamera } from 'react-icons/md'

const Chat = ({ selectedChat, selectedChatId, onCreateNewChat, onUpdateChatMessages, onUpdateChatTitle }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOptionClick = async (optionTitle) => {
    // Create new chat with the selected option title
    const newChatId = `chat_${Date.now()}`;
    const newChat = {
      title: optionTitle,
      messages: []
    };
    
    // Call the parent function to create and select the new chat
    if (onCreateNewChat) {
      onCreateNewChat(newChatId, newChat);
      
      // Automatically send the option title as the first message
      setTimeout(async () => {
        await sendMessageToChat(newChatId, optionTitle, newChat);
      }, 100); // Small delay to ensure the chat is created
    }
  };

  const sendMessageToChat = async (chatId, messageText, chatData) => {
    setIsLoading(true);
    
    // Update title if it's a new chat and this is the first message
    if (chatData.title === "new chat" && chatData.messages.length === 0 && onUpdateChatTitle) {
      onUpdateChatTitle(chatId, messageText);
    }
    
    // Add user message to chat
    const userMessage = {
      sender: 'user',
      message: messageText,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...chatData.messages, userMessage];
    onUpdateChatMessages(chatId, updatedMessages);
    
    try {
      // Send message to backend
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Context: You are a helpful assistant specializing in Bangalore city information. The user asked about "${chatData.title}"(if its "new chat" then ignore the title, just answer with the user input. But remember you are a helpful assistant specializing in Bangalore city information). Please provide relevant and helpful information about this topic in Bangalore.
          
          User's message: ${messageText}`
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add bot response to chat
        const botMessage = {
          sender: 'bot',
          message: data.reply,
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, botMessage];
        onUpdateChatMessages(chatId, finalMessages);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage = {
        sender: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      onUpdateChatMessages(chatId, finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || !selectedChatId) return;
    
    await sendMessageToChat(selectedChatId, message.trim(), selectedChat);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (text, messageIndex) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      // Reset the checkmark after 2 seconds
      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    if (!selectedChat || !selectedChatId) return;
    sendMessageToChat(selectedChatId, suggestion, selectedChat);
  };

  const quickSuggestions = [
    "What are the best places to visit in Bangalore?",
    "Tell me about Bangalore's weather throughout the year",
    "Recommend some local Bangalore street food",
    "Which tech parks are famous in Bangalore?"
  ];

  return (
    <div className='h-full text-white flex flex-col bg-[#151518]'>
      {/* Fixed Header */}
      <div className='h-[10vh] bg-[#18181B] border-b border-white/20 flex items-center justify-between px-6'>
        <div className='flex flex-col items-start gap-1'>
          <h1 className='text-2xl font-bold kdam-thmor-pro-regular bg-gradient-to-r from-[#00FF90] to-[#1658FF] bg-clip-text text-transparent'>
            Bangalore City Guide
          </h1>
          <p className='text-white/50 text-sm'>Ask me anything about Bangalore - from tourist spots to tech parks!</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 bg-green-400 rounded-full'></div>
          <span className='text-sm text-white/70'>Online</span>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className='flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40'>
        {selectedChat ? (
          <div>
            <h2 className='text-2xl font-bold mb-4 text-gradient bg-gradient-to-r from-[#00FF90] to-[#1658FF] bg-clip-text text-transparent'>
              {selectedChat.title}
            </h2>
            <div className='flex flex-col gap-3'>
              {selectedChat.messages.length > 0 ? (
                selectedChat.messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`relative group p-4 rounded-2xl max-w-[70%] ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-[#00D676] to-[#00B65A] text-white ml-auto rounded-br-sm' 
                        : 'bg-white/10 text-white mr-auto rounded-bl-sm'
                    }`}
                  >
                    {/* Copy button - appears on hover */}
                    <button
                      onClick={() => copyToClipboard(message.message, index)}
                      className={`absolute -top-2 ${
                        message.sender === 'user' ? '-left-2' : '-right-2'
                      } p-1 ${
                        copiedMessageIndex === index 
                          ? 'bg-green-600 hover:bg-green-500' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      } text-white rounded-full ${
                        copiedMessageIndex === index 
                          ? 'opacity-100' 
                          : 'opacity-0 group-hover:opacity-100'
                      } transition-all duration-200 z-10`}
                      title={copiedMessageIndex === index ? "Copied!" : "Copy message"}
                    >
                      {copiedMessageIndex === index ? (
                        <MdCheck className="w-3 h-3" />
                      ) : (
                        <MdContentCopy className="w-3 h-3" />
                      )}
                    </button>
                    
                    <p className='font-medium whitespace-pre-wrap'>{message.message}</p>
                    {message.timestamp && (
                      <p className='text-xs opacity-70 mt-1'>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className='text-white/50 text-center'>No messages in this chat. Start by asking something!</p>
              )}
              {isLoading && (
                <div className='bg-white/10 text-white mr-auto rounded-bl-sm p-4 rounded-2xl max-w-[70%]'>
                  <div className='flex items-center space-x-1'>
                    <span className='font-medium'>Typing</span>
                    <div className='flex space-x-1'>
                      <div className='w-1 h-1 bg-white rounded-full animate-bounce' style={{animationDelay: '0ms'}}></div>
                      <div className='w-1 h-1 bg-white rounded-full animate-bounce' style={{animationDelay: '150ms'}}></div>
                      <div className='w-1 h-1 bg-white rounded-full animate-bounce' style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
              {/* Auto-scroll target */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center text-center justify-end h-full'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-bold text-white mb-2'>Start Your Bangalore Journey</h2>
              <p className='text-white/50 w-[70%] mx-auto text-sm'>Ask me about popular tourist spots, local cuisine, tech parks, weather, or anything else related to Bangalore!</p>
            </div>
            
            {/* Options Grid */}
            <div className='grid grid-cols-3 gap-4 mb-8'>
              <button 
                onClick={() => handleOptionClick('Tourist Places')}
                className='bg-[#5500FF21] border-1 border-white/30 text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Tourist Places
              </button>
              <button 
                onClick={() => handleOptionClick('Local Food')}
                className='bg-[#00C8FF21] border-1 border-white/30 text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Local Food
              </button>
              <button 
                onClick={() => handleOptionClick('Tech Parks')}
                className='bg-[#FF6A0021] border-1 border-white/30 text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Tech Parks
              </button>
              <button 
                onClick={() => handleOptionClick('Transportation')}
                className='bg-[#FF00DD21] border-1 border-white/30 text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Transportation
              </button>
              <button 
                onClick={() => handleOptionClick('Neighborhood')}
                className='bg-[#FF000021] border-1 border-white/30 text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Neighborhood
              </button>
              <button 
                onClick={() => handleOptionClick('Education')}
                className='bg-[#0DFF0021] border-1 border-white/30 text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Education
              </button>
              <button 
                onClick={() => handleOptionClick('Events & festivals')}
                className='bg-[#0059FF21] border-1 border-white/30   text-white px-25 py-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200'
              >
                Events & festivals
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Message Input Area */}
      <div className='bg-[#151519] border-t border-white/20 px-6 py-4'>
        {/* Quick Suggestions - Always show when chat is selected */}
        {selectedChat && (
          <div className='mb-4'>
            <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40'>
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className='bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-full whitespace-nowrap transition-all duration-200 border border-white/20 hover:border-green-400'
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Row */}
        <div className='flex items-center gap-3'>
          {/* Left Icons */}
          <div className='flex items-center gap-2'>
            <button className='p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-full transition-all duration-200'>
              <MdAttachFile className='w-5 h-5' />
            </button>
          </div>
          
          {/* Input Field */}
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedChat ? "Ask anything about Bangalore..." : "Select a chat to start messaging..."}
            disabled={!selectedChat || isLoading}
            className='flex-1 py-3 px-4 bg-white/10 text-white border-2 border-transparent focus:border-green-400 rounded-full outline-none duration-200 disabled:opacity-50'
          />
          
          {/* Right Icons */}
          <div className='flex items-center gap-2'>
            <button className='p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-full transition-all duration-200'>
              <MdLocationOn className='w-5 h-5' />
            </button>
            <button className='p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-full transition-all duration-200'>
              <MdMic className='w-5 h-5' />
            </button>
            <button 
              onClick={sendMessage}
              disabled={!selectedChat || !message.trim() || isLoading}
              className='bg-gradient-to-r from-[#00D676] to-[#00B65A] text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat