# CORS Error Fix

## The Problem

You're getting this error:
```
Access to fetch at 'https://admin.neonslots.site/api/auth/send-otp' 
from origin 'https://www.neonslots.site' has been blocked by CORS policy
```

This happens because:
1. Your **frontend** (`www.neonslots.site`) is making direct API calls to your **backend** (`admin.neonslots.site`)
2. The browser blocks cross-origin requests unless the server explicitly allows them
3. The CORS middleware wasn't properly registered in Laravel

## ✅ Solution 1: Fixed CORS in Laravel (For Vite Frontend)

I've updated your `backend/bootstrap/app.php` to register the CORS middleware:

```php
$middleware->api(prepend: [
    \Illuminate\Http\Middleware\HandleCors::class,
]);
```

And updated `backend/config/cors.php` to:
- Include your production domain
- Set `max_age` to cache preflight requests

**After deploying, clear config cache:**
```bash
php artisan config:clear
php artisan cache:clear
```

## ✅ Solution 2: Use Next.js (No CORS Issues!)

**The better long-term solution** is to use the Next.js frontend I created (`frontend-next/`), which:
- ✅ **No CORS issues** - API calls go through Next.js server
- ✅ **Secure** - Backend URL never exposed to browser
- ✅ **HTTP-only cookies** - Auth tokens can't be stolen via XSS

### How Next.js Solves CORS

```
Old (Vite): Browser → admin.neonslots.site (CORS needed ❌)
New (Next.js): Browser → www.neonslots.site/api/* → admin.neonslots.site (No CORS! ✅)
```

The Next.js API routes run **on the server**, so they can call your backend without CORS restrictions.

## Testing the Fix

1. **Clear Laravel config cache:**
   ```bash
   cd backend
   php artisan config:clear
   ```

2. **Test the API directly:**
   ```bash
   curl -X OPTIONS https://admin.neonslots.site/api/auth/send-otp \
     -H "Origin: https://www.neonslots.site" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

   You should see `Access-Control-Allow-Origin: https://www.neonslots.site` in the response headers.

3. **If still failing**, check:
   - Web server (nginx/apache) isn't stripping CORS headers
   - No reverse proxy blocking headers
   - Laravel logs for errors

## Quick Checklist

- [x] CORS middleware registered in `bootstrap/app.php`
- [x] `config/cors.php` includes `https://www.neonslots.site`
- [ ] Config cache cleared (`php artisan config:clear`)
- [ ] Web server allows CORS headers
- [ ] Tested with curl/Postman

## Recommended: Migrate to Next.js

The Next.js version eliminates CORS entirely. See `/frontend-next/README.md` for setup instructions.

