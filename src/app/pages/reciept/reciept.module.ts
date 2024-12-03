import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecieptPageRoutingModule } from './reciept-routing.module';

import { RecieptPage } from './reciept.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecieptPageRoutingModule
  ],
  declarations: [RecieptPage]
})
export class RecieptPageModule {}
