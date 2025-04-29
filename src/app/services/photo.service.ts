import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';
  private platform: Platform;
  private isLowResolution: boolean = false; // 🔧 Flag para resolución baja

  constructor(platform: Platform) {
    this.platform = platform;
  }

  // Guardar imagen capturada
  private async savePicture(photo: Photo) {
    const base64Data = await this.readAsBase64(photo);

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };
    }
  }

  // Leer la imagen como base64 (web o móvil)
  private async readAsBase64(photo: Photo) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!
      });
      return file.data;
    } else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      // 👇 Ajustar resolución solo si se requiere
      if (this.isLowResolution) {
        return await this.convertBlobToBase64(blob, 960, 540) as string;
      } else {
        return await this.convertBlobToBase64(blob) as string;
      }
    }
  }

  // Convertir imagen Blob a base64 con posible redimensionado
  private convertBlobToBase64 = (blob: Blob, targetWidth?: number, targetHeight?: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;

      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;

        img.onload = () => {
          const width = targetWidth || img.width;
          const height = targetHeight || img.height;

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('No se pudo obtener el contexto del canvas.');
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9); // 90% calidad
          resolve(resizedBase64);
        };

        img.onerror = reject;
      };

      reader.readAsDataURL(blob);
    });

  // Tomar y guardar nueva foto
  public async addNewToGallery(resolucion: boolean) {
    this.isLowResolution = !resolucion; // 👈 Controlar si se aplica redimensionado

    const quality = resolucion ? 100 : 50;
    const width = resolucion ? 1920 : 960;
    const height = resolucion ? 1080 : 540;

    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: quality,
      width: width,
      height: height
    });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  // Cargar fotos guardadas
  public async loadSaved() {
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    if (!this.platform.is('hybrid')) {
      for (let photo of this.photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
