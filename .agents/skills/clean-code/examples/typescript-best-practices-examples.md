# JS / TypeScript Best Practices & Error Handling Examples

Concrete comparisons showing clean JavaScript/TypeScript and robust error handling.

## ❌ Bad Code
Violates best practices by using the `any` type, loose comparisons, magic values, and failing silently upon errors:

```typescript
async function processOrder(order: any) {
  try {
    if (order.status == 'pending') { // Loose comparison & magic string
      const response = await fetch(`https://api.example.com/pay/${order.id}`);
      const data = await response.json();
    }
  } catch (err) {
    // Silent failure: hard to debug or recover
  }
}
```

##  Good Code
Adheres to best practices by using strict typing, custom interfaces, enums, strict comparisons, and explicit error logging/propagation:

```typescript
enum OrderStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed'
}

interface Order {
  id: string;
  status: OrderStatus;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
}

async function processOrder(order: Order): Promise<PaymentResponse | null> {
  if (order.status !== OrderStatus.Pending) {
    return null;
  }

  try {
    const response = await fetch(`https://api.example.com/pay/${order.id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaymentResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to process order ${order.id}:`, error);
    throw new Error(`Order processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```
