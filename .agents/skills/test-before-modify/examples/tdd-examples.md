# Test-Before-Modify Examples

This document demonstrates how to apply the Test-Before-Modify pattern when creating or updating classes.

## TDD Workflow Example

### 1. Input Scenario
"Add a method `deactivate()` to the `User` class which sets `isActive` to `false` and throws an error if the user is already inactive."

### 2. Thought Process (TDD Workflow)
- **Target**: `server/src/domain/entities/User.ts`
- **Test Cases to Write First**:
  - Should deactivate an active user (happy path).
  - Should throw an error if the user is already inactive (error case).
- **Test File Location**: `server/tests/domain/entities/User.test.ts`

### 3. Test Code (Written First)
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { User } from '../../../src/domain/entities/User.js';

describe('User deactivation', () => {
  it('should deactivate an active user', () => {
    const user = new User({ id: '1', name: 'John', isActive: true });
    user.deactivate();
    assert.strictEqual(user.isActive, false);
  });

  it('should throw an error if already inactive', () => {
    const user = new User({ id: '1', name: 'John', isActive: false });
    assert.throws(() => {
      user.deactivate();
    }, /User is already inactive/);
  });
});
```

### 4. Implementation Code (Written After)
```typescript
export class User {
  public id: string;
  public name: string;
  public isActive: boolean;

  constructor(data: { id: string; name: string; isActive: boolean }) {
    this.id = data.id;
    this.name = data.name;
    this.isActive = data.isActive;
  }

  public deactivate(): void {
    if (!this.isActive) {
      throw new Error('User is already inactive');
    }
    this.isActive = false;
  }
}
```
