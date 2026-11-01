import PDFDocument from 'pdfkit';
import { join } from 'node:path';

export function renderReportPdf(input: { reference: string; customer: string; lawyer: string; submittedAt: Date | null; caseSummary: string; legalGuidance: string; nextSteps: string }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: `Consultation report ${input.reference}`, Author: 'Ask My Lawyer' } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.registerFont('Report', join(process.cwd(), 'assets/fonts/NotoSansDevanagari.ttf'));
    doc.font('Report').fillColor('#15304b').fontSize(22).text('ASK MY LAWYER');
    doc.fontSize(15).text('Consultation Report');
    doc.moveDown(0.5).fontSize(10).fillColor('#53657b').text(input.reference);
    doc.moveDown().strokeColor('#dce4ed').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
    doc.moveDown().fillColor('#182b42').fontSize(11);
    doc.text(`Customer: ${input.customer}`);
    doc.text(`Reviewed and submitted by: ${input.lawyer}`);
    doc.text(`Submitted (IST): ${input.submittedAt ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(input.submittedAt) : 'Not recorded'}`);
    for (const [title, text] of [['Case Summary', input.caseSummary], ['Legal Guidance Provided', input.legalGuidance], ['Recommended Next Steps', input.nextSteps]]) {
      doc.moveDown(1.2).fillColor('#15304b').fontSize(14).text(title);
      doc.moveDown(0.4).fillColor('#26374b').fontSize(11).text(text, { lineGap: 4, paragraphGap: 6 });
    }
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page++) {
      doc.switchToPage(page);
      doc.fontSize(8).fillColor('#708096').text(`Ask My Lawyer | ${input.reference} | ${page + 1} / ${range.count}`, 48, doc.page.height - 33, { lineBreak: false });
    }
    doc.end();
  });
}
