// Fix script: removes the comment and extra spaces
$file = 'c:\Users\baluf\OneDrive\Pictures\Screenshots\New folder\quix\quiz_system\src\components\teacher\QuestionCreator.tsx'
$content = Get-Content $file -Raw

# Replace the problematic section
$content = $content -replace '(?s)\{/\* Scheduling section removed.*?\*/\}\r?\n\r?\n\s+<div className="flex gap-4 w-full">', '            <div className="flex gap-4 w-full">'

Set-Content $file -Value $content -NoNewline
Write-Host "Fixed indentation in QuestionCreator.tsx"
