export type InterviewType = 'SCREENING' | 'TECHNICAL' | 'HR' | 'CLIENT_ROUND' | 'FINAL';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Interview {
  id: number;
  applicationId: number;
  application?: {
    id: number;
    job?: {
      id: number;
      title: string;
      description?: string;
      requirements?: string;
      experience?: string;
      skills?: string;
      location?: string | null;
      status?: string;
      employmentType?: string;
      organization?: {
        id: number;
        name: string;
      };
    };
    candidate?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    status?: string;
    vendor?: {
      id: number;
      name: string;
    };
  };
  interviewerId: number;
  interviewer?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role?: string;
    type?: string;
  };
  scheduledAt: string;
  durationMinutes: number;
  type: InterviewType;
  status: InterviewStatus;
  meetingLink: string;
  schedulingNotes?: string;
  ccUsers?: any[]; // Collection of User objects
  feedback?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleInterviewRequest {
  applicationId: number;
  interviewerId?: number;
  scheduledAt: string;
  durationMinutes: number;
  type: InterviewType;
  meetingLink?: string;
  ccUserIds?: number[];
  schedulingNotes?: string;
}
