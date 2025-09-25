import React from 'react'

interface PremiumStatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  gradient: 'primary' | 'secondary' | 'success' | 'danger'
  trend?: {
    value: number
    isPositive: boolean
  }
  delay?: number
}

const PremiumStatsCard: React.FC<PremiumStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
  delay = 0
}) => {
  const gradientClasses = {
    primary: 'gradient-primary shadow-colored',
    secondary: 'gradient-secondary shadow-orange',
    success: 'gradient-success',
    danger: 'gradient-danger'
  }

  return (
    <div
      className="card-premium group cursor-pointer overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-24 h-24 rotate-12 group-hover:rotate-45 transition-transform duration-500">
          {icon}
        </div>
      </div>

      {/* 상단 그라데이션 라인 */}
      <div className={`h-1 ${gradientClasses[gradient]} rounded-t-3xl`} />

      <div className="p-6">
        {/* 아이콘과 제목 */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl ${gradientClasses[gradient]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <div className="w-6 h-6">
              {icon}
            </div>
          </div>

          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
              trend.isPositive
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            }`}>
              <svg
                className={`w-4 h-4 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        {/* 통계 값 */}
        <div className="mb-3">
          <div className="text-3xl font-bold text-text-primary mb-1 group-hover:scale-105 transition-transform duration-300 origin-left">
            {value}
          </div>
          <div className="text-sm font-medium text-text-secondary">
            {title}
          </div>
        </div>

        {/* 부제목 */}
        <div className="text-sm text-text-tertiary">
          {subtitle}
        </div>

        {/* 프로그레스 바 (옵션) */}
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${gradientClasses[gradient]} rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out`}
            style={{ width: '70%' }}
          />
        </div>
      </div>

      {/* 호버 효과용 글로우 */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className={`absolute inset-0 rounded-3xl ${gradientClasses[gradient]} opacity-5 blur-xl`} />
      </div>
    </div>
  )
}

export default PremiumStatsCard