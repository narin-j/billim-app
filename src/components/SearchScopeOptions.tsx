import { SEARCH_SCOPE_LABEL, SEARCH_SCOPES, type SearchScope } from "@/lib/searchScope";

/** S1, S2 검색 범위. 폼의 by 값으로 보내서 JS 없이도 동작한다 */
export function SearchScopeOptions({ value }: { value: SearchScope }) {
  return (
    <fieldset className="flex gap-2">
      <legend className="sr-only">검색 범위</legend>
      {SEARCH_SCOPES.map((scope) => (
        <label
          key={scope}
          className="rounded-full border px-3 py-1 text-sm has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:outline-2"
        >
          <input type="radio" name="by" value={scope} defaultChecked={scope === value} className="sr-only" />
          {SEARCH_SCOPE_LABEL[scope]}
        </label>
      ))}
    </fieldset>
  );
}
