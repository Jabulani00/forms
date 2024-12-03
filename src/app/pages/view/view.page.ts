import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { 
  FormResponse, 
  Form,
  FormResponseAnswer
} from 'src/app/shared/models/form.model';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
interface EnhancedFormResponse extends FormResponse {
  formTitle: string;
}

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
})
export class ViewPage implements OnInit {
  formResponses$: Observable<EnhancedFormResponse[]> = of([]);
  forms: { [key: string]: Form } = {};
  selectedResponse: EnhancedFormResponse | null = null;

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadFormResponses();
  }

  async loadFormResponses() {
    const loading = await this.loadingController.create({
      message: 'Loading responses...'
    });
    await loading.present();

    try {
      // Fetch all forms
      const formsSnapshot = await this.firestore.collection<Form>('forms').get().toPromise();
      
      // Safely handle the snapshot
      if (formsSnapshot) {
        formsSnapshot.forEach(doc => {
          const form = doc.data();
          if (form) {
            this.forms[form.id] = form;
          }
        });
      }

      // Load form responses with form titles
      this.formResponses$ = this.firestore.collection<FormResponse>('form-responses')
        .snapshotChanges()
        .pipe(
          map(actions => actions.map(a => {
            const data = a.payload.doc.data() as FormResponse;
            return {
              ...data,
              formTitle: this.forms[data.formId]?.title || 'Unknown Form'
            } as EnhancedFormResponse;
          })),
          catchError(error => {
            console.error('Error loading form responses:', error);
            return of([]);
          })
        );
    } catch (error) {
      console.error('Error loading form responses:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Could not load form responses',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  viewResponseDetails(response: EnhancedFormResponse) {
    this.selectedResponse = response;
  }

  closeResponseDetails() {
    this.selectedResponse = null;
  }

  getQuestionText(questionId: number): string {
    if (!this.selectedResponse) return '';
    const form = this.forms[this.selectedResponse.formId];
    const question = form.questions.find(q => q.id === questionId);
    return question ? question.text : 'Unknown Question';
  }

  formatAnswer(answer: FormResponseAnswer): string {
    if (answer.answer === null) return 'No answer';
    if (typeof answer.answer === 'boolean') return answer.answer ? 'Yes' : 'No';
    if (Array.isArray(answer.answer)) return answer.answer.join(', ');
    
    // Check if it's a file upload
    if (answer.fileInfo) {
      return answer.fileInfo.name || 'Uploaded File';
    }
    
    return answer.answer as string;
  }
  async viewFile(fileInfo: any) {
    if (!fileInfo) return;
  
    const loading = await this.loadingController.create({
      message: 'Preparing file...'
    });
    await loading.present();
  
    try {
      // Get download URL for the file
      const fileRef = this.storage.ref(fileInfo.path);
      const downloadUrl = await fileRef.getDownloadURL().toPromise();
  
      // Open file in app using Ionic's built-in browser
      const browser = await Browser.open({
        url: downloadUrl,
        presentationStyle: 'fullscreen',
        toolbarColor: '#3880ff'
      });
  
    } catch (error) {
      console.error('Error viewing file:', error);
      
      const alert = await this.alertController.create({
        header: 'File Error',
        message: 'Could not open the file. Please try again later.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  async downloadFile(fileInfo: any) {
    if (!fileInfo) return;
  
    const loading = await this.loadingController.create({
      message: 'Preparing file...'
    });
    await loading.present();
  
    try {
      // Get download URL for the file
      const fileRef = this.storage.ref(fileInfo.path);
      const downloadUrl = await fileRef.getDownloadURL().toPromise();
  
      // Create a method to handle different file types
      this.openFileBasedOnType(downloadUrl, fileInfo);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      
      try {
        if (error.code === 'storage/object-not-found') {
          const alert = await this.alertController.create({
            header: 'File Not Found',
            message: 'The requested file could not be located. It may have been deleted.',
            buttons: ['OK']
          });
          await alert.present();
        } else {
          const alert = await this.alertController.create({
            header: 'Download Error',
            message: 'Could not access the file. Please try again later.',
            buttons: ['OK']
          });
          await alert.present();
        }
      } catch (alertError) {
        console.error('Error showing alert:', alertError);
      }
    } finally {
      await loading.dismiss();
    }
  }
  
  private openFileBasedOnType(downloadUrl: string, fileInfo: any) {
    // Supported file types for direct viewing in browser
    const viewableImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const viewablePdfTypes = ['application/pdf'];
  
    // Check if file can be viewed directly in browser
    if (viewableImageTypes.includes(fileInfo.type)) {
      // Open image in a new tab
      window.open(downloadUrl, '_blank');
    } else if (viewablePdfTypes.includes(fileInfo.type)) {
      // Open PDF in a new tab or browser's PDF viewer
      window.open(downloadUrl, '_blank');
    } else {
      // For other file types, trigger direct download
      this.triggerFileDownload(downloadUrl, fileInfo.name);
    }
  }
  
  private triggerFileDownload(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  isFileUpload(answer: FormResponseAnswer): boolean {
    return !!answer.fileInfo;
  }

  async deleteResponse(response: EnhancedFormResponse) {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this response?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            try {
              await this.firestore.collection('form-responses').doc(response.id).delete();
              this.presentToast('Response deleted successfully');
              this.selectedResponse = null;
            } catch (error) {
              console.error('Error deleting response:', error);
              this.presentToast('Failed to delete response');
            }
          }
        }
      ]
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
}