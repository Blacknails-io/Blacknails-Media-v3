# Hexagonal Architecture Scaffold Example

This reference scaffold demonstrates a complete user registration workflow in the backend server. It illustrates how the different layers interact while strictly preserving dependencies.

---

## 1. Domain Layer (Pure Business Core)
The domain holds the pure business state and invariants. It **MUST NOT** import any infrastructure libraries, databases, or frameworks (e.g., Express, sqlite, fs).

```typescript
// server/src/domain/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    private _role: 'ADMIN' | 'STANDARD' | 'VIEWER',
    private _isActive: boolean
  ) {
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
  }

  public get role() {
    return this._role;
  }

  public get isActive() {
    return this._isActive;
  }

  // Pure business rules and transitions
  public changeRole(newRole: 'ADMIN' | 'STANDARD' | 'VIEWER', requestedBy: User): void {
    if (requestedBy.role !== 'ADMIN') {
      throw new Error('Only administrators can modify user roles.');
    }
    this._role = newRole;
  }

  public deactivate(requestedBy: User): void {
    if (requestedBy.role !== 'ADMIN') {
      throw new Error('Only administrators can deactivate user accounts.');
    }
    if (requestedBy.id === this.id) {
      throw new Error('You cannot deactivate your own account.');
    }
    this._isActive = false;
  }
}
```

---

## 2. Application Layer (Boundary Ports)
Ports act as contracts at the hexagon border.

### Inbound (Driving) Port
Defines the entrypoint API contract for controllers:

```typescript
// server/src/application/ports/in/IRegisterUseCase.ts
import { User } from '../../../domain/User.js';

export interface RegisterInput {
  username: string;
  passwordRaw: string;
  role?: 'ADMIN' | 'STANDARD' | 'VIEWER';
}

export interface IRegisterUseCase {
  execute(input: RegisterInput): Promise<User>;
}
```

### Outbound (Driven) Port
Defines the contract for database or external infrastructure dependencies:

```typescript
// server/src/application/ports/out/IUserRepository.ts
import { User } from '../../../domain/User.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User, passwordHash: string): Promise<void>;
}
```

---

## 3. Application Layer (Concrete Use Case)
Orchestrates business logic using domain rules and driven ports. It is completely unaware of transport (Express request/response objects).

```typescript
// server/src/application/use_cases/RegisterUseCase.ts
import { IRegisterUseCase, RegisterInput } from '../ports/in/IRegisterUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { User } from '../../domain/User.js';
import { randomUUID } from 'crypto';

export class RegisterUseCase implements IRegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  public async execute(input: RegisterInput): Promise<User> {
    // 1. Verify business invariants using output ports
    const existingUser = await this.userRepository.findByUsername(input.username);
    if (existingUser) {
      throw new Error('Username is already registered.');
    }

    // 2. Instantiate pure domain entity
    const userId = randomUUID();
    const newUser = new User(
      userId,
      input.username,
      input.role || 'STANDARD',
      true
    );

    // 3. Hash passwords (in production, use an injected Hasher service port)
    const dummyHash = `sha256-mocked-${input.passwordRaw}`;

    // 4. Persist using outbound port
    await this.userRepository.save(newUser, dummyHash);

    return newUser;
  }
}
```

---

## 4. Adapters Layer (Infrastructure Implementations)
Adapters connect the hexagon to external systems.

### Driving HTTP Controller Adapter
Parses inputs, coordinates execution via inbound ports, and formats HTTP responses:

```typescript
// server/src/adapters/in/http/UserController.ts
import { Request, Response } from 'express';
import { IRegisterUseCase } from '../../../application/ports/in/IRegisterUseCase.js';

export class UserController {
  constructor(
    private readonly registerUseCase: IRegisterUseCase
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Missing required parameters (username, password).' });
      return;
    }

    try {
      const user = await this.registerUseCase.execute({
        username,
        passwordRaw: password
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### Driven Database SQLite Adapter
Implements outbound ports, executes raw database operations, and maps rows back to pure Domain entities:

```typescript
// server/src/adapters/out/database/SqliteUserRepository.ts
import { Database } from 'better-sqlite3';
import { IUserRepository } from '../../../application/ports/out/IUserRepository.js';
import { User } from '../../../domain/User.js';

export class SqliteUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  public async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;

    return new User(row.id, row.username, row.role, row.is_active === 1);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;

    return new User(row.id, row.username, row.role, row.is_active === 1);
  }

  public async save(user: User, passwordHash: string): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO users (id, username, role, is_active, password_hash)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        role = excluded.role,
        is_active = excluded.is_active
    `);

    insert.run(user.id, user.username, user.role, user.isActive ? 1 : 0, passwordHash);
  }
}
```
