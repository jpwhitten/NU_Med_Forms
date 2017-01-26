import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Slides } from 'ionic-angular';
import { Http, Jsonp, Headers } from '@angular/http';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Form } from '../../providers/form';
import { Camera } from 'ionic-native';
import { Network } from "ionic-native";

/*
  Generated class for the FormView page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-form-view',
  templateUrl: 'form-view.html'
})
export class FormViewPage {

  public SERVER_NUMBER = '8000';
  public connection: string = "";


  //Slides componant from the view representing each question on the form.
  @ViewChild('slides') slides: Slides;

  //The current selected form.
  form: Form;
  //Form obsverer listening for changes.
  formObserver: any;

  //Photo for confirmation.
  public base64Image: string;

  //The form group used to group the form questions.
  public formSlides: FormGroup;
  //Form builder.
  public formBuilder: FormBuilder = new FormBuilder();
  
  //Current invalid answers.
  public invalidAnswers: string = "";

  //Class constructor.
  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private http: Http) {



      if (Network.connection != "none") {
      this.connection = "Online";
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
        }
      }, 3000);
    });




    //Retrieve the selected form passed in from the home page.
    this.form = this.navParams.get('form');

    //Create a new object to store form questions to validation constraints.
    var validationMap = new Object();

    //Dynamically map each question (based on question type (more paramaters could be passed to generate dynamic Validators using custom functions)).
    for (var i = 0; i < this.form.questions.length; i++) {
      
      var questionType = this.form.questions[i].fieldType;
      
      if (questionType == 1) { //Single line input.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.minLength(10), Validators.pattern('[a-zA-Z]*'), Validators.required])];

      } else if (questionType == 2) { //TextArea.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.minLength(10), Validators.pattern('[a-zA-Z]*'), Validators.required])];

      } else if (questionType == 4) { //Checkbox.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.required])];

      } else if (questionType == 6) { //Select.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.required])];

      } else if (questionType == 7) { //Multplie Select.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.required])];

      } else if (questionType == 10) { //DateTime.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.required])];

      } else if (questionType == 15 || questionType == 8) { //Radio.

        validationMap[this.form.questions[i].id] = ['', Validators.compose([Validators.pattern('[a-zA-Z0-9]*')])];

      }
    }
    console.log(validationMap);
    //Pass map into the form builder, assign it to the form group.
    this.formSlides = this.formBuilder.group(validationMap);
    console.log(this.formSlides);
  }

  /**
   * Print all questions of this form and their current answer to the console.
   */
  showAllValue() {
    for (var i = 0; i < this.form.questions.length; i++) {
      console.log(this.form.questions[i].label)
      console.log(this.form.questions[i].choices)
      console.log(this.form.questions[i].answer)
    }
  }

  /**
   * Print the current question object to the console.
   */
  showValue(i) {

    console.log(this.form.questions[i])

  }

  //Skip to question i.
  jumpToQuestion(i: number) {
    this.slides.update();
    //Take 300ms to complete transition.
    this.slides.slideTo(i, 300, false);
  }

  //Submit the form only if their are valid answers to each question.
  submitForm() {
    if (this.formSlides.valid) {
      this.sendForm();
    } else {
      for (var i = 0; i < this.form.questions.length; i++) {
        var questionID = this.form.questions[i].id;
        var questionValidationState = this.formSlides.get(questionID.toString());
        if (questionValidationState.invalid) {
          //If invalid answers are present, display them to the user.
          this.invalidAnswers = this.getInvalidAnswers();
          break;
        }
      }

    }
  }


  /**
   * Does this form have any invalid answers?
   */
  hasInvalidAnswers(): boolean {

    for (var i = 0; i < this.form.questions.length; i++) {
      var questionID = this.form.questions[i].id;
      var questionValidationState = this.formSlides.get(questionID.toString());
      if (questionValidationState.invalid) {
        return true;
      }
    }
    return false;

  }

  /**
   * Is answer for question i invalid?
   */
  isInvalidAnswer(i): boolean {

    return this.getQuestionValidationState(i).invalid;

  }

  /**
   * Is answer for question i dirty (has it been changed)?
   */
  isDirtyAnswer(i): boolean {

    return this.getQuestionValidationState(i).dirty;

  }

  /**
   * Gett all invalid answers as a string.
   */
  getInvalidAnswers(): string {

    var invalidAnswers = "Invalid Answers: "
    for (var i = 0; i < this.form.questions.length; i++) {
      if (!this.form.questions[i].hasValidAnswer) {
        invalidAnswers = invalidAnswers.concat(i + ", ")
      }

    }

    return invalidAnswers;

  }

  /**
   * Question i has been answered.
   */
  answerQuestion(i) {

    console.log("question answer valid?" + this.form.questions[i].hasValidAnswer)
    this.form.questions[i].hasValidAnswer = this.getQuestionValidationState(i).valid;
    if (!this.form.questions[i].isDirty) {
      this.form.questions[i].isDirty = this.getQuestionValidationState(i).dirty;
    }

    this.form.answerQuestion();

  }

  /**
   * Get the validation state for question i (State contains current validation information (valid? dirty? ect.)).
   */
  getQuestionValidationState(i) {

    var questionID = this.form.questions[i].id;
    return this.formSlides.get(questionID.toString());

  }

  /**
   * Actually send the form to the server, will delete submissoin upon a transaction failure.
   */
  sendForm() {

    var siteUrl = "http://shieldvdev.ncl.ac.uk:" + this.SERVER_NUMBER;
    var subUrl = "/forms/api/submission/";
    var valUrl = "/forms/api/values/";

    var userSubUrl = "/forms/api/user_submission/";

    //set the headers for any posting.
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');


    //Post form.
    this.http.post(siteUrl + subUrl, JSON.stringify({ form: this.form.id, academic_year: this.form.academicYear, user_profile: this.form.userProfile }), { headers: headers }).subscribe(data => {
      var items = data.json();

      //post was successfull.
      if (items.id) {

        console.log("added submission");
        console.log(items);
        var id = items.id;

        //Add submission id to all questions about to be submitted.
        for (var v in this.form.questions) {
          this.form.questions[v].submissionID = id;

        }

        //Post answers to all questions.
        console.log(this.form.questions)
        for (var i = 0; i < this.form.questions.length; i++) {
          //console.log(this.form.questions[v])
          console.log({ value: this.form.questions[i].answer, form_submission_id: this.form.questions[i].submissionID, form_field_id: this.form.questions[i].id });
          this.http.post(siteUrl + valUrl, JSON.stringify({ value: this.form.questions[i].answer, form_submission_id: this.form.questions[i].submissionID, form_field_id: this.form.questions[i].id }), { headers: headers }).subscribe(data => {
            var result = data.json();
            
            //If post was successful.
            if (result.result) {
              console.log("added Values");
            } else {
              //Delete submission upon failure.
              console.log("failed to add values");
              this.http.delete(siteUrl + userSubUrl + id + "/").subscribe(data => {
              var deleteresult = data.json();
              console.log(deleteresult);
            });
            }
          });
          //Delete (Here to simulate transaction failure) ------------------------------------
          if (i == 12) {
            console.log("failed to add at " + i + ": deleting");
            this.http.delete(siteUrl + userSubUrl + id + "/").subscribe(data => {
              var deleteresult = data.json();
              console.log(deleteresult);
            });
            break;
          }
          //Delete ---------------------------------------------------------------------------
        }
      }
    });
  }


  checkForm() {
    console.log(this.formSlides.value);
    console.log(this.formSlides.valid);
  }

  //Only submit when complete
  canSubmitForm() {
    return this.form.hasCompleted;
  }

  takePhoto() {
    Camera.getPicture({
      destinationType: Camera.DestinationType.DATA_URL,
      targetWidth: 1000,
      targetHeight: 1000
    }).then((imageData) => {
      // imageData is a base64 encoded string
      this.base64Image = "data:image/jpeg;base64," + imageData;
    }, (err) => {
      console.log(err);
    });
  }

}
