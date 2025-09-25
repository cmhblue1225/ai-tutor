import OpenAI from 'openai'
import {
  performHybridSearch,
  formatSearchResultsForAI,
  evaluateSearchQuality,
  type HybridSearchResult
} from '../hybridSearchEngine'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export interface HybridRagResponse {
  answer: string
  searchResults: HybridSearchResult[]
  confidenceScore: number
  sources: Array<{
    type: 'vector' | 'web'
    title: string
    url?: string
    similarity?: number
  }>
  metadata: {
    searchResultsCount: number
    hasWebResults: boolean
    responseTime: number
  }
}

// 정보처리기사 특화 시스템 프롬프트
const ITPE_SYSTEM_PROMPT = `당신은 정보처리기사 시험 준비를 돕는 전문 AI 튜터입니다.

## 역할과 목표
- 정보처리기사 5개 과목(소프트웨어 설계, 소프트웨어 개발, 데이터베이스 구축, 프로그래밍 언어 활용, 정보시스템 구축관리)에 대한 전문적인 학습 지도
- 기출문제 해설 및 개념 설명
- 실무 중심의 이해하기 쉬운 설명 제공

## 응답 스타일
1. **정확성**: 제공된 학습자료와 검색 결과를 기반으로 정확한 정보 제공
2. **체계성**: 개념 → 예시 → 실무 적용 순으로 단계적 설명
3. **실용성**: 시험 출제 경향과 실무 활용 방안 함께 제시
4. **명확성**: 전문 용어 사용 시 반드시 쉬운 설명 병행

## 정보 출처 활용 원칙
- **학습자료(벡터 검색)**: 신뢰도 높음, 우선 참조
- **웹 검색 결과**: 보조 참조, 최신 정보 보완용
- 출처가 불분명한 정보는 "추정" 또는 "일반적으로"라고 명시

## 답변 구조
1. 핵심 답변 (2-3줄 요약)
2. 상세 설명 (개념, 원리)
3. 실제 예시 또는 기출문제 패턴
4. 학습 팁 또는 주의사항
5. 출처 표기 (제공된 경우)

질문에 대해 위 원칙에 따라 도움이 되는 답변을 제공하세요.`

// 하이브리드 RAG 기반 AI 응답 생성
export const generateHybridRagResponse = async (
  question: string,
  subjectId?: string,
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
): Promise<HybridRagResponse> => {
  const startTime = Date.now()

  try {
    // 1. 하이브리드 검색 수행
    console.log('하이브리드 검색 시작:', question)
    const searchResults = await performHybridSearch(question, {
      subjectId,
      includeWebSearch: true,
      vectorThreshold: 0.7,
      maxVectorResults: 8,
      maxWebResults: 3
    })

    // 2. 검색 품질 평가
    const qualityEvaluation = evaluateSearchQuality(searchResults)
    console.log('검색 품질 평가:', qualityEvaluation)

    // 3. 검색 결과를 AI용으로 포맷팅
    const formattedSearchResults = formatSearchResultsForAI(searchResults)

    // 4. 대화 컨텍스트 구성
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: ITPE_SYSTEM_PROMPT }
    ]

    // 최근 대화 기록 추가 (최대 6개)
    const recentHistory = conversationHistory.slice(-6)
    messages.push(...recentHistory)

    // 5. 검색 결과와 함께 질문 추가
    const contextualQuestion = `
사용자 질문: ${question}

관련 정보:
${formattedSearchResults}

위 정보를 바탕으로 사용자의 질문에 대해 정확하고 도움이 되는 답변을 제공해주세요.
검색된 정보가 충분하지 않다면 일반적인 지식을 활용하되, 이를 명확히 구분해서 설명해주세요.`

    messages.push({ role: 'user', content: contextualQuestion })

    // 6. OpenAI API 호출
    console.log('OpenAI API 호출 시작')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const answer = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.'

    // 7. 출처 정보 정리
    const sources = searchResults.map(result => ({
      type: result.source,
      title: result.metadata.file_name || result.metadata.title || '제목 없음',
      url: result.metadata.url,
      similarity: result.metadata.similarity
    }))

    const responseTime = Date.now() - startTime

    // 8. 응답 구성
    const response: HybridRagResponse = {
      answer,
      searchResults,
      confidenceScore: qualityEvaluation.confidenceScore,
      sources,
      metadata: {
        searchResultsCount: searchResults.length,
        hasWebResults: searchResults.some(r => r.source === 'web'),
        responseTime
      }
    }

    console.log(`하이브리드 RAG 응답 완료 (${responseTime}ms):`, {
      searchResults: searchResults.length,
      confidence: qualityEvaluation.confidenceScore,
      hasWeb: response.metadata.hasWebResults
    })

    return response
  } catch (error) {
    console.error('하이브리드 RAG 응답 생성 오류:', error)

    // 오류 발생 시 기본 응답
    return {
      answer: '죄송합니다. 현재 시스템에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      searchResults: [],
      confidenceScore: 0,
      sources: [],
      metadata: {
        searchResultsCount: 0,
        hasWebResults: false,
        responseTime: Date.now() - startTime
      }
    }
  }
}

// 정보처리기사 과목 및 카테고리 매핑
export const ITPE_SUBJECTS = {
  // 정보처리기사 5과목
  software_design: '소프트웨어 설계',
  software_development: '소프트웨어 개발',
  database_construction: '데이터베이스 구축',
  programming_language: '프로그래밍 언어 활용',
  information_system: '정보시스템 구축관리',
  // 기타 학습 자료 카테고리
  exam_questions: '기출문제',
  exam_trends: '출제동향',
  exam_info: '시험정보',
  study_tips: '학습꿀팁',
  mock_tests: '모의고사',
  summary_notes: '요약정리'
}

// 질문 카테고리 분석
export const analyzeQuestionCategory = (question: string): {
  category: string
  subjectId?: string
  keywords: string[]
} => {
  const questionLower = question.toLowerCase()

  // 과목별 키워드 매핑
  const subjectKeywords = {
    // 정보처리기사 5과목
    software_design: ['요구사항', 'uml', '설계', '모델링', '아키텍처', '디자인패턴', '분석'],
    software_development: ['개발', '프로그래밍', 'java', 'python', 'c언어', '알고리즘', '자료구조'],
    database_construction: ['데이터베이스', 'db', 'sql', '정규화', '트랜잭션', 'er다이어그램', '관계형'],
    programming_language: ['언어', 'java', 'c', 'python', 'javascript', '문법', '라이브러리'],
    information_system: ['정보시스템', '네트워크', '보안', '프로젝트관리', '시스템구축', 'it관리'],
    // 기타 카테고리
    exam_questions: ['기출문제', '기출', '문제', '회차', '년도', '시험문제'],
    exam_trends: ['출제동향', '동향', '경향', '트렌드', '출제', '변화'],
    exam_info: ['시험정보', '접수', '일정', '시험제도', '응시자격', '합격기준'],
    study_tips: ['꿀팁', '학습법', '공부법', '암기', '노하우', '효율'],
    mock_tests: ['모의고사', '모의시험', '실전', '연습', '테스트'],
    summary_notes: ['요약', '정리', '핵심', '요점', '총정리', '마무리']
  }

  // 가장 일치하는 과목 찾기
  let bestMatch = { subjectId: '', count: 0 }

  for (const [subjectId, keywords] of Object.entries(subjectKeywords)) {
    const matchCount = keywords.filter(keyword => questionLower.includes(keyword)).length
    if (matchCount > bestMatch.count) {
      bestMatch = { subjectId, count: matchCount }
    }
  }

  // 기출문제 관련 키워드
  const examKeywords = ['기출', '문제', '시험', '회차', '년도']
  const isExamQuestion = examKeywords.some(keyword => questionLower.includes(keyword))

  return {
    category: isExamQuestion ? 'exam' : 'concept',
    subjectId: bestMatch.count > 0 ? bestMatch.subjectId : undefined,
    keywords: questionLower.split(' ').filter(word => word.length > 1)
  }
}

// 하이브리드 RAG 클라이언트 객체
export const hybridRagClient = {
  generateResponse: async (
    question: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
    subjectId?: string
  ) => {
    const ragResponse = await generateHybridRagResponse(question, subjectId, conversationHistory)

    return {
      response: ragResponse.answer,
      sources: ragResponse.sources.map(source => ({
        type: source.type,
        title: source.title,
        file_name: source.title,
        url: source.url,
        content: '', // 실제 콘텐츠는 여기서 제공하지 않음
        snippet: '', // snippet도 별도로 제공하지 않음
        similarity: source.similarity
      })),
      confidence: ragResponse.confidenceScore,
      metadata: ragResponse.metadata
    }
  }
}