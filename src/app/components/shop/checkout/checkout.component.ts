import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { FormBuilder, FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Select2Data, Select2UpdateEvent } from 'ng-select2-component';
import { Router } from '@angular/router';
import { Observable, Subscription, map, of, interval, switchMap, delay, takeWhile } from 'rxjs';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { AccountUser } from "../../../shared/interface/account.interface";
import { AccountState } from '../../../shared/state/account.state';
import { CartState } from '../../../shared/state/cart.state';
import { OrderState } from '../../../shared/state/order.state';
import { Checkout, PlaceOrder } from '../../../shared/action/order.action';
import { GetUserDetails } from '../../../shared/action/account.action';
import { Register } from '../../../shared/action/auth.action';
import { ClearCart } from '../../../shared/action/cart.action';
import { AddressModalComponent } from '../../../shared/components/widgets/modal/address-modal/address-modal.component';
import { Cart } from '../../../shared/interface/cart.interface';
import { SettingState } from '../../../shared/state/setting.state';
import { GetSettingOption } from '../../../shared/action/setting.action';
import { OrderCheckout } from '../../../shared/interface/order.interface';
import { Values, DeliveryBlock } from '../../../shared/interface/setting.interface';
import { CartService } from '../../../shared/services/cart.service';
import { CountryState } from '../../../shared/state/country.state';
import { StateState } from '../../../shared/state/state.state';
import { AuthState } from '../../../shared/state/auth.state';
import * as data from '../../../shared/data/country-code';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';
import { tap } from 'rxjs/operators';
import { OrderService } from '../../../shared/services/order.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../shared/services/auth.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {

  public breadcrumb: Breadcrumb = {
    title: "Checkout",
    items: [{ label: 'Checkout', active: true }]
  }

  @Select(AccountState.user) user$: Observable<AccountUser>;
  @Select(AuthState.accessToken) accessToken$: Observable<string>;
  @Select(CartState.cartItems) cartItem$: Observable<Cart[]>;
  @Select(OrderState.checkout) checkout$: Observable<OrderCheckout>;
  @Select(SettingState.setting) setting$: Observable<Values>;
  @Select(CartState.cartHasDigital) cartDigital$: Observable<boolean | number>;
  @Select(CartState.cartTotal) cartTotal$: Observable<number>;
  @Select(CountryState.countries) countries$: Observable<Select2Data>;
  
  @ViewChild("addressModal") AddressModal: AddressModalComponent;
  @ViewChild('cpn', { static: false }) cpnRef: ElementRef<HTMLInputElement>;
  @ViewChild("payByQRModal") payByQRModal: TemplateRef<any>;

  public form: FormGroup;
  public coupon: boolean = true;
  public couponCode: string;
  public appliedCoupon: boolean = false;
  public couponError: string | null;
  public checkoutTotal: OrderCheckout;
  public loading: boolean = false;

  public shippingStates$: Observable<Select2Data>;
  public billingStates$: Observable<Select2Data>;
  public codes = data.countryCodes;

  public formData!: any;

  private pollingSubscription!: Subscription;
  private pollingInterval = 5000; // Poll every 5 seconds

  storeData: any;
  localUserCheck: any;

  payByNeoKredIntentSaveData: any;
  payByNeoStep = 0;
  payment_method = '';

  // Sub Paisa Config
  // @ViewChild('SubPaisaSdk', { static: true }) containerRef!: ElementRef;
  // formData = {
  //   env: 'stag',
  //   clientCode: 'LPS01',
  //   onToggle:() =>this.render(false) 
  // };
  // reactRoot: any = null;

  constructor(
    private store: Store, private router: Router,
    private formBuilder: FormBuilder, public cartService: CartService,
        private modalService: NgbModal,
        private sanitizer: DomSanitizer,
        private orderService: OrderService,
        private notificationService: NotificationService,
        private authService: AuthService
      ) {
    this.store.dispatch(new GetSettingOption());

    this.form = this.formBuilder.group({
      products: this.formBuilder.array([], [Validators.required]),
      shipping_address_id: new FormControl('', [Validators.required]),
      billing_address_id: new FormControl('', [Validators.required]),
      points_amount: new FormControl(false),
      wallet_balance: new FormControl(false),
      coupon: new FormControl(),
      delivery_description: new FormControl('', [Validators.required]),
      delivery_interval: new FormControl(),
      payment_method: new FormControl('', [Validators.required]),
      create_account: new FormControl(false),
      name: new FormControl('', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      country_code: new FormControl('91', [Validators.required]),
      phone: new FormControl('', [
        Validators.required, 
        Validators.pattern(/^[0-9]{10}$/),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]),
      password: new FormControl('', [
        Validators.minLength(6)
      ]),
      password_confirmation: new FormControl('', [
        Validators.minLength(6)
      ]),
      shipping_address: new FormGroup({
        title: new FormControl('', [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]),
        street: new FormControl('', [Validators.required]),
        city: new FormControl('', [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]),
        phone: new FormControl('', [
          Validators.required, 
          Validators.pattern(/^[0-9]{10}$/),
          Validators.minLength(10),
          Validators.maxLength(10)
        ]),
        pincode: new FormControl('', [Validators.required]),
        country_code: new FormControl('91', [Validators.required]),
        country_id: new FormControl('', [Validators.required]),
        state_id: new FormControl('', [Validators.required]),
      }),
      billing_address: new FormGroup({
        same_shipping: new FormControl(false),
        title: new FormControl('', [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]),
        street: new FormControl('', [Validators.required]),
        city: new FormControl('', [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]),
        phone: new FormControl('', [
          Validators.required, 
          Validators.pattern(/^[0-9]{10}$/),
          Validators.minLength(10),
          Validators.maxLength(10)
        ]),
        pincode: new FormControl('', [Validators.required]),
        country_code: new FormControl('91', [Validators.required]),
        country_id: new FormControl('', [Validators.required]),
        state_id: new FormControl('', [Validators.required]),
      })
    });
    
    const setting = this.store.selectSnapshot(state => state.setting);
    if (setting && setting.setting && setting.setting.activation) {
      setting.setting.activation.guest_checkout = true;
    }
    
    // Watch for access token changes to dynamically update form controls
    this.accessToken$.subscribe(token => {
       this.updateFormControls(!!token);
    });

    this.form.get('billing_address.same_shipping')?.valueChanges.subscribe(value => {
      if(value) {
        this.form.get('billing_address.title')?.setValue(this.form.get('shipping_address.title')?.value);
        this.form.get('billing_address.street')?.setValue(this.form.get('shipping_address.street')?.value);
        this.form.get('billing_address.country_id')?.setValue(this.form.get('shipping_address.country_id')?.value);
        this.form.get('billing_address.state_id')?.setValue(this.form.get('shipping_address.state_id')?.value);
        this.form.get('billing_address.city')?.setValue(this.form.get('shipping_address.city')?.value);
        this.form.get('billing_address.pincode')?.setValue(this.form.get('shipping_address.pincode')?.value);
        this.form.get('billing_address.country_code')?.setValue(this.form.get('shipping_address.country_code')?.value);
        this.form.get('billing_address.phone')?.setValue(this.form.get('shipping_address.phone')?.value);
      } else {
        this.form.get('billing_address.title')?.setValue('');
        this.form.get('billing_address.street')?.setValue('');
        this.form.get('billing_address.country_id')?.setValue('');
        this.form.get('billing_address.state_id')?.setValue('');
        this.form.get('billing_address.city')?.setValue('');
        this.form.get('billing_address.pincode')?.setValue('');
        this.form.get('billing_address.country_code')?.setValue('');
        this.form.get('billing_address.phone')?.setValue('');
      }
    });
    
    this.cartService.getUpdateQtyClickEvent().subscribe(() => {
      this.products();
      this.checkout();
    });

    this.form.controls['phone']?.valueChanges.subscribe((value) => {
      if(value && value.toString().length > 10) {
        this.form.controls['phone']?.setValue(+value.toString().slice(0, 10));
      }
    });

    this.form.get('shipping_address.phone')?.valueChanges.subscribe((value) => {
      if(value && value.toString().length > 10) {
        this.form.get('shipping_address.phone')?.setValue(+value.toString().slice(0, 10));
      }
    });

    this.form.get('billing_address.phone')?.valueChanges.subscribe((value) => {
      if(value && value.toString().length > 10) {
        this.form.get('billing_address.phone')?.setValue(+value.toString().slice(0, 10));
      }
    });

    // Prevent invalid characters in name field
    this.form.controls['name']?.valueChanges.subscribe((value) => {
      if(value) {
        // Remove any numbers and special characters, keep only letters and spaces
        const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        if(value !== cleanValue) {
          this.form.controls['name']?.setValue(cleanValue);
        }
      }
    });

    // Prevent invalid characters in shipping address title field
    this.form.get('shipping_address.title')?.valueChanges.subscribe((value) => {
      if(value) {
        // Remove any numbers and special characters, keep only letters and spaces
        const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        if(value !== cleanValue) {
          this.form.get('shipping_address.title')?.setValue(cleanValue);
        }
      }
    });

    // Prevent invalid characters in billing address title field
    this.form.get('billing_address.title')?.valueChanges.subscribe((value) => {
      if(value) {
        // Remove any numbers and special characters, keep only letters and spaces
        const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        if(value !== cleanValue) {
          this.form.get('billing_address.title')?.setValue(cleanValue);
        }
      }
    });

    // Prevent invalid characters in shipping address city field
    this.form.get('shipping_address.city')?.valueChanges.subscribe((value) => {
      if(value) {
        // Remove any numbers and special characters, keep only letters and spaces
        const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        if(value !== cleanValue) {
          this.form.get('shipping_address.city')?.setValue(cleanValue);
        }
      }
    });

    // Prevent invalid characters in billing address city field
    this.form.get('billing_address.city')?.valueChanges.subscribe((value) => {
      if(value) {
        // Remove any numbers and special characters, keep only letters and spaces
        const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        if(value !== cleanValue) {
          this.form.get('billing_address.city')?.setValue(cleanValue);
        }
      }
    });
    
    const accountData = localStorage.getItem('account');
    this.localUserCheck = accountData ? JSON.parse(accountData) : null;
    
  }

  get productControl(): FormArray {
    return this.form.get("products") as FormArray;
  } 

  ngOnInit() {
    this.checkout$.subscribe(data => this.checkoutTotal = data);
    this.products();
    
    // Reset loading state when component initializes
    this.loading = false;
  }

  products() {
    this.cartItem$.subscribe(items => {
      this.productControl.clear();
      items.forEach((item: Cart) =>
        this.productControl.push(
          this.formBuilder.group({
            product_id: new FormControl(item?.product_id, [Validators.required]),
            variation_id: new FormControl(item?.variation_id ? item?.variation_id : ''),
            quantity: new FormControl(item?.quantity),
          })
      ));
    });
  }

  selectShippingAddress(id: number) {
    if(id) {
      this.form.controls['shipping_address_id'].setValue(Number(id));
      this.checkout();
    }
  }

  selectBillingAddress(id: number) {
    if(id) {
      this.form.controls['billing_address_id'].setValue(Number(id));
      this.checkout();
    }
  }

  selectDelivery(value: DeliveryBlock) {
    this.form.controls['delivery_description'].setValue(value?.delivery_description);
    this.form.controls['delivery_interval'].setValue(value?.delivery_interval);
    this.checkout();
  }

  selectPaymentMethod(value: string) {
    this.form.controls['payment_method'].setValue(value);
    this.payment_method = value;
    this.checkout(value);
  }
  
  // CashFree Payment Integration
  initiateRadhaRamanIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.storeData?.order?.checkout
    };

    this.cartService.initiateRadhaRamanIntent({
      uuid: payload.uuid,
      email: payload.email,
        total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`
    }).subscribe({
      next: (response) => {
        if (response?.R && response?.data) {
          try {
            const zyaadaPayData = response.data;
            
            if (zyaadaPayData?.payment_url) {
              // Store payment info in session storage
              sessionStorage.setItem('payment_uuid', uuid);
              sessionStorage.setItem('payment_method', payment_method);
              sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = zyaadaPayData.payment_url;
            } else {
              console.error("Invalid response: Payment link is missing.");
            }
          } catch (error) {
              console.error("Error parsing Zyaada Pay response:", error);
          }
        } else {
          console.error("Payment initiation failed:", response?.msg);
        }
      },
      error: (err) => {
        console.log("Error initiating payment:", err);
      }
    });
  }   

  // StarPaisa Radha Payment Integration
  initiateStarpaisaRadhaIntent(payment_method: string) {
    const uuid = uuidv4();
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.storeData?.order?.checkout
    };

    const paymentData = {
      uuid: payload.uuid,
      email: parsedUserData.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`,
      payment_method: payment_method,
      amount: this.checkoutTotal?.total?.total,
      customer_name: parsedUserData.name,
      customer_phone: parsedUserData.phone,
      customer_email: parsedUserData.email
    };

    console.log('StarPaisa Radha Payment Data:', paymentData);
    console.log('StarPaisa Radha UUID:', uuid);
    console.log('StarPaisa Radha Payment Method:', payment_method);

    this.cartService.initiateStarpaisaRadhaIntent(paymentData).subscribe({
      next: (response: any) => {
        console.log('StarPaisa Radha Response:', response);
        this.handleStarpaisaRadhaResponse(response, uuid, payment_method);
      },
      error: (err: any) => {
        console.log("StarPaisa Radha payment initiation failed:", err);
        this.notificationService.showError('Payment initiation failed. Please try again.');
      }
    });
  }

  // Handle StarPaisa Radha response
  handleStarpaisaRadhaResponse(response: any, uuid: string, payment_method: string) {
    if (response?.R && response?.data) {
      try {
        const starpaisaData = response.data;

        if (starpaisaData?.payment_url) {
          // Store payment info in session storage for same-page flow
          sessionStorage.setItem('payment_uuid', uuid);
          sessionStorage.setItem('payment_method', payment_method);
          sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
          sessionStorage.setItem('payment_url', starpaisaData.payment_url);
          
          // Open the payment page in the same tab/window
          window.location.href = starpaisaData.payment_url;
        } else {
          console.error("Invalid response: Payment link is missing.");
          this.notificationService.showError('Invalid payment response. Please try again.');
        }
      } catch (error) {
          console.error("Error parsing StarPaisa Radha response:", error);
          this.notificationService.showError('Payment response error. Please try again.');
      }
    } else {
      console.error("Payment initiation failed:", response?.msg);
      this.notificationService.showError(response?.msg || 'Payment initiation failed. Please try again.');
    }
  }

  // This method is no longer needed for same-page payment flow
  // checkTransactionStatusStarpaisaRadha method removed

  // Haodapay (Secure UPI Payment) Integration
  initiateHaodapayIntent(payment_method: string) {
    const uuid = uuidv4();
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const paymentData = {
      uuid: uuid,
      email: parsedUserData.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`,
      payment_method: payment_method,
      amount: this.checkoutTotal?.total?.total,
      customer_name: parsedUserData.name,
      customer_phone: parsedUserData.phone,
      customer_email: parsedUserData.email
    };

    this.cartService.initiateHaodapayIntent(paymentData).subscribe({
      next: (response: any) => {
        this.handleHaodapayResponse(response, uuid, payment_method);
      },
      error: (err: any) => {
        console.log("Haodapay payment initiation failed:", err);
        this.notificationService.showError('Payment initiation failed. Please try again.');
      }
    });
  }

  // Handle Haodapay response
  handleHaodapayResponse(response: any, uuid: string, payment_method: string) {
    if (response?.R && response?.data) {
      try {
        const haodapayData = response.data;
        if (haodapayData?.payment_url) {
          // Store payment info in session storage for same-page flow
          sessionStorage.setItem('payment_uuid', uuid);
          sessionStorage.setItem('payment_method', payment_method);
          sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
          sessionStorage.setItem('payment_url', haodapayData.payment_url);
          // Redirect to the payment page
          window.location.href = haodapayData.payment_url;
        } else {
          console.error("Invalid response: Payment link is missing.");
          this.notificationService.showError('Invalid payment response. Please try again.');
        }
      } catch (error) {
        console.error("Error parsing Haodapay response:", error);
        this.notificationService.showError('Payment response error. Please try again.');
      }
    } else {
      console.error("Haodapay payment initiation failed:", response?.msg);
      this.notificationService.showError(response?.msg || 'Payment initiation failed. Please try again.');
    }
  }

  handlePaymentSuccess(response: any, action: any, uuid: string, payment_method: string) {
    if (response.status) {
      // Store payment info in session storage
      sessionStorage.setItem('payment_uuid', uuid);
      sessionStorage.setItem('payment_method', payment_method);
      sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
      
      // Create order data with UUID
      const formData = {
        ...this.form.value,
        uuid: uuid
      };

      // Place the order after successful payment
      this.orderService.placeOrder(formData).pipe(
        tap({
          next: result => {
            console.log('Order placed successfully:', result);
            localStorage.setItem('order_id', JSON.stringify(result.order_number));
            
            if (!result.is_guest) {
              this.router.navigateByUrl(`/account/order/details/${result.order_number}`);
            } else {
              this.router.navigate(['order/details'], { 
                queryParams: { 
                  order_number: result.order_number, 
                  email_or_phone: formData.email 
                } 
              });
            }
          },
          error: err => {
            console.error('Error placing order:', err);
            this.notificationService.showError('Error placing order. Please contact support.');
          }
        })
      ).subscribe();
    } else {
      console.log('Payment failed or cancelled:', response.reason);
      this.notificationService.showError('Payment was cancelled or failed. Please try again.');
    }
  }
  
  paybyNeoNext() {
    this.payByNeoStep = 1;
  }

  paybyNeoDone() {
    this.payByNeoStep = 0;
    this.modalService.dismissAll();
    this.pollingSubscription.unsubscribe();
  }


  togglePoint(event: Event) {
    this.form.controls['points_amount'].setValue((<HTMLInputElement>event.target)?.checked);
    this.checkout();
  }

  toggleWallet(event: Event) {
    this.form.controls['wallet_balance'].setValue((<HTMLInputElement>event.target)?.checked);
    this.checkout();
  }

  showCoupon() {
    this.coupon = true;
  }

  setCoupon(value?: string) {
    this.couponError = null;

    if(value)
      this.form.controls['coupon'].setValue(value);
    else
      this.form.controls['coupon'].reset();

    this.store.dispatch(new Checkout(this.form.value)).subscribe({
      error: (err) => {
        this.couponError = err.message;
      },
      complete: () => {
        this.appliedCoupon = value ? true : false;
        this.couponError = null;
      }
    });
  }

  couponRemove() {
    this.setCoupon();
  }

  shippingCountryChange(data: Select2UpdateEvent) {
    if(data && data?.value) {
      this.shippingStates$ = this.store
          .select(StateState.states)
          .pipe(map(filterFn => filterFn(+data?.value)));
    } else {
      this.form.get('shipping_address.state_id')?.setValue('');
      this.shippingStates$ = of();
    }
  }

  billingCountryChange(data: Select2UpdateEvent) {
    if(data && data?.value) {
      this.billingStates$ = this.store
          .select(StateState.states)
          .pipe(map(filterFn => filterFn(+data?.value)));
      if(this.form.get('billing_address.same_shipping')?.value) {
        setTimeout(() => {
          this.form.get('billing_address.state_id')?.setValue(this.form.get('shipping_address.state_id')?.value);
        }, 200);
      }
    } else {
      this.form.get('billing_address.state_id')?.setValue('');
      this.billingStates$ = of();
    }
  }

  private updateFormControls(isAuthenticated: boolean) {
    if (isAuthenticated) {
      // Add Authenticated Controls if missing
      if (!this.form.contains('shipping_address_id')) {
        this.form.addControl('shipping_address_id', new FormControl('', [Validators.required]));
      }
      if (!this.form.contains('billing_address_id')) {
        this.form.addControl('billing_address_id', new FormControl('', [Validators.required]));
      }
      if (!this.form.contains('points_amount')) {
        this.form.addControl('points_amount', new FormControl(false));
      }
      if (!this.form.contains('wallet_balance')) {
        this.form.addControl('wallet_balance', new FormControl(false));
      }

      // Restore specific validators for authenticated users
      this.form.controls['payment_method'].setValidators([Validators.required]);

      // Remove Guest Controls
      this.form.removeControl('create_account');
      this.form.removeControl('name');
      this.form.removeControl('email');
      this.form.removeControl('phone');
      this.form.removeControl('password');
      this.form.removeControl('password_confirmation');
      this.form.removeControl('shipping_address');
      this.form.removeControl('billing_address');

    } else {
      // Add Guest Controls if missing
      if (!this.form.contains('shipping_address')) {
        this.form.addControl('shipping_address', new FormGroup({
          title: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          street: new FormControl('', [Validators.required]),
          city: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/), Validators.minLength(10), Validators.maxLength(10)]),
          pincode: new FormControl('', [Validators.required]),
          country_code: new FormControl('91', [Validators.required]),
          country_id: new FormControl('', [Validators.required]),
          state_id: new FormControl('', [Validators.required]),
        }));
      }
      if (!this.form.contains('billing_address')) {
        this.form.addControl('billing_address', new FormGroup({
          same_shipping: new FormControl(false),
          title: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          street: new FormControl('', [Validators.required]),
          city: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/), Validators.minLength(10), Validators.maxLength(10)]),
          pincode: new FormControl('', [Validators.required]),
          country_code: new FormControl('91', [Validators.required]),
          country_id: new FormControl('', [Validators.required]),
          state_id: new FormControl('', [Validators.required]),
        }));
      }
      if (!this.form.contains('create_account')) {
        this.form.addControl('create_account', new FormControl(false));
        this.form.addControl('name', new FormControl(''));
        this.form.addControl('password', new FormControl(''));
        this.form.addControl('password_confirmation', new FormControl(''));
      }

      // Remove Authenticated Controls
      this.form.removeControl('shipping_address_id');
      this.form.removeControl('billing_address_id');
      this.form.removeControl('points_amount');
      this.form.removeControl('wallet_balance');
    }
    this.form.updateValueAndValidity();
  }

  checkout(payment_method?:string) {
    // If has coupon error while checkout
    if(this.couponError){
      this.couponError = null;
      this.cpnRef.nativeElement.value = '';
      this.form.controls['coupon'].reset();
    }

    if(this.form.valid) {
      this.loading = true;
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        this.loading = false;
        console.warn('Checkout request timed out');
      }, 15000); // 15 second timeout
      
      this.store.dispatch(new Checkout(this.form.value)).subscribe({
        next:(value) => {
          this.storeData = value;
          this.checkoutTotal = value.order.checkout;
        },
        error: (err) => {
          this.loading = false;
          clearTimeout(timeout);
          throw new Error(err);
        },
        complete: () => {
          this.loading = false;
          clearTimeout(timeout);
          this.form.controls['payment_method'].updateValueAndValidity();
        }
      });
    } else {
      const invalidFields = Object?.keys(this.form?.controls).filter(key => this.form.controls[key].invalid);
      console.warn('Form is invalid, skipping checkout API hit. Invalid fields:', invalidFields);
      // For debugging in UI if needed: 
      // this.notificationService.showError('Form Invalid: ' + invalidFields.join(', '));
    }
  }

  registerOnly() {
    this.form.markAllAsTouched();
    // Check only the fields required for registration
    const registrationFields = ['name', 'email', 'phone', 'password', 'country_code'];
    let isValid = true;
    registrationFields.forEach(field => {
      if(this.form.get(field)?.invalid) isValid = false;
    });

    if (isValid) {
      this.loading = true;
      const registerPayload = {
        ...this.form.value,
        password_confirmation: this.form.value.password
      };
      
      this.store.dispatch(new Register(registerPayload)).subscribe({
        next: () => {
           this.loading = false;
           this.notificationService.showSuccess('Account created successfully! You are now logged in.');
           // Refresh user details to populate AccountState
           this.store.dispatch(new GetUserDetails());
           // Refresh address modal data after becoming authenticated
           if (this.AddressModal) {
             this.AddressModal.downloadPINAreaExcelJSON();
           }
           // No redirect needed, the UI will react to the login state
        },
        error: (err) => {
           this.loading = false;
           this.notificationService.showError('Account creation failed: ' + err.message);
        }
      });
    } else {
      this.notificationService.showError('Please fill in all required account details correctly.');
    }
  }

  placeorder() {
    if (this.form.valid) {
      if (this.cpnRef && !this.cpnRef.nativeElement.value) {
        this.form.controls['coupon'].reset();
      }

      // If "Create Account" is checked, register the user first
      if (this.form.get('create_account')?.value) {
        const registerPayload = {
          ...this.form.value,
          password_confirmation: this.form.value.password // Ensure matching password
        };
        
        this.store.dispatch(new Register(registerPayload)).subscribe({
          next: () => {
             // Refresh user details to populate AccountState
             this.store.dispatch(new GetUserDetails());
             // Refresh address modal data after becoming authenticated
             if (this.AddressModal) {
               this.AddressModal.downloadPINAreaExcelJSON();
             }
             // Successfully registered (and logged in by State), now place order
             this.executeOrderPlacement();
          },
          error: (err) => {
             this.notificationService.showError('Account creation failed: ' + err.message);
          }
        });
      } else {
        this.executeOrderPlacement();
      }
    }
  }

  private executeOrderPlacement() {
    // For StarPaisa Radha, initiate payment first (like your other website)
    if (this.payment_method === 'starpaisa_radha') {
      this.initiateStarpaisaRadhaIntent(this.payment_method);
      return;
    }

    // For Haodapay (Secure UPI Payment), initiate payment first
    if (this.payment_method === 'radharaman_haodapay') {
      this.initiateHaodapayIntent(this.payment_method);
      return;
    }

    // For other payment methods, use the existing flow
    const uuid = uuidv4();

    const formData = {
      ...this.form.value,
      uuid: uuid
    }

    let action = new PlaceOrder(formData);

    this.orderService.placeOrder(action?.payload).pipe(
      tap({
        next: result => {
          console.log(result);
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    ).subscribe({
      next: (result) => {
        if (this.payment_method === 'radha_cashfree') {
          this.initiateRadhaRamanIntent(this.payment_method, uuid, result);
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  paybyqr() {
    this.modalService.dismissAll();
    // PlaceOrder Here
  }

  clearCart(){
    this.store.dispatch(new ClearCart());
  }

  ngOnDestroy() {
    this.form.reset();
    this.pollingSubscription && this.pollingSubscription.unsubscribe();
  }
  
}
