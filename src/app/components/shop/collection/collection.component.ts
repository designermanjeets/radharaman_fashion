import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Title, Meta } from '@angular/platform-browser';
import { Params } from '../../../shared/interface/core.interface';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { ProductModel } from '../../../shared/interface/product.interface';
import { GetProducts } from '../../../shared/action/product.action';
import { ProductState } from '../../../shared/state/product.state';
import { ThemeOptionState } from '../../../shared/state/theme-option.state';
import { Option } from '../../../shared/interface/theme-option.interface';
 
@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent {

  @Select(ProductState.product) product$: Observable<ProductModel>;
  @Select(ThemeOptionState.themeOptions) themeOptions$: Observable<Option>;

  public breadcrumb: Breadcrumb = {
    title: "Collections",
    items: [{ label: 'Collections', active: false }]
  };
  public layout: string = 'collection_category_slider';
  public skeleton: boolean = true;
  
  // Category UI data
  public categoryTitle: string = '';
  public categoryDescription: string = '';

  public filter: Params = {
    'page': 1, // Current page number
    'paginate': 40, // Display per page,
    'status': 1,
    'field': 'created_at',
    'price': '',
    'category': '',
    'tag': '',
    'sort': 'asc', // ASC, DSC
    'sortBy': 'asc',
    'rating': '',
    'attribute': '',
    store_id: 21
  };

  public totalItems: number = 0;

  constructor(private route: ActivatedRoute,
    private store: Store,
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document) {

    // Get Query params..
    this.route.queryParams.subscribe(params => {
      this.filter = {
        'page': params['page'] ? params['page'] : 1,
        'paginate': 40,
        'status': 1,
        'price': params['price'] ? params['price'] : '',
        'brand': params['brand'] ? params['brand'] : '',
        'category': params['category'] ? params['category'] : '',
        'tag': params['tag'] ? params['tag'] : '',
        'field': params['field'] ? params['field'] : this.filter['field'],
        'sortBy': params['sortBy'] ? params['sortBy'] : this.filter['sortBy'],
        'rating': params['rating'] ? params['rating'] : '',
        'attribute': params['attribute'] ? params['attribute'] : '',
        store_id: 21
      }

      // Reset SEO state
      this.categoryTitle = '';
      this.categoryDescription = '';

      // Set category-specific SEO and UI states
      if (params['category'] === 'women') {
        let link: HTMLLinkElement = this.document.querySelector('link[rel="canonical"]') || this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', 'https://radharamanfashion.in/collections/women');
        this.document.head.appendChild(link);
        
        this.titleService.setTitle('Women’s Trendy Clothing Online | Radharaman Fashion');
        this.metaService.updateTag({ name: 'description', content: 'Discover fashionable women’s clothing at Radharaman Fashion. Shop stylish dresses, trendy tops, and comfortable outfits designed for modern everyday style.' });
        
        this.categoryTitle = 'Trendy Women’s Fashion for Modern Style';
        this.categoryDescription = 'Upgrade your wardrobe with stylish women’s clothing from Radharaman Fashion. From elegant dresses to trendy tops and casual outfits, our collection offers fashionable options designed for comfort, confidence, and everyday style.';
      } else if (params['category'] === 'men') {
        this.titleService.setTitle('Men’s Fashion & Ethnic Wear Online | Radharaman Fashion');
        this.metaService.updateTag({ name: 'description', content: 'Shop stylish men’s fashion online at Radharaman Fashion. Discover trendy kurtas, casual shirts, and comfortable outfits perfect for everyday and festive wear.' });
        
        this.categoryTitle = 'Stylish Men’s Fashion for Every Occasion';
        this.categoryDescription = 'Explore the latest men’s fashion at Radharaman Fashion, featuring trendy kurtas, casual shirts, and comfortable everyday outfits. Our collection blends modern style with traditional designs, perfect for work, casual outings, and festive occasions.';
      } else if (params['category'] === 'activewear') {
        this.titleService.setTitle('Activewear for Men & Women | Radharaman Fashion');
        this.metaService.updateTag({ name: 'description', content: 'Shop stylish and comfortable activewear for men and women at Radharaman Fashion. Discover gym wear, athleisure outfits, and fitness fashion online.' });
        
        this.categoryTitle = 'Comfortable & Stylish Activewear';
        this.categoryDescription = 'Stay active and stylish with the activewear collection from Radharaman Fashion. Our range includes comfortable gym wear and trendy athleisure outfits designed to support your workouts while keeping your everyday look fashionable.';
      }

      this.store.dispatch(new GetProducts(this.filter));

      // Params For Demo Purpose only
      if(params['layout']) {
        this.layout = params['layout'];
      } else {
        // Get Collection Layout
        this.themeOptions$.subscribe(option => {
          this.layout = option?.collection && option?.collection?.collection_layout
            ? option?.collection?.collection_layout : 'collection_category_slider';
        });
      }

      this.filter['layout'] = this.layout;
    });
    this.product$.subscribe(product => this.totalItems = product?.total);
  }

}
