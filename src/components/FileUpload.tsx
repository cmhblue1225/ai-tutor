import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { validateFile, getFileIcon, formatFileSize } from '../lib/fileUtils'
import { parseFile } from '../lib/fileParser'
import { chunkContent, validateChunkQuality } from '../lib/chunkingSystem'
import {
  uploadFileToDatabase,
  saveChunksWithEmbeddings,
  updateFileStatus
} from '../lib/supabaseAdmin'
import Button from './ui/Button'

interface FileUploadProps {
  subjectId: string
  onUploadComplete?: (result: UploadResult) => void
  onUploadProgress?: (progress: number) => void
  className?: string
}

export interface UploadResult {
  success: boolean
  fileId?: string
  fileName?: string
  chunksCount?: number
  error?: string
}

interface UploadingFile {
  file: File
  id: string
  progress: number
  status: 'parsing' | 'chunking' | 'uploading' | 'completed' | 'error'
  error?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  subjectId,
  onUploadComplete,
  onUploadProgress,
  className = ''
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await processFile(file)
    }
  }, [subjectId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true
  })

  const processFile = async (file: File) => {
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 파일 검증
    const validation = validateFile(file)
    if (!validation.isValid) {
      const errorResult: UploadResult = {
        success: false,
        error: validation.error
      }
      onUploadComplete?.(errorResult)
      return
    }

    // 업로드 상태 초기화
    const uploadingFile: UploadingFile = {
      file,
      id: fileId,
      progress: 0,
      status: 'parsing'
    }

    setUploadingFiles(prev => [...prev, uploadingFile])

    try {
      // 1. 파일 파싱
      updateFileStatus(fileId, { status: 'parsing', progress: 10 })
      const parseResult = await parseFile(file)

      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || '파일 파싱에 실패했습니다.')
      }

      // 2. 청킹 처리
      updateFileStatus(fileId, { status: 'chunking', progress: 30 })
      const chunks = chunkContent(parseResult.data.content, file.name)

      const chunkValidation = validateChunkQuality(chunks)
      if (!chunkValidation.isValid) {
        console.warn('Chunk quality issues:', chunkValidation.issues)
      }

      // 3. 데이터베이스 저장
      await uploadToDatabase(fileId, parseResult.data, chunks, file)

      // 4. 완료
      updateFileStatus(fileId, { status: 'completed', progress: 100 })

      const successResult: UploadResult = {
        success: true,
        fileId,
        fileName: file.name,
        chunksCount: chunks.length
      }

      onUploadComplete?.(successResult)

    } catch (error) {
      console.error('File processing error:', error)

      const errorMessage = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.'

      updateFileStatus(fileId, {
        status: 'error',
        progress: 0,
        error: errorMessage
      })

      const errorResult: UploadResult = {
        success: false,
        error: errorMessage
      }

      onUploadComplete?.(errorResult)
    }
  }

  const updateFileStatus = (fileId: string, updates: Partial<UploadingFile>) => {
    setUploadingFiles(prev =>
      prev.map(file =>
        file.id === fileId ? { ...file, ...updates } : file
      )
    )

    if (updates.progress !== undefined) {
      onUploadProgress?.(updates.progress)
    }
  }

  const uploadToDatabase = async (fileId: string, parsedData: any, chunks: any[], file: File) => {
    try {
      // 1. 파일 메타데이터를 데이터베이스에 저장
      updateFileStatus(fileId, { status: 'uploading', progress: 60 })

      const uploadedFile = await uploadFileToDatabase(
        parsedData,
        file.name,
        file.type,
        file.size,
        subjectId
      )

      // 2. 청크들을 임베딩과 함께 저장
      updateFileStatus(fileId, { status: 'uploading', progress: 70 })

      await saveChunksWithEmbeddings(
        uploadedFile.id,
        chunks,
        (embeddingProgress) => {
          // 70%에서 95%까지 임베딩 진행률
          const totalProgress = 70 + (embeddingProgress / 100) * 25
          updateFileStatus(fileId, { progress: totalProgress })
        }
      )

      // 3. 파일 상태를 완료로 업데이트
      await updateFileStatus(uploadedFile.id, 'completed')
      updateFileStatus(fileId, { status: 'completed', progress: 100 })

      return uploadedFile.id
    } catch (error) {
      console.error('데이터베이스 업로드 오류:', error)
      // 에러 상태로 파일 업데이트
      try {
        await updateFileStatus(fileId, 'error', error instanceof Error ? error.message : '알 수 없는 오류')
      } catch (updateError) {
        console.error('파일 상태 업데이트 실패:', updateError)
      }
      throw error
    }
  }

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const getStatusText = (status: UploadingFile['status']): string => {
    switch (status) {
      case 'parsing':
        return '파일 분석 중...'
      case 'chunking':
        return '텍스트 처리 중...'
      case 'uploading':
        return '업로드 중...'
      case 'completed':
        return '완료'
      case 'error':
        return '오류'
      default:
        return '처리 중...'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 드롭존 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive || dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              파일을 드래그하여 업로드하거나 클릭하세요
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              PDF, TXT, MD 파일을 지원합니다 (최대 20MB)
            </p>
            <p className="text-xs text-gray-500">
              정보처리기사 교재, 기출문제, 학습자료를 업로드하세요
            </p>
          </div>

          <Button variant="secondary" size="sm" className="mx-auto">
            파일 선택
          </Button>
        </div>
      </div>

      {/* 업로드 진행 상황 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">업로드 진행 상황</h4>

          {uploadingFiles.map(uploadingFile => (
            <div key={uploadingFile.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {getFileIcon(uploadingFile.file.type)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    uploadingFile.status === 'completed' ? 'text-green-600' :
                    uploadingFile.status === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {getStatusText(uploadingFile.status)}
                  </span>

                  {uploadingFile.status !== 'completed' && uploadingFile.status !== 'error' && (
                    <button
                      onClick={() => removeFile(uploadingFile.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    uploadingFile.status === 'completed' ? 'bg-green-500' :
                    uploadingFile.status === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${uploadingFile.progress}%` }}
                />
              </div>

              {/* 에러 메시지 */}
              {uploadingFile.error && (
                <p className="text-sm text-red-600 mt-2">
                  {uploadingFile.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload