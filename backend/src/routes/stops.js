import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT name, id, capacity, number, transport_id, ST_AsGeoJson(St_transform(geom,4326)) geom, location FROM stops');
  res.send(rows);
});

export { router as default };
