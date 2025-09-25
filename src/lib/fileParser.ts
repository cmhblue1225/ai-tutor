import * as pdfjs from 'pdfjs-dist/build/pdf'

// PDF.js 설정 - CDN에서 Worker 로드
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export interface ParsedFileData {
  title: string
  content: string
  metadata: {
    pages?: number
    size: number
    type: string
    uploadedAt: string
  }
}

export interface FileParsingResult {
  success: boolean
  data?: ParsedFileData
  error?: string
}

export const parseFile = async (file: File): Promise<FileParsingResult> => {
  try {
    const baseMetadata = {
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }

    switch (file.type) {
      case 'application/pdf':
        return await parsePDF(file, baseMetadata)

      case 'text/plain':
        return await parseTextFile(file, baseMetadata)

      case 'text/markdown':
        return await parseMarkdownFile(file, baseMetadata)

      default:
        return {
          success: false,
          error: '지원하지 않는 파일 형식입니다.'
        }
    }
  } catch (error) {
    console.error('File parsing error:', error)
    return {
      success: false,
      error: '파일 파싱 중 오류가 발생했습니다.'
    }
  }
}

const parsePDF = async (file: File, baseMetadata: any): Promise<FileParsingResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise

    let fullText = ''

    // 모든 페이지의 텍스트 추출
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }

    return {
      success: true,
      data: {
        title: file.name.replace('.pdf', ''),
        content: fullText.trim(),
        metadata: {
          ...baseMetadata,
          pages: pdf.numPages
        }
      }
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    return {
      success: false,
      error: 'PDF 파일을 파싱할 수 없습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.'
    }
  }
}

const parseTextFile = async (file: File, baseMetadata: any): Promise<FileParsingResult> => {
  try {
    const text = await file.text()

    return {
      success: true,
      data: {
        title: file.name.replace('.txt', ''),
        content: text,
        metadata: baseMetadata
      }
    }
  } catch (error) {
    console.error('Text file parsing error:', error)
    return {
      success: false,
      error: 'TXT 파일을 읽을 수 없습니다.'
    }
  }
}

const parseMarkdownFile = async (file: File, baseMetadata: any): Promise<FileParsingResult> => {
  try {
    const text = await file.text()

    return {
      success: true,
      data: {
        title: file.name.replace('.md', ''),
        content: text,
        metadata: baseMetadata
      }
    }
  } catch (error) {
    console.error('Markdown file parsing error:', error)
    return {
      success: false,
      error: 'MD 파일을 읽을 수 없습니다.'
    }
  }
}

// 파일 메타데이터 추출 함수
export const extractFileMetadata = (fileName: string, content: string) => {
  // 정보처리기사 기출문제 연도/회차 패턴 인식
  const examPattern = /(\d{4})년.*?(\d+)회/
  const examMatch = content.match(examPattern) || fileName.match(examPattern)

  let examInfo = null
  if (examMatch) {
    examInfo = {
      year: parseInt(examMatch[1]),
      round: parseInt(examMatch[2])
    }
  }

  // 과목 정보 추출
  const subjects = [
    '소프트웨어 설계',
    '소프트웨어 개발',
    '데이터베이스 구축',
    '프로그래밍 언어 활용',
    '정보시스템 구축관리'
  ]

  const detectedSubject = subjects.find(subject =>
    content.includes(subject) || fileName.includes(subject)
  )

  return {
    examInfo,
    subject: detectedSubject,
    wordCount: content.length,
    hasQuestions: content.includes('문제') && content.includes('번'),
    isTextbook: !content.includes('문제') || content.includes('장') || content.includes('절')
  }
}