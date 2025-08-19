import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CustomValidators } from '../../../shared/validator/password-match';
import { Register } from '../../../shared/action/auth.action';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { SettingState } from '../../../shared/state/setting.state';
import { ThemeOptionState } from '../../../shared/state/theme-option.state';
import { Option } from '../../../shared/interface/theme-option.interface';
import { Values } from '../../../shared/interface/setting.interface';
import * as data from '../../../shared/data/country-code';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  @Select(SettingState.setting) setting$: Observable<Values>;
  @Select(ThemeOptionState.themeOptions) themeOption$: Observable<Option>;

  public form: FormGroup;
  public breadcrumb: Breadcrumb = {
    title: "Sign In",
    items: [{ label: 'Sign In', active: true }]
  }
  public codes = data.countryCodes;
  public tnc = new FormControl(false, [Validators.requiredTrue]);


  public reCaptcha: boolean = true;
  

  constructor(
    private store: Store,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      name: new FormControl('', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]),
      email: new FormControl('', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]),
      phone: new FormControl('', [
        Validators.required, 
        Validators.pattern(/^[0-9]{10}$/),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]),
      country_code: new FormControl('91', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      password_confirmation: new FormControl('', [Validators.required]),
      recaptcha: new FormControl(null, Validators.required)
    },{validator : CustomValidators.MatchValidator('password', 'password_confirmation')});

    this.setting$.subscribe(seting => {
      if((seting?.google_reCaptcha && !seting?.google_reCaptcha?.status) || !seting?.google_reCaptcha) {
        this.form.removeControl('recaptcha');
        this.reCaptcha = false;
      } else {
        this.form.setControl('recaptcha', new FormControl(null, Validators.required))
        this.reCaptcha = true;
      }
    });
  }

  // Get name validation errors
  getNameErrors(): string {
    const nameControl = this.form.get('name');
    if (nameControl?.touched && nameControl?.errors) {
      if (nameControl.errors['required']) {
        return 'name_is_required';
      }
      if (nameControl.errors['pattern']) {
        return 'Name should only contain letters and spaces';
      }
    }
    return '';
  }

  // Get email validation errors
  getEmailErrors(): string {
    const emailControl = this.form.get('email');
    if (emailControl?.touched && emailControl?.errors) {
      if (emailControl.errors['required']) {
        return 'Email Is Required';
      }
      if (emailControl.errors['email'] || emailControl.errors['pattern']) {
        return 'Invalid Email';
      }
    }
    return '';
  }

  // Get phone validation errors
  getPhoneErrors(): string {
    const phoneControl = this.form.get('phone');
    if (phoneControl?.touched && phoneControl?.errors) {
      if (phoneControl.errors['required']) {
        return 'Phone Number Is Required';
      }
      if (phoneControl.errors['pattern'] || phoneControl.errors['minlength'] || phoneControl.errors['maxlength']) {
        return 'Phone number should be exactly 10 digits';
      }
    }
    return '';
  }

  // Prevent invalid characters in name field
  onNameInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove any numbers and special characters, keep only letters and spaces
    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
    
    if (value !== cleanValue) {
      input.value = cleanValue;
      // Update the form control
      this.form.patchValue({ name: cleanValue });
    }
  }

  // Prevent invalid keys from being pressed in name field
  onNameKeyPress(event: KeyboardEvent) {
    const char = String.fromCharCode(event.keyCode || event.which);
    // Allow only letters, spaces, and backspace/delete
    if (!/[a-zA-Z\s]/.test(char) && event.key !== 'Backspace' && event.key !== 'Delete') {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Prevent non-numeric input in phone field
  onPhoneInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove any non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    if (value !== cleanValue) {
      input.value = cleanValue;
      // Update the form control
      this.form.patchValue({ phone: cleanValue });
    }
  }

  get passwordMatchError() {
    return (
      this.form.getError('mismatch') &&
      this.form.get('password_confirmation')?.touched
    );
  }

  submit() {
    this.form.markAllAsTouched();
    if(this.tnc.invalid){
      return
    }
    if(this.form.valid) {
      this.store.dispatch(new Register(this.form.value)).subscribe({
          complete: () => {
            this.router.navigateByUrl('/account/dashboard');
          }
        }
      );
    }
  }
}
