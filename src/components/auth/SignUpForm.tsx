import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

interface SignUpFormProps {
  onSwitchToLogin?: () => void
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const { signUp, loading } = useAuthStore()

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

    if (!formData.full_name) {
      newErrors.full_name = '이름을 입력해주세요'
    }

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
    })

    if (result.success) {
      setSuccess(true)
    } else {
      setErrors({ general: result.error || '회원가입에 실패했습니다' })
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto fade-in-up">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-l">
            <div className="w-6 h-6 text-green-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-headline text-text-primary mb-s">회원가입 완료!</h2>
          <p className="text-body text-text-secondary mb-l">
            이메일을 확인하여 계정을 활성화해 주세요.<br />
            메일이 오지 않았다면 스팸함도 확인해보세요.
          </p>

          <Button
            variant="secondary"
            onClick={onSwitchToLogin}
            className="w-full"
          >
            로그인 페이지로
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto fade-in-up">
      <div className="text-center mb-l">
        <h2 className="text-headline text-text-primary mb-s">회원가입</h2>
        <p className="text-body text-text-secondary">
          AI 튜터와 함께 새로운 학습 여정을 시작하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-m">
        {errors.general && (
          <div className="p-m bg-red-50 border border-red-200 rounded-apple">
            <p className="text-body text-red-600">{errors.general}</p>
          </div>
        )}

        <Input
          label="이름"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          error={errors.full_name}
          placeholder="홍길동"
          autoComplete="name"
        />

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
          placeholder="최소 6자 이상"
          autoComplete="new-password"
          helperText="안전한 비밀번호를 사용하세요"
        />

        <Input
          label="비밀번호 확인"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
        >
          회원가입
        </Button>
      </form>

      <div className="mt-l text-center">
        <p className="text-body text-text-secondary">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors duration-fast"
          >
            로그인
          </button>
        </p>
      </div>
    </Card>
  )
}

export default SignUpForm