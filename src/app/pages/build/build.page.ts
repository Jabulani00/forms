import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { Form, FormQuestion, QuestionType } from 'src/app/shared/models/form.model'; // Adjust import path as needed
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-build',
  templateUrl: './build.page.html',
  styleUrls: ['./build.page.scss'],
})
export class BuildPage implements OnInit {
  formBuilder: FormGroup;
  questionsForm: FormArray;
  generatedLink: string | null = null;

  questionTypes: QuestionType[] = [
    'text', 
    'longText', 
    'number', 
    'multipleChoice', 
    'trueOrFalse', 
    'singleChoice', 
    'fileUpload'
  ];

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private alertController: AlertController
  ) {
    this.formBuilder = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      questions: this.fb.array([])
    });

    this.questionsForm = this.formBuilder.get('questions') as FormArray;
  }

  ngOnInit() {
    this.addQuestion();
  }

  addQuestion() {
    const questionGroup = this.fb.group({
      id: [this.questionsForm.length + 1],
      type: ['text', Validators.required],
      text: ['', Validators.required],
      required: [false],
      maxLength: [null],
      options: this.fb.array([])
    });

    this.questionsForm.push(questionGroup);
  }

  addOption(questionIndex: number) {
    const optionsArray = (this.questionsForm.at(questionIndex).get('options') as FormArray);
    const optionGroup = this.fb.group({
      id: [optionsArray.length + 1],
      text: ['', Validators.required]
    });

    optionsArray.push(optionGroup);
  }

  removeQuestion(index: number) {
    this.questionsForm.removeAt(index);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const optionsArray = (this.questionsForm.at(questionIndex).get('options') as FormArray);
    optionsArray.removeAt(optionIndex);
  }

  generateCustomId(title: string): string {
    // Convert title to a URL-friendly slug
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-')  // Replace spaces, underscores, multiple dashes with single dash
      .replace(/^-+|-+$/g, '');  // Remove leading/trailing dashes

    // Add a random string to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    
    return `${slug}-${randomSuffix}`;
  }

  async createForm() {
    if (this.formBuilder.invalid) {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const formData = this.formBuilder.value;
    
    try {
      // Generate custom ID based on form title
      const customId = this.generateCustomId(formData.title);

      // Prepare form data according to the Form interface
      const formToCreate: Form = {
        id: customId, // Use the custom generated ID
        title: formData.title,
        description: formData.description,
        questions: formData.questions.map((q: any) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          required: q.required,
          ...(q.maxLength && { maxLength: q.maxLength }),
          ...(q.options && { options: q.options })
        })),
        createdAt: firebase.firestore.Timestamp.now()
      };

      // Create form in Firestore with the custom ID
      const formRef = await this.firestore.collection('forms').doc(customId).set(formToCreate);

      // Generate and set the link using the custom ID
      this.generatedLink = `http://localhost:8100/form/${customId}`;

      // Show success alert
      const alert = await this.alertController.create({
        header: 'Form Created',
        message: 'Your form has been successfully created!',
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      console.error('Error creating form:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to create form. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  getOptionsArray(questionIndex: number): FormArray {
    return this.questionsForm.at(questionIndex).get('options') as FormArray;
  }

  onQuestionTypeChange(questionIndex: number) {
    const questionGroup = this.questionsForm.at(questionIndex) as FormGroup;
    const typeControl = questionGroup.get('type');
    
    if (!typeControl) return;

    const type = typeControl.value;

    // Reset options based on question type
    if (type === 'multipleChoice' || type === 'singleChoice') {
      // Replace the entire 'options' control with a new FormArray
      questionGroup.setControl('options', this.fb.array([]));
      this.addOption(questionIndex);
    } else {
      // Remove the 'options' control if it exists
      if (questionGroup.contains('options')) {
        questionGroup.removeControl('options');
      }
    }
  }

  copyLink() {
    if (this.generatedLink) {
      navigator.clipboard.writeText(this.generatedLink).then(() => {
        this.presentCopyAlert();
      }).catch(err => {
        console.error('Failed to copy link: ', err);
      });
    }
  }

  async presentCopyAlert() {
    const alert = await this.alertController.create({
      header: 'Link Copied',
      message: 'Form link has been copied to clipboard.',
      buttons: ['OK']
    });
    await alert.present();
  }
}