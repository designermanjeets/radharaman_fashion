import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Params } from '../../../../../../shared/interface/core.interface';

@Component({
  selector: 'app-collection-price-filter',
  templateUrl: './collection-price-filter.component.html',
  styleUrls: ['./collection-price-filter.component.scss']
})
export class CollectionPriceFilterComponent implements OnChanges, OnDestroy {

  @Input() filter: Params;

  public minPrice: number = 300;
  public maxPrice: number = 15000;
  public selectedMinPrice: number = 300;
  public selectedMaxPrice: number = 15000;

  private scrollPosition: [number, number] = [0, 0];
  private shouldRestoreScroll: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute,
    private router: Router,
    private viewportScroller: ViewportScroller) {
    
    // Listen for navigation end events to restore scroll position
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.shouldRestoreScroll) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          this.viewportScroller.scrollToPosition(this.scrollPosition);
          this.shouldRestoreScroll = false;
        }, 0);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.filter && this.filter['price']) {
      const priceValue = this.filter['price'];
      // Handle price format: "min-max" or single value
      if (priceValue.includes('-')) {
        const [min, max] = priceValue.split('-').map(Number);
        this.selectedMinPrice = min || this.minPrice;
        this.selectedMaxPrice = max || this.maxPrice;
      } else if (!isNaN(Number(priceValue))) {
        // Single value - treat as max price
        this.selectedMaxPrice = Number(priceValue);
        this.selectedMinPrice = this.minPrice;
      }
    } else {
      // Reset to defaults if no price filter
      this.selectedMinPrice = this.minPrice;
      this.selectedMaxPrice = this.maxPrice;
    }
  }

  onMinPriceChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (value <= this.selectedMaxPrice) {
      this.selectedMinPrice = value;
      this.applyPriceFilter();
    } else {
      // If min exceeds max, swap them
      this.selectedMinPrice = this.selectedMaxPrice;
      (event.target as HTMLInputElement).value = this.selectedMinPrice.toString();
      this.applyPriceFilter();
    }
  }

  onMaxPriceChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (value >= this.selectedMinPrice) {
      this.selectedMaxPrice = value;
      this.applyPriceFilter();
    } else {
      // If max is less than min, swap them
      this.selectedMaxPrice = this.selectedMinPrice;
      (event.target as HTMLInputElement).value = this.selectedMaxPrice.toString();
      this.applyPriceFilter();
    }
  }

  onMinInputChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (value < this.minPrice) {
      this.selectedMinPrice = this.minPrice;
      (event.target as HTMLInputElement).value = this.minPrice.toString();
    } else if (value > this.selectedMaxPrice) {
      this.selectedMinPrice = this.selectedMaxPrice;
      (event.target as HTMLInputElement).value = this.selectedMaxPrice.toString();
    } else {
      this.selectedMinPrice = value;
    }
    this.applyPriceFilter();
  }

  onMaxInputChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (value > this.maxPrice) {
      this.selectedMaxPrice = this.maxPrice;
      (event.target as HTMLInputElement).value = this.maxPrice.toString();
    } else if (value < this.selectedMinPrice) {
      this.selectedMaxPrice = this.selectedMinPrice;
      (event.target as HTMLInputElement).value = this.selectedMinPrice.toString();
    } else {
      this.selectedMaxPrice = value;
    }
    this.applyPriceFilter();
  }

  getMinPercentage(): number {
    return ((this.selectedMinPrice - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
  }

  getMaxPercentage(): number {
    return ((this.selectedMaxPrice - this.minPrice) / (this.maxPrice - this.minPrice)) * 100;
  }

  applyPriceFilter() {
    // Save current scroll position before navigation
    this.scrollPosition = this.viewportScroller.getScrollPosition();
    this.shouldRestoreScroll = true;

    // Only apply filter if values have changed from defaults
    const priceValue = (this.selectedMinPrice === this.minPrice && this.selectedMaxPrice === this.maxPrice) 
      ? null 
      : `${this.selectedMinPrice}-${this.selectedMaxPrice}`;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        price: priceValue,
        page: 1
      },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  resetFilter() {
    this.selectedMinPrice = this.minPrice;
    this.selectedMaxPrice = this.maxPrice;
    this.applyPriceFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
