/**
 * The reference a client, a lawyer and the support desk all quote:
 * "AML-000123", counting up from the first consultation ever booked. Past
 * six digits it simply grows one. The number comes from
 * `consultation_number_seq`.
 */
export function consultationCode(number: number | null | undefined) {
  if (number == null) return '';
  return `AML-${String(number).padStart(6, '0')}`;
}
