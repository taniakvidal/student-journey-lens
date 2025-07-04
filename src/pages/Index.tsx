
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";
import { FilterPanel } from "@/components/FilterPanel";
import { StudentJourneyFunnel } from "@/components/StudentJourneyFunnel";
import { RiskAnalysis } from "@/components/RiskAnalysis";
import { GPAAnalysis } from "@/components/GPAAnalysis";
import { AttendanceAnalysis } from "@/components/AttendanceAnalysis";
import { AdvisorImpact } from "@/components/AdvisorImpact";
import { ProgramPerformance } from "@/components/ProgramPerformance";
import { KPISummary } from "@/components/KPISummary";
import { ExportPanel } from "@/components/ExportPanel";
import { ReasoningQuery } from "@/components/ReasoningQuery";
import { StudentEngagementAdvisor } from "@/components/StudentEngagementAdvisor";
import { StudentData, FilterState } from "@/types/student";
import { processStudentData } from "@/utils/dataProcessor";

const Index = () => {
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    programs: [],
    advisors: [],
    dateRange: { start: '', end: '' },
    riskLevel: 'all'
  });

  const filteredData = useMemo(() => {
    return processStudentData(studentData, filters);
  }, [studentData, filters]);

  const hasData = studentData.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Student Success Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive insights into student journeys, drop-out patterns, and success factors 
            to help improve retention and academic outcomes
          </p>
        </div>

        {/* File Upload Section */}
        {!hasData && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Upload Student Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onDataLoad={setStudentData} />
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard */}
        {hasData && (
          <>
            {/* KPI Summary */}
            <KPISummary data={filteredData} />

            {/* Filter Panel */}
            <FilterPanel 
              data={studentData} 
              filters={filters} 
              onFiltersChange={setFilters} 
            />

            {/* Analytics Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-8 lg:w-fit lg:grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="journey">Journey</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="advisor">Advisor Impact</TabsTrigger>
                <TabsTrigger value="engagement">AI Advisor</TabsTrigger>
                <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StudentJourneyFunnel data={filteredData} />
                  <ProgramPerformance data={filteredData} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GPAAnalysis data={filteredData} />
                  <AttendanceAnalysis data={filteredData} />
                </div>
              </TabsContent>

              <TabsContent value="journey">
                <StudentJourneyFunnel data={filteredData} detailed={true} />
              </TabsContent>

              <TabsContent value="risk">
                <RiskAnalysis data={filteredData} />
              </TabsContent>

              <TabsContent value="performance">
                <div className="space-y-6">
                  <ProgramPerformance data={filteredData} detailed={true} />
                  <GPAAnalysis data={filteredData} detailed={true} />
                </div>
              </TabsContent>

              <TabsContent value="advisor">
                <AdvisorImpact data={filteredData} />
              </TabsContent>

              <TabsContent value="engagement">
                <StudentEngagementAdvisor data={filteredData} />
              </TabsContent>

              <TabsContent value="reasoning">
                <ReasoningQuery data={filteredData} />
              </TabsContent>

              <TabsContent value="export">
                <ExportPanel data={filteredData} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
