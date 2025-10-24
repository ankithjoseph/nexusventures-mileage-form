import { Card } from "@/components/ui/card";
import { TripRow } from "./TripRow";
import { TripRow as TripRowType } from "@/types/logbook";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TripsTableProps {
  trips: TripRowType[];
  onChange: (rowIndex: number, field: keyof TripRowType, value: string) => void;
  onAddRow?: () => void;
  onRemoveRow?: (rowIndex: number) => void;
}

export const TripsTable = ({ trips, onChange, onAddRow, onRemoveRow }: TripsTableProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Business Trips ({trips.length} rows)</h2>
        {onAddRow && (
          <button
            type="button"
            className="btn btn-sm bg-primary text-white px-3 py-1 rounded"
            onClick={onAddRow}
          >
            Add row
          </button>
        )}
      </div>
      <ScrollArea className="w-full">
        <div className="min-w-[1200px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left text-sm font-semibold">#</th>
                <th className="p-2 text-left text-sm font-semibold">Date *</th>
                <th className="p-2 text-left text-sm font-semibold">From *</th>
                <th className="p-2 text-left text-sm font-semibold">To *</th>
                <th className="p-2 text-left text-sm font-semibold">Purpose *</th>
                <th className="p-2 text-left text-sm font-semibold">Odo Start *</th>
                <th className="p-2 text-left text-sm font-semibold">Odo End *</th>
                <th className="p-2 text-left text-sm font-semibold">Business km *</th>
                <th className="p-2 text-left text-sm font-semibold">Tolls/Parking €</th>
                <th className="p-2 text-left text-sm font-semibold">Notes</th>
                <th className="p-2 text-left text-sm font-semibold">Actions</th>
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
