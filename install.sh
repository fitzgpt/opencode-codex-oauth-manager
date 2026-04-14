#!/bin/bash

CMD_NAME="oc-hesap"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JS_PATH="$SCRIPT_DIR/index.js"

echo "--------------------------------------------------"
echo "[$CMD_NAME] Setup Wizard (Linux/macOS)"
echo "--------------------------------------------------"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js first."
    exit 1
fi

echo "[+] Node.js detected."
echo "[+] Making script executable..."
chmod +x "$JS_PATH"

# Function to add to shell profile
add_to_profile() {
    local profile_file="$1"
    if [ -f "$profile_file" ]; then
        if ! grep -q "$SCRIPT_DIR" "$profile_file"; then
            echo "[+] Adding to $profile_file..."
            echo "export PATH=\"\$PATH:$SCRIPT_DIR\"" >> "$profile_file"
            return 0
        fi
    fi
    return 1
}

added=false
if [[ "$SHELL" == *"zsh"* ]]; then
    add_to_profile "$HOME/.zshrc" && added=true
elif [[ "$SHELL" == *"bash"* ]]; then
    add_to_profile "$HOME/.bashrc" && added=true
    add_to_profile "$HOME/.bash_profile" && added=true
fi

if [ "$added" = true ]; then
    echo "--------------------------------------------------"
    echo "SUCCESS! [$CMD_NAME] is now installed."
    echo "--------------------------------------------------"
    echo "1. Please restart your terminal or run: source <your_profile_file>"
    echo "2. Type '$CMD_NAME' to start."
    echo "--------------------------------------------------"
else
    echo "[!] Could not automatically add to PATH."
    echo "Please manually add this directory to your PATH:"
    echo "export PATH=\"\$PATH:$SCRIPT_DIR\""
fi
