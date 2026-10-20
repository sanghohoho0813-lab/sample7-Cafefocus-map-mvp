/**
 * 화면이 바뀔 때 아주 짧게 스며들듯 나타난다.
 * 위치 이동(transform) 없이 투명도만, 끝나면 흔적이 남지 않게(fill 없음) —
 * 화면 안의 고정 요소(하단 버튼·전체 화면 검색)와 쌓임 순서에 영향을 주지 않는다.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="h-full animate-page-in">{children}</div>;
}
