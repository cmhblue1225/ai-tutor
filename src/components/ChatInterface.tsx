import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import Button from './ui/Button'
import Input from './ui/Input'
import type { StudyRoom } from '../lib/studyRooms'
import { aiClient } from '../lib/ai/client'
import { generateSystemPrompt, generateWelcomeMessage } from '../lib/ai/prompts'
import { getConversations, saveConversation, conversationsToMessages } from '../lib/conversations'
import { GoalSettingWorkflow, type ConcreteGoal } from '../lib/ai/goalSetting'
import { GoalManager } from '../lib/learning/goalManager'

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
  const [conversationHistory, setConversationHistory] = useState<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([])
  const [isGoalSetting, setIsGoalSetting] = useState(false)
  const [goalWorkflow, setGoalWorkflow] = useState<GoalSettingWorkflow | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 초기 대화 기록 로드 및 시스템 프롬프트 설정
  useEffect(() => {
    if (!isInitialized && roomId && room) {
      loadConversationHistory()
    }
  }, [roomId, isInitialized]) // room 의존성 제거하여 중복 호출 방지

  const loadConversationHistory = async () => {
    try {
      // 기존 대화 기록 로드
      const conversations = await getConversations(roomId)

      // 목표 설정 완료 여부 확인
      const hasGoalCompleted = await GoalManager.hasCompletedGoalSetting(roomId)

      if (conversations.length === 0 && !hasGoalCompleted) {
        // 첫 방문 시: 목표 설정 워크플로우 시작
        const workflow = new GoalSettingWorkflow(room)
        setGoalWorkflow(workflow)
        setIsGoalSetting(true)

        const welcomeQuestion = await workflow.generateStepQuestion()
        const welcomeMessage: Message = {
          id: 'goal-setting-welcome',
          role: 'assistant',
          content: welcomeQuestion,
          timestamp: new Date()
        }

        setMessages([welcomeMessage])

        // 목표 설정 메시지 저장
        await saveConversation({
          room_id: roomId,
          role: 'assistant',
          content: welcomeQuestion
        })
      } else if (!hasGoalCompleted) {
        // 대화는 있지만 목표 설정이 완료되지 않은 경우
        const workflow = new GoalSettingWorkflow(room)
        setGoalWorkflow(workflow)
        setIsGoalSetting(true)

        // 기존 대화 복원
        const messageHistory = conversations.map(conv => ({
          id: conv.id,
          role: conv.role,
          content: conv.content,
          timestamp: new Date(conv.created_at)
        }))
        setMessages(messageHistory)
      } else {
        // 목표 설정이 완료된 경우: 일반 AI 튜터 모드
        if (conversations.length === 0) {
          // 목표는 설정되었지만 대화가 없는 경우
          const systemPrompt = generateSystemPrompt(room)
          const welcomeContent = generateWelcomeMessage(room)

          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: welcomeContent,
            timestamp: new Date()
          }

          setMessages([welcomeMessage])
          setConversationHistory([{ role: 'system', content: systemPrompt }])

          // 웰컴 메시지 저장
          await saveConversation({
            room_id: roomId,
            role: 'assistant',
            content: welcomeContent
          })
        } else {
          // 기존 대화 복원
          const messageHistory = conversations.map(conv => ({
            id: conv.id,
            role: conv.role,
            content: conv.content,
            timestamp: new Date(conv.created_at)
          }))

          setMessages(messageHistory)

          // 시스템 프롬프트 + 기존 대화를 컨텍스트로 설정
          const systemPrompt = generateSystemPrompt(room)
          const contextMessages = [{ role: 'system' as const, content: systemPrompt }]
            .concat(conversationsToMessages(conversations))

          setConversationHistory(contextMessages)
        }
      }
    } catch (error) {
      console.error('대화 기록 로드 실패:', error)
      // 오류 시 목표 설정부터 시작
      const workflow = new GoalSettingWorkflow(room)
      setGoalWorkflow(workflow)
      setIsGoalSetting(true)

      const welcomeQuestion = await workflow.generateStepQuestion()
      const welcomeMessage: Message = {
        id: 'goal-setting-fallback',
        role: 'assistant',
        content: welcomeQuestion,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } finally {
      setIsInitialized(true)
    }
  }

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
      // 사용자 메시지 저장
      await saveConversation({
        room_id: roomId,
        role: 'user',
        content: userMessage.content
      })

      let assistantMessage: Message

      if (isGoalSetting && goalWorkflow) {
        // 목표 설정 워크플로우 처리
        const response = await goalWorkflow.processResponse(userMessage.content)

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.nextQuestion,
          timestamp: new Date()
        }

        if (response.isCompleted && response.analysis) {
          // 목표 설정 완료: 데이터베이스에 저장
          console.log('목표 설정 완료! 저장할 데이터:', response.analysis)
          const concreteGoal = response.analysis as ConcreteGoal
          try {
            const savedGoal = await GoalManager.saveLearningGoal(roomId, concreteGoal, room)
            console.log('학습 목표 저장 성공:', savedGoal)
          } catch (error) {
            console.error('학습 목표 저장 실패:', error)
          }

          // 목표 설정 모드 종료
          setIsGoalSetting(false)
          setGoalWorkflow(null)

          // 일반 AI 튜터 모드로 전환
          const systemPrompt = generateSystemPrompt(room)
          setConversationHistory([{ role: 'system', content: systemPrompt }])
        }
      } else {
        // 일반 AI 튜터 모드
        const messagesForAI = conversationHistory.concat([
          { role: 'user', content: userMessage.content }
        ])

        // OpenAI API 호출
        const aiResponse = await aiClient.getChatResponse(messagesForAI, {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000
        })

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.content,
          timestamp: new Date()
        }

        // 대화 히스토리 업데이트
        setConversationHistory(prev => prev.concat([
          { role: 'user', content: userMessage.content },
          { role: 'assistant', content: aiResponse.content }
        ]))
      }

      // AI 응답 저장
      await saveConversation({
        room_id: roomId,
        role: 'assistant',
        content: assistantMessage.content
      })

      // UI 업데이트
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(assistantMessage))
    } catch (error) {
      console.error('AI 응답 생성 실패:', error)
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: '죄송합니다. AI 튜터 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n\n오류가 계속되면 새로고침을 해보시기 바랍니다.',
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
              placeholder={isGoalSetting ? "목표 설정을 위해 답변해주세요..." : "궁금한 것을 질문해보세요..."}
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
          <span>{isGoalSetting ? '🎯 목표 설정 진행 중' : `${room.subject} AI 튜터`}</span>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface