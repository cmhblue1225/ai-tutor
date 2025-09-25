import { aiClient } from './client'

/**
 * OpenAI 임베딩 생성 및 관리 클래스
 */
export class EmbeddingManager {
  private static readonly MODEL_NAME = 'text-embedding-3-small'
  private static readonly EMBEDDING_DIMENSION = 1536

  /**
   * 텍스트의 임베딩을 생성합니다
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('임베딩 생성 시작:', text.substring(0, 100) + '...')

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.MODEL_NAME,
          dimensions: this.EMBEDDING_DIMENSION
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('잘못된 임베딩 응답 형식')
      }

      const embedding = data.data[0].embedding
      console.log('임베딩 생성 완료:', embedding.length, '차원')

      return embedding
    } catch (error) {
      console.error('임베딩 생성 실패:', error)
      throw error
    }
  }

  /**
   * 여러 텍스트의 임베딩을 배치로 생성합니다
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log('배치 임베딩 생성 시작:', texts.length, '개 텍스트')

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: this.MODEL_NAME,
          dimensions: this.EMBEDDING_DIMENSION
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('잘못된 임베딩 응답 형식')
      }

      const embeddings = data.data.map((item: any) => item.embedding)
      console.log('배치 임베딩 생성 완료:', embeddings.length, '개')

      return embeddings
    } catch (error) {
      console.error('배치 임베딩 생성 실패:', error)
      throw error
    }
  }

  /**
   * 코사인 유사도 계산
   */
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('벡터 차원이 일치하지 않습니다')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * 임베딩 품질 검증
   */
  static validateEmbedding(embedding: number[]): boolean {
    if (!Array.isArray(embedding)) {
      return false
    }

    if (embedding.length !== this.EMBEDDING_DIMENSION) {
      return false
    }

    // NaN이나 Infinity 값 확인
    return embedding.every(val => typeof val === 'number' && isFinite(val))
  }

  /**
   * 텍스트 전처리 (임베딩 생성 전)
   */
  static preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거 (한글 유지)
      .trim()
      .substring(0, 8000) // OpenAI 토큰 제한 고려
  }

  /**
   * 임베딩 메타데이터 생성
   */
  static createEmbeddingMetadata(chunkId: string, text: string) {
    return {
      chunk_id: chunkId,
      text_length: text.length,
      model_name: this.MODEL_NAME,
      dimensions: this.EMBEDDING_DIMENSION,
      created_at: new Date().toISOString()
    }
  }
}