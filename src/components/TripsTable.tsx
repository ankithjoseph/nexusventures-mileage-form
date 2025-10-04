import { Card } from "@/components/ui/card";
import { TripRow } from "./TripRow";
import { TripRow as TripRowType } from "@/types/logbook";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TripsTableProps {
  trips: TripRowType[];
  onChange: (rowIndex: number, field: keyof TripRowType, value: string) => void;
}

export const TripsTable = ({ trips, onChange }: TripsTableProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Business Trips (20 rows)</h2>
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
              </tr>
            </thead>
            <tbody>
              {trips.map((trip, index) => (
                <TripRow
                  key={index}
                  rowNumber={index}
                  data={trip}
                  onChange={onChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </Card>
  );
};
