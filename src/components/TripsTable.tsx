import { Card } from "@/components/ui/card";
import { TripRow } from "./TripRow";
import { TripRow as TripRowType } from "@/types/logbook";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TripsTableProps {
  trips: TripRowType[];
  onChange: (rowIndex: number, field: keyof TripRowType, value: string) => void;
  onAddRow?: () => void;
  onRemoveRow?: (rowIndex: number) => void;
}

const MobileTripCard = ({
  trip,
  index,
  onChange,
  onRemoveRow,
  t
}: {
  trip: TripRowType;
  index: number;
  onChange: (rowIndex: number, field: keyof TripRowType, value: string) => void;
  onRemoveRow?: (rowIndex: number) => void;
  t: (key: string) => string;
}) => {
  return (
    <Card className="p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-primary text-sm">Trip #{index + 1}</h3>
        {onRemoveRow && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemoveRow(index)}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('trip.date')} *
            </label>
            <Input
              type="date"
              value={trip.date}
              onChange={(e) => onChange(index, 'date', e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('trip.business')} *
            </label>
            <Select value={trip.purpose} onValueChange={(value) => onChange(index, 'purpose', value)}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter-workplace">{t('trip.purpose.interWorkplace')}</SelectItem>
                <SelectItem value="temporary workplace">{t('trip.purpose.temporaryWorkplace')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('trip.from')} *
            </label>
            <Input
              value={trip.from}
              onChange={(e) => onChange(index, 'from', e.target.value)}
              placeholder={t('placeholders.location')}
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('trip.to')} *
            </label>
            <Input
              value={trip.to}
              onChange={(e) => onChange(index, 'to', e.target.value)}
              placeholder={t('placeholders.location')}
              className="text-xs h-8"
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details">
            <AccordionTrigger className="text-xs font-medium py-2">
              Trip Details
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    {t('trip.odoStart')} *
                  </label>
                  <Input
                    type="number"
                    value={trip.odo_start}
                    onChange={(e) => onChange(index, 'odo_start', e.target.value)}
                    placeholder="0"
                    className="text-xs h-8 text-right"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    {t('trip.odoEnd')} *
                  </label>
                  <Input
                    type="number"
                    value={trip.odo_end}
                    onChange={(e) => onChange(index, 'odo_end', e.target.value)}
                    placeholder="0"
                    className="text-xs h-8 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {t('trip.businessKm')} *
                </label>
                <Input
                  type="number"
                  value={trip.business_km}
                  onChange={(e) => onChange(index, 'business_km', e.target.value)}
                  placeholder="0"
                  className="text-xs h-8 text-right bg-muted/30"
                  readOnly
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {t('trip.tollsParking')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={trip.tolls_parking}
                  onChange={(e) => onChange(index, 'tolls_parking', e.target.value)}
                  placeholder="0.00"
                  className="text-xs h-8 text-right"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {t('trip.notes')}
                </label>
                <Input
                  value={trip.notes}
                  onChange={(e) => onChange(index, 'notes', e.target.value)}
                  placeholder={t('placeholders.notes')}
                  className="text-xs h-8"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Card>
  );
};

export const TripsTable = ({ trips, onChange, onAddRow, onRemoveRow }: TripsTableProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-primary">{t('trips.title')} ({trips.length} {t('trips.rows')})</h2>
          {onAddRow && (
            <Button
              onClick={onAddRow}
              size="sm"
              className="bg-primary text-white h-8"
            >
              {t('trips.addRow')}
            </Button>
          )}
        </div>
        <ScrollArea className="w-full h-[calc(100vh-300px)] min-h-[400px]">
          <div className="space-y-3 pb-4">
            {trips.map((trip, index) => (
              <MobileTripCard
                key={index}
                trip={trip}
                index={index}
                onChange={onChange}
                onRemoveRow={onRemoveRow}
                t={t}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>
    );
  }

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
