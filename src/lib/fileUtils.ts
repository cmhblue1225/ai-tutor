// 파일 처리 유틸리티 함수들
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md'
} as const

export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export const validateFile = (file: File): FileValidationResult => {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.`
    }
  }

  // 파일 타입 검증
  const supportedTypes = Object.keys(SUPPORTED_FILE_TYPES)
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'PDF, TXT, MD 파일만 업로드 가능합니다.'
    }
  }

  return { isValid: true }
}

export const getFileIcon = (fileType: string): string => {
  switch (fileType) {
    case 'application/pdf':
      return '📄'
    case 'text/plain':
      return '📝'
    case 'text/markdown':
      return '📋'
    default:
      return '📎'
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const generateFileId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}