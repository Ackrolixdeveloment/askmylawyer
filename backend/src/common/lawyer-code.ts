/**
 * The reference a lawyer and the admin team both quote: "LAW0001", counting
 * up from the first lawyer to register. Past 9999 it simply grows a digit
 * ("LAW10000"). The number itself comes from `lawyer_number_seq`.
 */
export function lawyerCode(lawyerNumber: number | null | undefined) {
  if (lawyerNumber == null) return '';
  return `LAW${String(lawyerNumber).padStart(4, '0')}`;
}
