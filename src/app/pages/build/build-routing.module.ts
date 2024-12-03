import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BuildPage } from './build.page';

const routes: Routes = [
  {
    path: '',
    component: BuildPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BuildPageRoutingModule {}
