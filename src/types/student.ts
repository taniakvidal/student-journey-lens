
export interface StudentData {
  student_id: string;
  program: string;
  enrollment_date: string;
  registration_date: string;
  course_id: string;
  course_name: string;
  course_category: string;
  course_start_date: string;
  course_end_date: string;
  grade: string;
  completion_status: 'Completed' | 'Dropped' | 'In Progress';
  attendance_rate: number;
  advisor_id: string;
  advisor_meeting_count: number;
  support_ticket_count: number;
  gpa_at_time: number;
  credits_earned: number;
  total_credits_required: number;
}

export interface FilterState {
  programs: string[];
  advisors: string[];
  dateRange: {
    start: string;
    end: string;
  };
  riskLevel: 'all' | 'high' | 'medium' | 'low';
}

export interface ProcessedData {
  students: StudentData[];
  summary: {
    totalStudents: number;
    completionRate: number;
    dropoutRate: number;
    averageGPA: number;
    averageAttendance: number;
  };
  riskScores: Map<string, number>;
}
