import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, X } from "lucide-react";
import CategorySelect from "./CategorySelect";

interface MobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || (categoryFilter && categoryFilter !== "all") || (statusFilter && statusFilter !== "all") || sortBy !== "created_at_desc";
  const activeFilterCount = [
    searchTerm,
    categoryFilter && categoryFilter !== "all",
    statusFilter && statusFilter !== "all",
    sortBy !== "created_at_desc"
  ].filter(Boolean).length;

  return (
    <div className="sm:hidden">
      <div className="flex gap-2 mb-4">
        {/* Search input always visible on mobile */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter sheet trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Filter Products</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down your product search
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <CategorySelect value={categoryFilter} onValueChange={onCategoryChange} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at_desc">Newest First</SelectItem>
                    <SelectItem value="created_at_asc">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Name Z-A</SelectItem>
                    <SelectItem value="price_asc">Price Low-High</SelectItem>
                    <SelectItem value="price_desc">Price High-Low</SelectItem>
                    <SelectItem value="inventory_asc">Low Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Active Filters</label>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Search: {searchTerm}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange("")} />
                      </Badge>
                    )}
                    {categoryFilter && categoryFilter !== "all" && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Category: {categoryFilter}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryChange("all")} />
                      </Badge>
                    )}
                    {statusFilter && statusFilter !== "all" && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Status: {statusFilter}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => onStatusChange("all")} />
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" onClick={onClearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileFilters;