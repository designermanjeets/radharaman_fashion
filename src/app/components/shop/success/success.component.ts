import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss']
})
export class SuccessComponent implements OnInit {

  public countdown: number = 5;
  private countdownInterval: any;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.redirectToOrderDetails();
      }
    }, 1000);
  }

  redirectToOrderDetails(): void {
    // Get order ID from localStorage (set in app.component.ts)
    const orderId = localStorage.getItem('order_id');
    if (orderId) {
      const cleanOrderId = JSON.parse(orderId);
      this.router.navigate(['/account/order/details', cleanOrderId]);
    } else {
      // Fallback to account orders page
      this.router.navigate(['/account/orders']);
    }
  }

  redirectNow(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.redirectToOrderDetails();
  }
}
