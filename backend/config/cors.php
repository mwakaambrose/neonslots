<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8000',
        'https://www.neonslots.site',
        'https://neonslots.site',
        'https://admin.neonslots.site', // Allow admin subdomain if needed
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 3600, // Cache preflight requests for 1 hour
    'supports_credentials' => true,
];
