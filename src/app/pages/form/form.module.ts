import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { FormPageRoutingModule } from './form-routing.module';
import { FormPage } from './form.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [FormPage]
})
export class FormPageModule {}