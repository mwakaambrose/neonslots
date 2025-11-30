<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddCorsHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        
        $allowedOrigins = [
            'https://www.neonslots.site',
            'https://neonslots.site',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:8000',
        ];
        
        $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : null;
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            if (!$allowedOrigin) {
                return response('', 403);
            }
            
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '3600');
        }
        
        $response = $next($request);
        
        // Add CORS headers to actual response
        if ($allowedOrigin) {
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        }
        
        return $response;
    }
}

