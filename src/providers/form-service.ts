import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
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

  forms: Form[] = [];
  public SERVER_NUMBER = '8010';
  hasFailed = false;
  retry: number = 0;
  RETRY_MAX = 10;
  local: Storage;

  INCOMPLETE: string = "INCOMPLETE"


  constructor(public http: Http,
    public dataService: Data,
    public platform: Platform) {

    this.makeFormArray();
    console.log(this.forms);
    console.log("forms service");

  }

  makeFormArray() {

    var serverForms: Form[];
    this.getFormsFromServer().then((result) => {
      serverForms = result;
      console.log(serverForms);
      var savedForms = this.getSavedForms();
      console.log(savedForms);

      for (var k in savedForms) {
        this.forms.push(savedForms[k]);
      }

      var add: boolean;

      for (var i = 0; i < serverForms.length; i++) {
        var form = serverForms[i];
        add = true;
        for (var j = 0; j < savedForms.length; j++) {
          console.log(form);
          console.log(savedForms[j]);
          if (form = savedForms[j]) {
            add = false;
          }
        }
        if (add) {
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

      this.save();
    });


  }

  getFormsFromServer() {

    return new Promise<Form[]>((resolve, reject) => {

      var serverForm: Form[] = [];

      //Contact server to download any new Forms (Ones that aren't saved).
      var liveUrl: string = "http://shieldvdev.ncl.ac.uk:" + this.SERVER_NUMBER + "/forms/api/user_forms/b1026510/?format=json";
      var url: string = "../../assets/DummyJson/example_form copy 2.json";

      //Get Json from server.
      this.http.get(liveUrl).subscribe(data => {
        console.log("Got data");
        var items = data.json();
        console.log(items);

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
            this.INCOMPLETE);

          //Push new form.                              
          serverForm.push(newForm);


        }

        resolve(serverForm);

      }, (err: any) => {
        console.log(err);
        reject(err);
      }

      );

    })

  }


  getSavedForms(): Form[] {

    var savedForms: Form[] = [];

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
          savedForms.push(loadForm);
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

  sendForm(form) {
    var self = this;
    return new Promise(function (resolve, reject) {
      console.log("Sending Form");

      var siteUrl = "http://shieldvdev.ncl.ac.uk:" + "8014";
      var subUrl = "/forms/api/submission/";
      var valUrl = "/forms/api/values/";

      var userSubUrl = "/forms/api/user_submission/";

      //set the headers for any posting.
      var headers = new Headers();
      headers.append('Content-Type', 'application/json');


      //Post form.
      self.http.post(siteUrl + subUrl, JSON.stringify({ form: form.id, academic_year: form.academicYear, user_profile: form.userProfile }), { headers: headers }).subscribe(data => {
        var items = data.json();

        //post was successfull.
        if (items.id) {

          console.log("added submission");
          console.log(items);
          var id = items.id;

          //Add submission id to all questions about to be submitted.
          for (var v in form.questions) {
            form.questions[v].submissionID = id;
          }

          self.sendFormAnswers(form, siteUrl, valUrl, userSubUrl, id, headers).then(success => {
            resolve(success);
          })

        } else {

        }
      });
    })
  }

  sendFormAnswers(form, siteUrl, valUrl, userSubUrl, id, headers) {
    var self = this;
    return new Promise((resolve, reject) => {
      //Post answers to all questions.
      console.log(form.questions)
      for (var i = 0; i < form.questions.length; i++) {
        //console.log(this.form.questions[v])
        console.log({ value: form.questions[i].answer, form_submission_id: form.questions[i].submissionID, form_field_id: form.questions[i].id });
        self.http.post(siteUrl + valUrl, JSON.stringify({ value: form.questions[i].answer, form_submission_id: form.questions[i].submissionID, form_field_id: form.questions[i].id }), { headers: headers }).subscribe(data => {
          var result = data.json();

          //If post was successful.
          if (result.result) {
            console.log("added Values");
          } else {
            //Delete submission upon failure.
            console.log("failed to add values");
            self.http.delete(siteUrl + userSubUrl + id + "/").subscribe(data => {
              resolve(false);
              var deleteresult = data.json();
              console.log(deleteresult);
            });
          }
        });
        //Delete (Here to simulate transaction failure) ------------------------------------
        if (i == 12 && self.retry != 10) {
          console.log("failed to add at " + i + ": deleting");
          self.http.delete(siteUrl + userSubUrl + id + "/").subscribe(data => {
            resolve(false);
            var deleteresult = data.json();
            console.log(deleteresult);
          });
          break;
        }
        //Delete ---------------------------------------------------------------------------
        if (i == form.questions.length - 1) {
          resolve(true);
        }
      }
    });
  }

  sendQueuedForms() {
    for (var i = 0; i < this.forms.length; i++) {
      if (this.forms[i].submissionStatus == "QUEUED") {
        this.sendForm(this.forms[i]).then(msg => {
          console.log(msg)
          console.log("called");
          if (msg) {
            console.log("remove");
            console.log(i);
            this.removeFormFromList(i);
          } else if (this.retry <= this.RETRY_MAX) {
            console.log("Retry: " + this.retry)
            setTimeout(() => {
              this.sendQueuedForms();
              this.retry++;
            }, 2000);
          }
        });
      }
    }
  }

  removeFormFromList(index) {
    this.forms.splice(index - 1);
  }

  orderFormsByClosing() {
    this.forms.sort(function (a, b) {
      var aDate = new Date(a.close).valueOf();
      var bDate = new Date(b.close).valueOf();
      console.log(aDate + " : " + bDate);
      return aDate - bDate;
    });
  }

  orderFormsByOpen() {
    this.forms.sort(function (a, b) {
      var aDate = new Date(a.open).valueOf();
      var bDate = new Date(b.open).valueOf();
      console.log(aDate + " : " + bDate);
      return aDate - bDate;
    });
  }

  orderFormsByName() {
    this.forms.sort(function (a, b) {
      var aName = a.label.toLowerCase(), bName = b.label.toLowerCase();
      if (aName < bName)
        return -1;
      if (aName > bName)
        return 1;
      return 0;
    });
  }


  orderFormsByType() {
    this.forms.sort(function (a, b) {
      var aName = a.typeName.toLowerCase(), bName = b.typeName.toLowerCase();
      if (aName < bName)
        return -1;
      if (aName > bName)
        return 1;
      else {
        var aName = a.label.toLowerCase(), bName = b.label.toLowerCase();
        if (aName < bName)
          return -1;
        if (aName > bName)
          return 1;
        return 0;
      }
    });
  }

  orderFormsByCompletion() {
    this.forms.sort(function (a, b) {
      var aCompletion = a.questionsAnswered(), bCompletion = b.questionsAnswered();
      if (aCompletion > bCompletion)
        return -1;
      if (aCompletion < bCompletion)
        return 1;
      else {
        return 0;
      }
    });
  }

  caluclateTimeUntilDueDate(form) {
    var today = new Date();
    var formDue = new Date(form.close);
    var difference = formDue.valueOf() - today.valueOf();
    return difference
  }

  getApproximateTimeLeft(form): String {
    var difference = this.caluclateTimeUntilDueDate(form);
    var roundedDays = Math.round(difference / (1000 * 60 * 60 * 24));
    return new String((roundedDays + " " + "days"));
  }

  showAllFormInfo(): void {

    for (var i = 0; i < this.forms.length; i++) {
      console.log(this.forms[i]);
      console.log("Has Started: " + this.forms[i].hasStarted);
      console.log("Has Completed: " + this.forms[i].hasCompleted());
    }

  }

  removeAll(): void {

    this.forms = [];
    this.save();

  }

  save(): void {
    this.dataService.saveFormsData(this.forms);
  }

}
