"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RadarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RadarModal({ open, onOpenChange }: RadarModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stream Automation</DialogTitle>
          <DialogDescription>Stream automation coming soon</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="text-muted-foreground text-center">
            <p>This feature is currently under development.</p>
            <p className="mt-2">Stay tuned for updates!</p>
          </div>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
