
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, AlertTriangle, TrendingUp, MessageSquare, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { ProcessedData } from "@/types/student";
import { useToast } from "@/hooks/use-toast";

interface StudentEngagementAdvisorProps {
  data: ProcessedData;
}

interface ActionStep {
  step: number;
  action: string;
  timeline: string;
  responsible: string;
  success_metric: string;
}

interface DecisionTree {
  condition: string;
  decision: 'immediate' | 'urgent' | 'moderate' | 'monitor';
  next_steps: ActionStep[];
  expected_outcome: string;
}

interface EngagementInsight {
  type: 'risk_alert' | 'intervention' | 'program_pattern' | 'course_issue';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable_recommendations: string[];
  affected_students: number;
  confidence: number;
  decision_tree: DecisionTree;
}

interface AdvisorAnalysis {
  insights: EngagementInsight[];
  summary: string;
  timestamp: Date;
  immediate_actions: number;
  urgent_actions: number;
}

export const StudentEngagementAdvisor: React.FC<StudentEngagementAdvisorProps> = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AdvisorAnalysis | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const generateEngagementAnalysis = () => {
    const { students } = data;

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

    return {
      lowEngagementStudents: lowEngagementStudents.length,
      noAdvisorContact: noAdvisorContact.length,
      highSupportNoProgress: highSupportNoProgress.length,
      lowCreditProgress: lowCreditProgress.length,
      riskStudents: lowEngagementStudents.slice(0, 10).map(s => ({
        id: s.student_id,
        program: s.program,
        gpa: s.gpa_at_time,
        attendance: s.attendance_rate,
        advisorMeetings: s.advisor_meeting_count,
        supportTickets: s.support_ticket_count,
        creditProgress: (s.credits_earned / s.total_credits_required) * 100
      }))
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
      
      const systemPrompt = `You are a Student Engagement Advisor Agent focused on providing clear decisions and actionable next steps.

Analyze this student engagement data and provide structured decision trees with specific action steps:

Low Engagement Students: ${engagementData.lowEngagementStudents}
Students with No Advisor Contact: ${engagementData.noAdvisorContact}
High Support + Low Progress: ${engagementData.highSupportNoProgress}
Low Credit Progress: ${engagementData.lowCreditProgress}

For each insight, provide a decision tree with clear next steps including:
- Specific actions to take
- Timeline for each action
- Who is responsible
- Success metrics to track
- Expected outcomes

Respond in JSON format:
{
  "insights": [
    {
      "type": "risk_alert",
      "priority": "high",
      "title": "Clear insight title",
      "description": "Specific issue description",
      "actionable_recommendations": ["recommendation 1", "recommendation 2"],
      "affected_students": number,
      "confidence": 0.85,
      "decision_tree": {
        "condition": "IF student has X condition",
        "decision": "immediate|urgent|moderate|monitor",
        "next_steps": [
          {
            "step": 1,
            "action": "Specific action to take",
            "timeline": "Within 24 hours",
            "responsible": "Academic Advisor",
            "success_metric": "Student responds to outreach"
          }
        ],
        "expected_outcome": "What we expect to achieve"
      }
    }
  ],
  "summary": "Overall assessment",
  "immediate_actions": number,
  "urgent_actions": number
}`;

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
              content: 'Provide structured decision trees and clear next steps for these engagement patterns.'
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
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
          timestamp: new Date(),
          immediate_actions: parsedAnalysis.immediate_actions || 0,
          urgent_actions: parsedAnalysis.urgent_actions || 0
        };

        setAnalysis(advisorAnalysis);
        
        toast({
          title: "Decision Analysis Complete",
          description: `Generated ${advisorAnalysis.insights.length} decision trees with ${advisorAnalysis.immediate_actions + advisorAnalysis.urgent_actions} priority actions`
        });

      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback with structured decision trees
        const fallbackAnalysis: AdvisorAnalysis = {
          insights: [
            {
              type: 'risk_alert',
              priority: 'high',
              title: 'High-Risk Student Intervention Required',
              description: `${engagementData.lowEngagementStudents} students show critical disengagement with dual risk factors.`,
              actionable_recommendations: [
                'Schedule mandatory advisor meetings within 48 hours',
                'Implement academic probation procedures',
                'Connect with academic support services'
              ],
              affected_students: engagementData.lowEngagementStudents,
              confidence: 0.9,
              decision_tree: {
                condition: 'IF student has <60% attendance AND <2.5 GPA',
                decision: 'immediate',
                next_steps: [
                  {
                    step: 1,
                    action: 'Contact student via phone and email for emergency meeting',
                    timeline: 'Within 24 hours',
                    responsible: 'Academic Advisor',
                    success_metric: 'Student responds and schedules meeting'
                  },
                  {
                    step: 2,
                    action: 'Assess personal/academic barriers in one-on-one meeting',
                    timeline: 'Within 48 hours',
                    responsible: 'Academic Advisor',
                    success_metric: 'Identify specific challenges and create action plan'
                  },
                  {
                    step: 3,
                    action: 'Connect with tutoring, counseling, or financial aid as needed',
                    timeline: 'Within 1 week',
                    responsible: 'Student Success Coordinator',
                    success_metric: 'Student enrolled in appropriate support services'
                  }
                ],
                expected_outcome: 'Improved attendance and GPA within 4 weeks'
              }
            },
            {
              type: 'intervention',
              priority: 'urgent',
              title: 'Missing Advisor Contact System Failure',
              description: `${engagementData.noAdvisorContact} students lack advisor engagement despite academic challenges.`,
              actionable_recommendations: [
                'Implement mandatory check-in system',
                'Train advisors on proactive outreach',
                'Create automated early warning alerts'
              ],
              affected_students: engagementData.noAdvisorContact,
              confidence: 0.85,
              decision_tree: {
                condition: 'IF student has 0 advisor meetings AND incomplete status',
                decision: 'urgent',
                next_steps: [
                  {
                    step: 1,
                    action: 'Send automated outreach email with meeting scheduler',
                    timeline: 'Within 2 hours',
                    responsible: 'Academic System',
                    success_metric: 'Email delivered and meeting scheduled'
                  },
                  {
                    step: 2,
                    action: 'Conduct initial advisor meeting to assess needs',
                    timeline: 'Within 1 week',
                    responsible: 'Academic Advisor',
                    success_metric: 'Complete academic progress review'
                  },
                  {
                    step: 3,
                    action: 'Establish regular meeting schedule (bi-weekly minimum)',
                    timeline: 'Ongoing',
                    responsible: 'Academic Advisor',
                    success_metric: 'Consistent advisor contact maintained'
                  }
                ],
                expected_outcome: 'Improved student retention and course completion'
              }
            }
          ],
          summary: `Critical engagement issues require immediate action. ${engagementData.lowEngagementStudents} students need emergency intervention, while ${engagementData.noAdvisorContact} students require systematic advisor engagement.`,
          timestamp: new Date(),
          immediate_actions: engagementData.lowEngagementStudents,
          urgent_actions: engagementData.noAdvisorContact
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

  const markActionCompleted = (insightIndex: number, stepIndex: number) => {
    const actionId = `${insightIndex}-${stepIndex}`;
    setCompletedActions(prev => new Set([...prev, actionId]));
    toast({
      title: "Action Marked Complete",
      description: "Great job! Keep track of outcomes for continuous improvement."
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'immediate': return 'bg-red-600 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-black';
      case 'monitor': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
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
                Enter your OpenAI API key to enable AI-powered engagement analysis with clear decision trees and next steps
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
                <div className="text-sm text-gray-600">Immediate Action Needed</div>
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
                <div className="text-sm text-gray-600">Urgent Outreach Required</div>
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
                <div className="text-sm text-gray-600">Support Strategy Review</div>
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
                <div className="text-sm text-gray-600">Academic Planning Needed</div>
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
                Generating Decision Trees & Action Plans...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Generate Structured Decision Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary with Action Counts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Decision Analysis Summary</span>
                <div className="flex space-x-2">
                  <Badge className="bg-red-500 text-white">
                    {analysis.immediate_actions} Immediate
                  </Badge>
                  <Badge className="bg-orange-500 text-white">
                    {analysis.urgent_actions} Urgent
                  </Badge>
                </div>
              </CardTitle>
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

          {/* Decision Trees & Action Plans */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Decision Trees & Action Plans</h3>
            {analysis.insights.map((insight, insightIndex) => (
              <Card key={insightIndex} className="border-l-4" style={{ borderLeftColor: insight.priority === 'high' ? '#ef4444' : insight.priority === 'medium' ? '#f59e0b' : '#10b981' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className={`${getPriorityColor(insight.priority)} text-white`}>
                          {insight.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge className={getDecisionColor(insight.decision_tree.decision)}>
                          {insight.decision_tree.decision.toUpperCase()} ACTION
                        </Badge>
                        <Badge variant="outline">
                          {insight.affected_students} students
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{insight.description}</p>
                  
                  {/* Decision Tree */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Decision Logic
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Condition:</strong> {insight.decision_tree.condition}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Expected Outcome:</strong> {insight.decision_tree.expected_outcome}
                    </p>
                  </div>

                  {/* Action Steps */}
                  <div>
                    <h4 className="font-semibold mb-3">Action Steps:</h4>
                    <div className="space-y-3">
                      {insight.decision_tree.next_steps.map((step, stepIndex) => {
                        const actionId = `${insightIndex}-${stepIndex}`;
                        const isCompleted = completedActions.has(actionId);
                        
                        return (
                          <div key={stepIndex} className={`border rounded-lg p-3 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline">Step {step.step}</Badge>
                                  <Badge className="bg-blue-100 text-blue-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {step.timeline}
                                  </Badge>
                                  {isCompleted && (
                                    <Badge className="bg-green-500 text-white">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium mb-1">{step.action}</p>
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Responsible:</strong> {step.responsible}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Success Metric:</strong> {step.success_metric}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant={isCompleted ? "secondary" : "default"}
                                onClick={() => markActionCompleted(insightIndex, stepIndex)}
                                disabled={isCompleted}
                                className="ml-4"
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Done
                                  </>
                                ) : (
                                  'Mark Complete'
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
