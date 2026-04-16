import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddReport: () => void;
}

const Header = ({ onAddReport }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground leading-tight">Harta Rușinii</h1>
            <p className="text-xs text-muted-foreground">Accesibilitate pentru toți</p>
          </div>
        </div>
        <Button onClick={onAddReport} size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Raportează o clădire</span>
          <span className="sm:hidden">Raportează</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
