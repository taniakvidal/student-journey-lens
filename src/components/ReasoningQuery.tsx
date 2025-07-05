import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, MessageCircle } from "lucide-react";
import { ProcessedData } from "@/types/student";
import { useToast } from "@/hooks/use-toast";
import { EmailShareDialog } from "@/components/EmailShareDialog";

interface ReasoningQueryProps {
  data: ProcessedData;
}

interface QueryResult {
  query: string;
  response: string;
  timestamp: Date;
  reasoning_type: string;
}

export const ReasoningQuery: React.FC<ReasoningQueryProps> = ({ data }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const exampleQueries = [
    {
      type: "Multi-hop Reasoning",
      query: "Which students who have high attendance rates (>80%) and frequent advisor meetings (>3) still show completion rates below 60%? What patterns emerge?",
      color: "bg-blue-500"
    },
    {
      type: "Causal Inference", 
      query: "Does meeting more frequently with advisors causally improve GPA or reduce drop-out risk for students with initial GPA below 2.5?",
      color: "bg-green-500"
    },
    {
      type: "Conditional Aggregation",
      query: "Among students with high attendance rates (>85%), which programs still show low course completion rates (<70%)?",
      color: "bg-purple-500"
    },
    {
      type: "Exception Reasoning",
      query: "Which students maintain above-average GPAs (>3.0) despite having high support ticket counts (>5) or low attendance (<70%)?",
      color: "bg-yellow-500"
    },
    {
      type: "Temporal Trend",
      query: "What patterns emerge when analyzing the progression from enrollment to completion across different time periods in the data?",
      color: "bg-red-500"
    }
  ];

  const generateDataSummary = () => {
    const { students, summary, riskScores } = data;
    
    // Generate statistical summary for AI context
    const programs = [...new Set(students.map(s => s.program))];
    const avgGPA = summary.averageGPA;
    const avgAttendance = summary.averageAttendance;
    const highRiskStudents = Array.from(riskScores.entries()).filter(([_, score]) => score >= 0.7).length;
    
    return {
      totalStudents: summary.totalStudents,
      programs: programs,
      completionRate: summary.completionRate,
      dropoutRate: summary.dropoutRate,
      averageGPA: avgGPA,
      averageAttendance: avgAttendance,
      highRiskCount: highRiskStudents,
      sampleData: students.slice(0, 5).map(s => ({
        student_id: s.student_id,
        program: s.program,
        gpa: s.gpa_at_time,
        attendance: s.attendance_rate,
        completion_status: s.completion_status,
        advisor_meetings: s.advisor_meeting_count,
        support_tickets: s.support_ticket_count
      }))
    };
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a reasoning query",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const dataSummary = generateDataSummary();
      
      const systemPrompt = `You are an advanced AI analyst specializing in educational data analysis. You have access to student journey data with the following summary:

Total Students: ${dataSummary.totalStudents}
Programs: ${dataSummary.programs.join(', ')}
Overall Completion Rate: ${dataSummary.completionRate.toFixed(1)}%
Overall Dropout Rate: ${dataSummary.dropoutRate.toFixed(1)}%
Average GPA: ${dataSummary.averageGPA.toFixed(2)}
Average Attendance: ${(dataSummary.averageAttendance * 100).toFixed(1)}%
High Risk Students: ${dataSummary.highRiskCount}

Sample data points: ${JSON.stringify(dataSummary.sampleData, null, 2)}

Use advanced reasoning to analyze patterns, identify causal relationships, and provide actionable insights. Focus on:
1. Statistical relationships and correlations
2. Potential causal factors
3. Outliers and exceptions
4. Predictive indicators
5. Actionable recommendations

Be specific about confidence levels and acknowledge limitations in the analysis.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'o1-2025-04-16', // Using o1 model for reasoning
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: query
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
      const aiResponse = result.choices[0]?.message?.content || 'No response generated';

      const newResult: QueryResult = {
        query,
        response: aiResponse,
        timestamp: new Date(),
        reasoning_type: detectReasoningType(query)
      };

      setResults(prev => [newResult, ...prev]);
      setQuery('');
      
      toast({
        title: "Analysis Complete",
        description: "AI reasoning analysis has been generated"
      });

    } catch (error) {
      console.error('Query error:', error);
      toast({
        title: "Query Failed",
        description: "Failed to process reasoning query. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const detectReasoningType = (query: string): string => {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('causal') || queryLower.includes('cause')) return 'Causal Inference';
    if (queryLower.includes('among') || queryLower.includes('conditional')) return 'Conditional Analysis';
    if (queryLower.includes('despite') || queryLower.includes('exception')) return 'Exception Reasoning';
    if (queryLower.includes('trend') || queryLower.includes('time')) return 'Temporal Analysis';
    return 'Multi-hop Reasoning';
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="space-y-6">
      {/* API Key Input */}
      {!apiKey && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">OpenAI API Key Required</span>
              </div>
              <p className="text-sm text-yellow-700">
                Enter your OpenAI API key to enable AI-powered reasoning queries using o1/o3 models
              </p>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span>AI Reasoning Query</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask a complex reasoning question about student patterns, correlations, or predictive insights..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="min-h-[80px]"
          />
          <Button 
            onClick={handleQuery} 
            disabled={isLoading || !apiKey}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Example Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Example Reasoning Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleQueries.map((example, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                   onClick={() => handleExampleQuery(example.query)}>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={`${example.color} text-white`}>
                    {example.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{example.query}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI Analysis Results</h3>
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <Badge variant="outline">{result.reasoning_type}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EmailShareDialog
                      trigger={
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Email Results
                        </Button>
                      }
                      type="reasoning"
                      data={result}
                      defaultSubject={`AI Reasoning Analysis: ${result.reasoning_type}`}
                    />
                    <span className="text-sm text-gray-500">
                      {result.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium bg-blue-50 p-3 rounded">
                  {result.query}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {result.response}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
