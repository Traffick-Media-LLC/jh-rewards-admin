import React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

const presetRanges = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "This year", value: "year", days: 365 },
];

export function DateRangePicker({ date, onDateChange, className }: DateRangePickerProps) {
  const handlePresetSelect = (value: string) => {
    const preset = presetRanges.find(p => p.value === value);
    if (preset) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - preset.days);
      onDateChange({ from, to });
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 w-full sm:w-auto", className)}>
      <Select onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
          <SelectValue placeholder="Quick select" />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.value} value={preset.value} className="text-xs sm:text-sm">
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full sm:w-60 lg:w-72 justify-start text-left font-normal text-xs sm:text-sm",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    <span className="hidden sm:inline">{format(date.from, "MMM dd")} - {format(date.to, "MMM dd, y")}</span>
                    <span className="sm:hidden">{format(date.from, "MM/dd")} - {format(date.to, "MM/dd/yy")}</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{format(date.from, "LLL dd, y")}</span>
                    <span className="sm:hidden">{format(date.from, "MM/dd/yy")}</span>
                  </>
                )
              ) : (
                <>
                  <span className="hidden sm:inline">Pick a date range</span>
                  <span className="sm:hidden">Date range</span>
                </>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={1}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}