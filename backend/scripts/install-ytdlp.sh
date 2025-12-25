#!/bin/bash
set -e

echo "==> Installing yt-dlp for ytdlp-nodejs..."

# Define installation directory (use project bin for Render compatibility)
# This ensures the binary is included in the build artifacts
INSTALL_DIR="./bin"
mkdir -p "$INSTALL_DIR"

# Check if yt-dlp binary already exists in project bin
if [ -f "${INSTALL_DIR}/yt-dlp" ]; then
    echo "✓ yt-dlp already exists at: ${INSTALL_DIR}/yt-dlp"
    "${INSTALL_DIR}/yt-dlp" --version
    exit 0
fi

# Check if yt-dlp is in system PATH as fallback
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp found in system PATH at: $(which yt-dlp)"
    yt-dlp --version
    exit 0
fi

# Download binary directly to project bin directory
echo "Downloading yt-dlp binary from GitHub..."
if curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${INSTALL_DIR}/yt-dlp" 2>/dev/null; then
    chmod a+rx "${INSTALL_DIR}/yt-dlp"
    echo "✓ yt-dlp binary downloaded successfully to ${INSTALL_DIR}/yt-dlp"
else
    echo "✗ Failed to download yt-dlp binary"
    exit 1
fi

# Verify installation
echo "Verifying yt-dlp installation..."
if [ -f "${INSTALL_DIR}/yt-dlp" ]; then
    VERSION=$("${INSTALL_DIR}/yt-dlp" --version)
    echo "✓ yt-dlp installed successfully!"
    echo "  Location: ${INSTALL_DIR}/yt-dlp"
    echo "  Version: ${VERSION}"
    exit 0
fi

# Installation failed
echo "✗ yt-dlp installation failed"
echo "Please check the logs above for errors"
exit 1
