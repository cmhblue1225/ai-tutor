import { supabase } from '../supabase'
import { EmbeddingManager } from './embeddings'

export interface SearchResult {
  chunk_id: string
  title: string
  content: string
  subject: string
  category: string
  similarity_score: number
  importance_score: number
  metadata?: any
}

export interface SearchOptions {
  subject?: string
  category?: string
  limit?: number
  similarityThreshold?: number
  includeMetadata?: boolean
}

/**
 * pgvector 기반 벡터 검색 시스템
 */
export class VectorSearchEngine {

  /**
   * 지식 청크의 임베딩 생성 및 저장
   */
  static async createEmbeddingForChunk(chunkId: string): Promise<boolean> {
    try {
      console.log('청크 임베딩 생성 시작:', chunkId)

      // 1. 청크 데이터 조회
      const { data: chunk, error: chunkError } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('id', chunkId)
        .single()

      if (chunkError) {
        throw new Error(`청크 조회 실패: ${chunkError.message}`)
      }

      // 2. 텍스트 전처리 및 임베딩 생성
      const textForEmbedding = `${chunk.title}\n\n${chunk.content}`
      const preprocessedText = EmbeddingManager.preprocessText(textForEmbedding)
      const embedding = await EmbeddingManager.generateEmbedding(preprocessedText)

      // 3. 임베딩 검증
      if (!EmbeddingManager.validateEmbedding(embedding)) {
        throw new Error('생성된 임베딩이 유효하지 않습니다')
      }

      // 4. 기존 임베딩이 있는지 확인
      const { data: existingEmbedding, error: checkError } = await supabase
        .from('vector_embeddings')
        .select('id')
        .eq('chunk_id', chunkId)
        .maybeSingle()

      if (checkError) {
        throw new Error(`기존 임베딩 확인 실패: ${checkError.message}`)
      }

      // 5. 임베딩 저장 (업데이트 또는 삽입)
      if (existingEmbedding) {
        const { error: updateError } = await supabase
          .from('vector_embeddings')
          .update({
            embedding: `[${embedding.join(',')}]`,
            model_name: 'text-embedding-3-small'
          })
          .eq('chunk_id', chunkId)

        if (updateError) {
          throw new Error(`임베딩 업데이트 실패: ${updateError.message}`)
        }
      } else {
        const { error: insertError } = await supabase
          .from('vector_embeddings')
          .insert({
            chunk_id: chunkId,
            embedding: `[${embedding.join(',')}]`,
            model_name: 'text-embedding-3-small'
          })

        if (insertError) {
          throw new Error(`임베딩 삽입 실패: ${insertError.message}`)
        }
      }

      console.log('청크 임베딩 생성 완료:', chunkId)
      return true

    } catch (error) {
      console.error('청크 임베딩 생성 실패:', error)
      return false
    }
  }

  /**
   * 모든 지식 청크의 임베딩 생성 (배치 처리)
   */
  static async createAllEmbeddings(): Promise<{ success: number; failed: number }> {
    try {
      console.log('전체 청크 임베딩 생성 시작')

      // 1. 모든 청크 조회
      const { data: chunks, error: chunksError } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .order('created_at')

      if (chunksError) {
        throw new Error(`청크 목록 조회 실패: ${chunksError.message}`)
      }

      if (!chunks || chunks.length === 0) {
        console.log('임베딩을 생성할 청크가 없습니다')
        return { success: 0, failed: 0 }
      }

      console.log(`총 ${chunks.length}개 청크 임베딩 생성 시작`)

      let success = 0
      let failed = 0

      // 2. 각 청크별 임베딩 생성 (순차 처리로 API 제한 회피)
      for (const chunk of chunks) {
        try {
          await new Promise(resolve => setTimeout(resolve, 200)) // 0.2초 대기
          const result = await this.createEmbeddingForChunk(chunk.id)
          if (result) {
            success++
          } else {
            failed++
          }
        } catch (error) {
          console.error(`청크 ${chunk.id} 임베딩 생성 실패:`, error)
          failed++
        }
      }

      console.log(`임베딩 생성 완료: 성공 ${success}개, 실패 ${failed}개`)
      return { success, failed }

    } catch (error) {
      console.error('전체 임베딩 생성 실패:', error)
      throw error
    }
  }

  /**
   * 벡터 유사도 검색 수행
   */
  static async searchSimilar(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      console.log('벡터 검색 시작:', query)

      const {
        subject,
        category,
        limit = 10,
        similarityThreshold = 0.7,
        includeMetadata = false
      } = options

      // 1. 쿼리 임베딩 생성
      const preprocessedQuery = EmbeddingManager.preprocessText(query)
      const queryEmbedding = await EmbeddingManager.generateEmbedding(preprocessedQuery)

      // 2. 벡터 검색 쿼리 구성
      let searchQuery = `
        SELECT
          kc.id as chunk_id,
          kc.title,
          kc.content,
          kc.subject,
          kc.category,
          kc.importance_score,
          ${includeMetadata ? 'kc.metadata,' : ''}
          (ve.embedding <=> '[${queryEmbedding.join(',')}]'::vector) as distance
        FROM knowledge_chunks kc
        JOIN vector_embeddings ve ON kc.id = ve.chunk_id
        WHERE 1=1
      `

      const queryParams: any[] = []

      // 3. 필터 조건 추가
      if (subject) {
        queryParams.push(subject)
        searchQuery += ` AND kc.subject = $${queryParams.length}`
      }

      if (category) {
        queryParams.push(category)
        searchQuery += ` AND kc.category = $${queryParams.length}`
      }

      // 4. 유사도 임계값 적용 (거리는 유사도와 반비례)
      const maxDistance = 1 - similarityThreshold
      queryParams.push(maxDistance)
      searchQuery += ` AND (ve.embedding <=> '[${queryEmbedding.join(',')}]'::vector) <= $${queryParams.length}`

      // 5. 정렬 및 제한
      searchQuery += `
        ORDER BY
          (ve.embedding <=> '[${queryEmbedding.join(',')}]'::vector) ASC,
          kc.importance_score DESC
        LIMIT ${limit}
      `

      console.log('벡터 검색 쿼리 실행')

      // 6. 검색 실행
      const { data: results, error: searchError } = await supabase.rpc('execute_vector_search', {
        search_query: searchQuery
      })

      if (searchError) {
        // RPC 함수가 없는 경우 직접 쿼리 실행
        console.log('RPC 함수 없음, 직접 쿼리 실행')

        const { data: directResults, error: directError } = await supabase
          .from('knowledge_chunks')
          .select(`
            id,
            title,
            content,
            subject,
            category,
            importance_score,
            ${includeMetadata ? 'metadata,' : ''}
            vector_embeddings!inner(embedding)
          `)
          .limit(limit)

        if (directError) {
          throw new Error(`직접 검색 실패: ${directError.message}`)
        }

        // 클라이언트 사이드에서 유사도 계산
        const similarityResults = []
        for (const row of directResults || []) {
          try {
            const embeddingArray = JSON.parse(row.vector_embeddings.embedding)
            const similarity = EmbeddingManager.cosineSimilarity(queryEmbedding, embeddingArray)

            if (similarity >= similarityThreshold) {
              similarityResults.push({
                chunk_id: row.id,
                title: row.title,
                content: row.content,
                subject: row.subject,
                category: row.category,
                similarity_score: similarity,
                importance_score: row.importance_score,
                ...(includeMetadata && { metadata: row.metadata })
              })
            }
          } catch (embeddingError) {
            console.warn('임베딩 파싱 실패:', row.id)
          }
        }

        // 유사도 순으로 정렬
        similarityResults.sort((a, b) => b.similarity_score - a.similarity_score)

        console.log(`벡터 검색 완료: ${similarityResults.length}개 결과`)
        return similarityResults.slice(0, limit)
      }

      // 7. 결과 변환
      const searchResults: SearchResult[] = (results || []).map((row: any) => ({
        chunk_id: row.chunk_id,
        title: row.title,
        content: row.content,
        subject: row.subject,
        category: row.category,
        similarity_score: 1 - row.distance, // 거리를 유사도로 변환
        importance_score: row.importance_score,
        ...(includeMetadata && { metadata: row.metadata })
      }))

      console.log(`벡터 검색 완료: ${searchResults.length}개 결과`)
      return searchResults

    } catch (error) {
      console.error('벡터 검색 실패:', error)
      throw error
    }
  }

  /**
   * 임베딩 상태 확인
   */
  static async getEmbeddingStatus(): Promise<{
    total_chunks: number
    embedded_chunks: number
    missing_embeddings: string[]
  }> {
    try {
      // 1. 전체 청크 수 조회
      const { count: totalChunks, error: totalError } = await supabase
        .from('knowledge_chunks')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        throw new Error(`전체 청크 수 조회 실패: ${totalError.message}`)
      }

      // 2. 임베딩이 있는 청크 수 조회
      const { count: embeddedChunks, error: embeddedError } = await supabase
        .from('vector_embeddings')
        .select('*', { count: 'exact', head: true })

      if (embeddedError) {
        throw new Error(`임베딩 청크 수 조회 실패: ${embeddedError.message}`)
      }

      // 3. 임베딩이 누락된 청크 목록 조회
      const { data: missingChunks, error: missingError } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .not('id', 'in', `(${supabase.from('vector_embeddings').select('chunk_id')})`)

      if (missingError) {
        throw new Error(`누락 청크 조회 실패: ${missingError.message}`)
      }

      return {
        total_chunks: totalChunks || 0,
        embedded_chunks: embeddedChunks || 0,
        missing_embeddings: (missingChunks || []).map(chunk => chunk.id)
      }

    } catch (error) {
      console.error('임베딩 상태 확인 실패:', error)
      throw error
    }
  }

  /**
   * 특정 주제에 대한 관련 지식 검색
   */
  static async findRelatedKnowledge(
    subject: string,
    topic: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const searchQuery = `${subject} ${topic}에 대해 설명해주세요`

    return await this.searchSimilar(searchQuery, {
      subject,
      limit,
      similarityThreshold: 0.6
    })
  }
}