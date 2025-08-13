import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Package, Users, ShoppingCart, LayoutDashboard } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CommandPalette: React.FC<Props> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search admin..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => { navigate("/admin"); onOpenChange(false); }}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/admin/users"); onOpenChange(false); }}>
            <Users className="mr-2 h-4 w-4" /> Users
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/admin/products"); onOpenChange(false); }}>
            <Package className="mr-2 h-4 w-4" /> Products
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/admin/orders"); onOpenChange(false); }}>
            <ShoppingCart className="mr-2 h-4 w-4" /> Orders
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
