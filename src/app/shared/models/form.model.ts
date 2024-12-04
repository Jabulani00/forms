import { Timestamp } from 'firebase/firestore';
import firebase from 'firebase/compat/app';
export type QuestionType =
  | 'text'
  | 'longText'
  | 'number'
  | 'multipleChoice'
  | 'trueOrFalse'
  | 'singleChoice'
  | 'fileUpload';

export interface FormOption {
  id: number;
  text: string;
}

export interface BaseQuestion {
  id: number;
  type: QuestionType;
  text: string;
  required: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text' | 'longText';
  maxLength?: number;
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  min?: number;
  max?: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multipleChoice';
  options: FormOption[];
  maxSelections?: number;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'singleChoice';
  options: FormOption[];
}

export interface TrueOrFalseQuestion extends BaseQuestion {
  type: 'trueOrFalse';
}

export interface FileUploadQuestion extends BaseQuestion {
  type: 'fileUpload';
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export type FormQuestion = 
  | TextQuestion 
  | NumberQuestion 
  | MultipleChoiceQuestion 
  | SingleChoiceQuestion 
  | TrueOrFalseQuestion 
  | FileUploadQuestion;




export interface Form {
  id: string;
  title: string;
  description: string;
  isAuthor:boolean;
  isPaper:boolean;
  isSpeaker:boolean;
  questions: FormQuestion[];
  createdAt: firebase.firestore.Timestamp;
}


export interface FormResponseAnswer {
    questionId: number;
    answer: string | string[] | boolean | File | null;
    fileInfo?: {
      path: string;
      name: string;
      type: string;
      size: number;
    };
  }
export interface FormResponse {
  id: string;
  formId: string;
  userId?: string;
  answers: FormResponseAnswer[];
  submittedAt: Timestamp;
  status: 'draft' | 'submitted' | 'reviewed';
}

export function createForm(form: Omit<Form, 'id' | 'createdAt'>): Form {
  return {
    ...form,
    id: crypto.randomUUID(),
    createdAt: Timestamp.now(),
    questions: form.questions.map((q, index) => ({
      ...q,
      id: index + 1
    }))
  };
}

export function createFormResponse(
    formId: string, 
    answers: FormResponseAnswer[], 
    userId?: string | null
  ): FormResponse {
    return {
      id: crypto.randomUUID(),
      formId,
      ...(userId && userId.trim() !== '' ? { userId } : {}),
      answers,
      submittedAt: Timestamp.now(),
      status: 'submitted'
    };
  }
  
  export function updateFormResponse(
    existingResponse: FormResponse,
    newAnswers: FormResponseAnswer[],
    userId?: string | null
  ): FormResponse {
    return {
      ...existingResponse,
      answers: newAnswers,
      ...(userId && userId.trim() !== '' ? { userId } : {}),
      submittedAt: Timestamp.now(),
      status: 'submitted'
    };
  }