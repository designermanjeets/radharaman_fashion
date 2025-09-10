import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FailureComponent } from './failure.component';

describe('FailureComponent', () => {
  let component: FailureComponent;
  let fixture: ComponentFixture<FailureComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ FailureComponent ],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FailureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with countdown of 8', () => {
    expect(component.countdown).toBe(8);
  });

  it('should clear payment data on init', () => {
    spyOn(component, 'clearPaymentData');
    component.ngOnInit();
    expect(component.clearPaymentData).toHaveBeenCalled();
  });

  it('should start countdown on init', () => {
    spyOn(component, 'startCountdown');
    component.ngOnInit();
    expect(component.startCountdown).toHaveBeenCalled();
  });

  it('should redirect to home when countdown reaches 0', (done) => {
    component.countdown = 1;
    
    component.startCountdown();
    
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      done();
    }, 1100);
  });

  it('should redirect to home immediately when redirectNow is called', () => {
    component.redirectNow();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should redirect to checkout when tryAgain is called', () => {
    component.tryAgain();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/shop/checkout']);
  });

  it('should clear payment data from storage', () => {
    // Set some test data
    sessionStorage.setItem('payment_uuid', 'test-uuid');
    sessionStorage.setItem('payment_method', 'test-method');
    sessionStorage.setItem('payment_action', 'test-action');
    sessionStorage.setItem('payment_url', 'test-url');
    localStorage.setItem('order_id', 'test-order');

    component.clearPaymentData();

    expect(sessionStorage.getItem('payment_uuid')).toBeNull();
    expect(sessionStorage.getItem('payment_method')).toBeNull();
    expect(sessionStorage.getItem('payment_action')).toBeNull();
    expect(sessionStorage.getItem('payment_url')).toBeNull();
    expect(localStorage.getItem('order_id')).toBeNull();
  });
});
