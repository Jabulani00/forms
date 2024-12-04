//attachment.interface.ts
import { Timestamp } from 'firebase/firestore';

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Timestamp;
  size: number;
}