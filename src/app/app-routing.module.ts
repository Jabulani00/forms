import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'message/:id',
    loadChildren: () => import('./view-message/view-message.module').then( m => m.ViewMessagePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'build',
    loadChildren: () => import('./pages/build/build.module').then(m => m.BuildPageModule)
  },
  {
    path: 'form/:formId',
    loadChildren: () => import('./pages/form/form.module').then(m => m.FormPageModule)
  },
  {
    path: 'view',
    loadChildren: () => import('./pages/view/view.module').then(m => m.ViewPageModule)
  },
  {
    path: 'reciept',
    loadChildren: () => import('./pages/reciept/reciept.module').then( m => m.RecieptPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
