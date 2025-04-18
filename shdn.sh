#!/bin/bash

# update-shadcn-components.sh
# Script to bulk update all shadcn/ui components in a Next.js project using canary version
# Usage: ./update-shadcn-components.sh

# Set error handling
set -e

# Debug: Confirm shell
echo "Running in shell: $SHELL"

# Check if we're in a Next.js project
if [ ! -d "src/components/ui" ]; then
    echo "Error: src/components/ui directory not found"
    echo "Please run this script from your Next.js project root"
    exit 1
fi

# List of valid shadcn/ui components (as of April 2025)
VALID_COMPONENTS="accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button calendar card carousel checkbox collapsible combobox command context-menu dialog drawer dropdown-menu form hover-card input input-otp label menubar navigation-menu pagination popover progress radio-group resizable scroll-area select separator sheet skeleton slider sonner switch table tabs textarea toggle toggle-group tooltip"

# Backup directory
BACKUP_DIR="src/components/ui/backup-$(date +%Y%m%d-%H%M%S)"

# Log start of updates
echo "Starting shadcn/ui components update (canary version)..."
echo "Checking components in src/components/ui/..."

# Initialize counters
updated=0
failed=0
skipped=0

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Update each component
for file in src/components/ui/*.tsx; do
    # Extract component name
    component=$(basename "$file" .tsx | tr '[:upper:]' '[:lower:]')

    # Check if component is a valid shadcn/ui component
    if ! echo "$VALID_COMPONENTS" | grep -qw "$component"; then
        echo "Skipping non-shadcn component: $component"
        skipped=$((skipped + 1))
        continue
    fi

    echo "Updating component: $component"

    # Backup existing component
    cp "$file" "$BACKUP_DIR/$component.tsx"
    echo "Backed up $component to $BACKUP_DIR/$component.tsx"

    # Try to update the component
    if npx shadcn@canary add -y -o "$component"; then
        updated=$((updated + 1))
        echo "✓ Successfully updated $component"
    else
        failed=$((failed + 1))
        echo "✗ Failed to update $component"
        # Restore backup on failure
        cp "$BACKUP_DIR/$component.tsx" "$file"
        echo "Restored $component from backup"
    fi
done

# Print summary
echo "Update complete!"
echo "Successfully updated: $updated components"
echo "Skipped (non-shadcn): $skipped components"
if [ $failed -gt 0 ]; then
    echo "Failed to update: $failed components"
    echo "Backups available in: $BACKUP_DIR"
    exit 1
else
    echo "Backups available in: $BACKUP_DIR (can be deleted if updates are successful)"
fi
