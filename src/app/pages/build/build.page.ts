import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { Form, FormQuestion, QuestionType, TextQuestion, MultipleChoiceQuestion } from 'src/app/shared/models/form.model';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-build',
  templateUrl: './build.page.html',
  styleUrls: ['./build.page.scss'],
})
export class BuildPage implements OnInit {
  formBuilder: FormGroup;
  questionsForm: FormArray;
  generatedLink: string | null = null;
  forms$: Observable<Form[]>;
  questionTypes: QuestionType[] = [
    'text', 
    'longText', 
    'number', 
    'multipleChoice', 
    'trueOrFalse', 
    'singleChoice', 
    'fileUpload'
  ];
  isEditMode = false;
  editingFormId: string | null = null;
  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private alertController: AlertController
  ) {
    this.formBuilder = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      isAuthor: [false],
      isPaper: [false],
      isSpeaker: [false],
      questions: this.fb.array([])
    });
  
    this.questionsForm = this.formBuilder.get('questions') as FormArray;
    this.forms$ = this.firestore.collection<Form>('forms', ref => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'docId' });
  }


  fetchForms() {
    this.forms$ = this.firestore.collection<Form>('forms', ref => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'docId' });
  }

  async deleteForm(formId: string) {
    try {
      const alert = await this.alertController.create({
        header: 'Confirm Deletion',
        message: 'Are you sure you want to delete this form?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            handler: async () => {
              // Use delete() method directly
              await this.firestore.collection('forms').doc(formId).delete();
              
              const deleteAlert = await this.alertController.create({
                header: 'Form Deleted',
                message: 'The form has been successfully deleted.',
                buttons: ['OK']
              });
              await deleteAlert.present();

              // Optional: Refresh forms list after deletion
              this.fetchForms();
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Error deleting form:', error);
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to delete the form. Please try again.',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  editForm(form: Form) {
    this.isEditMode = true;
    this.editingFormId = form.id;  // Preserve the original form ID

    // Existing edit logic
    this.formBuilder.patchValue({
      title: form.title,
      description: form.description,
      isAuthor: form.isAuthor,
      isPaper: form.isPaper,
      isSpeaker: form.isSpeaker
    });

    // Clear existing questions
    while (this.questionsForm.length !== 0) {
      this.questionsForm.removeAt(0);
    }

    // Repopulate questions
    form.questions.forEach(question => {
      const baseQuestionGroup = {
        id: question.id,
        type: question.type,
        text: question.text,
        required: question.required
      };

      let additionalControls: any = {};

      switch (question.type) {
        case 'text':
        case 'longText':
          const textQuestion = question as TextQuestion;
          additionalControls = {
            maxLength: textQuestion.maxLength || null
          };
          break;
        case 'multipleChoice':
        case 'singleChoice':
          const multiChoiceQuestion = question as MultipleChoiceQuestion;
          additionalControls = {
            options: this.fb.array(
              multiChoiceQuestion.options?.map(opt => 
                this.fb.group({
                  id: opt.id,
                  text: opt.text
                })
              ) || []
            )
          };
          break;
      }

      const questionGroup = this.fb.group({
        ...baseQuestionGroup,
        ...additionalControls
      });

      this.questionsForm.push(questionGroup);
    });
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
      // Use the existing ID when in edit mode
      const customId = this.isEditMode && this.editingFormId 
        ? this.editingFormId 
        : this.generateCustomId(formData.title);

      const formToCreate: Form = {
        id: customId,
        title: formData.title,
        description: formData.description,
        isAuthor: formData.isAuthor,
        isPaper: formData.isPaper,
        isSpeaker: formData.isSpeaker,
        questions: formData.questions.map((q: any) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          required: q.required,
          ...(q.maxLength && { maxLength: q.maxLength }),
          ...(q.options && { options: q.options })
        })),
        createdAt: this.isEditMode 
          ? (this.formBuilder.value.createdAt || firebase.firestore.Timestamp.now())
          : firebase.firestore.Timestamp.now()
      };

      // Update or create the form using the consistent ID
      await this.firestore.collection('forms').doc(customId).set(formToCreate, { merge: true });

      // Generate link using the consistent ID
      this.generatedLink = `http://localhost:8100/form/${customId}`;

      const alertMessage = this.isEditMode 
        ? 'Your form has been successfully updated!' 
        : 'Your form has been successfully created!';

      const alert = await this.alertController.create({
        header: this.isEditMode ? 'Form Updated' : 'Form Created',
        message: alertMessage,
        buttons: ['OK']
      });
      await alert.present();

      // Reset form state
      this.isEditMode = false;
      this.editingFormId = null;
      this.formBuilder.reset();
      while (this.questionsForm.length !== 0) {
        this.questionsForm.removeAt(0);
      }
      this.addQuestion();

      // Refresh forms list
      this.fetchForms();
    } catch (error) {
      console.error('Error creating/updating form:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to create/update form. Please try again.',
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