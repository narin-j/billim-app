import type { ReactNode } from "react";

/** 불러오는 중 회색 틀. 틀은 화면 읽기 프로그램에 숨기고 label만 읽어 준다 */
function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

const ROWS = [0, 1, 2, 3];

/** S2 검색 결과 모양 */
export function BookListSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <div className="mx-4 mt-4 h-3.5 w-36 skeleton" />
      <ul className="grid gap-3 px-4 py-3">
        {ROWS.map((i) => (
          <li key={i} className="card flex items-start gap-3 p-3">
            <span className="h-[70px] w-[52px] shrink-0 skeleton rounded-lg" />
            <span className="grid flex-1 gap-2.5 pt-1">
              <span className="h-4 w-3/4 skeleton" />
              <span className="h-3 w-1/2 skeleton" />
            </span>
          </li>
        ))}
      </ul>
    </Loading>
  );
}

/** S4 소장 도서관 판 모양 */
export function LibraryListSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <div className="card mx-4 my-3 p-2.5">
        <div className="grid gap-2 px-3 pt-2 pb-3">
          <span className="h-4 w-4/5 skeleton" />
          <span className="h-3 w-24 skeleton" />
        </div>
        <ol className="border-t-2 border-dashed border-line">
          {ROWS.map((i) => (
            <li key={i} className="flex items-center gap-3 border-b border-line/60 px-3 py-3.5 last:border-b-0">
              <span className="grid flex-1 gap-2">
                <span className="h-4 w-2/3 skeleton" />
                <span className="h-5 w-16 skeleton" />
              </span>
              <span className="h-4 w-12 skeleton" />
            </li>
          ))}
        </ol>
      </div>
    </Loading>
  );
}

/** S4 머리 제목 자리 */
export function TitleSkeleton() {
  return (
    <span role="status" className="block">
      <span className="sr-only">책 정보를 불러오고 있어요</span>
      <span aria-hidden className="block h-5 w-44 skeleton" />
    </span>
  );
}
