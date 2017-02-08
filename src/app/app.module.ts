import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { FormViewPage } from '../pages/form-view/form-view';
import { SignaturePadModule } from 'angular2-signaturepad'
import { Data } from '../providers/data';
import { FormService } from '../providers/form-service';
import { ConnectionService } from '../providers/connection-service';
import { Storage } from '@ionic/storage';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    FormViewPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    SignaturePadModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    FormViewPage
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}, Data, Storage, FormService, ConnectionService]
})
export class AppModule {}
