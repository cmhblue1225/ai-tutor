import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

interface LoginFormProps {
  onSwitchToSignUp?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const navigate = useNavigate()
  const { signIn, loading, isAdmin } = useAuthStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const result = await signIn(formData)

    if (!result.success) {
      setErrors({ general: result.error || '로그인에 실패했습니다' })
    } else {
      // 로그인 성공 후 관리자면 /admin으로, 일반 사용자면 /dashboard로 리다이렉트
      if (isAdmin()) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto fade-in-up">
      <div className="text-center mb-l">
        <h2 className="text-headline text-text-primary mb-s">로그인</h2>
        <p className="text-body text-text-secondary">
          AI 튜터와 함께 학습을 시작하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-m">
        {errors.general && (
          <div className="p-m bg-red-50 border border-red-200 rounded-apple">
            <p className="text-body text-red-600">{errors.general}</p>
          </div>
        )}

        <Input
          label="이메일"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="example@email.com"
          autoComplete="email"
        />

        <Input
          label="비밀번호"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
        >
          로그인
        </Button>
      </form>

      <div className="mt-l text-center">
        <p className="text-body text-text-secondary">
          아직 계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors duration-fast"
          >
            회원가입
          </button>
        </p>
      </div>
    </Card>
  )
}

export default LoginForm