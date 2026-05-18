param(
    [string]$SourceImage = "minecraft-qq-backend:latest",
    [string]$TargetImage = "icemooncake/mc-qq-backend",
    [string]$Tag = "v1.1.0",
    [string]$BuildContext = ".",
    [switch]$SkipBuild
)

$targetRef = "$TargetImage`:$Tag"

if (-not $SkipBuild) {
    Write-Host "Building $SourceImage from $BuildContext"
    docker build -t $SourceImage $BuildContext
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Write-Host "Tagging $SourceImage -> $targetRef"
docker tag $SourceImage $targetRef
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Pushing $targetRef"
docker push $targetRef
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Done"
