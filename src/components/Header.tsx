import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddReport: () => void;
}

const Header = ({ onAddReport }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-extrabold text-foreground leading-tight truncate">Harta Rușinii</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Accesibilitate pentru toți</p>
          </div>
        </div>
        <Button
          onClick={onAddReport}
          size="default"
          className="gap-1.5 sm:gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shrink-0 px-3 sm:px-4"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Raportează o clădire</span>
          <span className="sm:hidden text-sm">Raportează</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
