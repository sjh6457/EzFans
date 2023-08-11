import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, name, ST_AsGeoJson(St_transform(geom,4326)) geom FROM gates WHERE id = $1', [id]);
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows[0]);
});

router.post('/', async (req, res) => {
  const { body } = req;
  if (body.name === undefined) {
    res.sendStatus(400);
  } else {
    await query('INSERT INTO gates (name) VALUES ($1)', [body.name]);
    res.sendStatus(200);
  }
});

router.get('/:id/capacitytrack', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT capacity, isfull, overflow_move, overflow_recieved FROM gates WHERE gates.id = $1', [id]);
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows);
});

router.get('/:id/capacity', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT SUM(rooms.capacity) as capacity FROM rooms INNER JOIN buildings ON rooms.building_id = buildings.id WHERE buildings.id = $1 GROUP BY rooms.building_id', [id]);
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows[0]);
});

router.post('/geom', async (req, res) => {
  const { body } = req;
  if (body.geom === undefined || body.id === undefined) {
    res.sendStatus(400);
  } else {
    await query('UPDATE gates SET geom = St_AsText(ST_GeomFromGeoJson($1)) WHERE id = $2', [body.geom, body.id]);
    res.sendStatus(200);
  }
});

export { router as default };
