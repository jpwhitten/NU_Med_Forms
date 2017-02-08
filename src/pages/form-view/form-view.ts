import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Slides } from 'ionic-angular';
import { Http, Jsonp, Headers } from '@angular/http';
import { FormBuilder, FormGroup, Validators, FormControl, ValidatorFn } from '@angular/forms';
import { Form } from '../../providers/form';
import { Question } from '../../providers/question';
import { Camera } from 'ionic-native';
import { Network } from "ionic-native";
import { HomePage } from '../home/home'
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import { FormService } from '../../providers/form-service';

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

   public SERVER_NUMBER = '8014';
  public connection: string = "";


  signature = '';
  isDrawing = false;

  @ViewChild(SignaturePad) signaturePad: SignaturePad;
  private signaturePadOptions: Object = { 
    'minWidth': 2,
    'canvasWidth': 400,
    'canvasHeight': 200,
    'backgroundColor': '#f6fbff',
    'penColor': '#666a73',
  };


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
  constructor(private nav: NavController,
    private navParams: NavParams,
    private http: Http,
    public storage: Storage, 
    public toastCtrl: ToastController,
    public formService: FormService) {

      console.log(formService.test)



    if (Network.type != "none") {
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
        console.log(Network.type);
        if (Network.type != "none") {
          console.log('Connection!');
          console.log("online: " + Network.type);
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

   validateCustom2(id) {
     console.log("id" + id);
      var question = this.form.findQuestion(id);
      console.log(question);
      if(question.restrictions.length != 0) {
        for(var restriction in question.restrictions) {
        var restrictedQuestion = this.form.findQuestion(question.restrictions[restriction].objectid);
        console.log(restrictedQuestion);
        console.log(restrictedQuestion.id);
        console.log(question.answer.toString());
        console.log(question.restrictions[restriction].option)   ;     
        if(question.answer.toString() == question.restrictions[restriction].option) {


            var questionType = this.form.findQuestion(id).fieldType;
            var validation: ValidatorFn = Validators.compose([Validators.required]);

            if (questionType == 1) { //Single line input.

              validation = Validators.compose([Validators.minLength(10), Validators.pattern('[a-zA-Z]*'), Validators.required]);

            } else if (questionType == 2) { //TextArea.

              validation = Validators.compose([Validators.minLength(10), Validators.pattern('[a-zA-Z]*'), Validators.required]);

            } else if (questionType == 4) { //Checkbox.

              validation = Validators.compose([Validators.required]);

            } else if (questionType == 6) { //Select.

              validation = Validators.compose([Validators.required]);

            } else if (questionType == 7) { //Multplie Select.

              validation = Validators.compose([Validators.required]);

            } else if (questionType == 10) { //DateTime.

              validation = Validators.compose([Validators.required]);

            } else if (questionType == 15 || questionType == 8) { //Radio.

              validation = Validators.compose([Validators.required, Validators.pattern('[A-Za-z]*')]);

            }
            this.getQuestionValidationStateForID(restrictedQuestion.id).setValidators(validation);
            console.log(this.getQuestionValidationStateForID(restrictedQuestion.id).valid)
            
        
      } else {

        this.getQuestionValidationStateForID(restrictedQuestion.id).setValidators(Validators.minLength(-1));
        console.log(this.getQuestionValidationStateForID(restrictedQuestion.id).valid)
        
      }

          
      } 
      } 
  }

  static passValidation(): ValidatorFn {
    return null;
  }

  //Skip to question i.
  jumpToQuestion(i: number) {
    this.slides.update();
    //Take 300ms to complete transition.
    this.slides.slideTo(i, 300, false);
  }

  //Submit the form only if their are valid answers to each question.
  submitForm() {
    if (this.formSlides.valid && this.isOnline()) {
      this.sendForm();
    } else if (this.formSlides.valid && !this.isOnline()) {
      this.form.submissionStatus = "QUEUED"
       this.nav.push(HomePage, {
        form: this.form
      });
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
      if (!this.getQuestionValidationState(i).valid) {
        invalidAnswers = invalidAnswers.concat(i + ", ")
      }

    }

    return invalidAnswers;

  }

  /**
   * Question i has been answered.
   */
  answerQuestion(i) {

    

    console.log("question answer valid?" + this.getQuestionValidationState(i).valid)
    if (!this.form.questions[i].isDirty) {
      this.form.questions[i].isDirty = this.getQuestionValidationState(i).dirty;
    }
    
    this.form.questions[i].answer = this.getQuestionValidationState(i).value; 

     setTimeout(() => {
        var questionID = this.form.questions[i].id
        this.validateCustom2(questionID);
      }, 0);
    

  }

  /**
   * Get the validation state for question i (State contains current validation information (valid? dirty? ect.)).
   */
  getQuestionValidationState(i) {

    var questionID = this.form.questions[i].id;
    return this.formSlides.get(questionID.toString());

  }

  getQuestionValidationStateForID(id) {

    for (var question in this.form.questions) {
      if (this.form.questions[question].id == id) {
        var questionID = this.form.questions[question].id;
        return this.formSlides.get(questionID.toString());
      }
    }
    return null;
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

  isOnline() {
    return ;
  }

  ionViewDidEnter() {
    this.signaturePad.clear()
    this.storage.get('savedSignature').then((data) => {
      this.signature = data;
    });
  }
  
  drawComplete() {
    this.isDrawing = false;
    this.slides.lockSwipes(false);
  }
 
  drawStart() {
    this.isDrawing = true;
    this.slides.lockSwipes(true);
  }
 
  savePad() {
    this.signature = this.signaturePad.toDataURL();
    this.storage.set('savedSignature', this.signature);
    this.signaturePad.clear();
    let toast = this.toastCtrl.create({
      message: 'New Signature saved.',
      duration: 3000
    });
    toast.present();
  }
 
  clearPad() {
    this.signaturePad.clear();
  }


}
