import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PapersconfPageRoutingModule } from './papersconf-routing.module';

import { PapersconfPage } from './papersconf.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PapersconfPageRoutingModule
  ],
  declarations: [PapersconfPage]
})
export class PapersconfPageModule {}
