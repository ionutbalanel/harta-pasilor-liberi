import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-accesibilitatii.png';

interface HeaderProps {
  onAddReport: () => void;
}

const Header = ({ onAddReport }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
      <div className="w-full px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 flex-nowrap">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <img
              src={logo}
              alt="Logo Harta Accesibilității"
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 object-contain"
            />
            <div className="min-w-0 flex md:items-center gap-3 sm:gap-4 flex-col md:flex-row">
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-extrabold text-foreground leading-tight truncate">
                  Harta Accesibilității
                </h1>
                <p className="text-[11px] sm:text-sm font-semibold text-[hsl(142_71%_38%)] leading-tight truncate">
                  Acces pentru toți.
                </p>
              </div>
              <div className="hidden md:block h-10 w-px bg-border shrink-0" />
              <p className="hidden md:block text-xs lg:text-sm text-muted-foreground leading-snug max-w-md">
                O platformă civică care identifică și promovează accesibilitatea clădirilor, pentru comunități incluzive.
              </p>
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
        <p className="md:hidden mt-2 text-[11px] text-muted-foreground leading-snug">
          O platformă civică care identifică și promovează accesibilitatea clădirilor, pentru comunități incluzive.
        </p>
      </div>
    </header>
  );
};

export default Header;
