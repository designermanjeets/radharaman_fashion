import { Component, Input, ViewChild, HostListener } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Logout } from '../../../../action/auth.action';
import { AccountUser } from '../../../../interface/account.interface';
import { AccountState } from '../../../../state/account.state';
import { AuthState } from '../../../../state/auth.state';
import { ConfirmationModalComponent } from '../../../widgets/modal/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent {

  @Input() style: string = 'basic';

  @Select(AuthState.isAuthenticated) isAuthenticated$: Observable<string>;
  @Select(AccountState.user) user$: Observable<AccountUser>;

  @ViewChild("confirmationModal") ConfirmationModal: ConfirmationModalComponent;

  public isDropdownOpen: boolean = false;

  constructor(private store: Store) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdownElement = target.closest('.delivery-login-box');
    
    if (!dropdownElement && this.isDropdownOpen) {
      this.isDropdownOpen = false;
      const parentElement = document.querySelector('.onhover-dropdown');
      if (parentElement) {
        parentElement.classList.remove('active');
      }
    }
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle dropdown state
    this.isDropdownOpen = !this.isDropdownOpen;
    
    // Add/remove active class for mobile styles
    const element = event.currentTarget as HTMLElement;
    const parentElement = element.closest('.onhover-dropdown');
    
    if (parentElement) {
      if (this.isDropdownOpen) {
        parentElement.classList.add('active');
      } else {
        parentElement.classList.remove('active');
      }
    }
    
    console.log('User profile clicked, dropdown open:', this.isDropdownOpen);
  }

  logout() {
    this.store.dispatch(new Logout());
  }

}
