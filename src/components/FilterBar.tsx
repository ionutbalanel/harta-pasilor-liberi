import { BuildingFilter } from '@/types/building';
import { Button } from '@/components/ui/button';
import { Filter, CheckCircle2, XCircle, Layers } from 'lucide-react';

interface FilterBarProps {
  filter: BuildingFilter;
  onFilterChange: (filter: BuildingFilter) => void;
}

const FilterBar = ({ filter, onFilterChange }: FilterBarProps) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-card border-b border-border">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground mr-1">Filtrează:</span>
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className="gap-1.5 text-xs"
      >
        <Layers className="w-3.5 h-3.5" />
        Toate
      </Button>
      <Button
        variant={filter === 'accessible' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('accessible')}
        className={`gap-1.5 text-xs ${filter === 'accessible' ? 'bg-accessible text-accessible-foreground hover:bg-accessible/90' : ''}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Accesibile
      </Button>
      <Button
        variant={filter === 'inaccessible' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('inaccessible')}
        className={`gap-1.5 text-xs ${filter === 'inaccessible' ? 'bg-inaccessible text-inaccessible-foreground hover:bg-inaccessible/90' : ''}`}
      >
        <XCircle className="w-3.5 h-3.5" />
        Inaccesibile
      </Button>
    </div>
  );
};

export default FilterBar;
