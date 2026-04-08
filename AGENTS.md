# AI Agents Configuration

This file documents the MCP (Model Context Protocol) servers and AI agents available for this project.

## Available MCP Servers

### GitLab Smile MCP Server
- **Description**: GitLab integration for merge requests, issues, pipelines, and work items
- **Features**:
  - Create/view merge requests
  - Create/view issues
  - Manage pipelines
  - Search across GitLab
  - Work items and notes
- **Status**: Available but not configured for a specific GitLab instance

### Context7 MCP Server
- **Description**: Documentation and code examples lookup for various libraries and frameworks
- **Features**:
  - Search documentation for any library/framework
  - Code examples and API references
  - Available libraries include: Cecil, Symfony, React, Next.js, and thousands more
- **Status**: Available and ready to use

## Usage Examples

### Context7 - Cecil Documentation
```bash
# First, resolve the library ID
context7_resolve-library-id(libraryName="Cecil", query="RSS feed configuration")

# Then, query the documentation
context7_query-docs(libraryId="/cecilapp/cecil", query="RSS feed configuration")
```

### Context7 - Any Library
```bash
# Find documentation for any library
context7_resolve-library_id(libraryName="LibraryName", query="what you want to do")

# Get code examples
context7_query-docs(libraryId="resolved-id", query="your question")
```

## Configuration

MCP servers are configured in `.claude/settings.json` or environment variables. No additional configuration needed for Context7 - it's ready to use.

## Tips

- Use Context7 to look up documentation when working with new libraries
- Context7 supports thousands of libraries including PHP, JavaScript, Python, Go, and more
- Code search examples are particularly useful for learning API patterns