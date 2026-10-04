// Portable test launcher; no dependency on a sibling development checkout.
export async function launch(options={}){
 if(process.env.ST_BROWSER_HARNESS)return (await import(process.env.ST_BROWSER_HARNESS)).launch(options);
 const {chromium}=await import('playwright');
 return chromium.launch({headless:true,...options});
}
