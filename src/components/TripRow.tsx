import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripRow as TripRowType } from "@/types/logbook";
import { useEffect } from "react";

interface TripRowProps {
  rowNumber: number;
  data: TripRowType;
  onChange: (rowIndex: number, field: keyof TripRowType, value: string) => void;
  onRemoveRow?: (rowIndex: number) => void;
}

export const TripRow = ({ rowNumber, data, onChange, onRemoveRow }: TripRowProps) => {
  // Auto-calculate business_km when odo values change
  useEffect(() => {
    const start = parseFloat(data.odo_start as string) || 0;
    const end = parseFloat(data.odo_end as string) || 0;
    if (start && end && end > start) {
      const calculated = end - start;
      if (calculated !== parseFloat(data.business_km as string)) {
        onChange(rowNumber, 'business_km', calculated.toString());
      }
    }
  }, [data.odo_start, data.odo_end]);

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="p-2 text-sm font-medium text-muted-foreground align-middle">{rowNumber + 1}</td>
      <td className="p-2 align-middle">
        <Input
          type="date"
          value={data.date}
          onChange={(e) => onChange(rowNumber, 'date', e.target.value)}
          className="text-sm w-full"
        />
      </td>
      <td className="p-2 align-middle">
        <Input
          value={data.from}
          onChange={(e) => onChange(rowNumber, 'from', e.target.value)}
          placeholder="Location"
          className="text-sm w-full"
        />
      </td>
      <td className="p-2 align-middle">
        <Input
          value={data.to}
          onChange={(e) => onChange(rowNumber, 'to', e.target.value)}
          placeholder="Location"
          className="text-sm w-full"
        />
      </td>
      <td className="p-2 align-middle">
        <Select value={data.purpose} onValueChange={(value) => onChange(rowNumber, 'purpose', value)}>
          <SelectTrigger className="text-sm ">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inter-workplace">Inter-workplace</SelectItem>
            <SelectItem value="temporary workplace">Temporary workplace</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-2 align-middle">
        <Input
          type="number"
          value={data.odo_start}
          onChange={(e) => onChange(rowNumber, 'odo_start', e.target.value)}
          placeholder="0"
          className="text-sm w-full text-right"
        />
      </td>
      <td className="p-2 align-middle">
        <Input
          type="number"
          value={data.odo_end}
          onChange={(e) => onChange(rowNumber, 'odo_end', e.target.value)}
          placeholder="0"
          className="text-sm w-full text-right"
        />
      </td>
      <td className="p-2 align-middle">
        <Input
          type="number"
          value={data.business_km}
          onChange={(e) => onChange(rowNumber, 'business_km', e.target.value)}
          placeholder="0"
          className="text-sm bg-muted/30 w-full text-right"
          readOnly
        />
      </td>
      <td className="p-2 align-middle">
        <Input
          type="number"
          step="0.01"
          value={data.tolls_parking}
          onChange={(e) => onChange(rowNumber, 'tolls_parking', e.target.value)}
          placeholder="0.00"
          className="text-sm w-full"
        />
      </td>
      <td className="p-2 align-middle">
        <Input
          value={data.notes}
          onChange={(e) => onChange(rowNumber, 'notes', e.target.value)}
          placeholder="Notes"
          className="text-sm w-full"
        />
      </td>
      <td className="p-2 align-middle">
        {onRemoveRow && (
          <button
            type="button"
            onClick={() => onRemoveRow(rowNumber)}
            className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded"
            aria-label={`Remove row ${rowNumber + 1}`}
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
};
