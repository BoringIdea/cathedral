/* eslint-disable @typescript-eslint/no-unused-vars */
'use strict';

var dbm;
var type;
var seed;
import { readFile } from 'fs';
import { join } from 'path';
var Promise;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
export function setup(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
}

export function up(db) {
  var filePath = join(
    __dirname,
    'sqls',
    'YYYYMMDDHHMMSS-your-migration-name-up.sql',
  );
  return new Promise(function (resolve, reject) {
    readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err);
      console.log('received data: ' + data);

      resolve(data);
    });
  }).then(function (data) {
    return db.runSql(data);
  });
}

export function down(db) {
  var filePath = join(
    __dirname,
    'sqls',
    'YYYYMMDDHHMMSS-your-migration-name-down.sql',
  );
  return new Promise(function (resolve, reject) {
    readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err);
      console.log('received data: ' + data);

      resolve(data);
    });
  }).then(function (data) {
    return db.runSql(data);
  });
}

export const _meta = {
  version: 1,
};
