import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 브라우저에서 사용하기 위한 설정
})

// AI 응답 타입 정의
export interface AIResponse {
  content: string
  role: 'assistant'
  timestamp: Date
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 스트리밍 응답을 위한 타입
export interface AIStreamChunk {
  content: string
  isComplete: boolean
}

// AI 클라이언트 클래스
export class AIClient {
  private client: OpenAI

  constructor() {
    this.client = openai
  }

  // 일반적인 채팅 응답 (스트리밍 없음)
  async getChatResponse(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: {
      model?: string
      temperature?: number
      max_tokens?: number
    }
  ): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
      })

      const choice = response.choices[0]
      if (!choice.message.content) {
        throw new Error('AI 응답을 받지 못했습니다.')
      }

      return {
        content: choice.message.content,
        role: 'assistant',
        timestamp: new Date(),
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : undefined
      }
    } catch (error) {
      console.error('AI 응답 생성 중 오류:', error)
      throw new Error('AI 응답을 생성하는데 실패했습니다.')
    }
  }

  // 스트리밍 응답
  async *getChatStreamResponse(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: {
      model?: string
      temperature?: number
      max_tokens?: number
    }
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        const isComplete = chunk.choices[0]?.finish_reason !== null

        if (content) {
          yield {
            content,
            isComplete
          }
        }

        if (isComplete) {
          yield {
            content: '',
            isComplete: true
          }
          break
        }
      }
    } catch (error) {
      console.error('AI 스트리밍 응답 생성 중 오류:', error)
      throw new Error('AI 응답을 생성하는데 실패했습니다.')
    }
  }

  // API 키 유효성 검사
  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch (error) {
      console.error('API 키 검증 실패:', error)
      return false
    }
  }
}

// 전역 AI 클라이언트 인스턴스
export const aiClient = new AIClient()