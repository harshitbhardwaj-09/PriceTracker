'use client'
import { googleProductSave, googleShoppingResult } from "@/lib/scrape";
import Link from "next/link";
import { useEffect,useState } from "react";
import { usePathname, useRouter } from 'next/navigation'
import { Toaster, toast } from "sonner";

interface Product {
  position: number;
  title: string;
  link: string;
  product_link: string;
  product_id: string;
  serpapi_product_api: string;
  source: string;
  price: string;
  extracted_price: number;
  second_hand_condition?: string;
  rating?: number;
  reviews?: number;
  extensions: any[];
  thumbnail: string;
  delivery: string;
}

  const ShoppingResult = () => {
  const title = usePathname();
  const router = useRouter();
    // console.log("herehello")
    console.log(title);
    const [shopResult, setShopResult] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        async function fetchData() {
            try {
              // Check if we have cached results for this search
              const cacheKey = `shopping_${title}`;
              const cachedData = sessionStorage.getItem(cacheKey);
              const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
              
              // Use cached data if it exists and is less than 5 minutes old
              if (cachedData && cacheTime) {
                const cacheAge = Date.now() - parseInt(cacheTime);
                if (cacheAge < 5 * 60 * 1000) { // 5 minutes
                  console.log('Using cached shopping results');
                  setShopResult(JSON.parse(cachedData));
                  setIsLoading(false);
                  return;
                }
              }
              
              const promise = () => new Promise((resolve) => setTimeout(() => resolve({ name: 'Sonner' }), 2500));
              toast.promise(promise, {
              loading: 'Loading... Hold on tight',
              position: 'top-center',
              success: (title) => {
              return `result based on yours search`;
             },
          error: 'Error',
});
               const products = await googleShoppingResult(title!);
               
               // Check if rate limited or error
               if (products && typeof products === 'object' && 'error' in products) {
                 // Check if we have old cached data to show
                 if (cachedData) {
                   console.log('Rate limited, showing cached results');
                   toast.warning('Showing cached results. Rate limit exceeded.');
                   setShopResult(JSON.parse(cachedData));
                 } else {
                   toast.error('Rate limit exceeded. Please wait and try again.');
                   setShopResult([]);
                 }
                 setIsLoading(false);
                 return;
               }
               
               // Ensure products is an array
               if (Array.isArray(products) && products.length > 0) {
                 setShopResult(products);
                 // Cache the results
                 sessionStorage.setItem(cacheKey, JSON.stringify(products));
                 sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
               } else {
                 console.warn('No products found or invalid response');
                 setShopResult([]);
               }
               setIsLoading(false);
            } catch (error) {
                console.error("Error occurred while fetching data:", error);
                toast.error('Failed to fetch products');
                setShopResult([]);
                setIsLoading(false);
            }
        }
    
        fetchData(); 
    
    }, [title]);

    async function handleClick(ProductGoogle:Product) {
       try {
        console.log("url sent");
        const promise = () => new Promise((resolve) => setTimeout(() => resolve({ name: 'Sonner' }), 2000));
              toast.promise(promise, {
              loading: 'Loading... redirecting',
              position: 'top-center',
              success: (title) => {
              return `redirecting on yours Product page`;
             },
          error: 'Error',
});
        const sendData = await googleProductSave(ProductGoogle);
        console.log(`front end url ${sendData}`)
        router.push(`/products/${sendData}`);
        
       } catch (error) {
        console.error("Error occurred while fetching data:", error);
       }
    }
    
    
return(
  <div className="flex flex-wrap pt-24 items-center justify-evenly px-8 gap-x-8 gap-y-16">
    {isLoading ? (
      <div className="w-full text-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
          <p className="text-2xl text-gray-700 font-medium">Loading results...</p>
          <p className="text-lg text-gray-500">Please wait while we fetch products for you</p>
        </div>
      </div>
    ) : shopResult.length === 0 ? (
      <div className="w-full text-center py-20">
        <p className="text-2xl text-gray-500">No products found. Try a different search or wait for rate limit to reset.</p>
      </div>
    ) : (
      shopResult.map((product:any, index:any) => (
        <div key={index} className="sm:w-[292px] sm:max-w-[292px] w-full flex-1 flex flex-col gap-4 rounded-md" >
     <Link href={"#"} onClick={() => handleClick(product)} className="sm:w-[292px] sm:max-w-[292px] w-full flex-1 flex flex-col gap-4 rounded-md">
           <div className="flex-1 relative flex flex-col gap-5 p-4 rounded-md">
             <img 
               src={product.thumbnail}
               alt={product.title}
               width={200}
               height={200}
               className="max-h-[250px] object-contain w-full h-full bg-transparent"
             />
           </div>
     
           <div className="flex flex-col gap-3">
             <h3 className="text-secondary text-xl leading-6 font-semibold truncate">{product.title}</h3>
     
             <div className="flex justify-between">
               <p className="text-black opacity-50 text-lg capitalize">
                 {product.rating}
               </p>
     
               <p className="text-black text-lg font-semibold">
                 <span>{product?.price}</span>
                 <span>{product?.extracted_old_price}</span>
               </p>
             </div>
           </div>
         </Link>
         </div>
        ))
    )}
        </div>
);
}

export default ShoppingResult;