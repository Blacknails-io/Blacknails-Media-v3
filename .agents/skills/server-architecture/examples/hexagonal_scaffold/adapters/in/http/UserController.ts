import { Request, Response } from 'express';
import { IRegisterUseCase } from '../../../application/ports/in/IRegisterUseCase.js';

/**
 * ADAPTADOR DE ENTRADA HTTP (Driving Inbound Adapter)
 * 
 * Capa: adapters/in/http/
 * Reglas:
 * - Conecta el puerto de entrada (`IRegisterUseCase`) con Express.
 * - Su única función es recibir el request HTTP, mapear los parámetros,
 *   llamar al caso de uso y devolver la respuesta formateada en JSON.
 * - Maneja códigos de estado HTTP correctos (201 Created, 400 Bad Request, etc.).
 */
export class UserController {
  constructor(
    private readonly registerUseCase: IRegisterUseCase
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Faltan parámetros requeridos (username, password).' });
      return;
    }

    try {
      // Mapeamos el input y llamamos al caso de uso inyectado
      const user = await this.registerUseCase.execute({
        username,
        passwordRaw: password
      });

      // Respondemos con el formato HTTP adecuado y los datos mapeados
      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error: any) {
      // Capturamos errores de negocio o de puerto y respondemos al cliente
      res.status(400).json({ error: error.message });
    }
  }
}
