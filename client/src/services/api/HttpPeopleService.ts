/*
 * Copyright (c) 2026 MyCompany LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IPeopleService, PersonDTO } from './interfaces.js';
import type { MediaAsset } from '../../types/MediaAsset.js';

export class HttpPeopleService implements IPeopleService {
  private readonly baseUrl = '/api/people';

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async parseError(res: Response, fallback: string): Promise<string> {
    let errorMessage = fallback;
    try {
      const err = await res.json();
      if (err.error) errorMessage = err.error;
    } catch {
      if (res.status === 502 || res.status === 503) {
        errorMessage = 'Servidor no disponible (Error 502/503).';
      }
    }
    return errorMessage;
  }

  public async list(token?: string): Promise<PersonDTO[]> {
    const res = await fetch(this.baseUrl, {
      method: 'GET',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'No se pudo cargar la lista de personas.'));
    }

    return res.json();
  }

  public async getAssets(personId: string, token?: string): Promise<MediaAsset[]> {
    const res = await fetch(`${this.baseUrl}/${personId}/assets`, {
      method: 'GET',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'No se pudieron cargar los archivos de la persona.'));
    }

    return res.json();
  }

  public async updateName(personId: string, name: string, token?: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${personId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'No se pudo guardar el nombre.'));
    }
  }

  public async deletePerson(personId: string, token?: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${personId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'No se pudo descartar la persona.'));
    }
  }
}
