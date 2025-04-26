import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <Button
      variant={isActive ? "secondary" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      {icon}
      {label && <span className="hidden sm:inline-block">{label}</span>}
    </Button>
  );
};

export default ToolbarButton;
