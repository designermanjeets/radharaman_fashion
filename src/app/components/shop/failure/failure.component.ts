import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-failure',
  templateUrl: './failure.component.html',
  styleUrls: ['./failure.component.scss']
})
export class FailureComponent implements OnInit, OnDestroy {

  public countdown: number = 8;
  private countdownInterval: any;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // this.clearPaymentData();
    // this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  clearPaymentData(): void {
    // Clear any payment-related data from storage
    sessionStorage.removeItem('payment_uuid');
    sessionStorage.removeItem('payment_method');
    sessionStorage.removeItem('payment_action');
    sessionStorage.removeItem('payment_url');
    localStorage.removeItem('order_id');
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.redirectToHome();
      }
    }, 1000);
  }

  redirectToHome(): void {
    this.router.navigate(['/']);
  }

  redirectNow(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.redirectToHome();
  }

  tryAgain(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/']);
  }
}
