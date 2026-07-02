import type { IPipelineService, PipelineWorkerDTO } from './interfaces.js';

export class HttpPipelineService implements IPipelineService {
  private readonly baseUrl = '/api/admin/pipeline';
  private readonly clientSignature = 'blacknails-media-handshake-key-2026';

  private getHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Blacknails-Client-Signature': this.clientSignature
    };
  }

  private async parseError(res: Response, fallback: string): Promise<string> {
    let errorMessage = fallback;
    try {
      const err = await res.json();
      if (err.error) errorMessage = err.error;
    } catch {
      if (res.status === 502 || res.status === 503) {
        errorMessage = 'Servidor no disponible (Error 502/503). Verifique su conectividad.';
      }
    }
    return errorMessage;
  }

  public async getWorkers(token: string): Promise<PipelineWorkerDTO[]> {
    const res = await fetch(`${this.baseUrl}/workers`, {
      method: 'GET',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'Error al obtener el estado del pipeline.'));
    }

    return res.json();
  }

  public async getWorker(token: string, workerId: string): Promise<PipelineWorkerDTO> {
    const res = await fetch(`${this.baseUrl}/workers/${workerId}`, {
      method: 'GET',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'Error al obtener el worker.'));
    }

    return res.json();
  }

  public async startWorker(token: string, workerId: string): Promise<PipelineWorkerDTO> {
    const res = await fetch(`${this.baseUrl}/workers/${workerId}/start`, {
      method: 'POST',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'Error al arrancar el worker.'));
    }

    return res.json();
  }

  public async stopWorker(token: string, workerId: string): Promise<PipelineWorkerDTO> {
    const res = await fetch(`${this.baseUrl}/workers/${workerId}/stop`, {
      method: 'POST',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'Error al detener el worker.'));
    }

    return res.json();
  }

  public async triggerWorker(token: string, workerId: string): Promise<PipelineWorkerDTO> {
    const res = await fetch(`${this.baseUrl}/workers/${workerId}/trigger`, {
      method: 'POST',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'Error al lanzar la ejecución puntual.'));
    }

    return res.json();
  }

  public async resetWorker(token: string, workerId: string): Promise<PipelineWorkerDTO> {
    const res = await fetch(`${this.baseUrl}/workers/${workerId}/reset`, {
      method: 'POST',
      headers: this.getHeaders(token)
    });

    if (!res.ok) {
      throw new Error(await this.parseError(res, 'Error al ejecutar el reset del worker.'));
    }

    return res.json();
  }
}
