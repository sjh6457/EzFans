/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import pg from 'pg';
import config from '../../config.json' assert { type: 'json' };

const { username, password, host } = config.db_config;
const dbName = "ezfans_36";

async function createDb() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/postgres`,
  });
  const client = await pool.connect();
  try {
    await client.query(`CREATE DATABASE ${dbName};`);
  } catch (e) {
    if (e.code === '42P04') {
      console.log('Database already exists, creation is skipped.');
    } else {
      console.log(e);
    }
  }
  client.release();
}

async function addPostgisToDb() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    const postGisExtension = `CREATE EXTENSION postgis;
    CREATE EXTENSION postgis_raster;
    CREATE EXTENSION postgis_topology;
    CREATE EXTENSION postgis_sfcgal;
    CREATE EXTENSION fuzzystrmatch;
    CREATE EXTENSION address_standardizer;
    CREATE EXTENSION address_standardizer_data_us;
    CREATE EXTENSION postgis_tiger_geocoder;`;
    await client.query(postGisExtension);
  } catch (e) {
    if (e.code === '42710') {
      console.log('Database already has the postgis extention, activation is skipped.');
    } else {
      console.log(e);
    }
  }
  client.release();
}

//Create Tables to Store Data
async function createTables() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /*Gates have an id, name, a capacity, and can tell if it is full
    They also have a location. Since there are multiple we can guide people to different ones*/
    const gatesTableQuery = `CREATE TABLE IF NOT EXISTS gates (
      id INTEGER NOT NULL,
      name VARCHAR NOT NULL,
      capacity INTEGER NOT NULL,
      overflow_move INTEGER,
      overflow_recieved INTEGER,
      geom geometry('POINT',4326,2)
      );`;
    await client.query(gatesTableQuery);

    /* Create a table for the orders, which need to have a name, and other information such as address, email, and phone number
       The orders are stored then given a transport to follow
    */
    const ordersTableQuery = `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      address VARCHAR,
      stop VARCHAR,
      phone VARCHAR,
      directions VARCHAR,
      gate INTEGER,
      preference VARCHAR,
      ticknum INTEGER NOT NULL
      );`;
    await client.query(ordersTableQuery);

    /*
    Have a database for all of the transports, with a capacity and a type so we can give the user a preference of which type of transport they prefer
    The path is made up of stops and connects them together
    */
    const transportTableQuery = `CREATE TABLE IF NOT EXISTS transports (
      id INTEGER PRIMARY KEY NOT NULL,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      path geometry('LINESTRING',4326,2),
      isfull INTEGER
      );`;
    await client.query(transportTableQuery);

    /*
    Create a list of stops that the user can choose to  use with a geometrical location and a location on the train line
    */
    const stopTableQuery = `CREATE TABLE IF NOT EXISTS stops (
      name VARCHAR NOT NULL,
      id SERIAL PRIMARY KEY,
      number INTEGER NOT NULL,
      transport_id INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      geom geometry('point',4326,2),
      location INTEGER,
      CONSTRAINT fktransports
      FOREIGN KEY(transport_id)
      REFERENCES transports(id)
      );`;
    await client.query(stopTableQuery);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  }
  client.release();
}

async function populateTablesIfEmpty() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    const resG = await client.query('SELECT count(*) FROM gates');
    const nbGates = parseInt(resG.rows[0].count, 10);

    const resT = await client.query('SELECT count(*) FROM transports');
    const nbTransports = parseInt(resT.rows[0].count, 10);

    const resS = await client.query('SELECT count(*) FROM stops');
    const nbStops = parseInt(resS.rows[0].count, 10);

    //Populate the reseidences categories
    await client.query('BEGIN');

    //Create the Gates and add them into the table
    if (nbGates === 0) {
      const Gates = [

        {
          id: 1,
          name: 'Gate 1', capacity: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2537851333618164,
              48.8421492623742
            ]
          }
        },


        {
          id: 2,
          name: 'Gate 2', capacity: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2522348165512085,
              48.841859759274186
            ]
          }
        },

        {
          id: 3,
          name: 'Gate 3', capacity: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.253924608230591,
              48.84112893302884
            ]
          }
        },

        {
          id: 4,
          name: 'Gate 4', capacity: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2522884607315063,
              48.84069819952246
            ]
          }
        },
      ];
      const queryGates = 'INSERT INTO gates(id, name, capacity, geom) VALUES ($1,$2,$3,$4)';
      for (const Gate of Gates) {
        await client.query(queryGates,
          [Gate.id, Gate.name, Gate.capacity, Gate.geom]);
      }
    } else {
      console.log('gates table already populated');
    };

    //Populate the transport table with Metros and busses
     if (nbTransports === 0) {
      const Transports = [

        {
          id: 1, name: 'Metro 1 North',
          type: 'metro',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.230868339538574,
                48.829582581850715
              ],
              [
                2.243657112121582,
                48.83362234192195
              ],
              [
                2.256617546081543,
                48.8376617762732
              ]
            ]
          }
        },


        {
          id: 2, name: 'Metro 1 South',
          type: 'metro',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.2565317153930664,
                48.83763352961143
              ],
              [
                2.287173271179199,
                48.86310554637889
              ],
              [
                2.303695678710937,
                48.88396486994846
              ]
            ]
          }
        },

        {
          id: 3, name: 'Metro 2 West',
          type: 'metro',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.228550910949707,
                48.840655832092224
              ],
              [
                2.2387218475341797,
                48.841870350880505
              ],
              [
                2.2565317153930664,
                48.83763352961143
              ]
            ]
          }
        },

        {
          id: 4, name: 'Metro 2 East',
          type: 'metro',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.256746292114258,
                48.8376617762732
              ],
              [
                2.2783327102661133,
                48.846092692826645
              ],
              [
                2.3074936866760254,
                48.84693994263992
              ]
            ]
          }
        },

        {
          id: 5, name: 'Bus A -> Bus C (Transfer at Levallios)',
          type: 'bus',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.2803068161010738,
                48.897339614430265
              ],
              [
                2.2851133346557617,
                48.891950643544824
              ],
              [
                2.288546562194824,
                48.88800024357089
              ],
              [
                2.2897911071777344,
                48.88701259480943
              ]
            ]
          }
        },

        {
          id: 6, name: 'Bus B',
          type: 'bus',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.2918295860290527,
                48.842689428318415
              ],
              [
                2.28790283203125,
                48.84107950478182
              ],
              [
                2.281980514526367,
                48.83870689156099
              ],
              [
                2.278289794921875,
                48.83647540276501
              ]
            ]
          }
        },

        {
          id: 7, name: 'Bus C -> Bus B (Transfer at Lenglen)',
          type: 'bus',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.2897911071777344,
                48.88701259480943
              ],
              [
                2.280607223510742,
                48.87822166142469
              ],
              [
                2.261359691619873,
                48.85865876105157
              ],
              [
                2.256660461425781,
                48.8376617762732
              ],
              [
                2.2772598266601562,
                48.83365059084553
              ]
            ]
          }
        },
        
        {
          id: 8, name: 'Walking',
          type: 'walking',
          path: {
            "type": "LineString",
            "coordinates": [
              [
                2.256660461425781,
                48.8376617762732
              ],
              [
                2.256660461425781,
                48.8376617762732
              ]
            ]
          }
        }

      ];
      const queryTransports = 'INSERT INTO transports(id, name, type, path) VALUES ($1,$2,$3,$4)';
      for (const Transport of Transports) {
        await client.query(queryTransports,
          [Transport.id, Transport.name, Transport.type, Transport.path]);
      }
    } else {
      console.log('Transports already loaded');
    }

    //check if the stops are empty, and if not populate the stops table
    if (nbStops === 0) {
      const Stops = [

        {
          name: 'Pont De Sévres', number: 2,
          capacity: 2,
          transport_id: 1,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2309112548828125,
              48.8295260794002
            ]
          }
        },

        {
          name: 'Marcel Sembat', number: 1,
          capacity: 2,
          transport_id: 1,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2436141967773438,
              48.83356584402702
            ]
          }
        },

        {
          name: 'Porte de Saint-Cloud', number: 0,
          capacity: 2,
          transport_id: 1, location: 12,
          geom: {
            "type": "Point",
            "coordinates": [
              2.256660461425781,
              48.8376617762732
            ]
          }
        }, 

        {
          name: 'Wagram', number: 2,
          capacity: 2,
          transport_id: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.303695678710937,
              48.88396486994846
            ]
          }
        },

        {
          name: 'Trocadéro', number: 1,
          capacity: 2,
          transport_id: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.287173271179199,
              48.86310554637889
            ]
          }
        },
        {
          name: 'Porte de Saint-Cloud', number: 0,
          capacity: 2,
          transport_id: 2,
          geom: {
            "type": "Point",
            "coordinates": [
              2.256660461425781,
              48.8376617762732
            ]
          }
        },

        {
          name: 'Boulogne - Pont de Saint-Cloud', number: 2,
          capacity: 2,
          transport_id: 3,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2285079956054688,
              48.840740566916864
            ]
          }
        },

        {
          name: 'Jean Jaurès', number: 1,
          capacity: 2,
          transport_id: 3,
          geom: {
            "type": "Point",
            "coordinates": [
              2.238764762878418,
              48.84192683940972
            ]
          }
        },
        {
          name: 'Porte de Saint-Cloud', number: 0,
          capacity: 2,
          transport_id: 3,
          geom: {
            "type": "Point",
            "coordinates": [
              2.256660461425781,
              48.8376617762732
            ]
          }
        },


        {
          name: 'Segur', number: 2,
          capacity: 2,
          transport_id: 4,
          geom: {
            "type": "Point",
            "coordinates": [
              2.3074936866760254,
              48.84693994263992
            ]
          }
        },

        {
          name: 'Javel', number: 1,
          capacity: 2,
          transport_id: 4,
          geom: {
            "type": "Point",
            "coordinates": [
              2.278295159339905,
              48.846177418453046
            ]
          }
        },
        {
          name: 'Porte de Saint-Cloud', number: 0,
          capacity: 2,
          transport_id: 4,
          geom: {
            "type": "Point",
            "coordinates": [
              2.256660461425781,
              48.8376617762732
            ]
          }
        },


        {
          name: 'Trebois', number: 6,
          capacity: 2,
          transport_id: 5,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2803068161010738,
              48.897339614430265
            ]
          }
        },

        {
          name: 'Louis Roaquier', number: 5,
          capacity: 2,
          transport_id: 5,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2851133346557617,
              48.891950643544824
            ]
          }
        },

        {
          name: 'Trezel', number: 4,
          capacity: 2,
          transport_id: 5,
          geom: {
            "type": "Point",
            "coordinates": [
              2.288546562194824,
              48.88800024357089
            ]
          }
        },

        {
          name: 'Aristide Briand', number: 3,
          capacity: 2,
          transport_id: 5,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2897911071777344,
              48.88701259480943
            ]
          }
        },

        {
          name: 'Levallios', number: 3,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2897911071777344,
              48.88701259480943
            ]
          }
        },

        {
          name: 'Malloit', number: 2,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.280607223510742,
              48.87822166142469
            ]
          }
        },

        {
          name: 'LAvenue Foch', number: 1,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.261359691619873,
              48.85865876105157
            ]
          }
        },

        {
          name: 'Porte de Saint-Cloud', number: 0,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.256660461425781,
              48.8376617762732
            ]
          }
        },

        {
          name: 'Lenglen', number: 1,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2772598266601562,
              48.83365059084553
            ]
          }
        },

        {
          name: 'Balard', number: 5,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.2918295860290527,
              48.842689428318415
            ]
          }
        },

        {
          name: 'Lourmel', number: 4,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.28790283203125,
              48.84107950478182
            ]
          }
        },

        {
          name: 'Boucicaut', number: 3,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.281980514526367,
              48.83870689156099
            ]
          }
        },

        {
          name: 'Felix Faure', number: 2,
          capacity: 2,
          transport_id: 6,
          geom: {
            "type": "Point",
            "coordinates": [
              2.278289794921875,
              48.83647540276501
            ]
          }
        },
        {
          name: 'N/A', number: 0,
          capacity: 99999,
          transport_id: 8,
          geom: {
            "type": "Point",
            "coordinates": [
              2.256660461425781,
              48.8376617762732
            ]
          }
        }

      ];
      const queryStops = 'INSERT INTO stops(name, number, capacity, transport_id, geom) VALUES ($1,$2,$3,$4,$5)';
      for (const Stop of Stops) {
        await client.query(queryStops,
          [Stop.name, Stop.number, Stop.capacity, Stop.transport_id, Stop.geom]);
      }
    } else {
      console.log('Stops table already populated');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  }
  client.release();
}

async function updateGeomProjection() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tables = [
      'gates',
      //'Blocks'
      'devices',
      'Stops'];
    for (const table of tables) {
      const queryText = "SELECT UpdateGeometrySRID($1,'geom',4326)";
      await client.query(queryText, [table]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  }
  client.release();
}

async function query(text, params) {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export {
  createDb, addPostgisToDb, createTables, populateTablesIfEmpty, updateGeomProjection, query,
};
