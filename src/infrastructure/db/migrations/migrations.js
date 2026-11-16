// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_create_sync_state.sql';
import m0001 from './0001_create_catalogs.sql';
import m0002 from './0002_create_map_packages.sql';
import m0003 from './0003_create_censuses.sql';
import m0004 from './0004_add_census_form_step.sql';
import m0005 from './0005_create_producer_farms.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005
    }
  }
  