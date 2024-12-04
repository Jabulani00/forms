//base.interface.ts
import { Timestamp } from 'firebase/firestore';

export interface BaseModel {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface MetadataModel {
  status: string;
  version: number;
  isDeleted: boolean;
  lastModified: Timestamp;
}