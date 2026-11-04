import { AVAILABILITY_LABEL } from "@/lib/messages";
import type { Availability } from "@/lib/types";

const DOT: Record<Availability, string> = {
  available: "bg-green-600",
  onLoan: "bg-gray-400",
  unknown: "bg-yellow-400",
};

/** S4, S4-1 대출 여부. 색만으로 구분하지 않고 글자도 함께 쓴다 */
export function AvailabilityStatus({ availability }: { availability: Availability }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[availability]}`} />
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}
