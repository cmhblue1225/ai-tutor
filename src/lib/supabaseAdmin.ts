import { supabase } from './supabase'
import OpenAI from 'openai'
import type { ChunkData } from './chunkingSystem'
import type { ParsedFileData } from './fileParser'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export interface UploadedFile {
  id: string
  file_name: string
  file_type: string
  file_size: number
  subject_id: string
  content: string
  metadata: any
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error_message?: string
  uploaded_at: string
  processed_at?: string
}

export interface FileChunk {
  id: string
  file_id: string
  chunk_index: number
  content: string
  embedding: number[]
  metadata: any
  created_at: string
}

// 파일 업로드 및 메타데이터 저장
export const uploadFileToDatabase = async (
  parsedData: ParsedFileData,
  fileName: string,
  fileType: string,
  fileSize: number,
  subjectId: string
): Promise<UploadedFile> => {
  try {
    const fileData = {
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      subject_id: subjectId,
      content: parsedData.content,
      metadata: parsedData.metadata,
      status: 'processing' as const,
      uploaded_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('uploaded_files')
      .insert([fileData])
      .select()
      .single()

    if (error) {
      throw new Error(`파일 메타데이터 저장 실패: ${error.message}`)
    }

    return data as UploadedFile
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    throw error
  }
}

// 텍스트를 임베딩으로 변환
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000) // 토큰 제한 고려
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('임베딩 생성 오류:', error)
    throw new Error('임베딩 생성에 실패했습니다.')
  }
}

// 청크 데이터를 데이터베이스에 저장 (임베딩 포함)
export const saveChunksWithEmbeddings = async (
  fileId: string,
  chunks: ChunkData[],
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    const totalChunks = chunks.length
    const chunkBatch = 5 // 배치 크기 제한으로 API 부하 조절

    for (let i = 0; i < chunks.length; i += chunkBatch) {
      const batch = chunks.slice(i, i + chunkBatch)
      const chunkPromises = batch.map(async (chunk, batchIndex) => {
        try {
          // 임베딩 생성
          const embedding = await generateEmbedding(chunk.content)

          // 데이터베이스에 저장
          const chunkData = {
            file_id: fileId,
            chunk_index: chunk.metadata.chunkIndex,
            content: chunk.content,
            embedding: `[${embedding.join(',')}]`, // PostgreSQL array 형식
            metadata: chunk.metadata,
            created_at: new Date().toISOString()
          }

          const { error } = await supabase
            .from('file_chunks')
            .insert([chunkData])

          if (error) {
            console.error(`청크 ${chunk.metadata.chunkIndex} 저장 실패:`, error)
            throw error
          }

          // 진행률 업데이트
          const currentProgress = ((i + batchIndex + 1) / totalChunks) * 100
          onProgress?.(Math.min(currentProgress, 100))

          return chunkData
        } catch (error) {
          console.error(`청크 ${chunk.metadata.chunkIndex} 처리 오류:`, error)
          throw error
        }
      })

      // 배치 단위로 병렬 처리
      await Promise.all(chunkPromises)

      // API 호출 간격 조절 (속도 제한 방지)
      if (i + chunkBatch < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  } catch (error) {
    console.error('청크 저장 오류:', error)
    throw error
  }
}

// 파일 처리 완료 상태 업데이트
export const updateFileStatus = async (
  fileId: string,
  status: UploadedFile['status'],
  errorMessage?: string
): Promise<void> => {
  try {
    const updateData: Partial<UploadedFile> = {
      status,
      processed_at: new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabase
      .from('uploaded_files')
      .update(updateData)
      .eq('id', fileId)

    if (error) {
      throw new Error(`파일 상태 업데이트 실패: ${error.message}`)
    }
  } catch (error) {
    console.error('파일 상태 업데이트 오류:', error)
    throw error
  }
}

// 관리자용 파일 목록 조회
export const getUploadedFiles = async (
  subjectId?: string,
  status?: UploadedFile['status']
): Promise<UploadedFile[]> => {
  try {
    let query = supabase
      .from('uploaded_files')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`파일 목록 조회 실패: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('파일 목록 조회 오류:', error)
    throw error
  }
}

// 파일 삭제 (청크 포함)
export const deleteUploadedFile = async (fileId: string): Promise<void> => {
  try {
    // 먼저 관련 청크 삭제
    const { error: chunkError } = await supabase
      .from('file_chunks')
      .delete()
      .eq('file_id', fileId)

    if (chunkError) {
      throw new Error(`청크 삭제 실패: ${chunkError.message}`)
    }

    // 파일 메타데이터 삭제
    const { error: fileError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', fileId)

    if (fileError) {
      throw new Error(`파일 삭제 실패: ${fileError.message}`)
    }
  } catch (error) {
    console.error('파일 삭제 오류:', error)
    throw error
  }
}

// 코사인 유사도 계산 함수
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// 벡터 유사도 검색 (클라이언트 사이드)
export const searchSimilarChunks = async (
  query: string,
  subjectId?: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<Array<FileChunk & { similarity: number; file_name: string }>> => {
  try {
    // 검색 쿼리의 임베딩 생성
    const queryEmbedding = await generateEmbedding(query)

    // 청크 데이터 조회 (과목 필터링 포함)
    let query_builder = supabase
      .from('file_chunks')
      .select(`
        *,
        uploaded_files!inner(
          subject_id,
          file_name,
          status
        )
      `)
      .eq('uploaded_files.status', 'completed')

    if (subjectId) {
      query_builder = query_builder.eq('uploaded_files.subject_id', subjectId)
    }

    const { data: chunks, error } = await query_builder

    if (error) {
      throw new Error(`청크 데이터 조회 실패: ${error.message}`)
    }

    if (!chunks || chunks.length === 0) {
      return []
    }

    // 유사도 계산 및 필터링
    const similarChunks = chunks
      .map(chunk => {
        try {
          // embedding이 문자열 형태의 배열이므로 파싱
          const chunkEmbedding = typeof chunk.embedding === 'string'
            ? JSON.parse(chunk.embedding)
            : chunk.embedding

          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)

          return {
            ...chunk,
            similarity,
            file_name: chunk.uploaded_files?.file_name || 'Unknown',
            embedding: chunkEmbedding
          }
        } catch (embeddingError) {
          console.error('임베딩 파싱 오류:', embeddingError)
          return null
        }
      })
      .filter(chunk => chunk !== null && chunk.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    return similarChunks as Array<FileChunk & { similarity: number; file_name: string }>
  } catch (error) {
    console.error('벡터 검색 오류:', error)
    throw error
  }
}

// 통계 정보 조회
export const getUploadStatistics = async (): Promise<{
  totalFiles: number
  totalChunks: number
  processingFiles: number
  completedFiles: number
  errorFiles: number
  subjectBreakdown: { [key: string]: number }
}> => {
  try {
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select('subject_id, status')

    if (filesError) {
      throw filesError
    }

    const { data: chunks, error: chunksError } = await supabase
      .from('file_chunks')
      .select('id')

    if (chunksError) {
      throw chunksError
    }

    const stats = {
      totalFiles: files?.length || 0,
      totalChunks: chunks?.length || 0,
      processingFiles: files?.filter(f => f.status === 'processing').length || 0,
      completedFiles: files?.filter(f => f.status === 'completed').length || 0,
      errorFiles: files?.filter(f => f.status === 'error').length || 0,
      subjectBreakdown: {} as { [key: string]: number }
    }

    // 과목별 파일 수 계산
    files?.forEach(file => {
      stats.subjectBreakdown[file.subject_id] =
        (stats.subjectBreakdown[file.subject_id] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('통계 조회 오류:', error)
    throw error
  }
}