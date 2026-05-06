import jsPDF from 'jspdf';
import { BuildingReport, BUILDING_TYPES } from '@/types/building';
import { NotoSansRegular, NotoSansBold } from './fonts/noto';

const CRITERIA_LABELS: Record<string, string> = {
  hasRamp: 'Rampă de acces',
  hasElevator: 'Lift funcțional',
  hasWideDoors: 'Uși suficient de largi',
  hasAdaptedBathroom: 'Grup sanitar adaptat',
  hasObstacleFreeAccess: 'Acces fără obstacole',
};

let fontsRegistered = false;
function registerFonts(doc: jsPDF) {
  if (fontsRegistered) {
    // jsPDF instances are separate; still need to add VFS+font each time
  }
  doc.addFileToVFS('NotoSans-Regular.ttf', NotoSansRegular);
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal', undefined, 'Identity-H');
  doc.addFileToVFS('NotoSans-Bold.ttf', NotoSansBold);
  doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold', undefined, 'Identity-H');
  fontsRegistered = true;
}

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
  registerFonts(doc);
  doc.setFont('NotoSans', 'normal');

  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.setFont('NotoSans', 'bold');
  doc.text('Harta Accesibilității - Raport Accesibilitate', margin, y);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('NotoSans', 'normal');
  doc.text(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`, margin, y);
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('NotoSans', 'bold');
  doc.text(b.name || 'Fără nume', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('NotoSans', 'normal');
  doc.text(`Adresă: ${b.address}`, margin, y); y += 6;
  doc.text(`Tip: ${BUILDING_TYPES[b.type]}`, margin, y); y += 6;
  doc.text(`Coordonate: ${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}`, margin, y); y += 10;

  doc.setFontSize(12);
  doc.setFont('NotoSans', 'bold');
  const verdictText = b.verdict === 'accessible' ? 'ACCESIBILĂ' : 'INACCESIBILĂ';
  doc.setTextColor(
    b.verdict === 'accessible' ? 22 : 239,
    b.verdict === 'accessible' ? 163 : 68,
    b.verdict === 'accessible' ? 74 : 68,
  );
  doc.text(`Verdict: ${verdictText}`, margin, y);
  doc.setTextColor(0);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('NotoSans', 'bold');
  doc.text('Criterii de accesibilitate:', margin, y); y += 7;

  doc.setFontSize(10);
  const keys = ['hasRamp', 'hasElevator', 'hasWideDoors', 'hasAdaptedBathroom', 'hasObstacleFreeAccess'] as const;
  keys.forEach((key) => {
    const v = b[key];
    doc.setFont('NotoSans', 'bold');
    if (v === 'yes') {
      doc.setTextColor(22, 163, 74);
      doc.text('✔', margin + 4, y);
    } else if (v === 'no') {
      doc.setTextColor(220, 38, 38);
      doc.text('✖', margin + 4, y);
    } else {
      doc.setTextColor(120);
      doc.text('➖', margin + 4, y);
    }
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(0);
    doc.text(CRITERIA_LABELS[key], margin + 12, y);
    y += 6;
  });

  if (b.comments) {
    y += 4;
    doc.setFont('NotoSans', 'bold');
    doc.text('Comentarii:', margin, y); y += 6;
    doc.setFont('NotoSans', 'normal');
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
