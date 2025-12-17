#!/bin/bash

# UI Modernization Script
# This script performs bulk find-and-replace operations to modernize the UI

COMPONENTS_DIR="src/components"

echo "Starting UI modernization..."

# Function to replace in all component files
replace_in_components() {
    find "$COMPONENTS_DIR" -name "*.tsx" -type f -exec sed -i "$1" {} \;
}

# Replace background gradients
echo "Updating background gradients..."
replace_in_components 's/bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700/bg-indigo-600 hover:bg-indigo-700/g'
replace_in_components 's/bg-gradient-to-r from-purple-600 to-blue-600/bg-indigo-600/g'
replace_in_components 's/bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700/bg-emerald-600 hover:bg-emerald-700/g'
replace_in_components 's/bg-gradient-to-r from-green-600 to-teal-600/bg-emerald-600/g'
replace_in_components 's/bg-gradient-to-r from-orange-600 to-red-600/bg-amber-600/g'
replace_in_components 's/bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700/bg-red-600 hover:bg-red-700/g'

# Replace card backgrounds
echo "Updating card backgrounds..."
replace_in_components 's/bg-white\/10 backdrop-blur-lg rounded-2xl/bg-slate-800\/50 backdrop-blur border border-slate-700 rounded-xl/g'
replace_in_components 's/bg-white\/10 backdrop-blur-lg/bg-slate-800\/50 backdrop-blur border border-slate-700/g'
replace_in_components 's/bg-white\/10/bg-slate-800\/50/g'
replace_in_components 's/bg-white\/20/bg-slate-900\/50/g'
replace_in_components 's/bg-white\/5/bg-slate-900\/30/g'

# Replace text colors
echo "Updating text colors..."
replace_in_components 's/text-gray-300/text-slate-400/g'
replace_in_components 's/text-gray-200/text-slate-300/g'
replace_in_components 's/text-gray-400/text-slate-500/g'

# Replace border colors
echo "Updating border colors..."
replace_in_components 's/border-white\/30/border-slate-700/g'
replace_in_components 's/border-white\/20/border-slate-700\/50/g'

# Replace focus rings
echo "Updating focus states..."
replace_in_components 's/focus:ring-2 focus:ring-purple-500/focus:outline-none focus:border-indigo-500 transition-colors/g'
replace_in_components 's/focus:ring-2 focus:ring-green-500/focus:outline-none focus:border-emerald-500 transition-colors/g'
replace_in_components 's/focus:ring-2 focus:ring-orange-500/focus:outline-none focus:border-amber-500 transition-colors/g'

# Replace rounded corners
echo "Updating border radius..."
replace_in_components 's/rounded-2xl/rounded-xl/g'

# Remove emojis (replace with text placeholders for now)
echo "Removing emojis..."
replace_in_components 's/🎯//g'
replace_in_components 's/🎮//g'
replace_in_components 's/👥//g'
replace_in_components 's/📚//g'
replace_in_components 's/❓//g'
replace_in_components 's/⏳//g'
replace_in_components 's/✅//g'
replace_in_components 's/❌//g'
replace_in_components 's/⚡//g'
replace_in_components 's/🔴/BUZZ/g'
replace_in_components 's/🏆//g'
replace_in_components 's/🥇/1st/g'
replace_in_components 's/🥈/2nd/g'
replace_in_components 's/🥉/3rd/g'
replace_in_components 's/🎉//g'
replace_in_components 's/⏱️//g'
replace_in_components 's/⏸️/Paused/g'
replace_in_components 's/🟢/Live/g'
replace_in_components 's/👁️//g'
replace_in_components 's/⚠️//g'

echo "UI modernization complete!"
echo "Note: You still need to manually add Lucide React icon imports and components"
echo "Refer to UI_MODERNIZATION_GUIDE.md for icon mappings"
