import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SuccessComponent } from './success.component';

describe('SuccessComponent', () => {
  let component: SuccessComponent;
  let fixture: ComponentFixture<SuccessComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ SuccessComponent ],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with countdown of 5', () => {
    expect(component.countdown).toBe(5);
  });

  it('should start countdown on init', () => {
    spyOn(component, 'startCountdown');
    component.ngOnInit();
    expect(component.startCountdown).toHaveBeenCalled();
  });

  it('should redirect to order details when countdown reaches 0', (done) => {
    localStorage.setItem('order_id', JSON.stringify('12345'));
    component.countdown = 1;
    
    component.startCountdown();
    
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/account/order/details', '12345']);
      done();
    }, 1100);
  });

  it('should redirect immediately when redirectNow is called', () => {
    localStorage.setItem('order_id', JSON.stringify('12345'));
    component.redirectNow();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/account/order/details', '12345']);
  });

  it('should fallback to orders page when no order ID in localStorage', () => {
    localStorage.removeItem('order_id');
    component.redirectToOrderDetails();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/account/orders']);
  });
});
