
import React, { useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentData } from "@/types/student";
import { parseCSV } from "@/utils/dataProcessor";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onDataLoad: (data: StudentData[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad }) => {
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          toast({
            title: "No data found",
            description: "The CSV file appears to be empty or incorrectly formatted",
            variant: "destructive"
          });
          return;
        }

        onDataLoad(parsedData);
        toast({
          title: "Data loaded successfully",
          description: `Loaded ${parsedData.length} student records`
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: "Error parsing file",
          description: "Please check that your CSV file is properly formatted",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  }, [onDataLoad, toast]);

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <div className="space-y-4">
          <div className="text-gray-600">
            <p className="text-lg font-medium">Upload Student Data CSV</p>
            <p className="text-sm">Select a CSV file containing student journey data</p>
          </div>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <label htmlFor="csv-upload" className="cursor-pointer">
              Choose CSV File
            </label>
          </Button>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Required CSV Columns:</h3>
          <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
            <div>• student_id</div>
            <div>• program</div>
            <div>• enrollment_date</div>
            <div>• registration_date</div>
            <div>• course_id</div>
            <div>• course_name</div>
            <div>• course_category</div>
            <div>• course_start_date</div>
            <div>• course_end_date</div>
            <div>• grade</div>
            <div>• completion_status</div>
            <div>• attendance_rate</div>
            <div>• advisor_id</div>
            <div>• advisor_meeting_count</div>
            <div>• support_ticket_count</div>
            <div>• gpa_at_time</div>
            <div>• credits_earned</div>
            <div>• total_credits_required</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
