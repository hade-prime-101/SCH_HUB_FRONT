$uri = "http://localhost:5000/api/v1/health"
try {
  $response = Invoke-WebRequest -Uri $uri -Method GET
  Write-Host "Health Status: $($response.StatusCode)"
  Write-Host $response.Content
} catch {
  Write-Host "Error: $_"
}
