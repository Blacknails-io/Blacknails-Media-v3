# Naming Conventions Examples

Concrete comparison between poor naming choices and clean code practices.

## ❌ Bad Code
Violates naming conventions by mixing snake_case, PascalCase, and using unclear or generic variable names:

```typescript
const user_age_limit = 18; // snake_case is not standard for local constants

function Get_Active_users(d: any) { // PascalCase/snake_case mix, 'd' is not descriptive
  let active_users_list = [];
  for (let i = 0; i < d.length; i++) {
    if (d[i].active === true) {
      active_users_list.push(d[i]);
    }
  }
  return active_users_list;
}
```

##  Good Code
Adheres to standard JavaScript/TypeScript naming conventions and provides strong typing:

```typescript
const USER_AGE_LIMIT = 18; // UPPERCASE for global constants

interface User {
  id: string;
  name: string;
  isActive: boolean;
}

// camelCase for functions and variables, descriptive names
function getActiveUsers(users: User[]): User[] {
  return users.filter(user => user.isActive);
}
```
