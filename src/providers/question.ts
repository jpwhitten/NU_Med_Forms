import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ChoiceValues } from '../providers/choice-values'
import 'rxjs/add/operator/map';

/*
  Generated class for the Questions provider.

  Model for a Question including all choices and an answer.
*/
@Injectable()
export class Question {

  constructor(public id: string,
              public label:string, 
              public fieldType: number, 
              public choices: ChoiceValues[], 
              public textFieldType: string, 
              public order: number, 
              public submissionID: String,
              public answer: any[],
              public hasValidAnswer: boolean,
              public isDirty: boolean) {

    
  }

}
