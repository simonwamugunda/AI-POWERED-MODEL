#!/usr/bin/env bash
set -euo pipefail

is_java_17() {
  [[ -x "$1/bin/java" ]] && "$1/bin/java" -version 2>&1 | head -n 1 | grep -Eq 'version "17([.]|\\")'
}

if [[ -n "${JAVA_HOME:-}" ]] && is_java_17 "$JAVA_HOME"; then
  gradle_java_home="$JAVA_HOME"
else
  gradle_java_home=""
  for candidate in \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-17-openjdk \
    /usr/lib/jvm/openjdk-17 \
    /usr/lib/jvm/temurin-17-jdk-amd64 \
    /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
    /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
  do
    if is_java_17 "$candidate"; then
      gradle_java_home="$candidate"
      break
    fi
  done
fi

if [[ -z "$gradle_java_home" ]]; then
  echo "JDK 17 was not found. Install JDK 17 or set JAVA_HOME to a JDK 17 installation." >&2
  exit 1
fi

export JAVA_HOME="$gradle_java_home"
export PATH="$JAVA_HOME/bin:$PATH"
exec ./gradlew "$@"
