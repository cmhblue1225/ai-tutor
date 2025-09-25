// AI 관련 모든 모듈을 내보내는 인덱스 파일

export { aiClient, AIClient } from './client'
export type { AIResponse, AIStreamChunk } from './client'

export {
  generateSystemPrompt,
  generateWelcomeMessage,
  generateContextSummaryPrompt
} from './prompts'