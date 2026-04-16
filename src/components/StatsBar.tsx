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
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Total clădiri</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accessible/10">
            <CheckCircle2 className="w-5 h-5 text-accessible" />
            <div>
              <p className="text-lg font-bold text-accessible">{accessible}</p>
              <p className="text-xs text-muted-foreground">Accesibile</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-inaccessible/10">
            <XCircle className="w-5 h-5 text-inaccessible" />
            <div>
              <p className="text-lg font-bold text-inaccessible">{inaccessible}</p>
              <p className="text-xs text-muted-foreground">Inaccesibile</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{accessiblePercent}%</p>
              <p className="text-xs text-muted-foreground">Rata accesibilității</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
