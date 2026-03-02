import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateTearSheet(
  elementId: string,
  locationName: string,
  moduleName: string
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`[PDF Export] Element #${elementId} not found`);
    return;
  }

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#1a1a1a',
    onclone: (_doc: Document, clonedEl: HTMLElement) => {
      const allEls = clonedEl.querySelectorAll('*') as NodeListOf<HTMLElement>;
      allEls.forEach((node) => {
        const cs = getComputedStyle(node);
        const needsFix = (v: string) => v.includes('oklch') || v.includes('color(');
        if (needsFix(cs.color)) node.style.color = 'rgb(255, 255, 255)';
        if (needsFix(cs.backgroundColor)) node.style.backgroundColor = 'rgb(26, 26, 26)';
        if (needsFix(cs.borderColor)) node.style.borderColor = 'rgb(51, 51, 51)';
      });
    },
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerY = 14;

  // Header
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageW, pageH, 'F');

  pdf.setTextColor(245, 158, 11); // amber accent
  pdf.text('Resilient — Climate Risk Tear-Sheet', margin, headerY);

  pdf.setFontSize(9);
  pdf.setTextColor(180, 180, 180);
  pdf.text(`Location: ${locationName}`, margin, headerY + 7);
  pdf.text(`Module: ${moduleName}`, margin, headerY + 12);
  pdf.text(`Date: ${new Date().toISOString().split('T')[0]}`, margin, headerY + 17);

  // Image
  const imgData = canvas.toDataURL('image/png');
  const contentTop = headerY + 24;
  const availW = pageW - margin * 2;
  const availH = pageH - contentTop - margin;
  const pxToMm = 25.4 / 96;
  let imgW = canvas.width * pxToMm;
  let imgH = canvas.height * pxToMm;
  const scale = Math.min(availW / imgW, availH / imgH, 1);
  imgW *= scale;
  imgH *= scale;

  pdf.addImage(imgData, 'PNG', margin, contentTop, imgW, imgH);

  const safeName = locationName.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`Resilient_Report_${moduleName}_${safeName}.pdf`);
}
