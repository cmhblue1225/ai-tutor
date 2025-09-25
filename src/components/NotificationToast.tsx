import React, { useEffect } from 'react'
import type { TabNotification } from '../hooks/useTabNotifications'

interface NotificationToastProps {
  notification: TabNotification
  onRemove: (id: string) => void
  onTabSwitch?: (tab: 'chat' | 'progress' | 'materials') => void
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onRemove,
  onTabSwitch
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id)
    }, 5000) // 5초 후 자동 제거

    return () => clearTimeout(timer)
  }, [notification.id, onRemove])

  const getIcon = (type: TabNotification['type']) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'achievement':
        return (
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'update':
        return (
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getBorderColor = (type: TabNotification['type']) => {
    switch (type) {
      case 'success': return 'border-l-green-500'
      case 'achievement': return 'border-l-yellow-500'
      case 'info': return 'border-l-blue-500'
      case 'update': return 'border-l-purple-500'
      default: return 'border-l-gray-500'
    }
  }

  const handleActionClick = () => {
    if (notification.targetTab && onTabSwitch) {
      onTabSwitch(notification.targetTab)
      onRemove(notification.id)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border-l-4 ${getBorderColor(notification.type)} p-4 mb-3 max-w-sm animate-slide-in-right`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            {notification.targetTab && onTabSwitch && (
              <button
                onClick={handleActionClick}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
              >
                확인하기
              </button>
            )}
            <button
              onClick={() => onRemove(notification.id)}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationToast