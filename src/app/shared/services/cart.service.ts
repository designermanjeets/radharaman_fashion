import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../../environments/environment";
import { Cart, CartAddOrUpdate, CartModel } from "../interface/cart.interface";


@Injectable({
  providedIn: "root",
})
export class CartService {
  
  private subjectQty = new Subject<boolean>();
  private paymentReturnSubject = new Subject<{uuid: string, method: string, payload: any}>();

  constructor(private http: HttpClient) {}

  getCartItems(): Observable<CartModel> {
    return this.http.get<CartModel>(`${environment.URL}/cart`);
  }

  addToCart(payload: CartAddOrUpdate): Observable<CartModel> {
    return this.http.post<CartModel>(`${environment.URL}/cart`, payload);
  }

  updateQty() {
    this.subjectQty.next(true);
  }

  getUpdateQtyClickEvent(): Observable<boolean>{ 
    return this.subjectQty.asObservable();
  }

  updateCart(payload: CartAddOrUpdate): Observable<CartModel> {
    return this.http.put<CartModel>(`${environment.URL}/cart`, payload);
  }

  replaceCart(payload: CartAddOrUpdate): Observable<CartModel> {
    return this.http.put<CartModel>(`${environment.URL}/replace/cart`, payload);
  }

  deleteCart(id: number): Observable<number> {
    return this.http.delete<number>(`${environment.URL}/cart/${id}`);
  }

  clearCart() {
    return this.http.delete<number>(`${environment.URL}/clear/cart`);
  } 

  syncCart(payload: CartAddOrUpdate[]): Observable<CartModel> {
    return this.http.post<CartModel>(`${environment.URL}/sync/cart`, payload);
  }

  initiateSubPaisa(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/initiate-payment`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Ensure JSON data format
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateNeoKredIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/newcred-initiate-payment`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  checkTransectionStatusNeoKred(uuid: any, payment_method: string) {
    return this.http.post<any>(`${environment.URL}/check-payment-response`,{ uuid: uuid, payment_method});
  }

  initiateCashFreeIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/generate-cash-free`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateZyaadaPayIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/zyaadapaisa-initiate-payment`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateEaseBuzzIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/ease-buzz-initiate-payment`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateZyaadaPayGajIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/zyaadapaisa-gaj-initiate-payment`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateRadhaRamanIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/radharaman-initiate-payment`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateStarpaisaRadhaIntent(data: any): Observable<any> {
    return new Observable(observer => {
      console.log('StarPaisa Radha - Sending data:', data);
      console.log('StarPaisa Radha - URL:', `${environment.URL}/radharaman-initiate-payment-star-paisa`);
      
      fetch(`${environment.URL}/radharaman-initiate-payment-star-paisa`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => {
          console.log('StarPaisa Radha - Response status:', response.status);
          console.log('StarPaisa Radha - Response headers:', response.headers);
          
          if (!response.ok) {
            return response.text().then(text => {
              console.log('StarPaisa Radha - Error response body:', text);
              throw new Error(`HTTP ${response.status}: ${text}`);
            });
          }
          
          return response.json();
        })
        .then(data => {
          console.log('StarPaisa Radha - Success response:', data);
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          console.error('StarPaisa Radha - Error:', error);
          observer.error(error);
        });
    });
  }

  checkTransectionStatusStarpaisaRadha(uuid: any, payment_method: string) {
    return this.http.post<any>(`${environment.URL}/check-payment-response`,{ uuid: uuid, payment_method});
  }
}
