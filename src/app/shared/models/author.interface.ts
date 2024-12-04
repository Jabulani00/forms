//author.interface.ts
import{Form} from './form.model';
export interface Author {
    id: string;
    name: string;
    email: string;
    organization: string;
    title: string;
    bio: string;
    formId:Form[];
    isPresenting: boolean;
  }