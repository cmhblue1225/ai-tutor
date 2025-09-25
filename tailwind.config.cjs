/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Apple 스타일 컬러 팔레트
      colors: {
        // 기본 색상
        white: '#FFFFFF',
        snow: '#FBFBFD',
        'light-gray': '#F5F5F7',

        // 텍스트 색상
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
        'text-tertiary': '#6E6E73',

        // 포인트 색상 - iOS Blue
        blue: {
          50: '#E6F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B7FF',
          400: '#339FFF',
          500: '#007AFF', // Primary iOS Blue
          600: '#0056CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },

        // 포인트 색상 - iOS Orange
        orange: {
          50: '#FFF4E6',
          100: '#FFE9CC',
          200: '#FFD399',
          300: '#FFBD66',
          400: '#FFA733',
          500: '#FF9500', // Primary iOS Orange
          600: '#E6860E',
          700: '#B3660B',
          800: '#804708',
          900: '#4D2804',
        },

        // 상태 색상
        green: {
          500: '#34C759', // iOS Green
        },
        red: {
          500: '#FF3B30', // iOS Red
        },
      },

      // Apple 스타일 폰트 설정
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },

      // 타이포그래피
      fontSize: {
        'display': ['42px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline': ['28px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'title': ['22px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'body': ['17px', { lineHeight: '1.4' }],
        'caption': ['13px', { lineHeight: '1.4' }],
      },

      // Apple 스타일 그림자
      boxShadow: {
        'apple': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'apple-lg': '0 12px 24px -4px rgb(0 0 0 / 0.15)',
        'apple-hover': '0 8px 16px -4px rgb(0 0 0 / 0.12)',
      },

      // 애니메이션 타이밍
      transitionDuration: {
        'fast': '200ms',
        'standard': '300ms',
        'slow': '500ms',
      },

      // Easing functions
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'apple-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      // 간격 시스템
      spacing: {
        'xs': '4px',
        's': '8px',
        'm': '16px',
        'l': '24px',
        'xl': '32px',
        'xxl': '48px',
        'xxxl': '64px',
      },

      // 둥근 모서리
      borderRadius: {
        'apple': '8px',
        'apple-lg': '12px',
        'apple-xl': '16px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}