import { AVAILABILITY_LABEL } from "@/lib/messages";
import type { Availability } from "@/lib/types";

/** S4, S4-1 대출 여부 배지. 색만으로 구분하지 않고 글자도 함께 쓴다 (색: globals.css badge-*) */
export function AvailabilityStatus({ availability }: { availability: Availability }) {
  return <span className={`badge badge-${availability}`}>{AVAILABILITY_LABEL[availability]}</span>;
}
