import { Component } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  constructor(public photoService: PhotoService) {}
    addPhotoGallery(){
      this.photoService.addNewToGallery();
    }

    mostrar = false;
    // Función para alternar el valor de 'mostrar'
    toggleMostrar() {
      this.mostrar = !this.mostrar;
    }

    async ngOnInit(){
      await this.photoService.loadSaved(); 
  }

}
