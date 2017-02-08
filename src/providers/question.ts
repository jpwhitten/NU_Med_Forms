import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ChoiceValues } from '../providers/choice-values';
import { Restrictions } from '../providers/restrictions';
import 'rxjs/add/operator/map';

/*
  Generated class for the Question provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class Question {

  public isDirty: boolean = false;

  constructor(public id: string,
    public label: string,
    public fieldType: number,
    public choices: ChoiceValues[],
    public textFieldType: string,
    public order: number,
    public submissionID: String,
    public answer: any[],
    public restrictions: Restrictions[]) {


  }

  makeDirty() {
    this.isDirty = true;
  }


  hasRestrictions(): boolean {
    return this.restrictions.length != 0;
  }


}
