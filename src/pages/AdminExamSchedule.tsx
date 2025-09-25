import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Calendar from 'react-calendar'
import Button from '../components/ui/Button'
import {
  type ExamSchedule,
  type ExamScheduleInput,
  createExamSchedule,
  getExamSchedules,
  updateExamSchedule,
  deleteExamSchedule,
  getExamScheduleStats,
  formatExamDate,
  calculateDDay,
  getRegistrationStatus
} from '../lib/examScheduleManager'
import 'react-calendar/dist/Calendar.css'

type CalendarValue = Date | null
type CalendarValues = [Date, Date] | [Date | null, Date | null] | Date | null

const AdminExamSchedule: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [selectedDate, setSelectedDate] = useState<CalendarValue>(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSchedules: 0,
    upcomingSchedules: 0,
    thisYearSchedules: 0,
    registrationOpen: 0
  })

  const [formData, setFormData] = useState<ExamScheduleInput>({
    exam_date: '',
    exam_type: '기사',
    session: '1회',
    registration_start: '',
    registration_end: '',
    result_date: ''
  })

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [schedulesData, statsData] = await Promise.all([
        getExamSchedules(),
        getExamScheduleStats()
      ])
      setSchedules(schedulesData)
      setStats(statsData)
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const resetForm = () => {
    setFormData({
      exam_date: '',
      exam_type: '기사',
      session: '1회',
      registration_start: '',
      registration_end: '',
      result_date: ''
    })
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createExamSchedule(formData)
      await loadData()
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('일정 추가 오류:', error)
    }
  }

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSchedule) return

    try {
      await updateExamSchedule(editingSchedule.id, formData)
      await loadData()
      setEditingSchedule(null)
      resetForm()
    } catch (error) {
      console.error('일정 수정 오류:', error)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('이 시험 일정을 삭제하시겠습니까?')) return

    try {
      await deleteExamSchedule(id)
      await loadData()
    } catch (error) {
      console.error('일정 삭제 오류:', error)
    }
  }

  const startEdit = (schedule: ExamSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      exam_date: schedule.exam_date,
      exam_type: schedule.exam_type,
      session: schedule.session,
      registration_start: schedule.registration_start,
      registration_end: schedule.registration_end,
      result_date: schedule.result_date
    })
  }

  const cancelEdit = () => {
    setEditingSchedule(null)
    resetForm()
  }

  // 캘린더에서 시험 날짜를 표시하는 함수
  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0]
      const examOnDate = schedules.filter(schedule => schedule.exam_date === dateString)

      if (examOnDate.length > 0) {
        return (
          <div className="text-xs mt-1">
            {examOnDate.map((exam, index) => (
              <div key={index} className="bg-blue-500 text-white rounded px-1 py-0.5 mb-1">
                {exam.exam_type} {exam.session}
              </div>
            ))}
          </div>
        )
      }
    }
    return null
  }

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0]
      const hasExam = schedules.some(schedule => schedule.exam_date === dateString)
      if (hasExam) {
        return 'exam-date'
      }
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-shadow"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">시험 일정 관리</h1>
                <p className="text-sm text-gray-600">정보처리기사 시험 일정 관리</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                관리자: {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hover:bg-gray-100"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="space-y-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">전체 일정</h3>
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalSchedules}</div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">다가오는 시험</h3>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingSchedules}</div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">올해 시험</h3>
                <span className="text-2xl">🗓️</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.thisYearSchedules}</div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">접수 중</h3>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.registrationOpen}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 캘린더 */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">시험 일정 캘린더</h2>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="gradient-primary text-white"
                >
                  일정 추가
                </Button>
              </div>

              <div className="calendar-container">
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate as (value: CalendarValues, event: React.MouseEvent<HTMLButtonElement>) => void}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  locale="ko-KR"
                  className="w-full"
                />
              </div>
            </div>

            {/* 일정 목록 */}
            <div className="card-premium p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">시험 일정 목록</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {schedules.map((schedule) => {
                  const registrationStatus = getRegistrationStatus(
                    schedule.registration_start,
                    schedule.registration_end
                  )

                  return (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            정보처리{schedule.exam_type} {schedule.session}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatExamDate(schedule.exam_date)}
                          </p>
                          <p className="text-sm font-semibold text-blue-600">
                            {calculateDDay(schedule.exam_date)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(schedule)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">접수 기간</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${registrationStatus.color}`}>
                            {registrationStatus.text}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          {formatExamDate(schedule.registration_start)} ~ {formatExamDate(schedule.registration_end)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">결과 발표:</span> {formatExamDate(schedule.result_date)}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {schedules.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <span className="text-gray-400 text-lg">📅</span>
                    <p className="text-gray-500 mt-2">등록된 시험 일정이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 일정 추가/수정 모달 */}
      {(showAddModal || editingSchedule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingSchedule ? '시험 일정 수정' : '시험 일정 추가'}
            </h3>

            <form onSubmit={editingSchedule ? handleEditSchedule : handleAddSchedule}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시험 종류
                    </label>
                    <select
                      value={formData.exam_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, exam_type: e.target.value as '기사' | '산업기사' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="기사">기사</option>
                      <option value="산업기사">산업기사</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회차
                    </label>
                    <select
                      value={formData.session}
                      onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value as '1회' | '2회' | '3회' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="1회">1회</option>
                      <option value="2회">2회</option>
                      <option value="3회">3회</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시험 일자
                  </label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    접수 시작일
                  </label>
                  <input
                    type="date"
                    value={formData.registration_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    접수 마감일
                  </label>
                  <input
                    type="date"
                    value={formData.registration_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결과 발표일
                  </label>
                  <input
                    type="date"
                    value={formData.result_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, result_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (editingSchedule) {
                      cancelEdit()
                    } else {
                      setShowAddModal(false)
                      resetForm()
                    }
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white"
                >
                  {editingSchedule ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 캘린더 스타일 */}
      <style jsx>{`
        .calendar-container {
          --react-calendar-font-family: inherit;
        }
        .calendar-container .react-calendar {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
        }
        .calendar-container .react-calendar__tile {
          position: relative;
          height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 8px;
        }
        .calendar-container .react-calendar__tile.exam-date {
          background: #fef3c7 !important;
        }
        .calendar-container .react-calendar__tile--active,
        .calendar-container .react-calendar__tile:hover {
          background: #dbeafe !important;
        }
      `}</style>
    </div>
  )
}

export default AdminExamSchedule