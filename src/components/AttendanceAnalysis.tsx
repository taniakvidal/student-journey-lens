
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedData } from "@/types/student";

interface AttendanceAnalysisProps {
  data: ProcessedData;
}

export const AttendanceAnalysis: React.FC<AttendanceAnalysisProps> = ({ data }) => {
  const { students } = data;

  // Attendance ranges
  const attendanceRanges = [
    { range: '90-100%', min: 0.9, max: 1.0, color: 'bg-green-500' },
    { range: '80-90%', min: 0.8, max: 0.9, color: 'bg-blue-500' },
    { range: '70-80%', min: 0.7, max: 0.8, color: 'bg-yellow-500' },
    { range: '60-70%', min: 0.6, max: 0.7, color: 'bg-orange-500' },
    { range: '0-60%', min: 0.0, max: 0.6, color: 'bg-red-500' }
  ];

  const attendanceDistribution = attendanceRanges.map(range => ({
    ...range,
    count: students.filter(s => s.attendance_rate >= range.min && s.attendance_rate < range.max).length
  }));

  // Attendance vs Completion Rate
  const attendanceCompletionCorrelation = attendanceRanges.map(range => {
    const studentsInRange = students.filter(s => s.attendance_rate >= range.min && s.attendance_rate < range.max);
    const completedInRange = studentsInRange.filter(s => s.completion_status === 'Completed');
    const droppedInRange = studentsInRange.filter(s => s.completion_status === 'Dropped');
    
    return {
      ...range,
      completionRate: studentsInRange.length > 0 ? (completedInRange.length / studentsInRange.length) * 100 : 0,
      dropoutRate: studentsInRange.length > 0 ? (droppedInRange.length / studentsInRange.length) * 100 : 0
    };
  });

  const totalStudents = students.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance vs Course Completion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Attendance Distribution */}
          <div>
            <h4 className="font-semibold mb-3">Attendance Distribution</h4>
            <div className="space-y-2">
              {attendanceDistribution.map(range => (
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

          {/* Attendance Impact on Completion */}
          <div>
            <h4 className="font-semibold mb-3">Completion Rate by Attendance Level</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attendanceCompletionCorrelation.map(range => (
                <div key={range.range} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-800 mb-2">{range.range} Attendance</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate:</span>
                      <span className={`font-semibold ${range.completionRate > 70 ? 'text-green-600' : range.completionRate > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {range.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dropout Rate:</span>
                      <span className={`font-semibold ${range.dropoutRate < 20 ? 'text-green-600' : range.dropoutRate < 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {range.dropoutRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-900">Attendance Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <strong>High Attendance (≥80%):</strong> {students.filter(s => s.attendance_rate >= 0.8).length} students
                ({((students.filter(s => s.attendance_rate >= 0.8).length / totalStudents) * 100).toFixed(1)}%)
              </div>
              <div>
                <strong>Low Attendance (&lt;60%):</strong> {students.filter(s => s.attendance_rate < 0.6).length} students
                ({((students.filter(s => s.attendance_rate < 0.6).length / totalStudents) * 100).toFixed(1)}%)
              </div>
              <div>
                <strong>Avg Completion (High Attendance):</strong> {
                  (() => {
                    const highAttendance = students.filter(s => s.attendance_rate >= 0.8);
                    const completed = highAttendance.filter(s => s.completion_status === 'Completed');
                    return highAttendance.length > 0 ? ((completed.length / highAttendance.length) * 100).toFixed(1) : 0;
                  })()
                }%
              </div>
              <div>
                <strong>Avg Completion (Low Attendance):</strong> {
                  (() => {
                    const lowAttendance = students.filter(s => s.attendance_rate < 0.6);
                    const completed = lowAttendance.filter(s => s.completion_status === 'Completed');
                    return lowAttendance.length > 0 ? ((completed.length / lowAttendance.length) * 100).toFixed(1) : 0;
                  })()
                }%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
