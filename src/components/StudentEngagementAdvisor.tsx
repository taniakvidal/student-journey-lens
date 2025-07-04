
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, AlertTriangle, TrendingUp, MessageSquare } from "lucide-react";
import { ProcessedData } from "@/types/student";
import { useToast } from "@/hooks/use-toast";

interface StudentEngagementAdvisorProps {
  data: ProcessedData;
}

interface EngagementInsight {
  type: 'risk_alert' | 'intervention' | 'program_pattern' | 'course_issue';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable_recommendations: string[];
  affected_students: number;
  confidence: number;
}

interface AdvisorAnalysis {
  insights: EngagementInsight[];
  summary: string;
  timestamp: Date;
}

export const StudentEngagementAdvisor: React.FC<StudentEngagementAdvisorProps> = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AdvisorAnalysis | null>(null);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const generateEngagementAnalysis = () => {
    const { students, summary } = data;

    // Analyze disengagement patterns
    const lowEngagementStudents = students.filter(s => 
      s.attendance_rate < 0.6 && s.gpa_at_time < 2.5
    );

    const noAdvisorContact = students.filter(s => 
      s.advisor_meeting_count === 0 && s.completion_status !== 'Completed'
    );

    const highSupportNoProgress = students.filter(s => 
      s.support_ticket_count > 3 && (s.credits_earned / s.total_credits_required) < 0.4
    );

    const lowCreditProgress = students.filter(s => 
      (s.credits_earned / s.total_credits_required) < 0.4
    );

    // Program performance analysis
    const programStats = new Map();
    students.forEach(student => {
      const program = student.program;
      if (!programStats.has(program)) {
        programStats.set(program, {
          totalStudents: new Set(),
          avgGPA: 0,
          avgAttendance: 0,
          completionRate: 0,
          records: []
        });
      }
      programStats.get(program).records.push(student);
      programStats.get(program).totalStudents.add(student.student_id);
    });

    // Course category analysis
    const courseStats = new Map();
    students.forEach(student => {
      const category = student.course_category;
      if (!courseStats.has(category)) {
        courseStats.set(category, {
          totalEnrollments: 0,
          completedCount: 0,
          droppedCount: 0,
          avgGrade: 0,
          records: []
        });
      }
      courseStats.get(category).records.push(student);
      courseStats.get(category).totalEnrollments++;
      if (student.completion_status === 'Completed') {
        courseStats.get(category).completedCount++;
      } else if (student.completion_status === 'Dropped') {
        courseStats.get(category).droppedCount++;
      }
    });

    return {
      lowEngagementStudents: lowEngagementStudents.length,
      noAdvisorContact: noAdvisorContact.length,
      highSupportNoProgress: highSupportNoProgress.length,
      lowCreditProgress: lowCreditProgress.length,
      programCount: programStats.size,
      courseCategories: courseStats.size,
      riskStudents: lowEngagementStudents.slice(0, 10).map(s => ({
        id: s.student_id,
        program: s.program,
        gpa: s.gpa_at_time,
        attendance: s.attendance_rate,
        advisorMeetings: s.advisor_meeting_count,
        supportTickets: s.support_ticket_count,
        creditProgress: (s.credits_earned / s.total_credits_required) * 100
      })),
      programInsights: Array.from(programStats.entries()).map(([program, stats]) => {
        const records = stats.records;
        const avgGPA = records.reduce((sum, r) => sum + r.gpa_at_time, 0) / records.length;
        const avgAttendance = records.reduce((sum, r) => sum + r.attendance_rate, 0) / records.length;
        const completed = records.filter(r => r.completion_status === 'Completed').length;
        const completionRate = (completed / stats.totalStudents.size) * 100;
        
        return {
          program,
          totalStudents: stats.totalStudents.size,
          avgGPA: avgGPA.toFixed(2),
          avgAttendance: (avgAttendance * 100).toFixed(1),
          completionRate: completionRate.toFixed(1)
        };
      }).sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
    };
  };

  const handleAdvisorAnalysis = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to enable AI advisor analysis",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const engagementData = generateEngagementAnalysis();
      
      const systemPrompt = `You are a Student Engagement Advisor Agent focused on analyzing academic performance, engagement patterns, and advising interactions. 

Analyze this student engagement data and provide actionable insights:

Low Engagement Students (attendance <60% + GPA <2.5): ${engagementData.lowEngagementStudents}
Students with No Advisor Contact: ${engagementData.noAdvisorContact}
High Support Tickets + Low Progress: ${engagementData.highSupportNoProgress}
Students with <40% Credit Progress: ${engagementData.lowCreditProgress}

Risk Students Sample: ${JSON.stringify(engagementData.riskStudents.slice(0, 3), null, 2)}

Program Performance: ${JSON.stringify(engagementData.programInsights.slice(0, 5), null, 2)}

Provide your analysis in JSON format with this structure:
{
  "insights": [
    {
      "type": "risk_alert" | "intervention" | "program_pattern" | "course_issue",
      "priority": "high" | "medium" | "low",
      "title": "Brief insight title",
      "description": "Detailed explanation of the pattern or issue",
      "actionable_recommendations": ["specific action 1", "specific action 2"],
      "affected_students": number,
      "confidence": 0.85
    }
  ],
  "summary": "Overall assessment and key priorities for advisors"
}

Focus on:
1. Early disengagement warning signs
2. Specific intervention recommendations
3. Systemic issues requiring institutional attention
4. Resource allocation priorities`;

      const userQuery = `Analyze the engagement patterns and provide specific, actionable recommendations for advisors and administrators to improve student success and reduce dropout risk.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'o1-2025-04-16',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userQuery
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const aiResponse = result.choices[0]?.message?.content || '{}';

      try {
        const parsedAnalysis = JSON.parse(aiResponse);
        const advisorAnalysis: AdvisorAnalysis = {
          insights: parsedAnalysis.insights || [],
          summary: parsedAnalysis.summary || 'Analysis completed successfully.',
          timestamp: new Date()
        };

        setAnalysis(advisorAnalysis);
        
        toast({
          title: "Advisor Analysis Complete",
          description: `Generated ${advisorAnalysis.insights.length} engagement insights`
        });

      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback analysis
        const fallbackAnalysis: AdvisorAnalysis = {
          insights: [
            {
              type: 'risk_alert',
              priority: 'high',
              title: 'High-Risk Student Identification',
              description: `${engagementData.lowEngagementStudents} students show critical disengagement patterns with low attendance and GPA.`,
              actionable_recommendations: [
                'Schedule immediate advisor meetings for students with <60% attendance and <2.5 GPA',
                'Implement early warning system for similar patterns',
                'Provide academic support resources and study skills workshops'
              ],
              affected_students: engagementData.lowEngagementStudents,
              confidence: 0.9
            },
            {
              type: 'intervention',
              priority: 'high',
              title: 'Advisor Engagement Gap',
              description: `${engagementData.noAdvisorContact} students have had no advisor contact despite academic challenges.`,
              actionable_recommendations: [
                'Mandate advisor check-ins for all students with incomplete status',
                'Implement proactive outreach system',
                'Train advisors on early intervention strategies'
              ],
              affected_students: engagementData.noAdvisorContact,
              confidence: 0.85
            }
          ],
          summary: `Critical engagement issues identified requiring immediate attention. Focus on the ${engagementData.lowEngagementStudents} students with dual risk factors and the ${engagementData.noAdvisorContact} students lacking advisor support.`,
          timestamp: new Date()
        };

        setAnalysis(fallbackAnalysis);
      }

    } catch (error) {
      console.error('Advisor analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate advisor analysis. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'intervention': return <Users className="h-4 w-4" />;
      case 'program_pattern': return <TrendingUp className="h-4 w-4" />;
      case 'course_issue': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const quickStats = generateEngagementAnalysis();

  return (
    <div className="space-y-6">
      {/* API Key Input */}
      {!apiKey && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">AI Engagement Advisor</span>
              </div>
              <p className="text-sm text-blue-700">
                Enter your OpenAI API key to enable AI-powered engagement analysis and intervention recommendations
              </p>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{quickStats.lowEngagementStudents}</div>
                <div className="text-sm text-gray-600">Low Engagement Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{quickStats.noAdvisorContact}</div>
                <div className="text-sm text-gray-600">No Advisor Contact</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{quickStats.highSupportNoProgress}</div>
                <div className="text-sm text-gray-600">High Support, Low Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{quickStats.lowCreditProgress}</div>
                <div className="text-sm text-gray-600">Low Credit Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>AI Student Engagement Advisor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAdvisorAnalysis} 
            disabled={isAnalyzing || !apiKey}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Student Engagement Patterns...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Generate Engagement Analysis & Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analysis Summary</CardTitle>
              <div className="text-sm text-gray-500">
                Generated on {analysis.timestamp.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-900">{analysis.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Actionable Insights & Recommendations</h3>
            {analysis.insights.map((insight, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: insight.priority === 'high' ? '#ef4444' : insight.priority === 'medium' ? '#f59e0b' : '#10b981' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(insight.type)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${getPriorityColor(insight.priority)} text-white`}>
                            {insight.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <Badge variant="outline">
                            {insight.affected_students} students affected
                          </Badge>
                          <Badge variant="outline">
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{insight.description}</p>
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Actions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {insight.actionable_recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
