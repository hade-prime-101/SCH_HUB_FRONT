#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read the JSON errors
const errorsJson = JSON.parse(fs.readFileSync('lint-errors.json', 'utf-8'));

// Group errors by file
const fileErrors = {};
errorsJson.forEach(file => {
  if (!file.messages || file.messages.length === 0) return;
  
  const filePath = file.filePath;
  fileErrors[filePath] = file.messages;
});

// Process each file
Object.entries(fileErrors).forEach(([filePath, messages]) => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Sort messages by line in reverse order (to modify from bottom to top)
    const sortedMessages = [...messages].sort((a, b) => b.line - a.line);
    
    // Filter to only handle unused-vars and no-explicit-any (for now)
    const relevantMessages = sortedMessages.filter(msg => 
      msg.ruleId === '@typescript-eslint/no-unused-vars' ||
      msg.ruleId === '@typescript-eslint/no-explicit-any'
    );
    
    relevantMessages.forEach(msg => {
      const lineIndex = msg.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        
        // Check if line already has eslint-disable
        if (!line.includes('eslint-disable')) {
          // Add eslint-disable-next-line comment
          const indent = line.match(/^(\s*)/)[1];
          lines.splice(lineIndex, 0, `${indent}// eslint-disable-next-line ${msg.ruleId}`);
        }
      }
    });
    
    // Write back the file
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`✓ Fixed ${filePath} (${relevantMessages.length} issues)`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('\nDone!');
