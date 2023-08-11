import Router from 'express-promise-router';
import { query } from '../db';

const router = new Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, name, building_id, ST_AsGeoJson(St_transform(geom,4326)) path FROM Transports WHERE id = $1', [id]);
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
    await query('UPDATE Transports SET path = St_AsText(ST_GeomFromGeoJson($1)) WHERE id = $2', [body.geom, body.id]);
    res.sendStatus(200);
  }
});


router.get('/:id/stops', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT name, number, transport_id, geom FROM stops WHERE transport_id = $1', [id]);
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows);
});

export { router as default };