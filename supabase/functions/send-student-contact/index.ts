
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  student: {
    student_id: string;
    program: string;
    gpa: number;
    attendance: number;
    riskScore: number;
  };
  contactMethod: 'email' | 'phone' | 'both';
  email?: string;
  phone?: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student, contactMethod, email, phone, subject, message }: ContactRequest = await req.json();

    console.log(`Initiating ${contactMethod} contact for student:`, student.student_id);

    // For now, we'll handle email contact. Phone contact would require SMS service integration
    if (contactMethod === 'email' || contactMethod === 'both') {
      if (!email) {
        throw new Error('Email address is required for email contact');
      }

      const htmlContent = generateStudentContactHTML({
        student,
        subject,
        message,
        contactMethod
      });

      const emailResponse = await resend.emails.send({
        from: "Academic Support <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: htmlContent,
      });

      console.log("Student contact email sent successfully:", emailResponse);
    }

    // Log the contact attempt (in a real system, you'd save this to a database)
    console.log(`Contact attempt logged for student ${student.student_id}:`, {
      method: contactMethod,
      timestamp: new Date().toISOString(),
      riskScore: student.riskScore
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Contact initiated via ${contactMethod}`,
      student_id: student.student_id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending student contact:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateStudentContactHTML(data: any): string {
  const { student, subject, message, contactMethod } = data;
  
  const riskLevel = student.riskScore >= 0.7 ? 'High Risk' : 
                   student.riskScore >= 0.4 ? 'Medium Risk' : 'Low Risk';
  const riskColor = student.riskScore >= 0.7 ? '#ef4444' : 
                   student.riskScore >= 0.4 ? '#f59e0b' : '#10b981';

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Academic Support Outreach</h1>
            <p style="margin: 10px 0 0 0; color: #64748b;">From your Academic Success Team</p>
          </div>

          <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
          </div>

          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #334155;">Academic Status Summary</h3>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="background: ${riskColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px;">
                ${riskLevel.toUpperCase()}
              </span>
              <span style="color: #64748b;">Risk Assessment</span>
            </div>
            <div style="font-size: 14px; color: #64748b;">
              <p><strong>Program:</strong> ${student.program}</p>
              <p><strong>Current GPA:</strong> ${student.gpa.toFixed(2)}</p>
              <p><strong>Attendance Rate:</strong> ${(student.attendance * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div style="background: #fef7ed; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; color: #92400e;">Next Steps</h4>
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              Please reply to this email or contact your academic advisor to schedule a meeting. 
              We're here to support your academic success and help you overcome any challenges you may be facing.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p>This message was sent as part of our proactive student success program.</p>
            <p>If you have questions, please contact your academic advisor or student support services.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
