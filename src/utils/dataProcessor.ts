
import { StudentData, FilterState, ProcessedData } from "@/types/student";

export const processStudentData = (data: StudentData[], filters: FilterState): ProcessedData => {
  let filteredStudents = data;

  // Apply filters
  if (filters.programs.length > 0) {
    filteredStudents = filteredStudents.filter(student => 
      filters.programs.includes(student.program)
    );
  }

  if (filters.advisors.length > 0) {
    filteredStudents = filteredStudents.filter(student => 
      filters.advisors.includes(student.advisor_id)
    );
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    filteredStudents = filteredStudents.filter(student => {
      const enrollmentDate = new Date(student.enrollment_date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      return enrollmentDate >= startDate && enrollmentDate <= endDate;
    });
  }

  // Calculate risk scores
  const riskScores = calculateRiskScores(filteredStudents);

  // Apply risk level filter
  if (filters.riskLevel !== 'all') {
    filteredStudents = filteredStudents.filter(student => {
      const risk = riskScores.get(student.student_id) || 0;
      switch (filters.riskLevel) {
        case 'high': return risk >= 0.7;
        case 'medium': return risk >= 0.4 && risk < 0.7;
        case 'low': return risk < 0.4;
        default: return true;
      }
    });
  }

  // Calculate summary statistics
  const totalStudents = new Set(filteredStudents.map(s => s.student_id)).size;
  const completedStudents = new Set(
    filteredStudents.filter(s => s.completion_status === 'Completed').map(s => s.student_id)
  ).size;
  const droppedStudents = new Set(
    filteredStudents.filter(s => s.completion_status === 'Dropped').map(s => s.student_id)
  ).size;

  const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
  const dropoutRate = totalStudents > 0 ? (droppedStudents / totalStudents) * 100 : 0;

  const totalGPA = filteredStudents.reduce((sum, student) => sum + student.gpa_at_time, 0);
  const averageGPA = filteredStudents.length > 0 ? totalGPA / filteredStudents.length : 0;

  const totalAttendance = filteredStudents.reduce((sum, student) => sum + student.attendance_rate, 0);
  const averageAttendance = filteredStudents.length > 0 ? totalAttendance / filteredStudents.length : 0;

  return {
    students: filteredStudents,
    summary: {
      totalStudents,
      completionRate,
      dropoutRate,
      averageGPA,
      averageAttendance
    },
    riskScores
  };
};

export const calculateRiskScores = (data: StudentData[]): Map<string, number> => {
  const riskScores = new Map<string, number>();

  data.forEach(student => {
    let riskScore = 0;

    // GPA factor (lower GPA = higher risk)
    if (student.gpa_at_time < 2.0) riskScore += 0.3;
    else if (student.gpa_at_time < 2.5) riskScore += 0.2;
    else if (student.gpa_at_time < 3.0) riskScore += 0.1;

    // Attendance factor (lower attendance = higher risk)
    if (student.attendance_rate < 0.6) riskScore += 0.25;
    else if (student.attendance_rate < 0.75) riskScore += 0.15;
    else if (student.attendance_rate < 0.85) riskScore += 0.05;

    // Support ticket factor (more tickets = higher risk)
    if (student.support_ticket_count > 5) riskScore += 0.2;
    else if (student.support_ticket_count > 2) riskScore += 0.1;

    // Advisor meeting factor (fewer meetings = higher risk)
    if (student.advisor_meeting_count === 0) riskScore += 0.15;
    else if (student.advisor_meeting_count < 2) riskScore += 0.1;

    // Credit progress factor
    const progressRatio = student.credits_earned / student.total_credits_required;
    if (progressRatio < 0.25) riskScore += 0.1;

    riskScores.set(student.student_id, Math.min(riskScore, 1.0));
  });

  return riskScores;
};

export const parseCSV = (csvText: string): StudentData[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Convert numeric fields
      if (['attendance_rate', 'gpa_at_time', 'advisor_meeting_count', 'support_ticket_count', 'credits_earned', 'total_credits_required'].includes(header)) {
        row[header] = parseFloat(value) || 0;
      } else {
        row[header] = value;
      }
    });
    
    return row as StudentData;
  }).filter(row => row.student_id); // Filter out empty rows
};
