//user.interface.ts
import { BaseModel } from './base.interface';
import { Timestamp } from 'firebase/firestore';
import { Speaker } from './speaker.interface'; 
import{Form} from './form.model';
export interface User extends BaseModel {
  email: string;
  firstName: string;
  lastName: string;
  authorIds: string[];
  presenterId:Speaker[];
  formId:Form[];
  role: UserRole;
  organization: string;
  phoneNumber: string;
  profileImage?: string;
  preferences: UserPreferences;
  registrationAttendance: boolean;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  timezone: string;
  language: string;
}

export type UserRole = 'admin' | 'reviewer' | 'author' | 'delegate' | 'speaker';

export interface NameTags {
  id: string;
  name: string;
  email: string;
  organization: string;
  title: string;
  userRole: UserRole; // Properly assign the UserRole type
  isPresenting: boolean; // Correct type usage
  qrCodeId: string; // Correct type usage
}