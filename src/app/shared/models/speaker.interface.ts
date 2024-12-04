//speaker.interface.ts
import { BaseModel } from './base.interface';
import{Form} from './form.model';
export interface Speaker extends BaseModel {
  userId: string;
  name: string;
  bio: string;
  organization: string;
  photoUrl?: string;
  presentations: string[];
  expertise: string[];
  formId:Form[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}