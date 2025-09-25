import { extractFileMetadata } from './fileParser'

export interface ChunkData {
  id: string
  content: string
  metadata: {
    chunkIndex: number
    totalChunks: number
    startOffset: number
    endOffset: number
    chunkType: 'textbook' | 'question' | 'mixed'
    subject?: string
    examInfo?: {
      year: number
      round: number
    }
  }
}

export interface ChunkingOptions {
  maxChunkSize: number
  overlapSize: number
  chunkType: 'textbook' | 'question' | 'auto'
}

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxChunkSize: 2000, // 교과서용 기본 청킹 크기
  overlapSize: 200,   // 200자 오버랩
  chunkType: 'auto'   // 자동 탐지
}

export const chunkContent = (
  content: string,
  fileName: string,
  options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS
): ChunkData[] => {
  const fileMetadata = extractFileMetadata(fileName, content)

  // 청킹 타입 결정
  let chunkType = options.chunkType
  if (chunkType === 'auto') {
    if (fileMetadata.hasQuestions) {
      chunkType = 'question'
    } else if (fileMetadata.isTextbook) {
      chunkType = 'textbook'
    } else {
      chunkType = 'mixed'
    }
  }

  switch (chunkType) {
    case 'question':
      return chunkQuestions(content, fileName, fileMetadata)
    case 'textbook':
      return chunkTextbook(content, fileName, fileMetadata, options)
    case 'mixed':
    default:
      return chunkMixed(content, fileName, fileMetadata, options)
  }
}

// 기출문제용 청킹 (문제별 분할)
const chunkQuestions = (content: string, fileName: string, fileMetadata: any): ChunkData[] => {
  const chunks: ChunkData[] = []

  // 문제 번호 패턴으로 분할 (1., 2., 3., ... 또는 1번, 2번, ...)
  const questionPattern = /(?:^|\n)(?:\d+\.|\d+번)/gm
  const matches = Array.from(content.matchAll(questionPattern))

  if (matches.length === 0) {
    // 문제 패턴이 없으면 일반 청킹으로 fallback
    return chunkTextbook(content, fileName, fileMetadata, DEFAULT_CHUNKING_OPTIONS)
  }

  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index || 0
    const endIndex = i < matches.length - 1 ? (matches[i + 1].index || content.length) : content.length

    const questionContent = content.slice(startIndex, endIndex).trim()

    if (questionContent.length > 50) { // 최소 길이 체크
      chunks.push({
        id: `${fileName}_question_${i + 1}`,
        content: questionContent,
        metadata: {
          chunkIndex: i,
          totalChunks: matches.length,
          startOffset: startIndex,
          endOffset: endIndex,
          chunkType: 'question',
          subject: fileMetadata.subject,
          examInfo: fileMetadata.examInfo
        }
      })
    }
  }

  return chunks
}

// 교과서용 청킹 (고정 크기 + 오버랩)
const chunkTextbook = (
  content: string,
  fileName: string,
  fileMetadata: any,
  options: ChunkingOptions
): ChunkData[] => {
  const chunks: ChunkData[] = []
  const { maxChunkSize, overlapSize } = options

  let currentOffset = 0
  let chunkIndex = 0

  while (currentOffset < content.length) {
    const endOffset = Math.min(currentOffset + maxChunkSize, content.length)
    let chunkContent = content.slice(currentOffset, endOffset)

    // 문장 단위로 자르기 위해 마지막 마침표나 개행 찾기
    if (endOffset < content.length) {
      const lastSentenceEnd = Math.max(
        chunkContent.lastIndexOf('.'),
        chunkContent.lastIndexOf('!'),
        chunkContent.lastIndexOf('?'),
        chunkContent.lastIndexOf('\n')
      )

      if (lastSentenceEnd > maxChunkSize * 0.7) {
        chunkContent = chunkContent.slice(0, lastSentenceEnd + 1)
      }
    }

    if (chunkContent.trim().length > 100) { // 최소 길이 체크
      chunks.push({
        id: `${fileName}_chunk_${chunkIndex}`,
        content: chunkContent.trim(),
        metadata: {
          chunkIndex,
          totalChunks: Math.ceil(content.length / (maxChunkSize - overlapSize)),
          startOffset: currentOffset,
          endOffset: currentOffset + chunkContent.length,
          chunkType: 'textbook',
          subject: fileMetadata.subject,
          examInfo: fileMetadata.examInfo
        }
      })

      chunkIndex++
    }

    // 다음 청크 시작점 (오버랩 고려)
    currentOffset += chunkContent.length - overlapSize

    // 무한 루프 방지
    if (currentOffset >= content.length - overlapSize) {
      break
    }
  }

  return chunks
}

// 혼합 타입 청킹
const chunkMixed = (
  content: string,
  fileName: string,
  fileMetadata: any,
  options: ChunkingOptions
): ChunkData[] => {
  // 문제가 포함된 경우 문제 위주로 청킹하되, 텍스트 부분은 교과서 방식으로
  if (fileMetadata.hasQuestions) {
    return chunkQuestions(content, fileName, fileMetadata)
  } else {
    return chunkTextbook(content, fileName, fileMetadata, options)
  }
}

// 청크 품질 검증
export const validateChunkQuality = (chunks: ChunkData[]): {
  isValid: boolean
  issues: string[]
} => {
  const issues: string[] = []

  // 최소 청크 수 체크
  if (chunks.length === 0) {
    issues.push('청크가 생성되지 않았습니다.')
  }

  // 너무 짧은 청크 체크
  const shortChunks = chunks.filter(chunk => chunk.content.length < 50)
  if (shortChunks.length > chunks.length * 0.3) {
    issues.push(`전체 청크의 ${Math.round(shortChunks.length / chunks.length * 100)}%가 너무 짧습니다.`)
  }

  // 너무 긴 청크 체크
  const longChunks = chunks.filter(chunk => chunk.content.length > 5000)
  if (longChunks.length > 0) {
    issues.push(`${longChunks.length}개의 청크가 권장 크기를 초과합니다.`)
  }

  // 빈 청크 체크
  const emptyChunks = chunks.filter(chunk => chunk.content.trim().length === 0)
  if (emptyChunks.length > 0) {
    issues.push(`${emptyChunks.length}개의 빈 청크가 있습니다.`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}