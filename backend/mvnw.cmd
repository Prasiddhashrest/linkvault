@ECHO OFF
WHERE mvn >NUL 2>NUL
IF %ERRORLEVEL% EQU 0 (
  mvn %*
  EXIT /B %ERRORLEVEL%
)
ECHO Maven is not installed. Please install Maven 3.9 or newer, then run mvn %*
EXIT /B 1
