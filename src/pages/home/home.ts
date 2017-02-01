import { Component } from '@angular/core';
import { NavController, NavParams, Platform, AlertController } from 'ionic-angular';
import { Http, Headers, Jsonp } from '@angular/http';
import { Form } from '../../providers/form';
import { Question } from '../../providers/question';
import { ChoiceValues } from '../../providers/choice-values';
import { Storage } from '@ionic/storage';
import { Data } from '../../providers/data';
import { FormViewPage } from '../form-view/form-view'
import { Network } from "ionic-native";
import { Restriction } from '../../providers/restriction'



@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  forms: Form[] = [];
  local: Storage;
  items: any;
  questionItems: any;
  connection: String = "";
  savedForms: any = false;
  public SERVER_NUMBER = '8014';
  hasFailed = false;
  retry: number = 0;
  RETRY_MAX = 10;

  queuedForm: Form;

  constructor(public nav: NavController,
    private http: Http,
    private navCtrl: NavController,
    public dataService: Data,
    private platform: Platform,
    private navParams: NavParams,
    private alertController: AlertController) {

    //Check local stoage for any saved forms.
    this.local = new Storage();
    this.dataService.getFormsData().then((forms) => {

      if (typeof (forms) != "undefined") {
        this.savedForms = JSON.parse(forms);
        console.log(this.savedForms)
      }

      if (this.navParams.get('form') != null) {
        this.queuedForm = this.navParams.get('form');
        console.log(this.queuedForm);

        //For each saved form push the form to the array of forms to be presented.
        if (forms) {
          this.savedForms.forEach((savedForm) => {

            let loadForm;

            if (savedForm.id != this.queuedForm.id) {

              //Temporary form.
              loadForm = new Form(savedForm.id,
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


            } else {

              loadForm = this.queuedForm;

            }

            //Push temporary form.                         
            this.forms.push(loadForm);
            console.log(this.forms)

            loadForm.form.subscribe(update => {
              this.save();
            })




          })
        }

      } else {

        if (forms) {
          this.savedForms.forEach((savedForm) => {

            let loadForm;

            //Temporary form.
            loadForm = new Form(savedForm.id,
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
            console.log(this.forms)

            loadForm.form.subscribe(update => {
              this.save();
            })



          });
        }


      }

      this.sendQueuedForms();
      this.getForms();



    })

    if (Network.connection != "none") {
      this.connection = "Online";
      this.sendQueuedForms();
    } else {
      this.connection = "Offline";
    }

    let disconnectSubscription = Network.onDisconnect().subscribe(() => {
      console.log('network was disconnected :( ')
      this.connection = "offline";
    });

    let connectSubscription = Network.onConnect().subscribe(() => {
      console.log('network connected!');
      setTimeout(() => {
        console.log(Network.connection);
        if (Network.connection != "none") {
          console.log('Connection!');
          console.log("online: " + Network.connection);
          this.connection = "online";
          this.getForms();
          this.sendQueuedForms();
        }
      }, 3000);
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
              if(i == form.questions.length - 1) {
                resolve(true);
              }
            } 
     });
 }

  removeFormFromList(index) {
    this.forms.splice(index - 1);
  }


  getForms() {

    //Contact server to download any new Forms (Ones that aren't saved).
    var liveUrl: string = "http://shieldvdev.ncl.ac.uk:" + this.SERVER_NUMBER + "/forms/api/user_forms/b1026510/?format=json";
    var url: string = "../../assets/DummyJson/example_form copy 2.json";

    //Get Json from server.
    this.http.get(liveUrl).subscribe(data => {
      console.log("Got data");
      this.items = data.json();

      //For each JSON object check if we already have the form saved.
      for (var i = 0; i < this.items.length; i++) {
        var addForm: boolean = true;
        for (var j = 0; j < this.savedForms.length; j++) {
          if (this.items[i].custom_name == this.savedForms[j].customName) {
            //We already have this form, dont save it (it will make a duplicate).
            addForm = false;
          }
        }

        //If we are adding the form (its new). 
        if (addForm) {

          //Get this forms questions from the server.
          var questions = this.getQuestions(this.items[i].field_api);

          //Temporary form with all form info.
          var newForm: Form = new Form(this.items[i].id,
            this.items[i].name,
            this.items[i].form_slug,
            this.items[i].custom_name,
            this.items[i].module_code,
            this.items[i].open,
            this.items[i].type_name,
            this.items[i].study_id,
            this.items[i].field_api,
            this.items[i].close,
            this.items[i].type,
            this.items[i].academicYear,
            this.items[i].userProfile,
            questions,
            "INCOMPLETE");
          //Push new form.                              
          this.forms.push(newForm);

          //Subsribe to form to save when updated.
          newForm.form.subscribe(update => {
            this.save();
          })
          this.save();
        }
      }
    }, (err: any) => {
      console.log(err);
    }

    );

    console.log("JSON length: " + this.forms.length);
    this.save()
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
      this.questionItems = data.json();
      console.log(this.questionItems)
      console.log(this.questionItems.length)

      //For Each question get the answer choices.
      for (var i = 0; i < this.questionItems.length; i++) {

        //Split choices 
        var choices = this.questionItems[i].choices;
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

        var restrictionArray: Restriction[] = [];
        var restrictions = this.questionItems[i].restrictions;

        for (var k = 0; k < this.questionItems[i].restrictions.length; k++) {

          var restriction = new Restriction(restrictions[k].condition,
            restrictions[k].logic.action,
            restrictions[k].option,
            restrictions[k].logic.object_id)

          restrictionArray.push(restriction);
        }

        //Set up for multiple select checkboxes (need an array slot for each checkbox where its state is stored)
        if (this.questionItems[i].field_type === 4) {
          var answerArray: boolean[] = new Array(splitChoiceValues.length);
          for (var i = 0; i < answerArray.length; i++) {
            answerArray[i] = false;
          }

          questions.push(new Question(
            this.questionItems[i].id,
            this.questionItems[i].label,
            this.questionItems[i].field_type,
            splitChoiceValues,
            this.questionItems[i].text_field_type,
            this.questionItems[i].order,
            null,
            answerArray,
            false,
            false,
            restrictionArray
          ));

        } else {
          //Set up for other questions.
          questions.push(new Question(
            this.questionItems[i].id,
            this.questionItems[i].label,
            this.questionItems[i].field_type,
            splitChoiceValues,
            this.questionItems[i].text_field_type,
            this.questionItems[i].order,
            null,
            null,
            false,
            false,
            restrictionArray
          ));

        }

      }
      console.log(this.questionItems);
      console.log("JSON length: " + questions.length);

    }, (err: any) => {
      console.log(err);
    });

    //Return the array of questions.
    return questions;

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

  viewForm(form): void {

    this.nav.push(FormViewPage, {
      form: form
    });

    this.save();

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
    this.savedForms = []
    this.save();

  }

  save(): void {
    this.dataService.saveFormsData(this.forms);
  }

  checkNetwork() {
    this.platform.ready().then(() => {
      let alert = this.alertController.create({
        title: "Connection Status",
        subTitle: <string>Network.connection,
        buttons: ["OK"]
      });
      alert.present();
    });



  }

}
