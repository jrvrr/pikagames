import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

    images = [
    '2.jpg',
    '2.jpg',
    '2.jpg',
    '2.jpg',
    '2.jpg',
  ];

currentIndex = 0;

prev() {
  if (this.currentIndex > 0) {
    this.currentIndex--;
  }
}

next() {
  if (this.currentIndex < this.images.length - 1) {
    this.currentIndex++;
  }
}
}
