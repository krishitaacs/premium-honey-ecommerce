$port = 8080
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Started HTTP server on http://localhost:$port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = [Uri]::UnescapeDataString($request.Url.LocalPath.TrimStart('/'))
        if ($path -eq "") { $path = "index.html" }
        
        $fullPath = Join-Path (Get-Location) $path
        
        if (Test-Path -Path $fullPath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($fullPath)
            
            # Simple MIME type mapping
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html" }
                ".css"  { $response.ContentType = "text/css" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".png"  { $response.ContentType = "image/png" }
                default { $response.ContentType = "application/octet-stream" }
            }
            
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
