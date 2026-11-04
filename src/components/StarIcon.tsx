/**
 * 즐겨찾기 별. 끝이 둥글고 통통한 별이라 말랑 니트 테마와 어울린다.
 * 켜지면 꿀색으로 채우고, 꺼지면 테두리만 그린다 (색: globals.css star-icon).
 * 글자 ★☆는 끝이 뾰족해서 쓰지 않는다.
 */
export function StarIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`star-icon ${filled ? "filled" : ""} ${className}`}
      strokeWidth={2.4}
      strokeLinejoin="round"
    >
      <path d="M12 2.8 15 8.4 21.2 9.5 16.8 14 17.7 20.3 12 17.5 6.3 20.3 7.2 14 2.8 9.5 9 8.4Z" />
    </svg>
  );
}
