import { useState, useRef } from 'react';
import { BuildingReport, AccessibilityValue, CriterionValue, calculateVerdict, BUILDING_TYPES } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';


import { X, Camera, CheckCircle2, XCircle, FileDown, Printer } from 'lucide-react';
import { generateReportPDF } from '@/lib/generateReportPDF';

interface ReportFormProps {
  lat: number;
  lng: number;
  onSubmit: (report: BuildingReport) => void;
  onCancel: () => void;
  submitting?: boolean;
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

const ReportForm = ({ lat, lng, onSubmit, onCancel, submitting = false }: ReportFormProps) => {
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
    generateReportPDF({
      name: name || 'Fara nume',
      address,
      type,
      lat,
      lng,
      hasRamp: criteria.hasRamp,
      hasElevator: criteria.hasElevator,
      hasWideDoors: criteria.hasWideDoors,
      hasAdaptedBathroom: criteria.hasAdaptedBathroom,
      hasObstacleFreeAccess: criteria.hasObstacleFreeAccess,
      comments,
      images,
      verdict,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[2000] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-card rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg my-2 sm:my-8 border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-card rounded-t-xl sm:rounded-t-2xl z-10">
          <h2 className="text-base sm:text-lg font-bold text-foreground">Raportează o clădire</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
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
            <Label htmlFor="building-type" className="font-semibold">Tipul clădirii</Label>
            <select
              id="building-type"
              value={type}
              onChange={(e) => setType(e.target.value as BuildingReport['type'])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {Object.entries(BUILDING_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
                <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
                  {options.map((opt) => {
                    const inputId = `${id}-${opt}`;
                    const selected = criteria[id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleCriterion(id, opt)}
                        aria-pressed={selected}
                        aria-label={`${label} - ${OPTION_LABELS[opt]}`}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors min-h-11 flex-1 min-w-[90px] justify-center ${
                          selected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected ? 'border-primary text-primary' : 'border-primary/70 text-transparent'
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full bg-current ${selected ? 'opacity-100' : 'opacity-0'}`} />
                        </span>
                        <Label htmlFor={inputId} className="text-sm font-medium cursor-pointer pointer-events-none">
                          {OPTION_LABELS[opt]}
                        </Label>
                      </button>
                    );
                  })}
                </div>
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
            <Button type="submit" size="lg" disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold">
              {submitting ? 'Se trimite…' : 'Trimite raportul'}
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
