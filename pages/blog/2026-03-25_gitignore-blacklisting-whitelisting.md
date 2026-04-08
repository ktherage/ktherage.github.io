---
title: "Debugging Git's .gitignore: Why Whitelisting Files in Subdirectories Fails"
description: "A deep dive into Git's .gitignore directory traversal rules and how to avoid common pitfalls when whitelisting files in subdirectories."
image: img/pexels-photo-577585.jpeg
published: true
tags: [Git]
excerpt: >-
  When using .gitignore to keep your project clean, it's easy to accidentally hide important files in subdirectories. Here's how to debug and fix this common issue.
---

## Introduction

When working with Git, it's common to use `.gitignore` to exclude files and directories. But sometimes, even well-intentioned rules can lead to unexpected behavior—especially when dealing with nested directories. In this post, I'll walk through a real-world example of how a `.gitignore` rule intended to keep a project clean ended up hiding important files, and how we fixed it.

---

## The Setup

I wanted to keep the `.tools/` directory clean, tracking only `composer.json`, `composer.lock`, and the `.gitignore` file itself. My initial `.tools/.gitignore` looked like this:

```gitignore
*
!.gitignore
!composer.json
!composer.lock
```

Goal: Track only composer.json, composer.lock, and .gitignore in .tools/ and its subdirectories, ignoring everything else.

---

## The Problem

After pushing this change, a colleague reported that their composer.lock file in `.tools/rector/` was being ignored. We used the following command to debug:

```bash
$ git check-ignore -v .tools/rector/composer.lock
.tools/.gitignore:1:*     .tools/rector/composer.lock
```

---

## Root Cause

Git's rule: *"It is not possible to re-include a file if a parent directory of that file is excluded."*

The `*` pattern ignores both files and directories, which means Git never even looks inside `.tools/rector/`—so the whitelist rules for `composer.json` and `composer.lock` never apply.

---

## The Solution

After debugging, we updated the `.gitignore` to explicitly allow directory traversal and re-include the necessary files:

```gitignore
# Ignore all files and directories at this level
*

# But allow Git to inspect subdirectories
!*/

# Explicitly ignore vendor directories
vendor

# Whitelist composer.json in any subdirectory
!*/composer.json

# Whitelist composer.lock in any subdirectory
!*/composer.lock

# Always keep this .gitignore file
!.gitignore
```

---

## Key Takeaways

| Directory/File | Rule Applied | Result |
|----------------|--------------|--------|
| .tools/ | `*` | Ignored |
| .tools/rector/ | `!*/` | Inspected |
| .tools/rector/vendor | `vendor` | Ignored |
| .tools/rector/composer.json | `!*/composer.json` | Tracked |

- **Git's Directory Traversal:** When you use `*` to ignore everything, Git won't look inside directories unless you explicitly allow it with `!*/`.
- **Testing Your Rules:** Always test your `.gitignore` with `git check-ignore -v <file>` and `git status` to ensure the expected files are tracked.
- **Order Matters:** Place general exclusions first, then re-include specific files or directories.
- **Common Pitfalls:** Remember to re-exclude directories like `vendor` after whitelisting, or they'll be included in your repository.

---

## Conclusion

Debugging `.gitignore` issues can be tricky, but understanding how Git evaluates directory traversal and pattern matching makes it much easier. Always test your rules with nested directories before committing, and don't hesitate to use `git check-ignore` to verify your setup.