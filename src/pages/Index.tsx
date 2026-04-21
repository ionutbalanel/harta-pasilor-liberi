import { useState, useCallback, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import FilterBar from '@/components/FilterBar';
import MapView from '@/components/MapView';
import ReportForm from '@/components/ReportForm';
import { BuildingReport, BuildingFilter } from '@/types/building';
import { fetchBuildings, addBuilding, deleteBuilding, getStats } from '@/store/buildings';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [buildings, setBuildings] = useState<BuildingReport[]>([]);
  const [filter, setFilter] = useState<BuildingFilter>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [formCoords, setFormCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBuildings().then(setBuildings);
  }, []);

  const stats = useMemo(() => getStats(buildings), [buildings]);

  const filteredBuildings = useMemo(() => {
    if (filter === 'all') return buildings;
    return buildings.filter((b) => b.verdict === filter);
  }, [buildings, filter]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isAdding) {
        setFormCoords({ lat, lng });
        setIsAdding(false);
      }
    },
    [isAdding]
  );

  const handleSubmit = useCallback(async (report: BuildingReport) => {
    setSubmitting(true);
    try {
      const saved = await addBuilding(report);
      setBuildings((prev) => [saved, ...prev]);
      setFormCoords(null);
      toast({
        title: 'Raport trimis!',
        description: `${saved.name} a fost adăugată pe hartă ca ${
          saved.verdict === 'accessible' ? 'accesibilă' : 'inaccesibilă'
        }.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Eroare',
        description: 'Nu am putut salva raportul. Încearcă din nou.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
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
        <MapView buildings={filteredBuildings} onMapClick={handleMapClick} isAdding={isAdding} />
      </div>
      {formCoords && (
        <ReportForm
          lat={formCoords.lat}
          lng={formCoords.lng}
          onSubmit={handleSubmit}
          onCancel={() => setFormCoords(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default Index;
