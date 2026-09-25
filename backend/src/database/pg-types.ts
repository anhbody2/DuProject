import { DataTypes } from 'sequelize';
import { types } from 'pg';

// Postgres returns BIGINT and NUMERIC as strings by default. Our ids fit in a JS
// number and money is NUMERIC(12,2), so parse both to numbers for a cleaner API.
// Must be imported before the Sequelize connection is created (see main.ts).
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

// Sequelize registers its own NUMERIC parser (returning strings), which takes
// precedence over pg's, so override it on the Sequelize data type itself.
(DataTypes as unknown as { postgres: { DECIMAL: { parse: (v: string) => number } } }).postgres.DECIMAL.parse =
  (value: string) => parseFloat(value);
