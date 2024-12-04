//paper.interface.ts
import { BaseModel } from './base.interface';
import { Author } from './author.interface';
import { Review } from './review.interface';
import { Attachment } from './attachment.interface';
import { Speaker } from './speaker.interface';
import{Form} from './form.model'; 
export interface Paper extends BaseModel {
  title: string;
  abstract: string;
  keywords: string[];
  authorIds: string[];
  presenterId:Speaker[];
  mainAuthor: Author;
  coAuthors: Author[];
  submissionType: SubmissionType;
  status: PaperStatus;
  reviewStatus: ReviewStatus;
  reviews: Review[];
  formId:Form[];
  attachments: Attachment[];
  presentationType: PresentationType;
  track?: string;
  sessionId?: string;
  documentUrl: string;
}

export type SubmissionType = 'full-paper' | 'abstract' | 'poster';
export type PaperStatus = 'draft' | 'submitted' | 'under-review' | 'accepted' | 'rejected';
export type ReviewStatus = 'pending' | 'in-progress' | 'completed';
export type PresentationType = 'oral' | 'poster' | 'virtual';