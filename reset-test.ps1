param(
    [string] $Name = "xibo-test",
    [string] $Template
)

$ErrorActionPreference = "Stop"

$workspace = $PSScriptRoot
$parent = Split-Path $workspace -Parent
$target = Join-Path $parent $Name

function Invoke-Checked {
    param(
        [Parameter(Mandatory)]
        [scriptblock] $Command
    )

    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE."
    }
}

Write-Host "==> Removing previous '$Name'..."

if (Test-Path $target) {
    Remove-Item -Recurse -Force $target
}

Write-Host "==> Building xibo-workspace..."

Push-Location $workspace

try {
    Invoke-Checked {
        npm.cmd run build
    }

    Write-Host "==> Creating '$Name'..."

    if (
        $Template -eq "static" -or
        $Template -eq "element"
    ) {
        Invoke-Checked {
            npx.cmd xibo new $Name "../$Name"
        }
    }
    elseif ($Template) {
        Invoke-Checked {
            npx.cmd xibo new $Template $Name "../$Name"
        }
    }
    else {
        Invoke-Checked {
            npx.cmd xibo new $Name "../$Name"
        }
    }
}
finally {
    Pop-Location
}

Write-Host "==> Installing local workspace..."

Push-Location $target

try {
    Invoke-Checked {
        npm.cmd install $workspace --no-save
    }

    if (
        $Template -eq "static" -or
        $Template -eq "element"
    ) {
        $templateName = "${Name}Template"

        Write-Host "==> Adding '$Template' '$templateName'..."

        Invoke-Checked {
            npx.cmd xibo add $Template $templateName
        }
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Xibo test project ready:"
Write-Host "  Name: $Name"

if ($Template) {
    Write-Host "  Template: $Template"
}
else {
    Write-Host "  Template: empty"
}

Write-Host "  Path: $target"