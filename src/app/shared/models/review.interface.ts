//review.interface.ts
import { BaseModel } from './base.interface';

export interface Review extends BaseModel {
  paperId: string;
  reviewerId: string;
  scores: {
    category: string;
    score: number;
    comment: string;
  }[];
  recommendation: ReviewRecommendation;
  comments: string;
  confidentialNotes?: string;
}

export type ReviewRecommendation = 'accept' | 'reject' | 'revise';