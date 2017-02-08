import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Platform } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { Network } from "ionic-native";
import { Observable } from 'rxjs/Observable';


/*
  Generated class for the ConnectionService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class ConnectionService {

  private connectionObserver: any;
  public connectionService: any;

  public connection: string;
  public connected: boolean

  constructor(private platform: Platform) {

    this.connectionService = Observable.create(observer => {
      this.connectionObserver = observer;
    });

    platform.ready().then(() => {
      this.connection = Network.type;
      if(this.connection != null || this.connection != 'none') {
        this.connected = true;
        this.connectionObserver.next();
      } else {
        this.connected = false;
        this.connectionObserver.next();
      }
    })

    let disconnectSubscription = Network.onDisconnect().subscribe(() => {
        console.log('network was disconnected :( ')
        this.connected = false;
        this.connection = Network.type;
        this.connectionObserver.next();
      });

      let connectSubscription = Network.onConnect().subscribe(() => {
        console.log('network connected!');
        setTimeout(() => {
          console.log('connected!');
          this.connected = true;
          this.connection = Network.type;
          this.connectionObserver.next();
        }, 1000);
      });
    
  }

  

}
