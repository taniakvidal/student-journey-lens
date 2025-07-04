
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedData } from "@/types/student";

interface ProgramPerformanceProps {
  data: ProcessedData;
  detailed?: boolean;
}

export const ProgramPerformance: React.FC<ProgramPerformanceProps> = ({ data, detailed = false }) => {
  const { students } = data;

  // Group students by program
  const programStats = new Map();
  
  students.forEach(student => {
    const program = student.program;
    if (!programStats.has(program)) {
      programStats.set(program, {
        totalStudents: new Set(),
        completedStudents: new Set(),
        droppedStudents: new Set(),
        inProgressStudents: new Set(),
        totalGPA: 0,
        totalAttendance: 0,
        recordCount: 0
      });
    }
    
    const stats = programStats.get(program);
    stats.totalStudents.add(student.student_id);
    stats.recordCount++;
    
    if (student.completion_status === 'Completed') {
      stats.completedStudents.add(student.student_id);
    } else if (student.completion_status === 'Dropped') {
      stats.droppedStudents.add(student.student_id);
    } else if (student.completion_status === 'In Progress') {
      stats.inProgressStudents.add(student.student_id);
    }
    
    stats.totalGPA += student.gpa_at_time;
    stats.totalAttendance += student.attendance_rate;
  });

  // Calculate program performance metrics
  const programPerformance = Array.from(programStats.entries()).map(([program, stats]) => {
    const totalStudents = stats.totalStudents.size;
    const completedStudents = stats.completedStudents.size;
    const droppedStudents = stats.droppedStudents.size;
    const inProgressStudents = stats.inProgressStudents.size;
    
    return {
      program,
      totalStudents,
      completedStudents,
      droppedStudents,
      inProgressStudents,
      completionRate: totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
      dropoutRate: totalStudents > 0 ? (droppedStudents / totalStudents) * 100 : 0,
      averageGPA: stats.recordCount > 0 ? stats.totalGPA / stats.recordCount : 0,
      averageAttendance: stats.recordCount > 0 ? (stats.totalAttendance / stats.recordCount) * 100 : 0
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'border-green-200 bg-green-50';
    if (rate >= 60) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getStatusColor = (rate: number, type: 'completion' | 'dropout') => {
    if (type === 'completion') {
      if (rate >= 80) return 'text-green-600';
      if (rate >= 60) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (rate <= 10) return 'text-green-600';
      if (rate <= 25) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle>Program Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {programPerformance.map(program => (
            <div key={program.program} className={`p-4 rounded-lg border-2 ${getPerformanceColor(program.completionRate)}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{program.program}</h4>
                  <p className="text-sm text-gray-600">{program.totalStudents} total students</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getStatusColor(program.completionRate, 'completion')}`}>
                    {program.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">completion rate</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Completed</div>
                  <div className="font-semibold text-green-600">{program.completedStudents}</div>
                </div>
                <div>
                  <div className="text-gray-600">Dropped</div>
                  <div className={`font-semibold ${getStatusColor(program.dropoutRate, 'dropout')}`}>
                    {program.droppedStudents} ({program.dropoutRate.toFixed(1)}%)
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">In Progress</div>
                  <div className="font-semibold text-blue-600">{program.inProgressStudents}</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg GPA</div>
                  <div className="font-semibold">{program.averageGPA.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg Attendance</div>
                  <div className="font-semibold">{program.averageAttendance.toFixed(1)}%</div>
                </div>
              </div>

              {detailed && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="flex h-full rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(program.completedStudents / program.totalStudents) * 100}%` }}
                      />
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(program.inProgressStudents / program.totalStudents) * 100}%` }}
                      />
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(program.droppedStudents / program.totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Completed</span>
                    <span>In Progress</span>
                    <span>Dropped</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {detailed && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Program Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Best Performing Program:</strong> {programPerformance[0]?.program} 
                ({programPerformance[0]?.completionRate.toFixed(1)}% completion)
              </div>
              <div>
                <strong>Needs Attention:</strong> {programPerformance[programPerformance.length - 1]?.program} 
                ({programPerformance[programPerformance.length - 1]?.dropoutRate.toFixed(1)}% dropout)
              </div>
              <div>
                <strong>Programs with High GPA (&gt;3.0):</strong> {
                  programPerformance.filter(p => p.averageGPA > 3.0).length
                } out of {programPerformance.length}
              </div>
              <div>
                <strong>Programs with Good Attendance (&gt;80%):</strong> {
                  programPerformance.filter(p => p.averageAttendance > 80).length
                } out of {programPerformance.length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
