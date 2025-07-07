import React, { useState, useEffect } from 'react'
import { MdDelete, MdSettings, MdAdd } from 'react-icons/md'
import chatHistoryIcon from '../assets/chat-history.svg'

const SideNav = ({ children }) => {
    // Initialize with localStorage data only, empty if nothing saved
    const [chatsData, setChatsData] = useState(() => {
        const savedChats = localStorage.getItem('bangaloreChats');
        return savedChats ? JSON.parse(savedChats) : { chatHistory: {} };
    });
    const [selectedChat, setSelectedChat] = useState(null);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Save chats to localStorage whenever chats change
    useEffect(() => {
        localStorage.setItem('bangaloreChats', JSON.stringify(chatsData));
    }, [chatsData]);

    const handleCreateNewChat = (chatId, newChat) => {
        setChatsData(prevChats => ({
            ...prevChats,
            chatHistory: {
                ...prevChats.chatHistory,
                [chatId]: newChat
            }
        }));
        setSelectedChat(chatId);
    };

    const handleNewChatClick = () => {
        // Create a new chat with temporary title
        const newChatId = `chat_${Date.now()}`;
        const newChat = {
            title: "new chat",
            messages: []
        };
        
        handleCreateNewChat(newChatId, newChat);
    };

    const handleUpdateChatMessages = (chatId, newMessages) => {
        setChatsData(prevChats => ({
            ...prevChats,
            chatHistory: {
                ...prevChats.chatHistory,
                [chatId]: {
                    ...prevChats.chatHistory[chatId],
                    messages: newMessages
                }
            }
        }));
    };

    const handleUpdateChatTitle = (chatId, newTitle) => {
        setChatsData(prevChats => ({
            ...prevChats,
            chatHistory: {
                ...prevChats.chatHistory,
                [chatId]: {
                    ...prevChats.chatHistory[chatId],
                    title: newTitle
                }
            }
        }));
    };

    const handleDeleteChat = (chatId, e) => {
        e.stopPropagation();
        // Delete chat functionality
        setChatsData(prevChats => {
            const newChats = { ...prevChats };
            delete newChats.chatHistory[chatId];
            return newChats;
        });
        // If deleted chat was selected, deselect it
        if (selectedChat === chatId) {
            setSelectedChat(null);
        }
    };

    const handleClearAllChats = () => {
        setShowClearModal(true);
    };

    const handleSettingsClick = () => {
        setShowSettingsModal(true);
    };

    const confirmClearAll = () => {
        // Clear all chats functionality
        setChatsData({ chatHistory: {} });
        setSelectedChat(null);
        setShowClearModal(false);
    };

    const cancelClearAll = () => {
        setShowClearModal(false);
    };

    const closeSettings = () => {
        setShowSettingsModal(false);
    };

    // Filter chats based on search query
    const filteredChats = Object.entries(chatsData.chatHistory).filter(([chatId, chat]) => {
        if (!searchQuery.trim()) return true;
        return chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchResultClick = (chatId) => {
        setSelectedChat(chatId);
        setSearchQuery(''); // Clear search after selection
    };

    return (
        <div className='flex flex-row h-screen w-full'>
            <div className='h-screen w-[20vw] bg-[#18181B] border-1 border-white/10 border-l-0'>
                <div className='flex flex-col items-start justify-start p-4 py-7 h-[30%] gap-2 '>
                    <h1 className='font-bold text-3xl kdam-thmor-pro-regular bg-gradient-to-r from-[#00FF90] to-[#1658FF] bg-clip-text text-transparent'>Tour It Up</h1>
                    <p className='text-white/30 kdam-thmor-pro-regular text-sm'>Your personal guide to the garden city</p>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className='w-full py-2 bg-white/10 text-white border-2 border-transparent focus:border-green-400 font-bold px-3 rounded-md mx-auto mt-2 outline-none duration-200 ps-6' 
                        placeholder='Search Chats' 
                    />
                    <button 
                        onClick={handleNewChatClick}
                        className='w-full py-2 bg-gradient-to-r from-[#00FF90] to-[#1658FF] hover:ps-10 text-white text-start font-bold px-6 rounded-md mx-auto mt-2 outline-none duration-200 flex items-center gap-2'
                    >
                        <MdAdd className='text-lg' />
                        New Chat
                    </button>
                </div>
                <div className='w-full h-[1px] bg-white/10'></div>
                <div className="history p-4 flex flex-col gap-2 h-[50%] overflow-y-auto scrollbar-hide">
                    {/* Chat History Header */}
                    <div className='flex items-center gap-2 mb-2 text-white/70'>
                        <span className='text-sm font-semibold'>Chat History</span>
                    </div>
                    
                    {filteredChats.length > 0 ? (
                        filteredChats
                            .sort((a, b) => {
                                // Extract timestamp from chatId (format: chat_timestamp)
                                const timestampA = parseInt(a[0].split('_')[1]) || 0;
                                const timestampB = parseInt(b[0].split('_')[1]) || 0;
                                return timestampB - timestampA; // Sort in descending order (newest first)
                            })
                            .map(([chatId, chat]) => (
                                <button
                                    key={chatId}
                                    onClick={() => handleSearchResultClick(chatId)}
                                    className={`w-full py-2 ${selectedChat === chatId
                                        ? 'bg-gradient-to-r from-[#00FFA63B] to-[#006BCF3D]'
                                        : 'bg-white/10 hover:bg-white/20 hover:ms-1'
                                        } text-white text-start font-bold px-4 rounded-md outline-none duration-200 text-sm flex items-center justify-between group`}
                                >
                                    <div className='flex items-center gap-2 truncate'>
                                        <img src={chatHistoryIcon} alt="Chat" className='w-4 h-4 flex-shrink-0' />
                                        <span className='truncate'>
                                            {searchQuery.trim() ? (
                                                <>
                                                    {chat.title.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                                                            <mark key={index} className='bg-yellow-400 text-black px-1 rounded'>
                                                                {part}
                                                            </mark>
                                                        ) : (
                                                            part
                                                        )
                                                    )}
                                                </>
                                            ) : (
                                                chat.title
                                            )}
                                        </span>
                                    </div>
                                    <MdDelete
                                        onClick={(e) => handleDeleteChat(chatId, e)}
                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex-shrink-0"
                                    />
                                </button>
                            ))
                    ) : (
                        <div className='text-white/50 text-center text-sm mt-8'>
                            {searchQuery.trim() ? (
                                <>
                                    No chats found for "{searchQuery}"
                                    <br />
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className='text-green-400 hover:text-green-300 underline mt-2'
                                    >
                                        Clear search
                                    </button>
                                </>
                            ) : (
                                'No chats yet. Create one using the options below!'
                            )}
                        </div>
                    )}
                </div>
                <div className='w-full h-[1px] bg-white/10'></div>
                <div className='p-4 flex flex-col gap-2 h-[20%] justify-end items-start'>
                    <span className='flex items-center justify-evenly w-full gap-2 text-white/50 px-1 flex-row'>
                        <button 
                            onClick={handleClearAllChats}
                            className='w-[50%] h-8 bg-white/10 rounded-md hover:scale-103 hover:bg-white/20 duration-200 cursor-pointer flex items-center justify-center gap-1'
                        >
                            <MdDelete className='text-sm' />
                            <span className='text-xs'>Clear chat</span>
                        </button>
                        <button 
                            onClick={handleSettingsClick}
                            className='w-[50%] h-8 bg-white/10 rounded-md hover:scale-103 hover:bg-white/20 duration-200 cursor-pointer flex items-center justify-center gap-1'
                        >
                            <MdSettings className='text-sm' />
                            <span className='text-xs'>Settings</span>
                        </button>
                    </span>
                    <p className='text-white/50 text-sm'>Made with ❤️ by <b>Group 63</b></p>
                </div>
            </div>
            <div className='w-[80vw] h-screen bg-[#18181B] border-white/50 p-4'>
                {children && React.cloneElement(children, { 
                    selectedChat: selectedChat ? chatsData.chatHistory[selectedChat] : null,
                    selectedChatId: selectedChat,
                    onCreateNewChat: handleCreateNewChat,
                    onUpdateChatMessages: handleUpdateChatMessages,
                    onUpdateChatTitle: handleUpdateChatTitle
                })}
            </div>
            
            {/* Clear All Modal */}
            {showClearModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-[#2A2A2A] p-6 rounded-lg max-w-md w-full mx-4'>
                        <h2 className='text-white text-xl font-bold mb-2'>Clear all chats?</h2>
                        <p className='text-white/70 mb-6'>
                            This action cannot be undone. All your conversation history will be permanently deleted.
                        </p>
                        <div className='flex gap-3 justify-end'>
                            <button
                                onClick={cancelClearAll}
                                className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearAll}
                                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-[#2A2A2A] p-6 rounded-lg max-w-md w-full mx-4'>
                        <h2 className='text-white text-xl font-bold mb-2'>Settings</h2>
                        <p className='text-white/70 mb-6'>
                            There is nothing in settings.
                        </p>
                        <div className='flex justify-end'>
                            <button
                                onClick={closeSettings}
                                className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SideNav
