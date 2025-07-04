
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessedData } from "@/types/student";

interface RiskAnalysisProps {
  data: ProcessedData;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ data }) => {
  const { students, riskScores } = data;

  // Categorize students by risk level
  const highRiskStudents = students.filter(s => (riskScores.get(s.student_id) || 0) >= 0.7);
  const mediumRiskStudents = students.filter(s => {
    const risk = riskScores.get(s.student_id) || 0;
    return risk >= 0.4 && risk < 0.7;
  });
  const lowRiskStudents = students.filter(s => (riskScores.get(s.student_id) || 0) < 0.4);

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { level: 'High', color: 'bg-red-500', textColor: 'text-red-700' };
    if (score >= 0.4) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Low', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  // Get top risk factors
  const riskFactorAnalysis = {
    lowGPA: students.filter(s => s.gpa_at_time < 2.5).length,
    lowAttendance: students.filter(s => s.attendance_rate < 0.75).length,
    highSupportTickets: students.filter(s => s.support_ticket_count > 3).length,
    fewAdvisorMeetings: students.filter(s => s.advisor_meeting_count < 2).length
  };

  return (
    <div className="space-y-6">
      {/* Risk Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700">High Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{highRiskStudents.length}</div>
            <div className="text-sm text-gray-600">
              {((highRiskStudents.length / students.length) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-700">Medium Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{mediumRiskStudents.length}</div>
            <div className="text-sm text-gray-600">
              {((mediumRiskStudents.length / students.length) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700">Low Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{lowRiskStudents.length}</div>
            <div className="text-sm text-gray-600">
              {((lowRiskStudents.length / students.length) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Common Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{riskFactorAnalysis.lowGPA}</div>
              <div className="text-sm text-gray-600">Low GPA (&lt;2.5)</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{riskFactorAnalysis.lowAttendance}</div>
              <div className="text-sm text-gray-600">Low Attendance (&lt;75%)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{riskFactorAnalysis.highSupportTickets}</div>
              <div className="text-sm text-gray-600">Many Support Tickets (&gt;3)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{riskFactorAnalysis.fewAdvisorMeetings}</div>
              <div className="text-sm text-gray-600">Few Advisor Meetings (&lt;2)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Risk Students List */}
      {highRiskStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>High Risk Students (Immediate Attention Required)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {highRiskStudents.slice(0, 20).map(student => {
                const riskScore = riskScores.get(student.student_id) || 0;
                const risk = getRiskLevel(riskScore);
                
                return (
                  <div key={student.student_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-4">
                      <Badge className={`${risk.color} text-white`}>
                        {risk.level}
                      </Badge>
                      <div>
                        <div className="font-medium">Student ID: {student.student_id}</div>
                        <div className="text-sm text-gray-600">
                          Program: {student.program} | GPA: {student.gpa_at_time.toFixed(2)} | 
                          Attendance: {(student.attendance_rate * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {(riskScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>
                );
              })}
              {highRiskStudents.length > 20 && (
                <div className="text-center py-2 text-gray-500">
                  ... and {highRiskStudents.length - 20} more high-risk students
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
