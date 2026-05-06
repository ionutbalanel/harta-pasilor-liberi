import jsPDF from 'jspdf';
import { BuildingReport, BUILDING_TYPES } from '@/types/building';

const CRITERIA_LABELS: Record<string, string> = {
  hasRamp: 'Rampa de acces',
  hasElevator: 'Lift functional',
  hasWideDoors: 'Usi suficient de largi',
  hasAdaptedBathroom: 'Grup sanitar adaptat',
  hasObstacleFreeAccess: 'Acces fara obstacole',
};

export async function generateReportPDF(b: {
  name: string;
  address: string;
  type: BuildingReport['type'];
  lat: number;
  lng: number;
  hasRamp: BuildingReport['hasRamp'];
  hasElevator: BuildingReport['hasElevator'];
  hasWideDoors: BuildingReport['hasWideDoors'];
  hasAdaptedBathroom: BuildingReport['hasAdaptedBathroom'];
  hasObstacleFreeAccess: BuildingReport['hasObstacleFreeAccess'];
  comments?: string;
  images: string[];
  verdict: BuildingReport['verdict'];
}) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Harta Accesibilitatii - Raport Accesibilitate', margin, y);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`, margin, y);
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(b.name || 'Fara nume', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Adresa: ${b.address}`, margin, y); y += 6;
  doc.text(`Tip: ${BUILDING_TYPES[b.type]}`, margin, y); y += 6;
  doc.text(`Coordonate: ${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}`, margin, y); y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const verdictText = b.verdict === 'accessible' ? 'ACCESIBILA' : 'INACCESIBILA';
  doc.setTextColor(
    b.verdict === 'accessible' ? 22 : 239,
    b.verdict === 'accessible' ? 163 : 68,
    b.verdict === 'accessible' ? 74 : 68,
  );
  doc.text(`Verdict: ${verdictText}`, margin, y);
  doc.setTextColor(0);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Criterii de accesibilitate:', margin, y); y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const keys = ['hasRamp', 'hasElevator', 'hasWideDoors', 'hasAdaptedBathroom', 'hasObstacleFreeAccess'] as const;
  keys.forEach((key) => {
    const v = b[key];
    const mark = v === 'yes' ? '[DA]' : v === 'no' ? '[NU]' : v === 'na' ? '[N/A]' : '[ - ]';
    doc.text(`${mark} ${CRITERIA_LABELS[key]}`, margin + 4, y);
    y += 6;
  });

  if (b.comments) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Comentarii:', margin, y); y += 6;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(b.comments, 170);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  const fileName = `raport-${(b.name || 'cladire').replace(/\s+/g, '-').toLowerCase()}.pdf`;

  if (b.images.length > 0) {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const imgMargin = 15;
    const gap = 10;
    const cols = 2;
    const rows = 2;
    const perPage = cols * rows;
    const cellW = (pageW - imgMargin * 2 - gap * (cols - 1)) / cols;
    const cellH = (pageH - imgMargin * 2 - gap * (rows - 1)) / rows;

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      });

    try {
      const loaded = await Promise.all(b.images.map(loadImg));
      loaded.forEach((im, idx) => {
        const onPageIdx = idx % perPage;
        if (onPageIdx === 0) doc.addPage();
        const col = onPageIdx % cols;
        const row = Math.floor(onPageIdx / cols);
        const cellX = imgMargin + col * (cellW + gap);
        const cellY = imgMargin + row * (cellH + gap);
        const ratio = Math.min(cellW / im.width, cellH / im.height);
        const w = im.width * ratio;
        const h = im.height * ratio;
        const x = cellX + (cellW - w) / 2;
        const yPos = cellY + (cellH - h) / 2;
        try {
          doc.addImage(im.src, 'JPEG', x, yPos, w, h);
        } catch {}
      });
    } catch {}
  }

  doc.save(fileName);
}
