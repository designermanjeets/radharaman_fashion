import { Component, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
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
  public isDropdownOpen: boolean = false;

  @Select(AuthState.isAuthenticated) isAuthenticated$: Observable<string>;
  @Select(AccountState.user) user$: Observable<AccountUser>;

  @ViewChild("confirmationModal") ConfirmationModal: ConfirmationModalComponent;

  constructor(private store: Store, private elRef: ElementRef<HTMLElement>) {}

  logout() {
    this.store.dispatch(new Logout());
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  onDocumentInteraction(event: Event) {
    if (!this.isDropdownOpen) return;
    const target = event.target as Node | null;
    if (target && !this.elRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }
}
