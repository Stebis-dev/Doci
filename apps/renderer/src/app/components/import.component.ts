import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ipcRenderer } from 'electron';

@Component({
  selector: 'app-import',
  imports: [CommonModule],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css',
})
export class ImportComponent {
  // onSelectDirectory(): void {
  //   ipcRenderer.invoke('select-directory').then((directoryPath: string) => {
  //     if (directoryPath) {
  //       const directoryInput = document.getElementById('directory-input') as HTMLInputElement;
  //       directoryInput.value = directoryPath;
  //     }
  //   });
  // }

  onImport(): void {
    const directoryInput = (document.getElementById('directory-input') as HTMLInputElement).value;
    console.log('Directory Path:', directoryInput);
    // Add logic to handle the directory path
  }
}
