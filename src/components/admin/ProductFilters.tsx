import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import CategorySelect from "./CategorySelect";

interface ProductFiltersProps {
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

const ProductFilters: React.FC<ProductFiltersProps> = ({
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <CategorySelect value={categoryFilter} onValueChange={onCategoryChange} />

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[150px]">
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

        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary">
              Search: {searchTerm}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onSearchChange("")} />
            </Badge>
          )}
          {categoryFilter && categoryFilter !== "all" && (
            <Badge variant="secondary">
              Category: {categoryFilter}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onCategoryChange("all")} />
            </Badge>
          )}
          {statusFilter && statusFilter !== "all" && (
            <Badge variant="secondary">
              Status: {statusFilter}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onStatusChange("all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;