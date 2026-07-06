# JSON to Pydantic Conversion Example

This example demonstrates how to parse a nested JSON object into strongly-typed Pydantic classes in Python.

---

## 1. Input JSON Data

```json
{
  "user_id": 12345,
  "username": "jdoe_88",
  "is_active": true,
  "preferences": {
    "theme": "dark",
    "notifications": [
      "email",
      "push"
    ]
  },
  "last_login": "2024-03-15T10:30:00Z",
  "meta_tags": null
}
```

---

## 2. Output Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class Preferences(BaseModel):
    theme: str
    notifications: List[str]

class User(BaseModel):
    user_id: int
    username: str
    is_active: bool
    preferences: Preferences
    last_login: Optional[str] = None
    meta_tags: Optional[List[str]] = None
```
