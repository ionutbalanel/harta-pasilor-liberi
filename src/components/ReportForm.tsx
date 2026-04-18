import { useState, useRef } from 'react';
import { BuildingReport, AccessibilityValue, CriterionValue, calculateVerdict, BUILDING_TYPES } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Camera, CheckCircle2, XCircle, FileDown, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportFormProps {
  lat: number;
  lng: number;
  onSubmit: (report: BuildingReport) => void;
  onCancel: () => void;
}

type CriterionDef = {
  id: keyof Pick<BuildingReport, 'hasRamp' | 'hasElevator' | 'hasWideDoors' | 'hasAdaptedBathroom' | 'hasObstacleFreeAccess'>;
  label: string;
  options: AccessibilityValue[]; // which radio choices to show
};

const CRITERIA: CriterionDef[] = [
  { id: 'hasRamp', label: 'Există rampă de acces?', options: ['yes', 'na', 'no'] },
  { id: 'hasElevator', label: 'Există lift funcțional?', options: ['yes', 'na', 'no'] },
  { id: 'hasWideDoors', label: 'Ușile sunt suficient de largi?', options: ['yes', 'no'] },
  { id: 'hasAdaptedBathroom', label: 'Există grup sanitar adaptat?', options: ['yes', 'na', 'no'] },
  { id: 'hasObstacleFreeAccess', label: 'Acces fără obstacole?', options: ['yes', 'no'] },
];

const OPTION_LABELS: Record<AccessibilityValue, string> = {
  yes: 'Da',
  no: 'Nu',
  na: 'Inutil',
};

const ReportForm = ({ lat, lng, onSubmit, onCancel }: ReportFormProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<BuildingReport['type']>('public');
  const [criteria, setCriteria] = useState<Record<CriterionDef['id'], CriterionValue>>({
    hasRamp: null,
    hasElevator: null,
    hasWideDoors: null,
    hasAdaptedBathroom: null,
    hasObstacleFreeAccess: null,
  });
  const [comments, setComments] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verdict = calculateVerdict(criteria);

  const toggleCriterion = (id: CriterionDef['id'], value: AccessibilityValue) =>
    setCriteria((prev) => ({ ...prev, [id]: prev[id] === value ? null : value }));

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
      ...criteria,
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

    const labels: Record<CriterionDef['id'], string> = {
      hasRamp: 'Rampa de acces',
      hasElevator: 'Lift functional',
      hasWideDoors: 'Usi suficient de largi',
      hasAdaptedBathroom: 'Grup sanitar adaptat',
      hasObstacleFreeAccess: 'Acces fara obstacole',
    };

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    (Object.keys(labels) as CriterionDef['id'][]).forEach((key) => {
      const v = criteria[key];
      const mark = v === 'yes' ? '[DA]' : v === 'no' ? '[NU]' : '[N/A]';
      doc.text(`${mark} ${labels[key]}`, margin + 4, y);
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

    if (images.length > 0) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Imagini atasate:', margin, y); y += 8;
      images.forEach((img) => {
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
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Str. Victoriei 10, Chișinău" required />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Tipul clădirii</Label>
            <Select value={type} onValueChange={(v) => setType(v as BuildingReport['type'])}>
              <SelectTrigger><SelectValue placeholder="Alege tipul..." /></SelectTrigger>
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

          {/* Criteria — radio groups */}
          <div className="space-y-4">
            <Label className="font-semibold text-base">Criterii de accesibilitate</Label>
            {CRITERIA.map(({ id, label, options }) => (
              <fieldset key={id} className="rounded-xl border border-border p-3 space-y-2">
                <legend className="px-1 text-sm font-medium text-foreground">{label}</legend>
                <RadioGroup
                  value={criteria[id] ?? ''}
                  onValueChange={(v) => toggleCriterion(id, v as AccessibilityValue)}
                  className="flex flex-wrap gap-2"
                >
                  {options.map((opt) => {
                    const inputId = `${id}-${opt}`;
                    const selected = criteria[id] === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => toggleCriterion(id, opt)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors min-h-11 flex-1 min-w-[90px] justify-center ${
                          selected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        <RadioGroupItem id={inputId} value={opt} onClick={(e) => e.stopPropagation()} />
                        <Label htmlFor={inputId} className="text-sm font-medium cursor-pointer" onClick={(e) => e.preventDefault()}>
                          {OPTION_LABELS[opt]}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </fieldset>
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
