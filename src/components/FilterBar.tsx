import { BuildingFilter } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Filter, CheckCircle2, XCircle, Layers } from 'lucide-react';

interface FilterBarProps {
  filter: BuildingFilter;
  onFilterChange: (filter: BuildingFilter) => void;
}

const FilterBar = ({ filter, onFilterChange }: FilterBarProps) => {
  return (
    <div className="bg-card border-b border-border">
      <div className="w-full flex flex-nowrap items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 overflow-x-auto">
        <div className="hidden sm:flex items-center gap-1.5 mr-1 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">Filtrează:</span>
        </div>
        <Filter className="w-4 h-4 text-muted-foreground shrink-0 sm:hidden" />
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
          className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs h-8 px-2 sm:px-3 shrink-0"
        >
          <Layers className="w-3.5 h-3.5" />
          Toate
        </Button>
        <Button
          variant={filter === 'accessible' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('accessible')}
          className={`gap-1 sm:gap-1.5 text-[11px] sm:text-xs h-8 px-2 sm:px-3 shrink-0 ${filter === 'accessible' ? 'bg-accessible text-accessible-foreground hover:bg-accessible/90' : ''}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Accesibile
        </Button>
        <Button
          variant={filter === 'inaccessible' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('inaccessible')}
          className={`gap-1 sm:gap-1.5 text-[11px] sm:text-xs h-8 px-2 sm:px-3 shrink-0 ${filter === 'inaccessible' ? 'bg-inaccessible text-inaccessible-foreground hover:bg-inaccessible/90' : ''}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Inaccesibile
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
