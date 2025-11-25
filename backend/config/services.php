<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    'relwox' => [
        'base_url' => env('RELWOX_BASE_URL', 'https://payments.relworx.com/api'),
        'api_key' => env('RELWOX_API_KEY'),
        'account_no' => env('RELWOX_ACCOUNT_NO'),
        'webhook_secret' => env('RELWOX_WEBHOOK_SECRET'),
    ],

    'ezzyconnect' => [
        'api_key' => env('EZZYCONNECT_API_KEY'),
        'api_url' => env('EZZYCONNECT_API_URL'),
    ],

    'mobispay' => [
        'base_url' => env('MOBISPAY_BASE_URL'),
        'client_id' => env('MOBISPAY_CLIENT_ID'),
        'client_secret' => env('MOBISPAY_CLIENT_SECRET'),
        'merchant_code' => env('MOBISPAY_MERCHANT_CODE'),
        // Prefer providing a dedicated RSA private key (PKCS#1 or PKCS#8 PEM) for signing.
        // Two ways to configure:
        // 1. MOBISPAY_PRIVATE_KEY_PATH -> Absolute path to readable PEM file.
        // 2. MOBISPAY_PRIVATE_KEY      -> Raw PEM string (use multiline value or base64 encode externally & decode before setting).
        // If both are set, MOBISPAY_PRIVATE_KEY is used.
        'private_key' => env('MOBISPAY_PRIVATE_KEY'),
        'private_key_path' => env('MOBISPAY_PRIVATE_KEY_PATH'),
    ],
];
