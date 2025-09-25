import { VectorSearchEngine, type SearchResult } from './vectorSearch'
import { aiClient } from './client'
import type { StudyRoom } from '../studyRooms'

export interface RAGContext {
  query: string
  retrievedChunks: SearchResult[]
  totalSimilarityScore: number
  searchOptions: {
    subject?: string
    category?: string
    limit: number
    threshold: number
  }
}

export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  context: RAGContext
  confidence: number
  responseType: 'direct' | 'contextual' | 'general'
}

/**
 * RAG (Retrieval-Augmented Generation) 시스템
 * 벡터 검색과 LLM을 결합하여 지식 기반 응답을 생성합니다
 */
export class RAGSystem {

  /**
   * RAG 기반 질문 응답
   */
  static async askQuestion(
    question: string,
    room: StudyRoom,
    options: {
      maxSources?: number
      similarityThreshold?: number
      includeGeneralKnowledge?: boolean
    } = {}
  ): Promise<RAGResponse> {
    try {
      const {
        maxSources = 5,
        similarityThreshold = 0.7,
        includeGeneralKnowledge = true
      } = options

      console.log('RAG 질문 처리 시작:', question)

      // 1. 관련 지식 검색
      const searchResults = await VectorSearchEngine.searchSimilar(question, {
        subject: room.subject,
        category: room.category,
        limit: maxSources,
        similarityThreshold,
        includeMetadata: true
      })

      console.log(`검색 결과: ${searchResults.length}개 청크`)

      // 2. 컨텍스트 구성
      const context: RAGContext = {
        query: question,
        retrievedChunks: searchResults,
        totalSimilarityScore: searchResults.reduce((sum, chunk) => sum + chunk.similarity_score, 0),
        searchOptions: {
          subject: room.subject,
          category: room.category,
          limit: maxSources,
          threshold: similarityThreshold
        }
      }

      // 3. 응답 유형 결정
      let responseType: RAGResponse['responseType'] = 'general'
      if (searchResults.length > 0) {
        const avgSimilarity = context.totalSimilarityScore / searchResults.length
        if (avgSimilarity >= 0.85) {
          responseType = 'direct'
        } else if (avgSimilarity >= 0.7) {
          responseType = 'contextual'
        }
      }

      console.log('응답 유형:', responseType)

      // 4. LLM 프롬프트 생성 및 응답 생성
      const answer = await this.generateContextualAnswer(
        question,
        searchResults,
        room,
        responseType,
        includeGeneralKnowledge
      )

      // 5. 신뢰도 계산
      const confidence = this.calculateConfidence(searchResults, responseType)

      const ragResponse: RAGResponse = {
        answer,
        sources: searchResults,
        context,
        confidence,
        responseType
      }

      console.log('RAG 응답 생성 완료, 신뢰도:', confidence)
      return ragResponse

    } catch (error) {
      console.error('RAG 질문 처리 실패:', error)
      throw error
    }
  }

  /**
   * 컨텍스트 기반 답변 생성
   */
  private static async generateContextualAnswer(
    question: string,
    sources: SearchResult[],
    room: StudyRoom,
    responseType: RAGResponse['responseType'],
    includeGeneral: boolean
  ): Promise<string> {

    // 검색된 지식을 텍스트로 구성
    const contextText = sources.map((source, index) =>
      `[참조 ${index + 1}] ${source.title}\n${source.content}\n(유사도: ${(source.similarity_score * 100).toFixed(1)}%)`
    ).join('\n\n')

    let systemPrompt = ''
    let userPrompt = ''

    if (responseType === 'direct' && sources.length > 0) {
      // 직접적인 답변이 가능한 경우
      systemPrompt = `당신은 ${room.subject} 분야의 전문 AI 튜터입니다.
제공된 학습 자료를 바탕으로 정확하고 구체적인 답변을 제공하세요.

**중요 지침:**
1. 제공된 참조 자료의 내용을 우선적으로 사용하세요
2. 정확한 정보만 제공하고, 확실하지 않은 내용은 명시하세요
3. 학습자의 수준을 고려하여 이해하기 쉽게 설명하세요
4. 필요시 참조 번호를 언급하여 출처를 명시하세요
5. 한국어로 자연스럽게 답변하세요`

      userPrompt = `**질문**: ${question}

**참조 자료**:
${contextText}

위 참조 자료를 바탕으로 질문에 대해 정확하고 자세히 답변해주세요.`

    } else if (responseType === 'contextual' && sources.length > 0) {
      // 부분적 관련성이 있는 경우
      systemPrompt = `당신은 ${room.subject} 분야의 전문 AI 튜터입니다.
제공된 학습 자료를 참고하되, 필요시 추가적인 전문 지식을 활용하여 완전한 답변을 제공하세요.

**중요 지침:**
1. 제공된 참조 자료의 관련 부분을 활용하세요
2. 참조 자료가 부족한 부분은 전문 지식으로 보완하세요
3. 어떤 부분이 참조 자료에서 온 것인지 구분해주세요
4. 학습 목표에 맞는 수준으로 설명하세요
5. 실용적이고 도움이 되는 정보를 제공하세요`

      userPrompt = `**질문**: ${question}

**참조 자료**:
${contextText}

위 참조 자료를 참고하되, 필요시 추가 지식을 활용하여 질문에 대해 완전하고 유용한 답변을 제공해주세요.`

    } else {
      // 일반적 지식으로 답변하는 경우
      if (!includeGeneral) {
        return "죄송합니다. 현재 학습 자료에서 관련 정보를 찾을 수 없습니다. 다른 질문을 해보시거나, 더 구체적인 키워드를 사용해보세요."
      }

      systemPrompt = `당신은 ${room.subject} 분야의 전문 AI 튜터입니다.
특정 참조 자료는 없지만, 해당 분야의 전문 지식을 바탕으로 정확하고 유용한 답변을 제공하세요.

**중요 지침:**
1. ${room.subject} 분야의 전문 지식을 활용하세요
2. 정확성을 최우선으로 하되, 확실하지 않은 내용은 명시하세요
3. 학습 목표와 수준에 적합한 설명을 제공하세요
4. 실용적이고 학습에 도움이 되는 내용을 포함하세요
5. 추가 학습 방향을 제시해주세요`

      userPrompt = `**학습 분야**: ${room.subject} (${room.category})
**질문**: ${question}

위 질문에 대해 전문적이고 정확한 답변을 제공해주세요.`
    }

    try {
      const response = await aiClient.getChatResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000
      })

      return response.content
    } catch (error) {
      console.error('답변 생성 실패:', error)
      return "죄송합니다. 현재 답변을 생성할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
  }

  /**
   * 응답 신뢰도 계산
   */
  private static calculateConfidence(
    sources: SearchResult[],
    responseType: RAGResponse['responseType']
  ): number {
    if (sources.length === 0) {
      return responseType === 'general' ? 0.6 : 0.3
    }

    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity_score, 0) / sources.length
    const sourceCount = Math.min(sources.length, 5) / 5 // 최대 5개 소스 기준으로 정규화

    let baseConfidence = 0
    switch (responseType) {
      case 'direct':
        baseConfidence = 0.9
        break
      case 'contextual':
        baseConfidence = 0.75
        break
      case 'general':
        baseConfidence = 0.6
        break
    }

    // 유사도와 소스 수를 고려하여 신뢰도 조정
    const confidence = baseConfidence * (0.7 + 0.3 * avgSimilarity) * (0.8 + 0.2 * sourceCount)

    return Math.min(Math.max(confidence, 0.1), 0.95) // 0.1 ~ 0.95 범위로 제한
  }

  /**
   * 특정 주제에 대한 상세 설명 생성
   */
  static async explainTopic(
    topic: string,
    room: StudyRoom,
    detailLevel: 'basic' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<RAGResponse> {
    const question = `${topic}에 대해 ${detailLevel} 수준으로 자세히 설명해주세요.`

    return await this.askQuestion(question, room, {
      maxSources: 8,
      similarityThreshold: 0.6,
      includeGeneralKnowledge: true
    })
  }

  /**
   * 연관 개념 및 학습 자료 추천
   */
  static async getRelatedConcepts(
    topic: string,
    room: StudyRoom
  ): Promise<{
    relatedTopics: string[]
    suggestedQuestions: string[]
    additionalSources: SearchResult[]
  }> {
    try {
      // 1. 관련 지식 검색
      const relatedSources = await VectorSearchEngine.searchSimilar(topic, {
        subject: room.subject,
        category: room.category,
        limit: 10,
        similarityThreshold: 0.5
      })

      // 2. 연관 주제 추출
      const topics = [...new Set(
        relatedSources
          .map(source => source.title)
          .filter(title => title !== topic)
          .slice(0, 5)
      )]

      // 3. 추천 질문 생성
      const questions = [
        `${topic}의 핵심 개념은 무엇인가요?`,
        `${topic}을 실무에서 어떻게 활용하나요?`,
        `${topic}과 관련된 주의사항은 무엇인가요?`,
        `${topic}의 장단점을 비교해주세요.`,
        `${topic}을 효과적으로 학습하는 방법은?`
      ]

      return {
        relatedTopics: topics,
        suggestedQuestions: questions,
        additionalSources: relatedSources.slice(0, 5)
      }
    } catch (error) {
      console.error('연관 개념 추천 실패:', error)
      return {
        relatedTopics: [],
        suggestedQuestions: [],
        additionalSources: []
      }
    }
  }

  /**
   * RAG 시스템 상태 확인
   */
  static async getSystemStatus(): Promise<{
    isReady: boolean
    embeddingStatus: any
    lastUpdate: string
    recommendations: string[]
  }> {
    try {
      const embeddingStatus = await VectorSearchEngine.getEmbeddingStatus()

      const isReady = embeddingStatus.embedded_chunks > 0
      const completionRate = embeddingStatus.total_chunks > 0
        ? embeddingStatus.embedded_chunks / embeddingStatus.total_chunks
        : 0

      const recommendations = []

      if (!isReady) {
        recommendations.push('임베딩을 생성해야 합니다. 초기화를 진행하세요.')
      } else if (completionRate < 1.0) {
        recommendations.push(`${embeddingStatus.missing_embeddings.length}개 청크의 임베딩이 누락되었습니다.`)
      }

      if (embeddingStatus.embedded_chunks < 10) {
        recommendations.push('더 많은 학습 데이터를 추가하면 검색 품질이 향상됩니다.')
      }

      return {
        isReady,
        embeddingStatus,
        lastUpdate: new Date().toISOString(),
        recommendations
      }
    } catch (error) {
      console.error('RAG 시스템 상태 확인 실패:', error)
      return {
        isReady: false,
        embeddingStatus: null,
        lastUpdate: new Date().toISOString(),
        recommendations: ['시스템 상태를 확인할 수 없습니다.']
      }
    }
  }
}