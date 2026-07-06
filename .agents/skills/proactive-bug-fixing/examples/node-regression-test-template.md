# Bug Regression Test Template

This template demonstrates how to write an isolated, deterministic unit/integration test using Node's native test runner (`node:test`) and assertion library (`node:assert`) to reproduce and prevent database duplicates regression bugs in the SQLite adapters.

---

## Regression Test Pattern

When fixing a bug, you **MUST** first write a test case reproducing the failure, and then verify it passes with your fix.

```typescript
import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';

test.describe('Regression Test: [BUG-ID] / [Brief bug description]', () => {
  let db: any;

  test.beforeEach(() => {
    // 1. DB Isolation: Use an in-memory SQLite database to keep tests clean and fast
    db = new Database(':memory:');
    
    // Set up schema required for the test scenario
    db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL
      );
    `);
  });

  test.afterEach(() => {
    if (db) {
      db.close();
    }
  });

  test('should gracefully handle duplicate assets hash imports without crashing', () => {
    const insertAsset = db.prepare('INSERT INTO assets (id, filename, hash, status) VALUES (?, ?, ?, ?)');
    
    // Step 1: Insert asset initially
    insertAsset.run('id-1', 'photo.jpg', 'sha256-hash123', 'imported');
    
    // Step 2: Attempt to trigger the bug flow (re-inserting the same hash)
    const executeDuplicateAction = () => {
      try {
        const hashExists = db.prepare('SELECT 1 FROM assets WHERE hash = ?').get('sha256-hash123');
        if (hashExists) {
          // Fix logic applied: return existing rather than re-inserting and crashing
          return { status: 'already_imported', id: 'id-1' };
        }
        insertAsset.run('id-2', 'photo.jpg', 'sha256-hash123', 'imported');
        return { status: 'inserted', id: 'id-2' };
      } catch (error) {
        throw error;
      }
    };

    // Assert that the fix works and no constraint violation error is thrown
    const result = executeDuplicateAction();
    assert.strictEqual(result.status, 'already_imported');
    assert.strictEqual(result.id, 'id-1');
  });
});
```
