import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, name, capacity, building_id, ST_AsGeoJson(St_transform(geom,4326)) geom FROM rooms WHERE id = $1', [id]);
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows[0]);
});

router.post('/location', async (req, res) => {
  const { body } = req;
  if (body.location === undefined || body.name === undefined) {
    res.sendStatus(400);
  } else {
    await query('UPDATE stops SET location = $1 WHERE name = $2', [body.location, body.name]);
    res.sendStatus(200);
  }
});

export { router as default };
