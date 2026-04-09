import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.css'
})
export class LoadingScreenComponent implements OnInit, OnDestroy {

  @Output() loadingDone = new EventEmitter<void>();

  progress = 0;
  fadeOut = false;

  private progressTimer: any;
  private totalDuration = 3200;
  private intervalMs = 40;

  ngOnInit(): void {
    this.startProgress();
  }

  ngOnDestroy(): void {
    clearInterval(this.progressTimer);
  }

  private startProgress(): void {
    const steps = this.totalDuration / this.intervalMs;
    const increment = 100 / steps;

    this.progressTimer = setInterval(() => {
      this.progress = Math.min(100, Math.round(this.progress + increment));

      if (this.progress >= 100) {
        clearInterval(this.progressTimer);
        setTimeout(() => {
          this.fadeOut = true;
          setTimeout(() => this.loadingDone.emit(), 600);
        }, 300);
      }
    }, this.intervalMs);
  }
}
