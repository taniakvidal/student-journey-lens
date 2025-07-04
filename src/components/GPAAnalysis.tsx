
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedData } from "@/types/student";

interface GPAAnalysisProps {
  data: ProcessedData;
  detailed?: boolean;
}

export const GPAAnalysis: React.FC<GPAAnalysisProps> = ({ data, detailed = false }) => {
  const { students } = data;

  // GPA distribution
  const gpaRanges = [
    { range: '3.5-4.0', min: 3.5, max: 4.0, color: 'bg-green-500' },
    { range: '3.0-3.5', min: 3.0, max: 3.5, color: 'bg-blue-500' },
    { range: '2.5-3.0', min: 2.5, max: 3.0, color: 'bg-yellow-500' },
    { range: '2.0-2.5', min: 2.0, max: 2.5, color: 'bg-orange-500' },
    { range: '0.0-2.0', min: 0.0, max: 2.0, color: 'bg-red-500' }
  ];

  const gpaDistribution = gpaRanges.map(range => ({
    ...range,
    count: students.filter(s => s.gpa_at_time >= range.min && s.gpa_at_time < range.max).length
  }));

  // GPA vs Completion Rate
  const gpaCompletionCorrelation = gpaRanges.map(range => {
    const studentsInRange = students.filter(s => s.gpa_at_time >= range.min && s.gpa_at_time < range.max);
    const completedInRange = studentsInRange.filter(s => s.completion_status === 'Completed');
    return {
      ...range,
      completionRate: studentsInRange.length > 0 ? (completedInRange.length / studentsInRange.length) * 100 : 0
    };
  });

  const totalStudents = students.length;

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle>GPA Analysis & Completion Correlation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* GPA Distribution */}
          <div>
            <h4 className="font-semibold mb-3">GPA Distribution</h4>
            <div className="space-y-2">
              {gpaDistribution.map(range => (
                <div key={range.range} className="flex items-center space-x-3">
                  <div className="w-20 text-sm font-medium">{range.range}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-full ${range.color} transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${totalStudents > 0 ? (range.count / totalStudents) * 100 : 0}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {range.count > 0 && `${range.count}`}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {totalStudents > 0 ? ((range.count / totalStudents) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GPA vs Completion Rate */}
          <div>
            <h4 className="font-semibold mb-3">GPA vs Completion Rate</h4>
            <div className="space-y-2">
              {gpaCompletionCorrelation.map(range => (
                <div key={range.range} className="flex items-center space-x-3">
                  <div className="w-20 text-sm font-medium">{range.range}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-full ${range.color} opacity-75 transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${range.completionRate}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {range.completionRate > 10 && `${range.completionRate.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {range.completionRate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {detailed && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">GPA Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong>Students with GPA &lt; 2.0:</strong> {students.filter(s => s.gpa_at_time < 2.0).length} 
                  ({((students.filter(s => s.gpa_at_time < 2.0).length / totalStudents) * 100).toFixed(1)}%)
                </div>
                <div>
                  <strong>Students with GPA &gt; 3.5:</strong> {students.filter(s => s.gpa_at_time > 3.5).length}
                  ({((students.filter(s => s.gpa_at_time > 3.5).length / totalStudents) * 100).toFixed(1)}%)
                </div>
                <div>
                  <strong>Completion Rate (GPA &gt; 3.0):</strong> {
                    (() => {
                      const highGPA = students.filter(s => s.gpa_at_time >= 3.0);
                      const completed = highGPA.filter(s => s.completion_status === 'Completed');
                      return highGPA.length > 0 ? ((completed.length / highGPA.length) * 100).toFixed(1) : 0;
                    })()
                  }%
                </div>
                <div>
                  <strong>Completion Rate (GPA &lt; 2.5):</strong> {
                    (() => {
                      const lowGPA = students.filter(s => s.gpa_at_time < 2.5);
                      const completed = lowGPA.filter(s => s.completion_status === 'Completed');
                      return lowGPA.length > 0 ? ((completed.length / lowGPA.length) * 100).toFixed(1) : 0;
                    })()
                  }%
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
