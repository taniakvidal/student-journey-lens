
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: 'advisor' | 'reasoning';
  subject: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, subject, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} analysis email to:`, to);

    let htmlContent = '';
    
    if (type === 'advisor') {
      htmlContent = generateAdvisorEmailHTML(data);
    } else if (type === 'reasoning') {
      htmlContent = generateReasoningEmailHTML(data);
    }

    const emailResponse = await resend.emails.send({
      from: "Student Analytics <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateAdvisorEmailHTML(analysis: any): string {
  const { summary, insights, immediate_actions, urgent_actions, timestamp } = analysis;
  
  let insightsHTML = '';
  insights.forEach((insight: any, index: number) => {
    const priorityColor = insight.priority === 'high' ? '#ef4444' : 
                         insight.priority === 'medium' ? '#f59e0b' : '#10b981';
    
    let stepsHTML = '';
    insight.decision_tree.next_steps.forEach((step: any) => {
      stepsHTML += `
        <div style="margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px;">
          <strong>Step ${step.step}:</strong> ${step.action}<br>
          <small><strong>Timeline:</strong> ${step.timeline} | <strong>Responsible:</strong> ${step.responsible}</small><br>
          <small><strong>Success Metric:</strong> ${step.success_metric}</small>
        </div>
      `;
    });

    insightsHTML += `
      <div style="margin: 20px 0; border-left: 4px solid ${priorityColor}; padding: 15px;">
        <h3 style="color: ${priorityColor}; margin: 0 0 10px 0;">${insight.title}</h3>
        <p><strong>Priority:</strong> ${insight.priority.toUpperCase()}</p>
        <p><strong>Affected Students:</strong> ${insight.affected_students}</p>
        <p>${insight.description}</p>
        <h4>Decision Logic:</h4>
        <p><strong>Condition:</strong> ${insight.decision_tree.condition}</p>
        <p><strong>Expected Outcome:</strong> ${insight.decision_tree.expected_outcome}</p>
        <h4>Action Steps:</h4>
        ${stepsHTML}
      </div>
    `;
  });

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Student Engagement Advisor Analysis</h1>
          <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2>Summary</h2>
            <p>${summary}</p>
            <p><strong>Priority Actions:</strong> ${immediate_actions} Immediate, ${urgent_actions} Urgent</p>
          </div>

          <h2>Detailed Insights & Action Plans</h2>
          ${insightsHTML}

          <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 5px;">
            <p><strong>Note:</strong> This analysis was generated using AI to help identify engagement patterns and provide actionable recommendations for student success.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateReasoningEmailHTML(data: any): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">AI Reasoning Analysis</h1>
          <p><strong>Generated:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2>Query</h2>
            <p style="font-style: italic;">"${data.query}"</p>
            <p><strong>Analysis Type:</strong> ${data.reasoning_type}</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 5px;">
            <h2>AI Analysis Results</h2>
            <div style="white-space: pre-wrap;">${data.response}</div>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 5px;">
            <p><strong>Note:</strong> This analysis was generated using advanced AI reasoning models to provide insights into student data patterns and relationships.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
