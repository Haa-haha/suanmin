import os
import re

color_map = {
    r'#d4a574': 'zinc-100',
    r'#8b7355': 'zinc-400',
    r'#e8e0d4': 'zinc-300',
    r'#e8c9a0': 'zinc-300',
    r'#6b6255': 'zinc-500',
    r'bg-\[\#0a0a0a\]': 'bg-zinc-950',
    r'border-\[\#d4a574\]/20': 'border-zinc-800',
    r'border-\[\#d4a574\]/30': 'border-zinc-800',
    r'border-\[\#d4a574\]/40': 'border-zinc-700',
    r'text-\[\#d4a574\]': 'text-zinc-100',
    r'text-\[\#8b7355\]': 'text-zinc-400',
    r'text-\[\#e8e0d4\]': 'text-zinc-300',
    r'text-\[\#6b6255\]': 'text-zinc-500',
    r'text-\[\#6b6255\]/50': 'text-zinc-500/50',
    r'text-\[\#6b6255\]/60': 'text-zinc-500/60',
    r'hover:text-\[\#8b7355\]': 'hover:text-zinc-300',
    r'hover:text-\[\#d4a574\]': 'hover:text-white',
    r'hover:text-\[\#e8e0d4\]': 'hover:text-white',
    r'hover:text-\[\#e8c9a0\]': 'hover:text-zinc-200',
    r'focus:border-\[\#d4a574\]': 'focus:border-zinc-400',
    r'focus:border-\[\#d4a574\]/40': 'focus:border-zinc-700',
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    # Handle text-[hex] and border-[hex] explicitly first
    for old, new in color_map.items():
        if '[' in old: # It's a full tailwind class replacement
            new_content = re.sub(old, new, new_content)

    # For any remaining hex codes in tsx (like inline styles or props)
    # We will replace #d4a574 with something like #f4f4f5 (zinc-100 hex)
    hex_map = {
        '#d4a574': '#f4f4f5',
        '#8b7355': '#a1a1aa',
        '#e8e0d4': '#d4d4d8',
        '#6b6255': '#71717a'
    }
    for old, new in hex_map.items():
        new_content = new_content.replace(old, new)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            process_file(os.path.join(root, file))

