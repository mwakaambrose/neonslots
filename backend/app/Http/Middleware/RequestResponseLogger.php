<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RequestResponseLogger
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $requestId = uniqid('req_', true);

        // Log request
        $this->logRequest($request, $requestId);

        // Process request
        $response = $next($request);

        // Calculate time of flight
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Log response
        $this->logResponse($request, $response, $requestId, $duration);

        return $response;
    }

    /**
     * Log incoming request details
     */
    private function logRequest(Request $request, string $requestId): void
    {
        $logData = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'path' => $request->path(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toIso8601String(),
        ];

        // Add authenticated user if available
        if ($user = $request->user()) {
            $logData['user_id'] = $user->id;
            $logData['user_type'] = get_class($user);
            if (method_exists($user, 'phone')) {
                $logData['user_phone'] = $user->phone;
            }
        }

        // Add request headers (excluding sensitive ones)
        $headers = $request->headers->all();
        unset($headers['authorization'], $headers['cookie']);
        $logData['headers'] = array_map(function ($header) {
            return is_array($header) ? $header[0] : $header;
        }, $headers);

        // Add request body (sanitize sensitive fields)
        $body = $request->all();
        $sensitiveFields = ['password', 'otp', 'pin', 'token', 'secret', 'api_key'];
        foreach ($sensitiveFields as $field) {
            if (isset($body[$field])) {
                $body[$field] = '***REDACTED***';
            }
        }
        $logData['body'] = $body;

        // Add query parameters
        if ($request->query->count() > 0) {
            $logData['query'] = $request->query->all();
        }

        Log::info('API Request', $logData);
    }

    /**
     * Log outgoing response details
     */
    private function logResponse(Request $request, Response $response, string $requestId, float $duration): void
    {
        $statusCode = $response->getStatusCode();
        $logLevel = $statusCode >= 500 ? 'error' : ($statusCode >= 400 ? 'warning' : 'info');

        $logData = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
            'status_code' => $statusCode,
            'status_text' => Response::$statusTexts[$statusCode] ?? 'Unknown',
            'duration_ms' => $duration,
            'timestamp' => now()->toIso8601String(),
        ];

        // Add response size if available
        if ($response->headers->has('Content-Length')) {
            $logData['response_size_bytes'] = (int) $response->headers->get('Content-Length');
        }

        // Add response body for non-successful responses or small responses
        $content = $response->getContent();
        if ($statusCode >= 400 || strlen($content) < 1000) {
            // Try to decode JSON for better readability
            $decoded = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $logData['response_body'] = $decoded;
            } else {
                $logData['response_body'] = substr($content, 0, 500);
            }
        } else {
            $logData['response_body'] = 'Response too large to log';
        }

        // Add response headers
        $responseHeaders = $response->headers->all();
        unset($responseHeaders['set-cookie']);
        $logData['response_headers'] = array_map(function ($header) {
            return is_array($header) ? $header[0] : $header;
        }, $responseHeaders);

        Log::log($logLevel, 'API Response', $logData);
    }
}

