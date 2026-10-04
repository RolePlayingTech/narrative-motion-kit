# Optional regeneration on Windows. The completed WAV is checked in for all platforms.
# This is a synthetic demonstration narrator, not a recording of any real person.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$motionProject = Join-Path $PSScriptRoot '..\projects\demo-fuel-prices'
$motionAudio = Join-Path $motionProject 'narration'
New-Item -ItemType Directory -Path $motionAudio -Force | Out-Null
$motionSegments = @(
  'Cena paliwa to koniec długiego łańcucha.',
  'Rząd i prezydent działają w granicach prawa.',
  'Podatki wymagają ustawy.',
  'Surowiec, rafineria, transport. Każdy etap ma znaczenie.',
  'Ormuz to jedna piąta światowego zużycia paliw płynnych.',
  'A ropa drożeje, ale też tanieje.'
)
$motionVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$motionVoice.SelectVoice('Microsoft Paulina Desktop')
$motionVoice.Rate = 2
try {
  for ($motionIndex = 0; $motionIndex -lt $motionSegments.Count; $motionIndex++) {
    $motionVoice.SetOutputToWaveFile((Join-Path $motionAudio "segment-$motionIndex.wav"))
    $motionVoice.Speak($motionSegments[$motionIndex])
  }
} finally { $motionVoice.Dispose() }
$motionSegments | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $motionAudio 'segments.json') -Encoding utf8
