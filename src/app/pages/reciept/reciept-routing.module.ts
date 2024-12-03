import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecieptPage } from './reciept.page';

const routes: Routes = [
  {
    path: '',
    component: RecieptPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecieptPageRoutingModule {}
