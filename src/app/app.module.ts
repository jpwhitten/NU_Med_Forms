import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { Storage } from '@ionic/storage'
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { Data } from '../providers/data';
import { FormViewPage } from '../pages/form-view/form-view';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    FormViewPage
  ],
  imports: [
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    FormViewPage
  ],
  providers: [Storage, Data]
})
export class AppModule {}
