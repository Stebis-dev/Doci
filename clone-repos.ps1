Write-Host "Cloning repositories..."

$BASE_DIR = "./tests/external-projects"

$REPOSITORIES = @{
    "csharp" = @("https://github.com/exceptionnotfound/BattleshipModellingPractice.git")
    "cpp" = @("https://github.com/zer0main/battleship.git")
    "java" = @("https://github.com/cosenary/Battleship.git")
}

function Clone-Repositories {
    param (
        [string]$Language
    )

    $Repos = $REPOSITORIES[$Language]

    $TargetDir = Join-Path -Path $BASE_DIR -ChildPath $Language

    if (-not (Test-Path -Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir | Out-Null
    }

    Write-Host "Cloning repositories for $Language into $TargetDir..."

    foreach ($Repo in $Repos) {
        $RepoName = ($Repo -split '/').TrimEnd('.git')[-1]

        $ClonePath = Join-Path -Path $TargetDir -ChildPath $RepoName

        if (Test-Path -Path $ClonePath) {
            Write-Host "Repository $RepoName already exists in $TargetDir. Skipping..."
        } else {
            Write-Host "Cloning $Repo into $ClonePath..."
            git clone $Repo $ClonePath --depth 1
        }
    }
}

Write-Host "Starting to clone repositories..."

foreach ($Language in $REPOSITORIES.Keys) {
    Clone-Repositories -Language $Language
}

Write-Host "All repositories have been cloned."