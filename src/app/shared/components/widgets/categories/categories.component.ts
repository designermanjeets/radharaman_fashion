import { Component, Input, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Select } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { Category, CategoryModel } from '../../../interface/category.interface';
import { CategoryState } from '../../../state/category.state';
import { AttributeService } from '../../../services/attribute.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnDestroy {

  @Select(CategoryState.category) category$: Observable<CategoryModel>;

  @Input() categoryIds: number[] = [];
  @Input() style: string = 'vertical';
  @Input() title?: string;
  @Input() image?: string;
  @Input() theme: string;
  @Input() sliderOption: OwlOptions;
  @Input() selectedCategoryId: number;
  @Input() bgImage: string;
  
  @Output() selectedCategory: EventEmitter<number> = new EventEmitter();

  public categories: Category[];
  public selectedCategorySlug: string[] = [];
  private categorySubscription: Subscription;
  private queryParamsSubscription: Subscription;

  constructor(private route: ActivatedRoute,
    public attributeService: AttributeService,
    private router: Router) {
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      this.selectedCategorySlug = params['category'] ? params['category'].split(',') : [];
    });
    
    this.updateCategories();

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoryIds']) {
      this.updateCategories();
    }
  }

  ngOnDestroy() {
    if (this.categorySubscription) {
      this.categorySubscription.unsubscribe();
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  private updateCategories() {
    if (this.categorySubscription) {
      this.categorySubscription.unsubscribe();
    }
    
    this.categorySubscription = this.category$.subscribe(res => {
      if (!res || !res.data || !Array.isArray(res.data)) {
        this.categories = [];
        return;
      }
      
      // Handle both number (1) and boolean (true) status values
      // Note: CategoryOption.ts has status as number (1), but interface defines it as boolean
      let filteredCategories = res.data.filter(category => {
        // Check for boolean true first (type-safe)
        if (category.status === true) {
          return true;
        }
        // Then check for number 1 (runtime data from CategoryOption.ts)
        // Using type assertion since interface mismatch exists
        const statusValue = (category as any).status;
        return statusValue === 1 || statusValue === '1';
      });
      
      if (this.categoryIds && this.categoryIds.length) {
        // Filter by categoryIds, but always include category 69 (Cozy Winter Wear)
        filteredCategories = filteredCategories.filter(category => 
          this.categoryIds.includes(category.id) || category.id === 69
        );
      }
      
      this.categories = filteredCategories;
    });
  }

  selectCategory(id?: number) {
    this.selectedCategory.emit(id);
  }

  redirectToCollection(slug: string) {
    let index = this.selectedCategorySlug.indexOf(slug);
    if(index === -1)
      this.selectedCategorySlug.push(slug);
    else
      this.selectedCategorySlug.splice(index,1);

    this.router.navigate(['/collections'], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCategorySlug.length ? this.selectedCategorySlug?.join(',') : null
      },
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    });
  }

  closeCanvasMenu() {
    this.attributeService.offCanvasMenu = false;
  }

}
