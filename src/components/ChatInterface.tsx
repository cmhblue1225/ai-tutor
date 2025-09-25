import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import Button from './ui/Button'
import Input from './ui/Input'
import type { StudyRoom } from '../lib/studyRooms'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
}

interface ChatInterfaceProps {
  roomId: string
  room: StudyRoom
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ roomId, room }) => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 초기 환영 메시지 설정
  useEffect(() => {
    if (!isInitialized) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `안녕하세요! 저는 ${room.subject} 전문 AI 튜터입니다. 🤖

**${room.name}** 학습 공간에서 함께 공부해요!

📚 **학습 목표**: ${room.goal}
🎯 **분야**: ${room.category}
${room.goal_type === 'certification' ? '🏆 **목표**: 자격증 합격' : '🎨 **목표**: 실력 향상'}

궁금한 것이 있으면 언제든 질문해주세요. 개념 설명, 문제 풀이, 학습 계획 수립 등 모든 것을 도와드릴 수 있어요!`,
        timestamp: new Date()
      }

      setMessages([welcomeMessage])
      setIsInitialized(true)
    }
  }, [room, isInitialized])

  // 텍스트영역 높이 자동 조정
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // 타이핑 인디케이터 표시
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }

    setMessages(prev => [...prev, typingMessage])

    try {
      // TODO: 실제 AI API 호출 로직
      // 현재는 시뮬레이션된 응답
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      const assistantResponse = generateMockResponse(userMessage.content, room)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(assistantMessage))
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: '죄송합니다. 메시지 전송 중 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date()
      }
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const generateMockResponse = (userInput: string, room: StudyRoom): string => {
    const responses = [
      `${room.subject}에 대한 좋은 질문이네요! 이 개념을 차근차근 설명해드리겠습니다.`,
      `${room.goal_type === 'certification' ? '시험에' : '학습에'} 도움이 되는 정보를 알려드릴게요.`,
      `${room.category} 분야에서는 이런 접근 방식이 효과적입니다.`,
      '더 자세한 설명이 필요하시면 언제든 말씀해 주세요!',
      '이해가 잘 되셨나요? 다른 궁금한 점이 있으시면 계속 질문해 주세요.'
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
              message.role === 'user' ? 'order-2' : 'order-1'
            }`}>
              {/* 메시지 버블 */}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isTyping
                    ? 'bg-gray-100 border border-gray-200'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {message.isTyping ? (
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500 ml-2">AI 튜터가 입력 중...</span>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {message.content}
                  </pre>
                )}
              </div>

              {/* 시간 표시 */}
              {!message.isTyping && (
                <div className={`text-xs text-gray-500 mt-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>

            {/* 아바타 */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              message.role === 'user'
                ? 'order-1 ml-3 bg-blue-500 text-white'
                : 'order-2 mr-3 bg-gradient-to-br from-purple-500 to-blue-600 text-white'
            }`}>
              {message.role === 'user'
                ? (user?.email?.[0]?.toUpperCase() || 'U')
                : '🤖'
              }
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="card-premium p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="궁금한 것을 질문해보세요..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="gradient-primary text-white shadow-colored hover:shadow-lg transition-all duration-300 px-6 py-3"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>

        {/* 도움말 텍스트 */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>💡 Shift + Enter로 줄바꿈</span>
            <span>⚡ Enter로 전송</span>
          </div>
          <span>{room.subject} AI 튜터</span>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface