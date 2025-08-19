import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { GetPaymentDetails, UpdatePaymentDetails } from '../../../shared/action/payment-details.action';
import { PaymentDetailsState } from '../../../shared/state/payment-details.state';
import { PaymentDetails } from '../../../shared/interface/payment-details.interface';

@Component({
  selector: 'app-bank-details',
  templateUrl: './bank-details.component.html',
  styleUrls: ['./bank-details.component.scss']
})
export class BankDetailsComponent {

  @Select(PaymentDetailsState.paymentDetails) paymentDetails$: Observable<PaymentDetails>;
  
  public form: FormGroup;
  public active = 'bank';

  constructor(private store: Store, private formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      bank_account_no: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9]+$/)
      ]),
      bank_name: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]),
      bank_holder_name: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]),
      swift: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[A-Z0-9]+$/)
      ]),
      ifsc: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[A-Z0-9]+$/)
      ]),
      paypal_email: new FormControl('', [Validators.email]),
    });
  }

  ngOnInit(): void {
    this.store.dispatch(new GetPaymentDetails());
    this.paymentDetails$.subscribe(paymentDetails => {
      this.form.patchValue({
        bank_account_no: paymentDetails?.bank_account_no,
        bank_name: paymentDetails?.bank_name,
        bank_holder_name: paymentDetails?.bank_holder_name,
        swift:paymentDetails?.swift,
        ifsc: paymentDetails?.ifsc,
        paypal_email: paymentDetails?.paypal_email
      })
    });
  }

  // Prevent non-numeric input in bank account number field
  onBankAccountInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove any non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    if (value !== cleanValue) {
      input.value = cleanValue;
      // Update the form control
      this.form.patchValue({ bank_account_no: cleanValue });
    }
  }

  // Prevent invalid characters in bank name field
  onBankNameInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove any numbers and special characters, keep only letters and spaces
    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
    
    if (value !== cleanValue) {
      input.value = cleanValue;
      // Update the form control
      this.form.patchValue({ bank_name: cleanValue });
    }
  }

  // Prevent invalid keys from being pressed in bank name field
  onBankNameKeyPress(event: KeyboardEvent) {
    const char = String.fromCharCode(event.keyCode || event.which);
    // Allow only letters, spaces, and backspace/delete
    if (!/[a-zA-Z\s]/.test(char) && event.key !== 'Backspace' && event.key !== 'Delete') {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Prevent invalid characters in holder name field
  onHolderNameInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove any numbers and special characters, keep only letters and spaces
    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
    
    if (value !== cleanValue) {
      input.value = cleanValue;
      // Update the form control
      this.form.patchValue({ bank_holder_name: cleanValue });
    }
  }

  // Prevent invalid keys from being pressed in holder name field
  onHolderNameKeyPress(event: KeyboardEvent) {
    const char = String.fromCharCode(event.keyCode || event.which);
    // Allow only letters, spaces, and backspace/delete
    if (!/[a-zA-Z\s]/.test(char) && event.key !== 'Backspace' && event.key !== 'Delete') {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Prevent invalid characters in SWIFT/IFSC fields
  onSwiftIfscInput(event: any, fieldName: string) {
    const input = event.target;
    const value = input.value;
    // Remove any non-alphanumeric characters, keep only uppercase letters and numbers
    const cleanValue = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    if (value !== cleanValue) {
      input.value = cleanValue;
      // Update the form control
      this.form.patchValue({ [fieldName]: cleanValue });
    }
  }

  submit(){    
    this.form.markAllAsTouched();
    if(this.form.valid){
      this.store.dispatch(new UpdatePaymentDetails(this.form.value))
    }
  }

}
