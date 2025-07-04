
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessedData } from "@/types/student";

interface AdvisorImpactProps {
  data: ProcessedData;
}

export const AdvisorImpact: React.FC<AdvisorImpactProps> = ({ data }) => {
  const { students } = data;

  // Group students by advisor
  const advisorStats = new Map();
  
  students.forEach(student => {
    const advisorId = student.advisor_id;
    if (!advisorStats.has(advisorId)) {
      advisorStats.set(advisorId, {
        totalStudents: new Set(),
        completedStudents: new Set(),
        droppedStudents: new Set(),
        totalMeetings: 0,
        averageGPA: 0,
        averageAttendance: 0
      });
    }
    
    const stats = advisorStats.get(advisorId);
    stats.totalStudents.add(student.student_id);
    
    if (student.completion_status === 'Completed') {
      stats.completedStudents.add(student.student_id);
    } else if (student.completion_status === 'Dropped') {
      stats.droppedStudents.add(student.student_id);
    }
    
    stats.totalMeetings += student.advisor_meeting_count;
    stats.averageGPA += student.gpa_at_time;
    stats.averageAttendance += student.attendance_rate;
  });

  // Calculate advisor performance metrics
  const advisorPerformance = Array.from(advisorStats.entries()).map(([advisorId, stats]) => {
    const totalStudents = stats.totalStudents.size;
    const completedStudents = stats.completedStudents.size;
    const droppedStudents = stats.droppedStudents.size;
    
    return {
      advisorId,
      totalStudents,
      completionRate: totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
      dropoutRate: totalStudents > 0 ? (droppedStudents / totalStudents) * 100 : 0,
      averageMeetings: totalStudents > 0 ? stats.totalMeetings / totalStudents : 0,
      averageGPA: totalStudents > 0 ? stats.averageGPA / students.filter(s => s.advisor_id === advisorId).length : 0,
      averageAttendance: totalStudents > 0 ? stats.averageAttendance / students.filter(s => s.advisor_id === advisorId).length : 0
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  // Meeting frequency analysis
  const meetingRanges = [
    { range: '5+', min: 5, max: Infinity, color: 'bg-green-500' },
    { range: '3-4', min: 3, max: 4, color: 'bg-blue-500' },
    { range: '1-2', min: 1, max: 2, color: 'bg-yellow-500' },
    { range: '0', min: 0, max: 0, color: 'bg-red-500' }
  ];

  const meetingImpact = meetingRanges.map(range => {
    const studentsInRange = students.filter(s => 
      s.advisor_meeting_count >= range.min && s.advisor_meeting_count <= range.max
    );
    const completedInRange = studentsInRange.filter(s => s.completion_status === 'Completed');
    
    return {
      ...range,
      count: studentsInRange.length,
      completionRate: studentsInRange.length > 0 ? (completedInRange.length / studentsInRange.length) * 100 : 0
    };
  });

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Advisor Meeting Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Advisor Meeting Frequency Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {meetingImpact.map(range => (
              <div key={range.range} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-800">{range.range}</div>
                <div className="text-xs text-gray-600 mb-2">Meetings</div>
                <div className="text-sm">
                  <div className="font-medium">{range.count} students</div>
                  <div className={`text-lg font-bold ${range.completionRate > 70 ? 'text-green-600' : range.completionRate > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {range.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">completion</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Advisors */}
      <Card>
        <CardHeader>
          <CardTitle>Advisor Performance Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {advisorPerformance.slice(0, 15).map((advisor, index) => (
              <div key={advisor.advisorId} className={`p-4 rounded-lg border ${getPerformanceColor(advisor.completionRate)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">Advisor {advisor.advisorId}</div>
                      <div className="text-sm text-gray-600">
                        {advisor.totalStudents} students | Avg {advisor.averageMeetings.toFixed(1)} meetings
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {advisor.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">completion rate</div>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Dropout:</span>
                    <span className="ml-1 font-medium">{advisor.dropoutRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg GPA:</span>
                    <span className="ml-1 font-medium">{advisor.averageGPA.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Attendance:</span>
                    <span className="ml-1 font-medium">{(advisor.averageAttendance * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Advisor Impact Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Meeting Frequency Correlation</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Students with 5+ meetings: {(meetingImpact[0]?.completionRate || 0).toFixed(1)}% completion</div>
                <div>Students with 0 meetings: {(meetingImpact[3]?.completionRate || 0).toFixed(1)}% completion</div>
                <div className="font-medium mt-2">
                  Impact: {((meetingImpact[0]?.completionRate || 0) - (meetingImpact[3]?.completionRate || 0)).toFixed(1)}% difference
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Top Advisor Metrics</h4>
              <div className="text-sm text-green-800 space-y-1">
                {advisorPerformance[0] && (
                  <>
                    <div>Best Completion Rate: {advisorPerformance[0].completionRate.toFixed(1)}%</div>
                    <div>Advisor: {advisorPerformance[0].advisorId}</div>
                    <div>Avg Meetings: {advisorPerformance[0].averageMeetings.toFixed(1)}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
