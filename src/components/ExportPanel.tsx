
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProcessedData } from "@/types/student";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  data: ProcessedData;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ data }) => {
  const { toast } = useToast();

  const exportToCSV = (dataArray: any[], filename: string) => {
    if (dataArray.length === 0) {
      toast({
        title: "No data to export",
        description: "Please ensure you have data loaded first",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(dataArray[0]);
    const csvContent = [
      headers.join(','),
      ...dataArray.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${filename} has been downloaded`
    });
  };

  const exportFilteredStudents = () => {
    exportToCSV(data.students, 'filtered_student_data.csv');
  };

  const exportRiskAnalysis = () => {
    const riskData = data.students.map(student => ({
      student_id: student.student_id,
      program: student.program,
      risk_score: (data.riskScores.get(student.student_id) || 0).toFixed(3),
      risk_level: ((data.riskScores.get(student.student_id) || 0) >= 0.7) ? 'High' : 
                  ((data.riskScores.get(student.student_id) || 0) >= 0.4) ? 'Medium' : 'Low',
      gpa: student.gpa_at_time,
      attendance_rate: student.attendance_rate,
      completion_status: student.completion_status,
      advisor_meetings: student.advisor_meeting_count,
      support_tickets: student.support_ticket_count
    }));
    
    exportToCSV(riskData, 'student_risk_analysis.csv');
  };

  const exportSummaryReport = () => {
    const { summary } = data;
    const summaryData = [
      {
        metric: 'Total Students',
        value: summary.totalStudents,
        percentage: '100.0%'
      },
      {
        metric: 'Completion Rate',
        value: summary.completionRate.toFixed(1) + '%',
        percentage: summary.completionRate.toFixed(1) + '%'
      },
      {
        metric: 'Dropout Rate',
        value: summary.dropoutRate.toFixed(1) + '%',
        percentage: summary.dropoutRate.toFixed(1) + '%'
      },
      {
        metric: 'Average GPA',
        value: summary.averageGPA.toFixed(2),
        percentage: 'N/A'
      },
      {
        metric: 'Average Attendance',
        value: (summary.averageAttendance * 100).toFixed(1) + '%',
        percentage: (summary.averageAttendance * 100).toFixed(1) + '%'
      }
    ];
    
    exportToCSV(summaryData, 'summary_report.csv');
  };

  const exportProgramAnalysis = () => {
    // Group students by program for analysis
    const programStats = new Map();
    
    data.students.forEach(student => {
      const program = student.program;
      if (!programStats.has(program)) {
        programStats.set(program, {
          totalStudents: new Set(),
          completedStudents: new Set(),
          droppedStudents: new Set(),
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
      }
      
      stats.totalGPA += student.gpa_at_time;
      stats.totalAttendance += student.attendance_rate;
    });

    const programData = Array.from(programStats.entries()).map(([program, stats]) => {
      const totalStudents = stats.totalStudents.size;
      const completedStudents = stats.completedStudents.size;
      const droppedStudents = stats.droppedStudents.size;
      
      return {
        program,
        total_students: totalStudents,
        completed_students: completedStudents,
        dropped_students: droppedStudents,
        completion_rate: totalStudents > 0 ? ((completedStudents / totalStudents) * 100).toFixed(1) + '%' : '0%',
        dropout_rate: totalStudents > 0 ? ((droppedStudents / totalStudents) * 100).toFixed(1) + '%' : '0%',
        average_gpa: stats.recordCount > 0 ? (stats.totalGPA / stats.recordCount).toFixed(2) : '0.00',
        average_attendance: stats.recordCount > 0 ? ((stats.totalAttendance / stats.recordCount) * 100).toFixed(1) + '%' : '0%'
      };
    });
    
    exportToCSV(programData, 'program_analysis.csv');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Filtered Student Data</h3>
              <p className="text-sm text-gray-600 mb-3">
                Export the current filtered dataset with all student information and applied filters.
              </p>
              <Button onClick={exportFilteredStudents} className="w-full">
                Export Student Data
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Risk Analysis Report</h3>
              <p className="text-sm text-gray-600 mb-3">
                Export detailed risk scores and categorization for all students in current filter.
              </p>
              <Button onClick={exportRiskAnalysis} className="w-full">
                Export Risk Analysis
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Summary Report</h3>
              <p className="text-sm text-gray-600 mb-3">
                Export key performance indicators and summary statistics for executive review.
              </p>
              <Button onClick={exportSummaryReport} className="w-full">
                Export Summary
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Program Analysis</h3>
              <p className="text-sm text-gray-600 mb-3">
                Export program-by-program performance metrics and completion rates.
              </p>
              <Button onClick={exportProgramAnalysis} className="w-full">
                Export Program Analysis
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>Student Data Export:</strong> Contains all student records matching your current filters, 
              including enrollment dates, course information, grades, and completion status.
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <strong>Risk Analysis Export:</strong> Provides calculated risk scores for each student with 
              contributing factors like GPA, attendance, and advisor interactions.
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <strong>Summary Report:</strong> High-level KPIs suitable for sharing with academic leadership 
              and administrators for strategic decision making.
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <strong>Program Analysis Export:</strong> Detailed breakdown by academic program showing 
              comparative performance metrics and areas for improvement.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
