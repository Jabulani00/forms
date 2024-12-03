import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { AngularFirestore, DocumentSnapshot } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { 
  Form, 
  FormQuestion, 
  FormResponse, 
  FormResponseAnswer, 
  MultipleChoiceQuestion, 
  SingleChoiceQuestion,
  NumberQuestion,
  FileUploadQuestion,
  TextQuestion, // Add this import
  createFormResponse, 
  updateFormResponse 
} from 'src/app/shared/models/form.model';

import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {
  formId: string | null = null;
  formDetails: Form | null = null;
  responseForm: FormGroup;
  existingResponseId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.responseForm = this.fb.group({
      responseId: [''],
      answers: this.fb.array([])
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.formId = params.get('formId');
      if (this.formId) {
        this.loadFormDetails();
      }
    });
  }
  prepareResponseData(): FormResponseAnswer[] {
    return this.responseForm.get('answers')?.value.map((answerData: any) => {
      // Handle different types of answers
      let processedAnswer = answerData.answer;
  
      // If it's a file upload, ensure we're storing the file metadata
      if (this.formDetails?.questions[answerData.questionId - 1]?.type === 'fileUpload') {
        processedAnswer = answerData.answer?.path ? answerData.answer : null;
      }
  
      return {
        questionId: answerData.questionId,
        answer: processedAnswer,
        ...(answerData.answer?.path && { 
          fileInfo: {
            path: answerData.answer.path,
            name: answerData.answer.name,
            type: answerData.answer.type,
            size: answerData.answer.size
          }
        })
      };
    });
  }
 
  createQuestionControl(question: FormQuestion): FormGroup {
    const initialValue = this.getInitialAnswerValue(question);
    
    const control = this.fb.group({
      questionId: [question.id],
      answer: [
        initialValue,
        this.getValidators(question)
      ]
    });
  
    return control;
  }
  
  private getInitialAnswerValue(question: FormQuestion): any {
    switch (question.type) {
      case 'multipleChoice':
        return [];
      case 'singleChoice':
        return null;
      case 'trueOrFalse':
        return null;
        case 'fileUpload':
          return null; // or { path: null, name: null, type: null, size: null }
      case 'text':
      case 'longText':
      case 'number':
      default:
        return null;
    }
  }
  
  private getValidators(question: FormQuestion) {
    const validators = [];
    
    if (question.required) {
      validators.push(Validators.required);
    }
  
    // Add type-specific validators
    switch (question.type) {
      case 'text':
      case 'longText':
        const textQuestion = question as TextQuestion;
        if (textQuestion.maxLength) {
          validators.push(Validators.maxLength(textQuestion.maxLength));
        }
        break;
      
      case 'number':
        const numberQuestion = question as NumberQuestion;
        if (numberQuestion.min !== undefined) {
          validators.push(Validators.min(numberQuestion.min));
        }
        if (numberQuestion.max !== undefined) {
          validators.push(Validators.max(numberQuestion.max));
        }
        break;
      
      case 'multipleChoice':
        const multipleChoiceQuestion = question as MultipleChoiceQuestion;
        if (multipleChoiceQuestion.maxSelections) {
          validators.push(this.maxSelectionsValidator(multipleChoiceQuestion.maxSelections));
        }
        break;
    }
  
    return validators;
  }
  
  // Custom validator for maximum selections in multiple choice
  private maxSelectionsValidator(max: number) {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value || !Array.isArray(control.value)) {
        return null;
      }
      return control.value.length > max ? {'maxSelections': {max}} : null;
    };
  }
 
 

    async loadFormDetails() {
    try {
      const formDoc = await this.firestore.collection('forms').doc(this.formId!).get().toPromise();
      
      // Null check for formDoc
      if (!formDoc || !formDoc.exists) {
        throw new Error('Form not found');
      }

      const data = formDoc.data();
      if (data) {
        this.formDetails = data as Form;
        this.initializeResponseForm();
      } else {
        throw new Error('Form data is empty');
      }
    } catch (error) {
      console.error('Error loading form details:', error);
      this.presentAlert('Error', 'Could not load form details');
    }
  }

  initializeResponseForm() {
    const answersArray = this.responseForm.get('answers') as FormArray;
    answersArray.clear();

    this.formDetails?.questions.forEach((question, index) => {
      const control = this.createQuestionControl(question);
      answersArray.push(control);
    });
  }

  isFileUpload(question: FormQuestion): boolean {
    return question.type === 'fileUpload';
  }

 

  async submitResponse() {
    if (this.responseForm.invalid) {
      await this.presentAlert('Invalid Form', 'Please fill in all required fields');
      return;
    }
  
    try {
      const answersArray = this.responseForm.get('answers') as FormArray;
      const processedAnswers: FormResponseAnswer[] = await Promise.all(
        answersArray.controls.map(async (control, index) => {
          const question = this.formDetails?.questions[index];
          const answer = control.get('answer')?.value;
  
          if (question?.type === 'fileUpload' && answer instanceof File) {
            return this.uploadFile(answer, question as FileUploadQuestion);
          }
  
          return {
            questionId: question?.id ?? 0,
            answer: answer
          };
        })
      );
  
      if (this.existingResponseId) {
        await this.updateExistingResponse(processedAnswers);
      } else {
        await this.createNewResponse(processedAnswers);
      }
  
      await this.presentToast('Response submitted successfully');
    } catch (error) {
      console.error('Error submitting response:', error);
      await this.presentAlert('Error', 'Failed to submit response');
    }
  }
  isFileUploadQuestion(question: FormQuestion): question is FileUploadQuestion {
    return question.type === 'fileUpload';
  }
  // In form.page.ts
getAcceptedFileTypes(question: FormQuestion): string {
  if (question.type === 'fileUpload') {
    const fileUploadQuestion = question as FileUploadQuestion;
    return fileUploadQuestion.allowedFileTypes?.join(',') || '';
  }
  return '';
}

  async createNewResponse(answers: FormResponseAnswer[]) {
    // If you have a way to get the current user's ID, pass it
    // Otherwise, pass null or omit it entirely
    const response = createFormResponse(this.formId!, answers, null);
    await this.firestore.collection('form-responses').doc(response.id).set(response);
    this.existingResponseId = response.id;
    this.responseForm.get('responseId')?.setValue(response.id);
  }
  

  async lookupResponse() {
    const responseId = this.responseForm.get('responseId')?.value;
    if (!responseId) {
      this.presentAlert('Error', 'Please enter a response ID');
      return;
    }

    try {
      const responseDoc = await this.firestore
        .collection('form-responses')
        .doc(responseId)
        .get()
        .toPromise();

      // Null and exists check
      if (!responseDoc || !responseDoc.exists) {
        this.presentAlert('Error', 'Response not found');
        return;
      }

      const response = responseDoc.data() as FormResponse;

      if (response && response.formId === this.formId) {
        this.existingResponseId = responseId;
        this.populateExistingResponse(response);
      } else {
        this.presentAlert('Error', 'Response not found or does not match this form');
      }
    } catch (error) {
      console.error('Error looking up response:', error);
      this.presentAlert('Error', 'Could not find response');
    }
  }

  populateExistingResponse(response: FormResponse) {
    const answersArray = this.responseForm.get('answers') as FormArray;
    
    response.answers.forEach(savedAnswer => {
      const matchingControl = answersArray.controls
        .find(control => control.get('questionId')?.value === savedAnswer.questionId);
      
      if (matchingControl) {
        matchingControl.get('answer')?.setValue(savedAnswer.answer);
      }
    });
  }
 
  getOptionsForQuestion(question: FormQuestion): any[] {
    if (
      question.type === 'multipleChoice' || 
      question.type === 'singleChoice'
    ) {
      return (question as MultipleChoiceQuestion | SingleChoiceQuestion).options || [];
    }
    return [];
  }

  isMultipleChoice(question: FormQuestion): boolean {
    return question.type === 'multipleChoice';
  }

  isSingleChoice(question: FormQuestion): boolean {
    return question.type === 'singleChoice';
  }

 
  
  

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000
    });
    toast.present();
  }

  async uploadFile(file: File, question: FileUploadQuestion): Promise<FormResponseAnswer> {
    try {
      // File size validation
      if (question.maxFileSize && file.size > question.maxFileSize) {
        await this.presentAlert('File Too Large', `File must be less than ${question.maxFileSize / 1024}KB`);
        throw new Error('File size exceeds limit');
      }
  
      // File type validation
      if (question.allowedFileTypes && 
          !question.allowedFileTypes.includes(file.type)) {
        await this.presentAlert('Invalid File Type', 'Unsupported file type');
        throw new Error('Invalid file type');
      }
  
      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `form-uploads/${this.formId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      // Firebase storage upload
      const storageRef = firebase.storage().ref(uniqueFileName);
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();
      
      return {
        questionId: question.id,
        answer: downloadURL,
        fileInfo: {
          path: uniqueFileName,
          name: file.name,
          type: file.type,
          size: file.size
        }
      };
    } catch (error) {
      console.error('File upload error:', error);
      await this.presentAlert('Upload Error', 'Failed to upload file');
      throw error;
    }
  }
  
  async deleteExistingFile(existingAnswer: FormResponseAnswer): Promise<void> {
    try {
      if (!existingAnswer.fileInfo?.path) return;
  
      const fileRef = firebase.storage().ref(existingAnswer.fileInfo.path);
      await fileRef.delete();
    } catch (error: unknown) {
      console.error('File deletion error:', error);
      
      // Type-safe error checking
      if (error instanceof Error) {
        const storageError = error as { code?: string };
        if (storageError.code === 'storage/object-not-found') {
          console.log('File already deleted or does not exist');
        }
      }
    }
  }


 
  
  async updateExistingResponse(answers: FormResponseAnswer[]) {
    if (!this.existingResponseId) return;
  
    try {
      const existingResponseDoc = await this.firestore
        .collection('form-responses')
        .doc(this.existingResponseId)
        .get()
        .toPromise();
  
      if (!existingResponseDoc || !existingResponseDoc.exists) {
        throw new Error('Response not found');
      }
  
      const existingResponse = existingResponseDoc.data() as FormResponse;
  
      // Process each answer
      const processedAnswers = await Promise.all(answers.map(async (newAnswer) => {
        // Find the corresponding question
        const correspondingQuestion = this.formDetails?.questions.find(
          q => q.id === newAnswer.questionId
        ) as FileUploadQuestion;
  
        // If it's a file upload and a new file is provided
        if (correspondingQuestion?.type === 'fileUpload' && newAnswer.answer instanceof File) {
          // Find the existing answer for this question
          const existingAnswer = existingResponse.answers.find(
            a => a.questionId === newAnswer.questionId
          );
  
          // Delete existing file if it exists
          if (existingAnswer?.fileInfo) {
            await this.deleteExistingFile(existingAnswer);
          }
  
          // Upload new file
          return this.uploadFile(newAnswer.answer, correspondingQuestion);
        }
  
        // For non-file uploads, return the answer as-is
        return newAnswer;
      }));
  
      const updatedResponse = updateFormResponse(existingResponse, processedAnswers);
  
      await this.firestore
        .collection('form-responses')
        .doc(this.existingResponseId)
        .update(updatedResponse);
    } catch (error) {
      console.error('Error updating response:', error);
      this.presentAlert('Error', 'Failed to update response');
      throw error;
    }
  }
  
  // Modify onFileSelected to work with the new approach
  onFileSelected(event: Event, questionIndex: number) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const answersArray = this.responseForm.get('answers') as FormArray;
      const questionControl = answersArray.at(questionIndex);
      
      const question = this.formDetails?.questions[questionIndex] as FileUploadQuestion;
      if (question?.type === 'fileUpload') {
        // Directly set the File object
        questionControl.get('answer')?.setValue(file);
      }
    }
  }
}