"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  value,
  callback,
  disabled = false,
}: {
  value: Date;
  callback: (date: Date) => void;
  disabled?: boolean;
}) {
  const [date, setDate] = React.useState<Date>(value);
  const onChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    callback(selectedDate);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {date ? (
            format(date, "LLLL dd, y", { locale: id })
          ) : (
            <span>Tanggal Kedatangan</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
