import { Building2, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';

interface StatsBarProps {
  total: number;
  accessible: number;
  inaccessible: number;
  accessiblePercent: number;
}

const StatsBar = ({ total, accessible, inaccessible, accessiblePercent }: StatsBarProps) => {
  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-secondary min-w-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Total clădiri</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-accessible/10 min-w-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accessible shrink-0" />
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-accessible leading-tight">{accessible}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Accesibile</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-inaccessible/10 min-w-0">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-inaccessible shrink-0" />
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-inaccessible leading-tight">{inaccessible}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Inaccesibile</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-secondary min-w-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{accessiblePercent}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Rata accesibilității</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
