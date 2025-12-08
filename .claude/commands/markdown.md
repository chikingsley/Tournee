# Fix Markdown Files

Fix all markdown linting issues across the project.

## Steps

Run the auto-fixer first:

```bash
markdownlint-cli2 --fix "**/*.md" "#node_modules"
```

Check what remains:

```bash
markdownlint-cli2 "**/*.md" "#node_modules" 2>&1
```

For any remaining MD040 errors (code blocks without language), read each file and add the appropriate language identifier to the code fence. Determine the language by examining the code block content:

- TypeScript/JavaScript code → `typescript` or `javascript`
- Shell commands → `bash`
- JSON data → `json`
- Plain text, diagrams, or unknown → `text`

For MD029 errors (ordered list numbering), fix the list to use sequential numbers (1, 2, 3...).

Run the linter again to confirm all issues are fixed.

Report a summary of changes made.
