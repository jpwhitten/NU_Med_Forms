import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/map';

/*
  Generated class for the Data provider.

  Model for storing data locally. 
*/
@Injectable()
export class Data {


  constructor(public storage: Storage) {
    
    
  }

  getFormsData(): Promise<any> {
    return this.storage.get('forms');
  }

  saveFormsData(data): void {

    let saveData = [];

     data.forEach((form) => {
      saveData.push({
        id: form.id,
        label: form.label,
        formSlug: form.form,
        customName: form.customName,
        moduleCode: form.moduleCode,
        open: form.open,
        typeName: form.typeName,
        studyID: form.studyID,
        fieldAPI: form.fieldAPI,
        close: form.close,                
        type: form.type,
        academicYear: form.academicYear,
        userProfile: form.userProfile,
        questions: form.questions,
        hasStarted: form.hasStarted,
        submissionStatus: form.submissionStatus
      });
    });

    let newData = JSON.stringify(saveData);
    this.storage.set('forms', newData);

  }
  

}
