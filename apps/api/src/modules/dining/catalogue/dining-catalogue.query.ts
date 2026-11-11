import {
  DINING_VENUE_KINDS,
  type DiningVenueKind,
  type DiningVenueQuery,
} from '@coastline/api-contracts';
import { unprocessable } from '../../../common/errors/api-errors';
import type { VenueQueryDto } from './dto/venue-query.dto';

const BEACH_POINT_CODE = /^[A-Za-z0-9-]{1,32}$/;

function parseStrictBoolean(name: string, value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw unprocessable(`${name} must be "true" or "false".`, { field: name, value });
}

/** Turns the raw query strings into a typed filter, rejecting bad values with 422. */
export function parseVenueQuery(raw: VenueQueryDto): DiningVenueQuery {
  const query: DiningVenueQuery = {};

  if (raw.kind !== undefined) {
    if (!(DINING_VENUE_KINDS as readonly string[]).includes(raw.kind)) {
      throw unprocessable(`kind must be one of ${DINING_VENUE_KINDS.join(', ')}.`, {
        field: 'kind',
        value: raw.kind,
      });
    }
    query.kind = raw.kind as DiningVenueKind;
  }

  if (raw.beachPointCode !== undefined) {
    if (!BEACH_POINT_CODE.test(raw.beachPointCode)) {
      throw unprocessable('beachPointCode must be a beach point code such as "SUG".', {
        field: 'beachPointCode',
        value: raw.beachPointCode,
      });
    }
    query.beachPointCode = raw.beachPointCode.toUpperCase();
  }

  const reservable = parseStrictBoolean('reservable', raw.reservable);
  if (reservable !== undefined) {
    query.reservable = reservable;
  }

  const delivers = parseStrictBoolean('delivers', raw.delivers);
  if (delivers !== undefined) {
    query.delivers = delivers;
  }

  return query;
}
