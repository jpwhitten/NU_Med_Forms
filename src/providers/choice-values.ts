import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the ChoiceValues provider.

  Stores the answer for a question, such as a radio select that may have 
  a text value and a numerical value
*/
@Injectable()
export class ChoiceValues {

  constructor(public text: string, 
              public value: string) {
    
  }

}
