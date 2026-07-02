import { Request, Response } from 'express';
import { IPeopleUseCase } from '../../../application/ports/in/IPeopleUseCase.js';

export class PeopleController {
  constructor(private readonly peopleUseCase: IPeopleUseCase) {}

  public getPeople = async (req: Request, res: Response): Promise<void> => {
    try {
      const people = await this.peopleUseCase.getPeople();
      res.status(200).json(people);
    } catch (error: any) {
      console.error('Error fetching people stats:', error);
      res.status(500).json({ error: error?.message || 'Internal Server Error' });
    }
  };

  public renamePerson = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Name is required and must be a string.' });
        return;
      }
      await this.peopleUseCase.renamePerson(id, name);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error(`Error renaming person ${req.params.id}:`, error);
      res.status(500).json({ error: error?.message || 'Internal Server Error' });
    }
  };

  public getPersonAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const assets = await this.peopleUseCase.getPersonAssets(id);
      res.status(200).json(assets);
    } catch (error: any) {
      console.error(`Error fetching assets for person ${req.params.id}:`, error);
      res.status(500).json({ error: error?.message || 'Internal Server Error' });
    }
  };

  public dismissPerson = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedFaces = await this.peopleUseCase.dismissPerson(id);
      res.status(200).json({ deletedFaces });
    } catch (error: any) {
      console.error('Error dismissing person:', error);
      res.status(500).json({ error: error?.message || 'Internal Server Error' });
    }
  };

  public deleteOrphanPersons = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedCount = await this.peopleUseCase.deleteOrphanPersons();
      res.status(200).json({ deletedCount });
    } catch (error: any) {
      console.error('Error deleting orphan persons:', error);
      res.status(500).json({ error: error?.message || 'Internal Server Error' });
    }
  };
}

