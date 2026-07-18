Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\static\logo.png"
$img = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
# Scale slightly over 100% so the home-screen icon reads larger (adaptive masks crop edges).
$scale = 1.18
foreach ($size in 192, 512) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(11, 15, 25))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $draw = [int][Math]::Round($size * $scale)
    $offset = [int][Math]::Round(($size - $draw) / 2)
    $g.DrawImage($img, $offset, $offset, $draw, $draw)
    $outDir = (Resolve-Path (Join-Path $PSScriptRoot "..\static")).Path
    $out = Join-Path $outDir "pwa-icon-$size.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $fi = Get-Item $out
    Write-Output "pwa-icon-$size.png $($fi.Length) bytes (scale=$scale)"
}
$img.Dispose()
