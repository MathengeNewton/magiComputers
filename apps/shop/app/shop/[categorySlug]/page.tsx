'use client';

import { useParams } from 'next/navigation';
import ProductsListing from '../../components/ProductsListing';

export default function ShopCategoryPage() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;

  return <ProductsListing basePath="shop" initialCategorySlug={categorySlug} />;
}
