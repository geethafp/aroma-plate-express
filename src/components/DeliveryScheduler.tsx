import { useState } from 'react';
import { format, addHours, startOfHour, isBefore, addDays } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

interface DeliverySchedulerProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const DeliveryScheduler = ({ date, time, onDateChange, onTimeChange }: DeliverySchedulerProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Minimum delivery date is 24 hours from now
  const minDate = addDays(new Date(), 1);
  const minDateStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());

  const isTimeDisabled = (slot: string) => {
    if (!date) return false;
    const [h] = slot.split(':').map(Number);
    const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h);
    return isBefore(slotDate, addHours(new Date(), 24));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">DELIVERY SCHEDULE</h3>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "w-full flex items-center gap-3 h-14 rounded-xl bg-card card-shadow px-4 text-left transition-all",
            !date && "text-muted-foreground/50"
          )}>
            <CalendarIcon size={18} className="text-primary shrink-0" />
            {date ? format(date, 'EEEE, dd MMMM yyyy') : 'Select delivery date'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { onDateChange(d); setCalendarOpen(false); onTimeChange(''); }}
            disabled={(d) => isBefore(d, minDateStart)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {date && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-primary" />
            <span className="text-sm text-muted-foreground">Select delivery time</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map(slot => {
              const disabled = isTimeDisabled(slot);
              const selected = time === slot;
              return (
                <button
                  key={slot}
                  disabled={disabled}
                  onClick={() => onTimeChange(slot)}
                  className={cn(
                    "py-2.5 rounded-lg text-sm font-medium transition-all",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card card-shadow text-foreground hover:bg-secondary",
                    disabled && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryScheduler;
