import React from 'react'
import { useNavigate } from 'react-router-dom'
import ChatUI from '../components/Chat'
import { useAuth } from '../AuthProvider/AuthProvider'

const ChatPage: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const handleBack = () => {
        // Navigate back based on user type
        if (user?.role === 'ORGANIZATION') {
            navigate('/orgdashboard')
        } else {
            navigate('/home')
        }
    }

    return (
        <div className="h-screen">
            <ChatUI onBack={handleBack} />
        </div>
    )
}

export default ChatPage