
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StudentData, FilterState } from "@/types/student";

interface FilterPanelProps {
  data: StudentData[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ data, filters, onFiltersChange }) => {
  const uniquePrograms = [...new Set(data.map(d => d.program))].sort();
  const uniqueAdvisors = [...new Set(data.map(d => d.advisor_id))].sort();

  const handleProgramToggle = (program: string) => {
    const newPrograms = filters.programs.includes(program)
      ? filters.programs.filter(p => p !== program)
      : [...filters.programs, program];
    
    onFiltersChange({ ...filters, programs: newPrograms });
  };

  const handleAdvisorToggle = (advisor: string) => {
    const newAdvisors = filters.advisors.includes(advisor)
      ? filters.advisors.filter(a => a !== advisor)
      : [...filters.advisors, advisor];
    
    onFiltersChange({ ...filters, advisors: newAdvisors });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      programs: [],
      advisors: [],
      dateRange: { start: '', end: '' },
      riskLevel: 'all'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Filters</CardTitle>
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Programs Filter */}
          <div className="space-y-2">
            <Label>Programs</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uniquePrograms.map(program => (
                <div key={program} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`program-${program}`}
                    checked={filters.programs.includes(program)}
                    onChange={() => handleProgramToggle(program)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`program-${program}`} className="text-sm">
                    {program}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Advisors Filter */}
          <div className="space-y-2">
            <Label>Advisors</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uniqueAdvisors.slice(0, 10).map(advisor => (
                <div key={advisor} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`advisor-${advisor}`}
                    checked={filters.advisors.includes(advisor)}
                    onChange={() => handleAdvisorToggle(advisor)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`advisor-${advisor}`} className="text-sm">
                    {advisor}
                  </label>
                </div>
              ))}
              {uniqueAdvisors.length > 10 && (
                <p className="text-xs text-gray-500">... and {uniqueAdvisors.length - 10} more</p>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Enrollment Date Range</Label>
            <div className="space-y-2">
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="space-y-2">
            <Label>Risk Level</Label>
            <Select
              value={filters.riskLevel}
              onValueChange={(value: any) => onFiltersChange({ ...filters, riskLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-wrap gap-2">
          {filters.programs.map(program => (
            <Badge key={program} variant="secondary" className="cursor-pointer" onClick={() => handleProgramToggle(program)}>
              {program} ×
            </Badge>
          ))}
          {filters.advisors.map(advisor => (
            <Badge key={advisor} variant="secondary" className="cursor-pointer" onClick={() => handleAdvisorToggle(advisor)}>
              {advisor} ×
            </Badge>
          ))}
          {filters.riskLevel !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => onFiltersChange({ ...filters, riskLevel: 'all' })}>
              {filters.riskLevel} risk ×
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
