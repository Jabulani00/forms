import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { BuildPageRoutingModule } from './build-routing.module';
import { BuildPage } from './build.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    BuildPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [BuildPage]
})
export class BuildPageModule {}