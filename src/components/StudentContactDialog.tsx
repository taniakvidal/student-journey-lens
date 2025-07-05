
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentInfo {
  student_id: string;
  program: string;
  gpa: number;
  attendance: number;
  riskScore: number;
}

interface StudentContactDialogProps {
  trigger: React.ReactNode;
  student: StudentInfo;
}

export const StudentContactDialog: React.FC<StudentContactDialogProps> = ({ 
  trigger, 
  student 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'both'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(`Academic Support Check-in - ${student.program}`);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSendContact = async () => {
    if (!email.trim() && contactMethod !== 'phone') {
      toast({
        title: "Email Required",
        description: "Please enter the student's email address",
        variant: "destructive"
      });
      return;
    }

    if (!phone.trim() && contactMethod === 'phone') {
      toast({
        title: "Phone Required",
        description: "Please enter the student's phone number",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for the student",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('send-student-contact', {
        body: {
          student: student,
          contactMethod: contactMethod,
          email: email,
          phone: phone,
          subject: subject,
          message: message
        }
      });

      if (error) throw error;

      toast({
        title: "Contact Sent Successfully",
        description: `Outreach to student ${student.student_id} has been initiated`
      });

      setIsOpen(false);
      setEmail('');
      setPhone('');
      setMessage('');

    } catch (error) {
      console.error('Student contact error:', error);
      toast({
        title: "Failed to Send Contact",
        description: "There was an error reaching out to the student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'bg-red-500 text-white';
    if (score >= 0.4) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Contact Student</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Student Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Student ID: {student.student_id}</div>
            <Badge className={getRiskColor(student.riskScore)}>
              {student.riskScore >= 0.7 ? 'HIGH RISK' : student.riskScore >= 0.4 ? 'MEDIUM RISK' : 'LOW RISK'}
            </Badge>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Program: {student.program}</div>
            <div>GPA: {student.gpa.toFixed(2)} | Attendance: {(student.attendance * 100).toFixed(1)}%</div>
            <div>Risk Score: {(student.riskScore * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Contact Method Selection */}
          <div>
            <Label>Contact Method</Label>
            <div className="flex space-x-2 mt-2">
              <Button
                size="sm"
                variant={contactMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setContactMethod('email')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button
                size="sm"
                variant={contactMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => setContactMethod('phone')}
              >
                <Phone className="h-4 w-4 mr-1" />
                Phone
              </Button>
              <Button
                size="sm"
                variant={contactMethod === 'both' ? 'default' : 'outline'}
                onClick={() => setContactMethod('both')}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Both
              </Button>
            </div>
          </div>

          {/* Contact Details */}
          {(contactMethod === 'email' || contactMethod === 'both') && (
            <div>
              <Label htmlFor="email">Student Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {(contactMethod === 'phone' || contactMethod === 'both') && (
            <div>
              <Label htmlFor="phone">Student Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          {/* Subject (for email) */}
          {(contactMethod === 'email' || contactMethod === 'both') && (
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Message */}
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Hi [Student Name], I wanted to reach out regarding your academic progress..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendContact} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Contact
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
