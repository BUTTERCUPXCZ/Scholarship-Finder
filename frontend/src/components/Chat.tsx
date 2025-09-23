import React, { useState, useRef, useEffect } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
    Send,
    Search,
    MoreVertical,
    Phone,
    Video,
    Info,
    Smile,
    Paperclip,
    ArrowLeft
} from 'lucide-react'

interface Message {
    id: string
    content: string
    sender: 'user' | 'other'
    timestamp: Date
    senderName: string
    status?: 'sent' | 'delivered' | 'read'
}

interface Chat {
    id: string
    name: string
    lastMessage: string
    timestamp: string
    unreadCount: number
    avatar: string
    isOnline: boolean
}

interface ChatUIProps {
    onBack?: () => void
    isMobile?: boolean
}

const ChatUI: React.FC<ChatUIProps> = ({ onBack, isMobile = false }) => {
    const [selectedChat, setSelectedChat] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Mock data
    const [chats] = useState<Chat[]>([
        {
            id: '1',
            name: 'Nickola Peever',
            lastMessage: 'I know how important this file is to you. You can trust me :)',
            timestamp: '05:23 PM',
            unreadCount: 2,
            avatar: 'NP',
            isOnline: true
        },
        {
            id: '2',
            name: 'Jacquenetta Slowgrave',
            lastMessage: 'Great! Looking forward to it. See you tomorrow.',
            timestamp: '10 minutes',
            unreadCount: 8,
            avatar: 'JS',
            isOnline: false
        },
        {
            id: '3',
            name: 'Farand Hume',
            lastMessage: 'How about 7 PM at the new Italian place?',
            timestamp: 'Yesterday',
            unreadCount: 0,
            avatar: 'FH',
            isOnline: true
        },
        {
            id: '4',
            name: 'Ossie Peasey',
            lastMessage: 'Hey Bonnie, yes, definitely! What time works for you?',
            timestamp: '13 days',
            unreadCount: 0,
            avatar: 'OP',
            isOnline: false
        },
        {
            id: '5',
            name: 'Hall Negri',
            lastMessage: 'No worries at all! I\'ll grab a table and wait for you there.',
            timestamp: '2 days',
            unreadCount: 0,
            avatar: 'HN',
            isOnline: true
        }
    ])

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'I know how important this file is to you. You can trust me :) I know how important this file is to you. You can trust me :) know how important this file is to you. You can trust me :)',
            sender: 'other',
            timestamp: new Date('2024-01-15T17:23:00'),
            senderName: 'Nickola Peever',
            status: 'read'
        },
        {
            id: '2',
            content: 'I know how important this file is to you. You can trust me :) me :)',
            sender: 'user',
            timestamp: new Date('2024-01-15T17:23:00'),
            senderName: 'You',
            status: 'read'
        }
    ])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = () => {
        if (message.trim() && selectedChat) {
            const newMessage: Message = {
                id: Date.now().toString(),
                content: message,
                sender: 'user',
                timestamp: new Date(),
                senderName: 'You',
                status: 'sent'
            }
            setMessages(prev => [...prev, newMessage])
            setMessage('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedChatData = chats.find(chat => chat.id === selectedChat)

    const formatTime = (timestamp: Date) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    if (isMobile && selectedChat) {
        // Mobile view when chat is selected
        return (
            <div className="flex flex-col h-screen bg-white">
                {/* Mobile Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedChat(null)}
                        className="p-1"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                {selectedChatData?.avatar}
                            </div>
                            {selectedChatData?.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{selectedChatData?.name}</h3>
                            <p className="text-xs text-green-600">Online</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="p-2">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2">
                            <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-2 rounded-2xl ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-900 border border-gray-200'
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className={`text-xs ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                                        {formatTime(msg.timestamp)}
                                    </span>
                                    {msg.sender === 'user' && (
                                        <div className="text-indigo-200">
                                            ✓✓
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter message..."
                                className="pr-20 rounded-full border-gray-300"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                    <Paperclip className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                    <Smile className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim()}
                            className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Chat List Sidebar */}
            <div className={`${isMobile && selectedChat ? 'hidden' : 'flex'} flex-col w-full ${!isMobile ? 'max-w-sm' : ''} border-r border-gray-200 bg-white`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        {onBack && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onBack}
                                className="p-1 mr-2"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
                        <Button variant="ghost" size="sm" className="p-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Chats search..."
                            className="pl-10 rounded-full border-gray-300"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat.id)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${selectedChat === chat.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                                        {chat.avatar}
                                    </div>
                                    {chat.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                                        <span className="text-xs text-gray-500">{chat.timestamp}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                                        {chat.unreadCount > 0 && (
                                            <Badge variant="default" className="bg-indigo-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                                {chat.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {!isMobile && (
                <div className="flex-1 flex flex-col">
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                                            {selectedChatData?.avatar}
                                        </div>
                                        {selectedChatData?.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{selectedChatData?.name}</h3>
                                        <p className="text-sm text-green-600">Online</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="p-2">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="p-2">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="p-2">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-3 rounded-2xl ${msg.sender === 'user'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <span className={`text-xs ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                                {msg.sender === 'user' && (
                                                    <div className="text-indigo-200">
                                                        ✓✓
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className="p-2">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 relative">
                                        <Input
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Enter message..."
                                            className="pr-12 rounded-full border-gray-300"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                                        >
                                            <Smile className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim()}
                                        className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                                <p className="text-gray-600">Select a chat from the sidebar to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ChatUI