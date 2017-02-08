import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Form } from '../providers/form';
import { Question } from '../providers/question';
import { ChoiceValues } from '../providers/choice-values';
import { Storage } from '@ionic/storage';
import { Data } from '../providers/data';
import { Restrictions } from '../providers/restrictions'
import { Platform } from 'ionic-angular';



/*
  Generated class for the FormService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class FormService {

  forms: Form[];
  public SERVER_NUMBER = '8014';
  hasFailed = false;
  retry: number = 0;
  RETRY_MAX = 10;
  local: Storage;

  INCOMPLETE: string = "INCOMPLETE"


  constructor(public http: Http,
    public dataService: Data,
    public platform: Platform) {

  }

  makeFormArray() {

   var serverForms = this.getFormsFromServer();
   var savedForms = this.getSavedForms();

   var add: boolean;

   for(var i = 0; i < serverForms.length; i++) {
     var form = serverForms[i]
     add = true;
     for(var j = 0; j < savedForms.length; j++) {
       if(form = savedForms[j]) {
         add = false;
       }
     }
     if(add) {
       this.forms.push(new Form(
         form.id,
         form.label,
         form.formSlug,
         form.customName,
         form.moduleCode,
         form.open,
         form.typeName,
         form.studyID,
         form.fieldAPI,
         form.close,
         form.type,
         form.academicYear,
         form.userProfile,
         this.getQuestions(form.fieldAPI),
         this.INCOMPLETE,
       ));
     }
   }


  }

  getFormsFromServer(): Form[] {

    var serverForm: Form[] = [];

    //Contact server to download any new Forms (Ones that aren't saved).
    var liveUrl: string = "http://shieldvdev.ncl.ac.uk:" + this.SERVER_NUMBER + "/forms/api/user_forms/b1026510/?format=json";
    var url: string = "../../assets/DummyJson/example_form copy 2.json";

    //Get Json from server.
    this.http.get(liveUrl).subscribe(data => {
      console.log("Got data");
      var items = data.json();

      for (var i in items) {

        //Get this forms questions from the server.
        var questions = this.getQuestions(items[i].field_api);

        //Temporary form with all form info.
        var newForm: Form = new Form(
          items[i].id,
          items[i].name,
          items[i].form_slug,
          items[i].custom_name,
          items[i].module_code,
          items[i].open,
          items[i].type_name,
          items[i].study_id,
          items[i].field_api,
          items[i].close,
          items[i].type,
          items[i].academicYear,
          items[i].userProfile,
          questions,
          "INCOMPLETE");

        //Push new form.                              
        serverForm.push(newForm);

      }

    }, (err: any) => {
      console.log(err);
    }

    );

    console.log("JSON length: " + this.forms.length);
    return serverForm;
  }

  getSavedForms(): Form[] {
     
      var savedForms: any;

     //Check local stoage for any saved forms.
    this.local = new Storage();
    this.dataService.getFormsData().then((forms) => {
      if (typeof (forms) != "undefined") {
        savedForms = JSON.parse(forms);
      }
      //For each saved form push the form to the array of forms to be presented.
      if (forms) {
        savedForms.forEach((savedForm) => {
          //Temporary form.
          let loadForm = new Form(savedForm.id,
            savedForm.label,
            savedForm.formSlug,
            savedForm.customName,
            savedForm.moduleCode,
            savedForm.open,
            savedForm.typeName,
            savedForm.studyID,
            savedForm.fieldAPI,
            savedForm.close,
            savedForm.type,
            savedForm.academicYear,
            savedForm.userProfile,
            savedForm.questions,
            savedForm.submissionStatus);
          loadForm.hasStarted = savedForm.hasStarted;

          //Push temporary form.                         
          this.forms.push(loadForm);
          loadForm.form.subscribe(update => {
            this.save();
          })
        })
      }
    }); 
    return savedForms;
}


  //Get the questions for a specific form.
  getQuestions(formLayout): Question[] {

    //Store Questions.
    let questions: Question[] = [];

    //Concatonate strings to create correct url for server request.
    var formLayoutUrlStart: string = "http://shieldvdev.ncl.ac.uk:" + this.SERVER_NUMBER;
    var formLayoutUrlEnd: string = "";
    var formLayoutUrl: string = formLayoutUrlStart + formLayout;

    //Get Questions JSON.
    this.http.get(formLayoutUrl).subscribe(data => {
      console.log("Got data");
      var questionItems = data.json();
      console.log(questionItems)
      console.log(questionItems.length)

      //For Each question get the answer choices.
      for (var i = 0; i < questionItems.length; i++) {

        //Split choices 
        var choices = questionItems[i].choices;
        var splitChoices = choices.split(",");
        var splitChoiceValues: ChoiceValues[] = [];

        //For each choice store the text value and actual value for the choice (eg. text: Good, value: 4).
        for (var j = 0; j < splitChoices.length; j++) {
          var values = splitChoices[j].split("::");
          splitChoiceValues.push({
            text: values[1],
            value: values[0]
          });
        }

        var restrictionArray: Restrictions[] = [];
        var restrictions = questionItems[i].restrictions;

        for (var k = 0; k < questionItems[i].restrictions.length; k++) {

          var restriction = new Restrictions(restrictions[k].condition,
            restrictions[k].logic.action,
            restrictions[k].option,
            restrictions[k].logic.object_id)

          restrictionArray.push(restriction);
        }

        //Set up for multiple select checkboxes (need an array slot for each checkbox where its state is stored)
        if (questionItems[i].field_type === 4) {
          var answerArray: boolean[] = new Array(splitChoiceValues.length);
          for (var i = 0; i < answerArray.length; i++) {
            answerArray[i] = false;
          }

          questions.push(new Question(
            questionItems[i].id,
            questionItems[i].label,
            questionItems[i].field_type,
            splitChoiceValues,
            questionItems[i].text_field_type,
            questionItems[i].order,
            null,
            answerArray,
            restrictionArray
          ));

        } else {
          //Set up for other questions.
          questions.push(new Question(
            questionItems[i].id,
            questionItems[i].label,
            questionItems[i].field_type,
            splitChoiceValues,
            questionItems[i].text_field_type,
            questionItems[i].order,
            null,
            null,
            restrictionArray
          ));

        }

      }
      console.log(questionItems);
      console.log("JSON length: " + questions.length);

    }, (err: any) => {
      console.log(err);
    });

    //Return the array of questions.
    return questions;

  }
  save(): void {
    this.dataService.saveFormsData(this.forms);
  }

}
