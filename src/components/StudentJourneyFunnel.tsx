
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedData } from "@/types/student";

interface StudentJourneyFunnelProps {
  data: ProcessedData;
  detailed?: boolean;
}

export const StudentJourneyFunnel: React.FC<StudentJourneyFunnelProps> = ({ data, detailed = false }) => {
  const { students } = data;

  // Calculate funnel stages
  const totalEnrolled = new Set(students.map(s => s.student_id)).size;
  const totalRegistered = new Set(students.filter(s => s.registration_date).map(s => s.student_id)).size;
  const totalStarted = new Set(students.filter(s => s.course_start_date).map(s => s.student_id)).size;
  const totalCompleted = new Set(students.filter(s => s.completion_status === 'Completed').map(s => s.student_id)).size;

  const stages = [
    { name: 'Enrolled', count: totalEnrolled, percentage: 100, color: 'bg-blue-500' },
    { name: 'Registered', count: totalRegistered, percentage: totalEnrolled > 0 ? (totalRegistered / totalEnrolled) * 100 : 0, color: 'bg-green-500' },
    { name: 'Started Courses', count: totalStarted, percentage: totalEnrolled > 0 ? (totalStarted / totalEnrolled) * 100 : 0, color: 'bg-yellow-500' },
    { name: 'Completed', count: totalCompleted, percentage: totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0, color: 'bg-purple-500' }
  ];

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle>Student Journey Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{stage.name}</span>
                <div className="text-right">
                  <span className="font-bold">{stage.count}</span>
                  <span className="text-sm text-gray-500 ml-2">({stage.percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-center text-white font-medium text-sm`}
                  style={{ width: `${Math.max(stage.percentage, 10)}%` }}
                >
                  {stage.percentage > 20 && `${stage.percentage.toFixed(1)}%`}
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  Drop-off: {((stages[index].count - stages[index + 1].count) / stages[index].count * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {detailed && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Journey Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Enrollment to Registration:</strong> {((totalRegistered / totalEnrolled) * 100).toFixed(1)}% conversion
              </div>
              <div>
                <strong>Registration to Course Start:</strong> {totalRegistered > 0 ? ((totalStarted / totalRegistered) * 100).toFixed(1) : 0}% conversion
              </div>
              <div>
                <strong>Course Start to Completion:</strong> {totalStarted > 0 ? ((totalCompleted / totalStarted) * 100).toFixed(1) : 0}% conversion
              </div>
              <div>
                <strong>Overall Completion Rate:</strong> {((totalCompleted / totalEnrolled) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
