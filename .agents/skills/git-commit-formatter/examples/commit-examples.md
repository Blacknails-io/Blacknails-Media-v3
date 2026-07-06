# Git Commit Examples

Comparative guide showing poor commit messages versus messages following the Conventional Commits specification.

---

## ❌ Bad Commits
Avoid vague descriptions, incorrect capitalization, or using non-standard types:

```text
fixed login bug
```
*(No type, no scope, past tense, and vague).*

```text
feat: ADDED GOOGLE LOGIN AND FIXED REDIRECTS!!!
```
*(Uses uppercase in description, past tense, and combines multiple tasks instead of keeping it atomic).*

```text
refactor(auth): rewrote registration form component
```
*(Uses past tense instead of imperative mood).*

---

##  Good Commits
Adheres to the allowed types, uses the imperative mood, specifies optional scopes, and logs breaking changes:

```text
feat(auth): add google authentication provider
```
*(Standard feat type, explicit auth scope, and imperative mood "add").*

```text
fix(server): resolve SQLite outbox dispatcher crash
```
*(Standard fix type, server scope, and precise description).*

```text
feat(api)!: upgrade HTTP endpoint contracts to v3

BREAKING CHANGE: The user model birthdate field format changed from string to ISO Date.
```
*(Uses '!' to indicate a breaking change, includes the BREAKING CHANGE footer).*
