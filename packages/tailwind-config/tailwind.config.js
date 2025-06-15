/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // apps 폴더 안의 모든 프로젝트에 있는 파일들
    "../../apps/**/*.{js,ts,jsx,tsx}",
    // packages 폴더 안의 모든 프로젝트(특히 ui)에 있는 파일들
    "../../packages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // HeroUI 가이드에 따라 필요한 플러그인이 있다면 여기에 추가합니다.
  // 예: require('@tailwindcss/forms')
  plugins: [],
};