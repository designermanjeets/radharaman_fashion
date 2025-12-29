import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Params } from '../../../../../../shared/interface/core.interface';

@Component({
  selector: 'app-collection-price-filter',
  templateUrl: './collection-price-filter.component.html',
  styleUrls: ['./collection-price-filter.component.scss']
})
export class CollectionPriceFilterComponent implements OnChanges {

  @Input() filter: Params;

  public minPrice: number = 0;
  public maxPrice: number = 15000;
  public selectedMinPrice: number = 0;
  public selectedMaxPrice: number = 15000;

  constructor(private route: ActivatedRoute,
    private router: Router) {
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

}
