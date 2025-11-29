import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
MatButtonModule, MatIconModule, CommonModule, RouterLink,     MatFormFieldModule,
    MatInputModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

 selectedFileName: string = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName = input.files[0].name;
    }
  }

    constructor(private dialog: MatDialog, private route: ActivatedRoute) {}

showForm = false;

  toggleForm() {
    this.showForm = !this.showForm;
  }

   images = [
    { src: '1.jpg', },
    { src: '2.jpg',  },
    { src: '3.jpg', },
  ];

  currentIndex = 0;

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
}
