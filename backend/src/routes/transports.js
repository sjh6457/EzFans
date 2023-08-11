import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT id, name, type, ST_AsGeoJson(St_transform(path,4326)) path FROM transports');
  res.send(rows);
});

export { router as default };
