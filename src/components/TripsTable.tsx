import { Card } from "@/components/ui/card";
import { TripRow } from "./TripRow";
import { TripRow as TripRowType } from "@/types/logbook";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

interface TripsTableProps {
  trips: TripRowType[];
  onChange: (rowIndex: number, field: keyof TripRowType, value: string) => void;
  onAddRow?: () => void;
  onRemoveRow?: (rowIndex: number) => void;
}

export const TripsTable = ({ trips, onChange, onAddRow, onRemoveRow }: TripsTableProps) => {
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">{t('trips.title')} ({trips.length} {t('trips.rows')})</h2>
        {onAddRow && (
          <button
            type="button"
            className="btn btn-sm bg-primary text-white px-3 py-1 rounded"
            onClick={onAddRow}
          >
            {t('trips.addRow')}
          </button>
        )}
      </div>
      <ScrollArea className="w-full">
        <div className="min-w-[1200px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left text-sm font-semibold">#</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.date')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.from')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.to')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.business')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.odoStart')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.odoEnd')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.businessKm')} *</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.tollsParking')}</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.notes')}</th>
                <th className="p-2 text-left text-sm font-semibold">{t('trip.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip, index) => (
                <TripRow
                  key={index}
                  rowNumber={index}
                  data={trip}
                  onChange={onChange}
                  onRemoveRow={onRemoveRow}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </Card>
  );
};
