<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

$isApiDocsEnabled = ! app()->environment('production');

Route::middleware('proxy.only')->group(function () use ($isApiDocsEnabled): void {
    Route::get('/', function () {
        return view('welcome');
    });

    Route::get('/api/openapi.json', function () use ($isApiDocsEnabled) {
        if (! $isApiDocsEnabled) {
            abort(404);
        }

        $path = base_path('docs/openapi.json');

        if (! File::exists($path)) {
            abort(404, 'OpenAPI document not found.');
        }

        return response()->file($path, [
            'Content-Type' => 'application/json; charset=UTF-8',
        ]);
    });

    Route::get('/api/docs', function () use ($isApiDocsEnabled) {
        if (! $isApiDocsEnabled) {
            abort(404);
        }

        return <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-Ticaret Test API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
      });
    </script>
  </body>
</html>
HTML;
    });
});
