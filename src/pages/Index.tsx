import { useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import FilterBar from '@/components/FilterBar';
import MapView from '@/components/MapView';
import ReportForm from '@/components/ReportForm';
import { BuildingReport, BuildingFilter } from '@/types/building';
import { getBuildings, addBuilding, getStats } from '@/store/buildings';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [buildings, setBuildings] = useState<BuildingReport[]>(getBuildings);
  const [filter, setFilter] = useState<BuildingFilter>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [formCoords, setFormCoords] = useState<{ lat: number; lng: number } | null>(null);

  const stats = useMemo(() => getStats(buildings), [buildings]);

  const filteredBuildings = useMemo(() => {
    if (filter === 'all') return buildings;
    return buildings.filter(b => b.verdict === filter);
  }, [buildings, filter]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isAdding) {
      setFormCoords({ lat, lng });
      setIsAdding(false);
    }
  }, [isAdding]);

  const handleSubmit = useCallback((report: BuildingReport) => {
    addBuilding(report);
    setBuildings(getBuildings());
    setFormCoords(null);
    toast({
      title: 'Raport trimis!',
      description: `${report.name} a fost adăugată pe hartă ca ${report.verdict === 'accessible' ? 'accesibilă' : 'inaccesibilă'}.`,
    });
  }, []);

  const handleStartAdding = useCallback(() => {
    setIsAdding(true);
    toast({
      title: 'Selectează locația',
      description: 'Click pe hartă pentru a alege locația clădirii.',
    });
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onAddReport={handleStartAdding} />
      <StatsBar {...stats} />
      <FilterBar filter={filter} onFilterChange={setFilter} />
      <div className="flex-1 relative">
        <MapView
          buildings={filteredBuildings}
          onMapClick={handleMapClick}
          isAdding={isAdding}
        />
      </div>
      {formCoords && (
        <ReportForm
          lat={formCoords.lat}
          lng={formCoords.lng}
          onSubmit={handleSubmit}
          onCancel={() => setFormCoords(null)}
        />
      )}
    </div>
  );
};

export default Index;
