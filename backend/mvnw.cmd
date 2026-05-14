@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET "MVN_CMD=mvn.cmd") ELSE (SET "MVN_CMD=%__MVNW_ARG0_NAME__%")
@SET MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%
@IF "%MAVEN_PROJECTBASEDIR%"=="" SET "MAVEN_PROJECTBASEDIR=%~dp0"
@SET MVNW_REPOURL=https://repo.maven.apache.org/maven2

@SET MVNW_PROPERTIES_FILE=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties
@FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%MVNW_PROPERTIES_FILE%") DO (
  @IF "%%A"=="distributionUrl" SET "DISTRIBUTION_URL=%%B"
)

@SET MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.9
@IF NOT EXIST "%MAVEN_HOME%\bin\mvn.cmd" (
  @ECHO Maven wrapper: downloading Maven 3.9.9...
  @CALL :DownloadMaven
)

@SET PATH=%MAVEN_HOME%\bin;%PATH%
@CALL mvn.cmd %*
@GOTO :EOF

:DownloadMaven
  @POWERSHELL -Command "& { $url='%DISTRIBUTION_URL%'; $dest='%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.9.zip'; New-Item -ItemType Directory -Force -Path '%USERPROFILE%\.m2\wrapper\dists' | Out-Null; if (-not (Test-Path $dest)) { Invoke-WebRequest -Uri $url -OutFile $dest }; Expand-Archive -Path $dest -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force }"
  @REN "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.9-bin" "apache-maven-3.9.9" 2>NUL
  @EXIT /B
