import express, { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import Item from '../models/Item';
import metaWeapon from '../models/metaWeapon';
import Satchel from '../models/Satchel';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

router.post('/:uuid/unload', asyncHandler(async (req: Request, res: Response) => {
  logger.info(`POST /item/${req.params.uuid}/unload`);

  const { uuid } = req.params;

  // We look for the related Item
  const item = await Item.findById(uuid).exec();
  if (!item) {
    logger.warn(`Item.id:${uuid} not found`);
    return res.status(200).json({ 
        success: false,
        msg: `Item.id:${uuid} not found`,
        payload: null
     });
  } else {
    logger.debug(`Item.id:${uuid} found`);
  }

  // We look for the related metaWeapon (Item.metaid)
  const meta = await metaWeapon.findOne({ _id: Number(item.metaid) }).exec();
  if (!meta) {
    logger.warn(`metaWeapon.id:${item.metaid} not found`);
    return res.status(200).json({ 
        success: false,
        msg: `metaWeapon.id:${item.metaid} not found`,
        payload: null
     });
  } else {
    logger.debug(`metaWeapon.id:${item.metaid} found`);
  }
  
  // We look for the related Satchel (Item.bearer)
  const satchel = await Satchel.findById(item.bearer).exec();
  if (!satchel) {
    logger.warn(`Satchel.id:${uuid} not found`);
    return res.status(200).json({ 
        success: false,
        msg: `Satchel.id:${uuid} not found`,
        payload: null
     });
  } else {
    logger.debug(`Satchel.id:${uuid} found`);
  }

  if (typeof item.ammo !== 'number') {
    logger.warn(`Item.id:${uuid} has no ammo field or ammo is not a number`);
    return res.status(200).json({ 
        success: false,
        msg: `Item.id:${uuid} has no ammo field or ammo is not a number`,
        payload: null
     });
  }

  if (item.ammo == 0) {
    logger.warn(`Item.id:${uuid} is already empty (item.ammo == ${item.ammo})`);
    return res.status(200).json({ 
        success: false,
        msg: `Item.id:${uuid} is already empty (item.ammo == ${item.ammo})`,
        payload: item
     });
  }

  item.ammo = 0;
  item.updated = new Date();
  await item.save();

  logger.info(`Item.id:${uuid} unloaded`);
  return res.status(200).json({
    success: true,
    msg: `Item.id:${uuid} unloaded successfully`,
    payload: item
  });
}));

export default router;
