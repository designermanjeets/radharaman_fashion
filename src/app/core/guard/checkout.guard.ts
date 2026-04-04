import { Injectable, } from '@angular/core';
import { Store } from '@ngxs/store';
import { UrlTree, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GetUserDetails } from './../../shared/action/account.action';
import { AuthService } from './../../shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutGuard {

  constructor(private store: Store,
    private router: Router,
    private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Store the attempted URL for redirecting after login
    this.authService.redirectUrl = state.url;

    if(this.store.selectSnapshot(state => state.auth && state.auth.access_token)) {
        // Return the observable to properly wait for GetUserDetails to complete
        return this.store.dispatch(new GetUserDetails()).pipe(
          map(() => true),
          catchError(() => of(true)) // Allow access even if GetUserDetails fails
        );
    } else {
        // Always allow guest checkout - settings.setting may not be loaded yet
        // which previously caused a crash here, clearing the cart state
        const settingState = this.store.selectSnapshot(state => state.setting);
        const guestCheckoutEnabled = settingState?.setting?.activation?.guest_checkout ?? true;
        if(guestCheckoutEnabled) {
            if(this.store.selectSnapshot(state => state.cart?.is_digital_only)) {
                return this.router.createUrlTree(['/auth/login']);
            }
        } else {
            return this.router.createUrlTree(['/auth/login']);
        }
    }
    
    return true;
  }

}