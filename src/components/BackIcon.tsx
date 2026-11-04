/** 뒤로 화살표. 끝이 둥글고 도톰한 선이라 말랑 니트 테마와 어울린다 (글자 ←는 가늘고 뾰족해서 쓰지 않는다) */
export function BackIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`size-6 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H6.5M11.5 6.5 6 12l5.5 5.5" />
    </svg>
  );
}
