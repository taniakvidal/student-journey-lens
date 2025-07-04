
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessedData } from "@/types/student";

interface KPISummaryProps {
  data: ProcessedData;
}

export const KPISummary: React.FC<KPISummaryProps> = ({ data }) => {
  const { summary } = data;

  const getStatusColor = (rate: number, type: 'completion' | 'dropout') => {
    if (type === 'completion') {
      if (rate >= 80) return 'bg-green-500';
      if (rate >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    } else {
      if (rate <= 10) return 'bg-green-500';
      if (rate <= 25) return 'bg-yellow-500';
      return 'bg-red-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalStudents.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {summary.completionRate.toFixed(1)}%
            </div>
            <Badge className={`${getStatusColor(summary.completionRate, 'completion')} text-white`}>
              {summary.completionRate >= 80 ? 'Good' : summary.completionRate >= 60 ? 'Fair' : 'Poor'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Dropout Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {summary.dropoutRate.toFixed(1)}%
            </div>
            <Badge className={`${getStatusColor(summary.dropoutRate, 'dropout')} text-white`}>
              {summary.dropoutRate <= 10 ? 'Good' : summary.dropoutRate <= 25 ? 'Fair' : 'High'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Average GPA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {summary.averageGPA.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Avg Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {(summary.averageAttendance * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
