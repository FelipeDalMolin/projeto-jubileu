param(
    [string]$PublicUrl = "https://app.jubileuweb.com/health",
    [string]$ReportDir = "$env:USERPROFILE\Desktop"
)

$ErrorActionPreference = "Continue"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $ReportDir "wsl-incident-$stamp.txt"

Start-Transcript -Path $out -Force

Write-Host "===== WSL INCIDENT COLLECT - PROJETO JUBILEU ====="
Get-Date
hostname
whoami

Write-Host "`n===== TESTE PUBLICO ====="
curl.exe -sS -o NUL -w "HTTP=%{http_code} tempo=%{time_total}s`n" $PublicUrl

Write-Host "`n===== WSL STATUS ====="
wsl --status
wsl --version
wsl -l -v

Write-Host "`n===== SERVICOS WINDOWS RELEVANTES ====="
Get-Service *wsl*, LxssManager, vmcompute, hns, vmms -ErrorAction SilentlyContinue |
    Format-Table Name, Status, StartType -AutoSize

Write-Host "`n===== DETALHE SERVICOS WSL/HYPER-V ====="
Get-CimInstance Win32_Service |
    Where-Object { $_.Name -in @("WSLService","WslInstaller","LxssManager","vmcompute","hns","vmms") } |
    Select-Object Name, State, Status, ProcessId, StartMode, PathName |
    Format-Table -AutoSize

Write-Host "`n===== QUERYEX WSLService / WslInstaller ====="
sc.exe queryex WSLService
sc.exe queryex WslInstaller

Write-Host "`n===== PROCESSOS RELEVANTES ====="
Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessName -match "wsl|vmmem|vmcompute|docker|com.docker|code|cloudflared"
    } |
    Sort-Object CPU -Descending |
    Select-Object ProcessName, Id, CPU, WS, VM, StartTime -ErrorAction SilentlyContinue |
    Format-Table -AutoSize

Write-Host "`n===== EVENTOS SYSTEM ULTIMAS 6H ====="
Get-WinEvent -FilterHashtable @{
    LogName='System'
    StartTime=(Get-Date).AddHours(-6)
    Level=1,2,3
} -ErrorAction SilentlyContinue |
    Select-Object TimeCreated, ProviderName, Id, LevelDisplayName, Message -First 120 |
    Format-List

Write-Host "`n===== EVENTOS APPLICATION ULTIMAS 6H ====="
Get-WinEvent -FilterHashtable @{
    LogName='Application'
    StartTime=(Get-Date).AddHours(-6)
    Level=1,2,3
} -ErrorAction SilentlyContinue |
    Select-Object TimeCreated, ProviderName, Id, LevelDisplayName, Message -First 120 |
    Format-List

Write-Host "`n===== LOGS ESPECIFICOS WSL/HYPER-V/HNS ====="
$logs = @(
    "Microsoft-Windows-Lxss/Operational",
    "Microsoft-Windows-Hyper-V-Compute-Admin",
    "Microsoft-Windows-Hyper-V-Worker-Admin",
    "Microsoft-Windows-Host-Network-Service-Admin"
)

foreach ($log in $logs) {
    Write-Host "`n----- $log -----"
    try {
        Get-WinEvent -FilterHashtable @{
            LogName=$log
            StartTime=(Get-Date).AddHours(-6)
        } -ErrorAction Stop |
            Select-Object TimeCreated, ProviderName, Id, LevelDisplayName, Message -First 80 |
            Format-List
    }
    catch {
        Write-Host "Nao foi possivel ler o log $log"
        Write-Host $_.Exception.Message
    }
}

Write-Host "`n===== MEMORIA / DISCO ====="
Get-CimInstance Win32_OperatingSystem |
    Select-Object TotalVisibleMemorySize, FreePhysicalMemory, TotalVirtualMemorySize, FreeVirtualMemory |
    Format-List

Get-PSDrive -PSProvider FileSystem | Format-Table -AutoSize

Write-Host "`n===== OBSERVACAO ====="
Write-Host "Use este arquivo como evidencia antes de reiniciar WSLService/LxssManager/vmcompute."
Write-Host "Nao use wsl --unregister no fluxo normal de recuperacao."

Stop-Transcript

Write-Host "`nArquivo gerado:"
Write-Host $out
