# CORS Fix - Deployment Checklist

## Changes Made

1. ✅ Created custom `AddCorsHeaders` middleware
2. ✅ Registered CORS middleware in `bootstrap/app.php`
3. ✅ Updated `config/cors.php` with production domains

## Deployment Steps

### 1. Deploy Code Changes
```bash
# On your server
cd /path/to/backend
git pull origin main  # or your branch
```

### 2. Clear All Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Rebuild optimized cache (optional, for production)
php artisan config:cache
php artisan route:cache
```

### 3. Restart PHP-FPM / Web Server
```bash
# For PHP-FPM
sudo systemctl restart php8.2-fpm  # or your PHP version

# For Apache
sudo systemctl restart apache2

# For Nginx (usually just reload)
sudo nginx -s reload
```

### 4. Test CORS Headers

Test the preflight OPTIONS request:
```bash
curl -X OPTIONS https://admin.neonslots.site/api/auth/send-otp \
  -H "Origin: https://www.neonslots.site" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected Response:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: https://www.neonslots.site
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
< Access-Control-Allow-Credentials: true
< Access-Control-Max-Age: 3600
```

### 5. Check Web Server Configuration

If you're using **Nginx**, ensure it's not stripping headers. Check your config:

```nginx
location / {
    # Don't strip headers
    proxy_pass_header Access-Control-Allow-Origin;
    proxy_pass_header Access-Control-Allow-Credentials;
    
    # Or use this for Laravel
    try_files $uri $uri/ /index.php?$query_string;
}
```

If you're using **Apache**, check `.htaccess` isn't blocking headers.

### 6. Verify Middleware is Loaded

Check Laravel logs to ensure middleware is running:
```bash
tail -f storage/logs/laravel.log
```

Make a test request and check for any errors.

## Troubleshooting

### Still Getting CORS Errors?

1. **Check if middleware is registered:**
   ```bash
   php artisan route:list | grep api/auth
   ```

2. **Test directly with curl:**
   ```bash
   # Test actual POST request
   curl -X POST https://admin.neonslots.site/api/auth/send-otp \
     -H "Origin: https://www.neonslots.site" \
     -H "Content-Type: application/json" \
     -d '{"phone":"+256700000000"}' \
     -v
   ```

3. **Check browser console** - Look for the exact error message

4. **Verify domain matches exactly:**
   - `https://www.neonslots.site` (with www)
   - `https://neonslots.site` (without www)
   - Must match exactly in `AddCorsHeaders.php`

### Common Issues

- **Config cache not cleared** → Run `php artisan config:clear`
- **PHP-FPM not restarted** → Restart PHP-FPM service
- **Web server caching** → Clear web server cache
- **CDN/Proxy stripping headers** → Check Cloudflare/CDN settings
- **Domain mismatch** → Ensure exact match in allowed origins

## Alternative: Use Next.js (No CORS Needed!)

If CORS continues to be problematic, consider using the Next.js frontend (`frontend-next/`) which eliminates CORS entirely by proxying requests through the Next.js server.

