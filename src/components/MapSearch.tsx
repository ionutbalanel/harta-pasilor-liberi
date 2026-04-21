import { useEffect, useRef, useState } from 'react';
import { Search, LoaderCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

interface MapSearchProps {
  onSelect: (lat: number, lng: number, bbox?: [number, number, number, number], label?: string) => void;
}

const MapSearch = ({ onSelect }: MapSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=md&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'ro' } });
        if (!res.ok) throw new Error('Network');
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch (err) {
        console.error('[search] error', err);
        toast({ title: 'Eroare căutare', description: 'Încearcă din nou.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const bb = r.boundingbox;
    const bbox: [number, number, number, number] = [
      parseFloat(bb[0]),
      parseFloat(bb[2]),
      parseFloat(bb[1]),
      parseFloat(bb[3]),
    ];
    onSelect(lat, lng, bbox, r.display_name);
    setQuery(r.display_name.split(',').slice(0, 2).join(','));
    setOpen(false);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="absolute top-3 left-14 z-[1000] w-[min(240px,calc(100%-4rem))]">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Caută adresă..."
          className="pl-8 pr-8 h-9 text-xs bg-background shadow-lg border-border"
          aria-label="Caută locație"
        />
        {loading ? (
          <LoaderCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Șterge căutarea"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {open && results.length > 0 && (
        <ul className="mt-1 bg-background border border-border rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                onClick={() => choose(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex gap-2 items-start"
              >
                <Search className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && results.length === 0 && query.trim().length >= 3 && (
        <div className="mt-1 bg-background border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Niciun rezultat.
        </div>
      )}
    </div>
  );
};

export default MapSearch;
