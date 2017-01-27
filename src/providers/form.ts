import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Question } from '../providers/question'
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

/*
  Generated class for the Form provider.

  Model for a form, including a form observer to save any answers when it detects the input.
*/
@Injectable()
export class Form {

  form: any;
  formObserver: any;
  public hasStarted: boolean; 

  constructor(public id: String,
              public label: string,
              public formSlug: string,
              public customName: string,
              public moduleCode: number,
              public open: string,
              public typeName: string,
              public studyID: string,
              public fieldAPI: string,
              public close: string,
              public type: number,
              public academicYear: String,
              public userProfile: String,
              public questions: Question[],
              public submissionStatus: String) {

    this.hasStarted = false;

    this.form = Observable.create(observer => {
      this.formObserver = observer;
    })

  }

  buildForm(): void {

    this.formObserver.next(true);

  }

  answerQuestion(): void {

    this.hasStarted = true;
    this.formObserver.next(true);

  }

  hasCompleted(): boolean {
    var hasCompleted: boolean = true;
    this.questions.forEach(question => {
       if(question.answer === null) {
         hasCompleted = false;
         return hasCompleted;
       }
    });
    return hasCompleted;
  }

  questionsAnswered(): number {
    var numberAnswered = 0;
    this.questions.forEach(question => {
      if(question.answer !== null) {
        numberAnswered++;
      }
    })
    return numberAnswered;
  }

  numberQuestions():number {
    return this.questions.length;
  }

  findQuestion(id): Question {
    for(var question in this.questions) {
      if(id == this.questions[question].id) {
        return this.questions[question];
      }
    }
  }

  isQuestionRestricted(id): boolean {
    for(var question in this.questions) {
      if(this.questions[question].restrictions.length != 0) {
        for(var restriction in this.questions[question].restrictions) {
          if(this.questions[question].restrictions[restriction].objectid == id) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isQuestionRestrictedAndShouldHide(id):boolean {
    for(var question in this.questions) {
      if(this.questions[question].restrictions.length != 0) {
        for(var restriction in this.questions[question].restrictions) {
          if(this.questions[question].restrictions[restriction].objectid == id) {
            return this.questions[question].restrictions[restriction].action == "show";
          }
        }
      }
    }
    return false;
  }

  getRestrictingQuestion(id): Question {
    for(var question in this.questions) {
      for(var restriction in this.questions[question].restrictions) {
        if(this.questions[question].restrictions[restriction].objectid == id) {
         return this.findQuestion(this.questions[question].id);
        }
      }
    }
  }

  saveForm(): void {

     this.formObserver.next(true);
     this.hasStarted = true;

  }

}
