import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import firebase from 'firebase/compat/app';

import { User, UserRole } from '../../shared/models/user.interface';
import { Author } from '../../shared/models/author.interface';
import { Speaker } from '../../shared/models/speaker.interface';
import { Paper, SubmissionType, PresentationType } from '../../shared/models/paper.interface';

@Component({
  selector: 'app-papersconf',
  templateUrl: './papersconf.page.html',
  styleUrls: ['./papersconf.page.scss'],
})
export class PapersconfPage implements OnInit {
  // Use non-null assertion or definite initialization
  registrationForm!: FormGroup;
  
  userRoles: UserRole[] = ['author', 'speaker', 'delegate', 'reviewer'];
  submissionTypes: SubmissionType[] = ['full-paper', 'abstract', 'poster'];
  presentationTypes: PresentationType[] = ['oral', 'poster', 'virtual'];

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.registrationForm = this.fb.group({
      // User Details
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      organization: ['', Validators.required],
      phoneNumber: [''],
      role: ['', Validators.required],

      // Additional fields based on role
      authorDetails: this.fb.group({
        bio: [''],
        isPresenting: [false]
      }),

      speakerDetails: this.fb.group({
        bio: [''],
        expertise: [''],
        socialLinks: this.fb.group({
          linkedin: [''],
          twitter: [''],
          website: ['']
        })
      }),

      // Paper Details
      paperDetails: this.fb.group({
        title: [''],
        abstract: [''],
        keywords: [''],
        submissionType: [''],
        presentationType: ['']
      }),

      paperFile: [null]
    }, { validators: this.roleValidator });
  }

  // Role change handler
  roleChanged(event: any) {
    const role = event.detail.value;
    
    // Reset form sections based on role
    if (role === 'delegate') {
      this.registrationForm.get('authorDetails')?.reset();
      this.registrationForm.get('speakerDetails')?.reset();
      this.registrationForm.get('paperDetails')?.reset();
    }
  }

  // Custom validator to prevent role conflicts
  roleValidator(form: AbstractControl): {[key: string]: any} | null {
    if (!form) return null;

    const roleControl = form.get('role');
    const authorDetailsControl = form.get('authorDetails');
    const speakerDetailsControl = form.get('speakerDetails');

    if (!roleControl || !authorDetailsControl || !speakerDetailsControl) {
      return null;
    }

    const role = roleControl.value;
    const isPresenting = authorDetailsControl.get('isPresenting')?.value;

    if (role === 'delegate') {
      // Delegate cannot have author or speaker details
      if (authorDetailsControl.value || speakerDetailsControl.value) {
        return { roleConflict: true };
      }
    }

    if (role === 'author' && isPresenting) {
      // If author is presenting, they become a speaker
      roleControl.setValue('speaker');
    }

    return null;
  }

  async onSubmit() {
    if (this.registrationForm.invalid) {
      return;
    }

    try {
      // Authenticate user
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        this.registrationForm.value.email, 
        this.generateTemporaryPassword()
      );

      // Safely unwrap user
      const user = userCredential.user;
      if (!user) {
        throw new Error('User creation failed');
      }

      const userId = user.uid;
      const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();

      // Save user details
      const userData: User = {
        id: userId,
        email: this.registrationForm.value.email,
        firstName: this.registrationForm.value.firstName,
        lastName: this.registrationForm.value.lastName,
        role: this.registrationForm.value.role,
        organization: this.registrationForm.value.organization,
        phoneNumber: this.registrationForm.value.phoneNumber,
        authorIds: [],
        presenterId: [],
        formId: [],
        preferences: {
          notifications: {
            email: true,
            push: false,
            sms: false
          },
          timezone: 'UTC',
          language: 'en'
        },
        registrationAttendance: false,
        createdAt: serverTimestamp as any,
        updatedAt: serverTimestamp as any,
        createdBy: userId,
        updatedBy: userId
      };

      // Save user to Firestore
      await this.firestore.collection('users').doc(userId).set(userData);

      // Handle Author Creation
      if (this.registrationForm.value.role === 'author') {
        const authorData: Author = {
          id: this.firestore.createId(),
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          organization: userData.organization,
          title: '', // Add title if available in form
          bio: this.registrationForm.value.authorDetails?.bio || '',
          isPresenting: this.registrationForm.value.authorDetails?.isPresenting || false,
          formId: []
        };

        await this.firestore.collection('authors').add(authorData);
      }

      // Handle Speaker Creation
      if (this.registrationForm.value.role === 'speaker') {
        const speakerData: Speaker = {
          id: this.firestore.createId(),
          userId: userId,
          name: `${userData.firstName} ${userData.lastName}`,
          organization: userData.organization,
          bio: this.registrationForm.value.speakerDetails?.bio || '',
          expertise: this.registrationForm.value.speakerDetails?.expertise?.split(',') || [],
          socialLinks: this.registrationForm.value.speakerDetails?.socialLinks || {},
          presentations: [],
          formId: [],
          createdAt: serverTimestamp as any,
          updatedAt: serverTimestamp as any,
          createdBy: userId,
          updatedBy: userId
        };

        await this.firestore.collection('speakers').add(speakerData);
      }

      // Handle Paper Submission
      if (this.registrationForm.value.role === 'author' && 
          this.registrationForm.value.paperDetails?.title) {
        const paperFile = this.registrationForm.get('paperFile')?.value;
        let documentUrl = '';

        // Upload paper file to Firebase Storage
        if (paperFile) {
          const filePath = `papers/${userId}/${paperFile.name}`;
          const fileRef = this.storage.ref(filePath);
          const uploadTask = await fileRef.put(paperFile);
          documentUrl = await uploadTask.ref.getDownloadURL();
        }

        const paperData: Paper = {
          id: this.firestore.createId(),
          title: this.registrationForm.value.paperDetails.title,
          abstract: this.registrationForm.value.paperDetails.abstract || '',
          keywords: this.registrationForm.value.paperDetails.keywords?.split(',') || [],
          authorIds: [userId],
          mainAuthor: {
            id: userId,
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            organization: userData.organization,
            title: '',
            bio: '',
            isPresenting: false,
            formId: []
          },
          coAuthors: [],
          submissionType: this.registrationForm.value.paperDetails.submissionType,
          presentationType: this.registrationForm.value.paperDetails.presentationType,
          status: 'draft',
          reviewStatus: 'pending',
          reviews: [],
          presenterId: [],
          formId: [],
          attachments: [],
          documentUrl: documentUrl,
          createdAt: serverTimestamp as any,
          updatedAt: serverTimestamp as any,
          createdBy: userId,
          updatedBy: userId
        };

        await this.firestore.collection('papers').add(paperData);
      }

      // Reset form after successful submission
      this.registrationForm.reset();
    } catch (error) {
      console.error('Registration Error:', error);
      // Handle error (show toast, alert, etc.)
    }
  }

  // Generate a temporary password for initial user creation
  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  // Method to handle file upload
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.registrationForm.get('paperFile')?.setValue(file);
  }
}