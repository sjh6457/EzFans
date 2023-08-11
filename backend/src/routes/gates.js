import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT id, name, capacity, ST_AsGeoJson(St_transform(geom,4326)) geom FROM gates');
  res.send(rows);
});

export { router as default };
