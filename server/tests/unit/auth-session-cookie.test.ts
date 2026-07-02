import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clearSessionCookie, createSessionCookie, requireUser } from '../../src/adapters/in/http/auth.js';
import { User } from '../../src/domain/entities/User.js';

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
}

describe('session cookie authentication', () => {
  it('authenticates requests with the bn_session cookie when Bearer is unavailable', async () => {
    const user = new User({
      id: 'user-cookie',
      username: 'cookie-user',
      passwordHash: 'hash',
      role: 'VIEWER'
    });
    let receivedToken: string | null = null;
    const getSessionUserUseCase = {
      async execute(token: string) {
        receivedToken = token;
        return user;
      }
    };

    const req = {
      headers: {
        cookie: 'theme=dark; bn_session=session-token-123; other=value'
      }
    };
    const res = createMockResponse();

    const result = await requireUser(req as any, res as any, getSessionUserUseCase);

    assert.equal(result, user);
    assert.equal(receivedToken, 'session-token-123');
    assert.equal(res.statusCode, 200);
  });

  it('serializes secure login and logout cookies with safe defaults', () => {
    const expiresAt = '2026-07-02T12:00:00.000Z';
    const cookie = createSessionCookie('token value', expiresAt);

    assert.match(cookie, /^bn_session=token%20value;/);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Expires=Thu, 02 Jul 2026 12:00:00 GMT/);

    const clearCookie = clearSessionCookie();
    assert.match(clearCookie, /^bn_session=;/);
    assert.match(clearCookie, /Max-Age=0/);
    assert.match(clearCookie, /HttpOnly/);
  });
});
