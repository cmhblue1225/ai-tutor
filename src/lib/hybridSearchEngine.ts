import { searchSimilarChunks } from './supabaseAdmin'
import { supabase } from './supabase'

export interface HybridSearchResult {
  content: string
  source: 'vector' | 'web'
  metadata: {
    file_name?: string
    chunk_index?: number
    similarity?: number
    url?: string
    title?: string
    snippet?: string
  }
  timestamp: string
}

export interface SearchOptions {
  subjectId?: string
  includeWebSearch?: boolean
  vectorThreshold?: number
  maxVectorResults?: number
  maxWebResults?: number
}

// 웹 검색 캐시 조회
const getCachedWebSearch = async (query: string): Promise<any[] | null> => {
  try {
    // 24시간 이내의 캐시된 결과 조회
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('web_search_cache')
      .select('results')
      .eq('query', query)
      .gte('cached_at', twentyFourHoursAgo)
      .order('cached_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return data.results
  } catch (error) {
    console.error('웹 검색 캐시 조회 오류:', error)
    return null
  }
}

// 웹 검색 결과 캐싱
const cacheWebSearchResults = async (query: string, results: any[]) => {
  try {
    const { error } = await supabase
      .from('web_search_cache')
      .insert([{
        query,
        results,
        cached_at: new Date().toISOString()
      }])

    if (error) {
      console.error('웹 검색 결과 캐싱 오류:', error)
    }
  } catch (error) {
    console.error('웹 검색 캐싱 처리 오류:', error)
  }
}

// 웹 검색 수행 (Tavily API 사용)
const performWebSearch = async (query: string, maxResults: number = 5): Promise<any[]> => {
  try {
    // 먼저 캐시된 결과 확인
    const cachedResults = await getCachedWebSearch(query)
    if (cachedResults) {
      console.log('캐시된 웹 검색 결과 사용')
      return cachedResults.slice(0, maxResults)
    }

    // Tavily API 키가 없으면 웹 검색 스킵
    const tavilyApiKey = import.meta.env.VITE_TAVILY_API_KEY
    if (!tavilyApiKey) {
      console.warn('Tavily API 키가 설정되지 않아 웹 검색을 수행할 수 없습니다.')
      return []
    }

    // 정보처리기사 관련 검색어로 보강
    const enhancedQuery = `정보처리기사 ${query}`

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: enhancedQuery,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: maxResults,
        include_domains: [
          'www.kisa.or.kr',
          'www.tta.or.kr',
          'cafe.naver.com',
          'blog.naver.com',
          'tistory.com',
          'github.io'
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`웹 검색 API 오류: ${response.statusText}`)
    }

    const data = await response.json()
    const results = data.results || []

    // 결과 캐싱
    await cacheWebSearchResults(query, results)

    return results
  } catch (error) {
    console.error('웹 검색 오류:', error)
    return []
  }
}

// 하이브리드 검색 수행
export const performHybridSearch = async (
  query: string,
  options: SearchOptions = {}
): Promise<HybridSearchResult[]> => {
  const {
    subjectId,
    includeWebSearch = true,
    vectorThreshold = 0.7,
    maxVectorResults = 10,
    maxWebResults = 5
  } = options

  const results: HybridSearchResult[] = []

  try {
    // 1. 벡터 검색 수행
    console.log('벡터 검색 시작...')
    const vectorResults = await searchSimilarChunks(
      query,
      subjectId,
      maxVectorResults,
      vectorThreshold
    )

    // 벡터 검색 결과를 HybridSearchResult 형태로 변환
    const vectorSearchResults: HybridSearchResult[] = vectorResults.map(chunk => ({
      content: chunk.content,
      source: 'vector' as const,
      metadata: {
        file_name: chunk.file_name,
        chunk_index: chunk.chunk_index,
        similarity: chunk.similarity
      },
      timestamp: new Date().toISOString()
    }))

    results.push(...vectorSearchResults)

    // 2. 벡터 검색 결과 품질 확인
    const hasHighQualityVectorResults = vectorResults.some(result => result.similarity > 0.8)

    // 3. 웹 검색 수행 (벡터 검색 결과가 부족하거나 품질이 낮은 경우)
    if (includeWebSearch && (!hasHighQualityVectorResults || vectorResults.length < 3)) {
      console.log('웹 검색 시작...')
      try {
        const webResults = await performWebSearch(query, maxWebResults)

        const webSearchResults: HybridSearchResult[] = webResults.map(result => ({
          content: result.content || result.snippet || '',
          source: 'web' as const,
          metadata: {
            url: result.url,
            title: result.title,
            snippet: result.snippet
          },
          timestamp: new Date().toISOString()
        }))

        results.push(...webSearchResults)
      } catch (webSearchError) {
        console.error('웹 검색 실패:', webSearchError)
        // 웹 검색 실패해도 벡터 검색 결과는 반환
      }
    }

    // 4. 결과 순위 조정 (벡터 검색 우선, 높은 유사도 우선)
    results.sort((a, b) => {
      // 벡터 검색 결과 우선
      if (a.source === 'vector' && b.source === 'web') return -1
      if (a.source === 'web' && b.source === 'vector') return 1

      // 벡터 검색끼리는 유사도 높은 순
      if (a.source === 'vector' && b.source === 'vector') {
        return (b.metadata.similarity || 0) - (a.metadata.similarity || 0)
      }

      // 웹 검색끼리는 기본 순서 유지
      return 0
    })

    console.log(`하이브리드 검색 완료: 벡터 ${vectorResults.length}개, 웹 ${results.filter(r => r.source === 'web').length}개`)

    return results
  } catch (error) {
    console.error('하이브리드 검색 오류:', error)
    throw error
  }
}

// 검색 품질 평가
export const evaluateSearchQuality = (results: HybridSearchResult[]): {
  hasRelevantResults: boolean
  confidenceScore: number
  resultSummary: string
} => {
  const vectorResults = results.filter(r => r.source === 'vector')
  const webResults = results.filter(r => r.source === 'web')

  // 벡터 검색 품질 평가
  const highQualityVectorResults = vectorResults.filter(
    r => (r.metadata.similarity || 0) > 0.8
  )

  const hasRelevantResults = highQualityVectorResults.length > 0 || webResults.length > 0

  // 신뢰도 점수 계산 (0-1)
  let confidenceScore = 0

  if (highQualityVectorResults.length > 0) {
    // 고품질 벡터 결과가 있으면 높은 신뢰도
    confidenceScore = 0.8 + (highQualityVectorResults.length * 0.05)
  } else if (vectorResults.length > 0) {
    // 일반 벡터 결과만 있으면 중간 신뢰도
    const avgSimilarity = vectorResults.reduce((sum, r) => sum + (r.metadata.similarity || 0), 0) / vectorResults.length
    confidenceScore = 0.4 + (avgSimilarity * 0.4)
  } else if (webResults.length > 0) {
    // 웹 검색 결과만 있으면 낮은 신뢰도
    confidenceScore = 0.3
  }

  confidenceScore = Math.min(confidenceScore, 1)

  const resultSummary = `벡터 검색: ${vectorResults.length}개 (고품질: ${highQualityVectorResults.length}개), 웹 검색: ${webResults.length}개`

  return {
    hasRelevantResults,
    confidenceScore,
    resultSummary
  }
}

// 검색 결과를 AI 응답용으로 포맷팅
export const formatSearchResultsForAI = (results: HybridSearchResult[]): string => {
  if (results.length === 0) {
    return '관련 정보를 찾을 수 없습니다.'
  }

  const sections: string[] = []

  // 벡터 검색 결과
  const vectorResults = results.filter(r => r.source === 'vector')
  if (vectorResults.length > 0) {
    sections.push('**학습 자료에서:**')
    vectorResults.slice(0, 3).forEach((result, index) => {
      const similarity = result.metadata.similarity || 0
      const fileName = result.metadata.file_name || '파일명 없음'
      sections.push(`${index + 1}. [${fileName}] (유사도: ${(similarity * 100).toFixed(1)}%)`)
      sections.push(result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''))
      sections.push('')
    })
  }

  // 웹 검색 결과
  const webResults = results.filter(r => r.source === 'web')
  if (webResults.length > 0) {
    sections.push('**추가 참고자료:**')
    webResults.slice(0, 2).forEach((result, index) => {
      const title = result.metadata.title || '제목 없음'
      const url = result.metadata.url || ''
      sections.push(`${index + 1}. ${title}`)
      if (url) sections.push(`   출처: ${url}`)
      sections.push(result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''))
      sections.push('')
    })
  }

  return sections.join('\n')
}