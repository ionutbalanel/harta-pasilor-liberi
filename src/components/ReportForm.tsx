import { useState, useRef } from 'react';
import { BuildingReport, calculateVerdict, BUILDING_TYPES } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, Camera, CheckCircle2, XCircle, FileDown, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportFormProps {
  lat: number;
  lng: number;
  onSubmit: (report: BuildingReport) => void;
  onCancel: () => void;
}

const ReportForm = ({ lat, lng, onSubmit, onCancel }: ReportFormProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<BuildingReport['type']>('public');
  const [hasRamp, setHasRamp] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [hasWideDoors, setHasWideDoors] = useState(false);
  const [hasAdaptedBathroom, setHasAdaptedBathroom] = useState(false);
  const [hasObstacleFreeAccess, setHasObstacleFreeAccess] = useState(false);
  const [comments, setComments] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verdict = calculateVerdict({ hasRamp, hasElevator, hasWideDoors, hasAdaptedBathroom, hasObstacleFreeAccess });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    const report: BuildingReport = {
      id: Date.now().toString(),
      name: name.trim(),
      address: address.trim(),
      lat, lng, type,
      hasRamp, hasElevator, hasWideDoors, hasAdaptedBathroom, hasObstacleFreeAccess,
      comments: comments.trim(),
      images,
      verdict,
      createdAt: new Date().toISOString(),
    };
    onSubmit(report);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Harta Rusinii - Raport Accesibilitate', margin, y);
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
    doc.text(name || 'Fara nume', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Adresa: ${address}`, margin, y); y += 6;
    doc.text(`Tip: ${BUILDING_TYPES[type]}`, margin, y); y += 6;
    doc.text(`Coordonate: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, margin, y); y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const verdictText = verdict === 'accessible' ? 'ACCESIBILA' : 'INACCESIBILA';
    doc.setTextColor(verdict === 'accessible' ? 22 : 239, verdict === 'accessible' ? 163 : 68, verdict === 'accessible' ? 74 : 68);
    doc.text(`Verdict: ${verdictText}`, margin, y);
    doc.setTextColor(0);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Criterii de accesibilitate:', margin, y); y += 7;

    const criteria = [
      ['Rampa de acces', hasRamp],
      ['Lift functional', hasElevator],
      ['Usi suficient de largi', hasWideDoors],
      ['Grup sanitar adaptat', hasAdaptedBathroom],
      ['Acces fara obstacole', hasObstacleFreeAccess],
    ] as const;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    criteria.forEach(([label, val]) => {
      doc.text(`${val ? '[X]' : '[ ]'} ${label}`, margin + 4, y);
      y += 6;
    });

    if (comments) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('Comentarii:', margin, y); y += 6;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(comments, 170);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    }

    // Add images if any
    if (images.length > 0) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Imagini atasate:', margin, y); y += 8;
      images.forEach((img, i) => {
        if (y > 250) { doc.addPage(); y = margin; }
        try {
          doc.addImage(img, 'JPEG', margin, y, 60, 45);
          y += 50;
        } catch {}
      });
    }

    doc.save(`raport-${name.replace(/\s+/g, '-').toLowerCase() || 'cladire'}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[2000] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg my-8 border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Raportează o clădire</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Verdict preview */}
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            verdict === 'accessible' ? 'bg-accessible/10' : 'bg-inaccessible/10'
          }`}>
            {verdict === 'accessible' ? (
              <CheckCircle2 className="w-8 h-8 text-accessible" />
            ) : (
              <XCircle className="w-8 h-8 text-inaccessible" />
            )}
            <div>
              <p className={`font-bold text-lg ${
                verdict === 'accessible' ? 'text-accessible' : 'text-inaccessible'
              }`}>
                {verdict === 'accessible' ? 'Accesibilă' : 'Inaccesibilă'}
              </p>
              <p className="text-xs text-muted-foreground">Verdict calculat automat</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="font-semibold">Numele clădirii *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Primăria Sectorului 1" required />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="font-semibold">Adresa *</Label>
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Str. Victoriei 10, București" required />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Tipul clădirii</Label>
            <Select value={type} onValueChange={(v) => setType(v as BuildingReport['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Publică</SelectItem>
                <SelectItem value="private">Privată</SelectItem>
                <SelectItem value="institution">Instituție</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coordinates */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            📍 Coordonate: {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>

          {/* Criteria */}
          <div className="space-y-3">
            <Label className="font-semibold text-base">Criterii de accesibilitate</Label>
            {[
              { id: 'ramp', label: 'Există rampă de acces?', checked: hasRamp, onChange: setHasRamp },
              { id: 'elevator', label: 'Există lift funcțional?', checked: hasElevator, onChange: setHasElevator },
              { id: 'doors', label: 'Ușile sunt suficient de largi?', checked: hasWideDoors, onChange: setHasWideDoors },
              { id: 'bathroom', label: 'Există grup sanitar adaptat?', checked: hasAdaptedBathroom, onChange: setHasAdaptedBathroom },
              { id: 'obstacle', label: 'Acces fără obstacole?', checked: hasObstacleFreeAccess, onChange: setHasObstacleFreeAccess },
            ].map(({ id, label, checked, onChange }) => (
              <div key={id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
                <Label htmlFor={id} className="cursor-pointer font-medium text-sm">{label}</Label>
              </div>
            ))}
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <Label htmlFor="comments" className="font-semibold">Comentarii</Label>
            <Textarea id="comments" value={comments} onChange={e => setComments(e.target.value)} placeholder="Descrieți problemele de accesibilitate..." rows={3} />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label className="font-semibold">Fotografii</Label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 w-full">
              <Camera className="w-4 h-4" />
              Adaugă fotografii
            </Button>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 bg-foreground/70 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-card" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground font-semibold">
              Trimite raportul
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={generatePDF} className="flex-1 gap-1.5">
                <FileDown className="w-4 h-4" />
                Descarcă PDF
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handlePrint} className="flex-1 gap-1.5">
                <Printer className="w-4 h-4" />
                Printează
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
