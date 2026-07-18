Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\static\logo.png"
$img = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
foreach ($size in 192, 512) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(11, 15, 25))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $size, $size)
    $out = Join-Path $PSScriptRoot "..\static\pwa-icon-$size.png"
    $bmp.Save((Resolve-Path (Split-Path $out -Parent)).Path + "\pwa-icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $fi = Get-Item (Join-Path $PSScriptRoot "..\static\pwa-icon-$size.png")
    Write-Output "pwa-icon-$size.png $($fi.Length) bytes"
}
$img.Dispose()
