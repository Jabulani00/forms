import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PapersconfPage } from './papersconf.page';

const routes: Routes = [
  {
    path: '',
    component: PapersconfPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PapersconfPageRoutingModule {}
