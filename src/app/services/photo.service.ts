import { Injectable } from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera'; 
import {Filesystem, Directory} from '@capacitor/filesystem'; 
import {Preferences} from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor() { }
  public async addNewToGallery(){
    //Espera a que se encienda la camara 
    const capturedPhoto = await Camera.getPhoto({
      resultType:CameraResultType.Uri, 
      source: CameraSource.Camera, 
      quality:100
    })
  }
}
