# SOLID Principles Examples

Concrete illustration of refactoring code to satisfy SOLID principles.

## ❌ Bad Code
Violates the **Single Responsibility Principle (SRP)** by mixing database saving operations with notification dispatching logic in a single class:

```typescript
class UserManager {
  saveUserToDatabase(user: any) {
    // Logic to save user
    console.log(`Saving ${user.name} to DB...`);
  }

  sendWelcomeEmail(user: any) {
    // Logic to send email
    console.log(`Sending email to ${user.email}...`);
  }
}
```

##  Good Code
Adheres to **SRP** by separating database concerns from communication concerns into separate classes, making the code much easier to maintain, test, and extend:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

class UserRepository {
  save(user: User): void {
    // Responsible ONLY for database operations
    console.log(`Saving ${user.name} to DB...`);
  }
}

class NotificationService {
  sendWelcomeEmail(user: User): void {
    // Responsible ONLY for user notifications
    console.log(`Sending email to ${user.email}...`);
  }
}
```
