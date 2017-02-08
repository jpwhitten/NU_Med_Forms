import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, Platform, AlertController } from 'ionic-angular';
import { Http, Headers, Jsonp } from '@angular/http';
import { Form } from '../../providers/form';
import { Question } from '../../providers/question';
import { ChoiceValues } from '../../providers/choice-values';
import { Storage } from '@ionic/storage';
import { Data } from '../../providers/data';
import { FormViewPage } from '../form-view/form-view'
import { Network } from "ionic-native";
import { Restrictions } from '../../providers/restrictions'
import { ConnectionService } from '../../providers/connection-service'
import { FormService } from '../../providers/form-service'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  forms: Form[] = [];
  local: Storage;
  items: any;
  questionItems: any;
  savedForms: any = false;
  public SERVER_NUMBER = '8014';
  hasFailed = false;
  retry: number = 0;
  RETRY_MAX = 10;
  queuedForm: Form;


  constructor(public navCtrl: NavController,
    public platform: Platform,
    private chRef: ChangeDetectorRef,
    public nav: NavController,
    private http: Http,
    public dataService: Data,
    private navParams: NavParams,
    private alertController: AlertController,
    private connectionService: ConnectionService,
    public formService: FormService) {

    this.connectionService.connectionService.subscribe(() => {
      chRef.detectChanges();
      console.log("changes");
    })

    platform.ready().then(() => {


    })

  }

  viewForm(form): void {

    this.nav.push(FormViewPage, {
      form: form
    });

    this.save();

  }
  
  save(): void {
    this.dataService.saveFormsData(this.forms);
  }

}
